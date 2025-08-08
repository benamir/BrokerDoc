import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

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
    const { data: userMessage, error: userMessageError } = await supabase
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
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new NextResponse('Failed to fetch conversation history', { status: 500 });
    }

    // Prepare system prompt for real estate document assistant
    const systemPrompt = `You are BrokerDoc AI, an intelligent assistant for real estate brokers and agents. Your role is to help with document preparation, analysis, and information extraction for real estate transactions.

Key capabilities:
- Analyze real estate documents (contracts, listings, disclosures, etc.)
- Extract key information and identify missing required fields
- Provide guidance on document completion and compliance
- Answer questions about real estate processes and requirements
- Help organize and prepare document packages for transactions

When a user uploads a document:
1. Analyze the document type and purpose
2. Extract key information (property details, parties, dates, amounts, etc.)
3. Identify any missing required fields or information
4. Provide clear, actionable recommendations
5. Ask clarifying questions if needed

Always be professional, accurate, and helpful. Focus on real estate-specific knowledge and compliance requirements.`;

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

          // Save assistant message to database
          const { error: assistantMessageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: assistantContent,
            });

          if (assistantMessageError) {
            console.error('Error saving assistant message:', assistantMessageError);
          }

          // Update conversation title if it's the first exchange
          if (messages.length <= 1) {
            const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
            await supabase
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