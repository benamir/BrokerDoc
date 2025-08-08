import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { templateId, documentData, conversationId } = await request.json();

    if (!templateId || !documentData || !conversationId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const supabase = await createClerkSupabaseClient();

    // Get the template information
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return new NextResponse('Template not found', { status: 404 });
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    // Download the PDF template
    const templatePdfUrl = template.pdf_form_url;
    let pdfBytes: ArrayBuffer;

    if (templatePdfUrl.startsWith('/')) {
      // Local file path - in production, you'd serve this from your storage
      return new NextResponse('Template PDF not found', { status: 404 });
    } else {
      // External URL or Supabase storage URL
      const response = await fetch(templatePdfUrl);
      if (!response.ok) {
        return new NextResponse('Failed to fetch template PDF', { status: 500 });
      }
      pdfBytes = await response.arrayBuffer();
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Fill the form fields
    await fillPdfForm(form, documentData, template);

    // Generate the filled PDF
    const filledPdfBytes = await pdfDoc.save();

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${template.name}-${timestamp}.pdf`;
    const filePath = `${user.id}/${fileName}`;

    // Upload the filled PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-documents')
      .upload(filePath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload PDF:', uploadError);
      return new NextResponse('Failed to save document', { status: 500 });
    }

    // Get the public URL for the uploaded PDF
    const { data: { publicUrl } } = supabase.storage
      .from('generated-documents')
      .getPublicUrl(filePath);

    // Create a generated document record
    const { data: generatedDoc, error: docError } = await supabase
      .from('generated_documents')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        template_id: templateId,
        document_data: documentData,
        pdf_url: publicUrl,
        status: 'preview',
        metadata: {
          property_address: documentData.property_address,
          document_title: template.name,
          parties_involved: [
            documentData.buyer_full_name,
            documentData.seller_full_name
          ].filter(Boolean),
          transaction_value: documentData.purchase_price
        }
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to create document record:', docError);
      return new NextResponse('Failed to save document record', { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: generatedDoc,
      previewUrl: publicUrl
    });

  } catch (error) {
    console.error('Fill template error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function fillPdfForm(form: PDFForm, data: Record<string, any>, template: any) {
  // Get all form fields
  const fields = form.getFields();
  
  // Map our data to PDF form field names
  const fieldMapping: Record<string, string> = {
    // Property Information
    'property_address': 'PropertyAddress',
    'legal_description': 'LegalDescription',
    
    // Financial Information
    'purchase_price': 'PurchasePrice',
    'deposit_amount': 'DepositAmount',
    'deposit_due_date': 'DepositDueDate',
    'balance_due_date': 'ClosingDate',
    
    // Buyer Information
    'buyer_full_name': 'BuyerName',
    'buyer_address': 'BuyerAddress',
    'buyer_phone': 'BuyerPhone',
    'buyer_email': 'BuyerEmail',
    
    // Seller Information
    'seller_full_name': 'SellerName',
    'seller_address': 'SellerAddress',
    'seller_phone': 'SellerPhone',
    'seller_email': 'SellerEmail',
    
    // Agent Information
    'buyer_agent_name': 'BuyerAgentName',
    'buyer_agent_brokerage': 'BuyerBrokerage',
    'seller_agent_name': 'SellerAgentName',
    'seller_agent_brokerage': 'SellerBrokerage',
    
    // Conditions
    'financing_condition': 'FinancingCondition',
    'financing_deadline': 'FinancingDeadline',
    'inspection_condition': 'InspectionCondition',
    'inspection_deadline': 'InspectionDeadline',
    'status_certificate_condition': 'StatusCertificateCondition',
    
    // Additional Information
    'inclusions': 'Inclusions',
    'exclusions': 'Exclusions',
    'additional_terms': 'AdditionalTerms',
    'irrevocable_date': 'IrrevocableDate',
    'irrevocable_time': 'IrrevocableTime'
  };

  // Fill each field based on our data
  Object.entries(data).forEach(([dataKey, value]) => {
    const pdfFieldName = fieldMapping[dataKey];
    if (!pdfFieldName || value === undefined || value === null || value === '') {
      return;
    }

    try {
      // Try to get the field from the PDF
      const field = form.getField(pdfFieldName);

      if (field instanceof PDFTextField) {
        // Handle text fields
        let textValue = String(value);
        
        // Format currency values
        if (dataKey.includes('price') || dataKey.includes('amount')) {
          textValue = formatCurrency(Number(value));
        }
        
        // Format dates
        if (dataKey.includes('date')) {
          textValue = formatDate(value);
        }
        
        field.setText(textValue);
      } else if (field instanceof PDFCheckBox) {
        // Handle checkbox fields
        if (Boolean(value)) {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        // Handle dropdown fields
        field.select(String(value));
      }
    } catch (error) {
      // Field might not exist in the PDF - that's okay, just skip it
      console.warn(`PDF field '${pdfFieldName}' not found, skipping...`);
    }
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
}