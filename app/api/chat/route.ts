import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';
import { ontarioPurchaseAgreementFields } from '@/lib/template-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { conversationId, message, fileUrl, fileName, fileType } = await request.json();

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      return new NextResponse('Failed to save message', { status: 500 });
    }

    // Get conversation history for context
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new NextResponse('Failed to fetch conversation history', { status: 500 });
    }

    // Check if this looks like a document preparation request
    const isDocumentRequest = await detectDocumentRequest(message);
    
    // Prepare system prompt for real estate document assistant
    const systemPrompt = `You are BrokerDoc AI, an intelligent assistant for real estate brokers and agents in Ontario, Canada. Your role is to help with document preparation, analysis, and information extraction for real estate transactions.

Key capabilities:
- Prepare Ontario real estate documents (Purchase Agreements, Listing Agreements, etc.)
- Extract key information from broker instructions and uploaded documents
- Guide users through document completion step-by-step
- Identify missing required fields and ask for clarification
- Provide compliance guidance for Ontario real estate regulations

DOCUMENT PREPARATION WORKFLOW:
When a user wants to prepare a document (like "prepare an offer" or "create a purchase agreement"):

1. IDENTIFY DOCUMENT TYPE: Determine what document they need (Purchase Agreement is most common)

2. EXTRACT AVAILABLE INFORMATION: From their message, extract any provided details like:
   - Property address
   - Purchase price
   - Deposit amount
   - Buyer/seller names
   - Closing date
   - Conditions (financing, inspection, etc.)

3. ASK FOR MISSING REQUIRED FIELDS: For Ontario Purchase Agreements, these are required:
   - Property address
   - Purchase price
   - Deposit amount and due date
   - Closing date (balance due date)
   - Buyer full name, address, phone, email
   - Seller full name, address, phone, email
   - Irrevocable date and time

4. GUIDE STEP-BY-STEP: Ask for missing information conversationally, one or two fields at a time

5. CONFIRM DETAILS: Once you have sufficient information, summarize and ask "Should I prepare the document with these details?"

6. TRIGGER DOCUMENT GENERATION: When confirmed, use the function call format below

RESPONSE FORMAT FOR DOCUMENT GENERATION:
When ready to generate a document, include this JSON in your response:
\`\`\`json
{
  "action": "generate_document",
  "template": "ontario_purchase_agreement",
  "data": {
    "property_address": "123 Main St, Toronto, ON M5V 3A8",
    "purchase_price": 800000,
    "deposit_amount": 40000,
    "buyer_full_name": "John Smith",
    // ... all extracted fields
  }
}
\`\`\`

COMMUNICATION STYLE:
- Be conversational and helpful, like a knowledgeable assistant
- Ask for information naturally: "I'll need the buyer's contact information. What's their full name and phone number?"
- Provide context: "For Ontario purchase agreements, we need the deposit due date - typically this is within 24-48 hours of acceptance."
- Confirm understanding: "So you want to prepare an offer for $800,000 on 123 Main Street with a $40,000 deposit - is that correct?"

Always be professional, accurate, and helpful. Focus on Ontario real estate requirements and best practices.`;

    // Build conversation context
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content + (msg.file_name ? ` [File: ${msg.file_name}]` : ''),
      })),
    ];

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: conversationMessages as any,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          });

          let assistantContent = '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              assistantContent += content;
              
              // Send chunk to client
              const data = JSON.stringify({ content });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }

          // Check if the response contains a document generation request
          const documentRequest = extractDocumentRequest(assistantContent);
          
          // Save assistant message to database
          const { error: assistantMessageError } = await supabaseAdmin
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: assistantContent,
              metadata: documentRequest ? { document_request: documentRequest } : undefined,
            });

          if (assistantMessageError) {
            console.error('Error saving assistant message:', assistantMessageError);
          }

          // If there's a document generation request, process it
          if (documentRequest) {
            try {
              // Save the extraction for tracking
              await supabaseAdmin
                .from('document_extractions')
                .insert({
                  conversation_id: conversationId,
                  template_id: await getTemplateId(documentRequest.template),
                  user_input: message,
                  extracted_fields: documentRequest.data,
                  confidence_scores: {},
                  missing_required_fields: [],
                  suggestions: {}
                });

              // Send document generation trigger to client
              const docGenData = JSON.stringify({ 
                action: 'document_generation',
                request: documentRequest 
              });
              controller.enqueue(new TextEncoder().encode(`data: ${docGenData}\n\n`));
              
            } catch (docError) {
              console.error('Error processing document request:', docError);
            }
          }

          // Update conversation title if it's the first exchange
          if (messages.length <= 1) {
            const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
            await supabaseAdmin
              .from('conversations')
              .update({ title })
              .eq('id', conversationId);
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('OpenAI API error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to detect document preparation requests
async function detectDocumentRequest(message: string): Promise<boolean> {
  const documentKeywords = [
    'prepare an offer', 'create an offer', 'write an offer',
    'prepare a purchase agreement', 'create a purchase agreement',
    'draft an agreement', 'generate a contract',
    'prepare the document', 'create the document',
    'fill out the form', 'complete the paperwork'
  ];
  
  const lowerMessage = message.toLowerCase();
  return documentKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Helper function to extract document generation requests from AI response
function extractDocumentRequest(content: string): any | null {
  try {
    // Look for JSON code blocks in the response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1];
      const parsed = JSON.parse(jsonContent);
      
      if (parsed.action === 'generate_document' && parsed.template && parsed.data) {
        return parsed;
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing document request:', error);
    return null;
  }
}

// Helper function to get template ID by name
async function getTemplateId(templateName: string): Promise<string | null> {
  try {
    let type = 'purchase_agreement';
    
    if (templateName.includes('listing')) {
      type = 'listing_agreement';
    } else if (templateName.includes('lease')) {
      type = 'lease_agreement';
    }
    
    const { data: template } = await supabaseAdmin
      .from('document_templates')
      .select('id')
      .eq('type', type)
      .eq('region', 'ontario')
      .eq('is_active', true)
      .single();
      
    return template?.id || null;
  } catch (error) {
    console.error('Error getting template ID:', error);
    return null;
  }
}