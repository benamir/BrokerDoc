import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';
import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, rgb } from 'pdf-lib';

export async function POST(request: NextRequest) {
  console.log('🚀 Fill template API called');
  try {
    console.log('👤 Checking user authentication...');
    const user = await currentUser();
    if (!user) {
      console.log('❌ User not authenticated');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('✅ User authenticated:', user.id);

    console.log('📝 Parsing request body...');
    const { templateId, documentData, conversationId } = await request.json();
    console.log('📊 Request data:', { templateId, conversationId, dataKeys: Object.keys(documentData || {}) });

    if (!templateId || !documentData || !conversationId) {
      console.log('❌ Missing required fields:', { templateId: !!templateId, documentData: !!documentData, conversationId: !!conversationId });
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = await createClerkSupabaseClient();

    console.log('📋 Fetching template from database...');
    // Get the template information
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.log('❌ Template error:', templateError);
      console.log('❌ Template data:', template);
      return new NextResponse('Template not found', { status: 404 });
    }
    console.log('✅ Template found:', { id: template.id, name: template.name });

    console.log('🔍 Verifying conversation ownership...');
    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      console.log('❌ Conversation error:', convError);
      console.log('❌ Conversation data:', conversation);
      return new NextResponse('Conversation not found', { status: 404 });
    }
    console.log('✅ Conversation verified');

    console.log('📥 Downloading PDF template...');
    // Download the PDF template
    const templatePdfUrl = template.pdf_form_url;
    console.log('📄 Template PDF URL:', templatePdfUrl);
    let pdfBytes: ArrayBuffer;

    if (templatePdfUrl.startsWith('/')) {
      // Local file path - in production, you'd serve this from your storage
      console.log('❌ Local file path detected - not supported');
      return new NextResponse('Template PDF not found', { status: 404 });
    } else {
      console.log('🌐 Fetching PDF from external URL...');
      // External URL or Supabase storage URL
      const response = await fetch(templatePdfUrl);
      console.log('📡 Fetch response status:', response.status);
      if (!response.ok) {
        console.log('❌ Failed to fetch PDF, status:', response.status);
        return new NextResponse('Failed to fetch template PDF', { status: 500 });
      }
      console.log('🔄 Converting to ArrayBuffer...');
      pdfBytes = await response.arrayBuffer();
      console.log('✅ PDF downloaded successfully, size:', pdfBytes.byteLength, 'bytes');
    }

    console.log('📖 Loading PDF document...');
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    console.log('✅ PDF document loaded');
    
    console.log('📝 Getting PDF form...');
    const form = pdfDoc.getForm();
    console.log('✅ PDF form retrieved');
    
    // Debug: Show all available fields in the PDF
    const fields = form.getFields();
    console.log('🔍 Available PDF fields:');
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. "${field.getName()}" (${field.constructor.name})`);
    });
    console.log(`📊 Total fields found: ${fields.length}`);

    console.log('✏️ Filling form fields...');
    
    // Check if PDF has fillable fields
    if (fields.length > 0) {
      console.log('📝 Using form field filling...');
      await fillPdfForm(form, documentData, template);
    } else {
      console.log('📝 No form fields found, using text overlay method...');
      await overlayTextOnPdf(pdfDoc, documentData);
    }
    console.log('✅ Form fields filled');

    console.log('💾 Generating filled PDF...');
    // Generate the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    console.log('✅ PDF generated, size:', filledPdfBytes.byteLength, 'bytes');

    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${template.name}-${timestamp}.pdf`;
    const filePath = `${user.id}/${fileName}`;

    // Upload the filled PDF to Supabase Storage
    console.log('📤 Uploading filled PDF to storage...');
    console.log('📁 File path:', filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-documents')
      .upload(filePath, filledPdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload PDF:', uploadError);
      console.error('Upload error details:', uploadError);
      return new NextResponse('Failed to save document', { status: 500 });
    }
    
    console.log('✅ PDF uploaded successfully:', uploadData?.path);

    // Get the public URL for the uploaded PDF
    const { data: { publicUrl } } = supabase.storage
      .from('generated-documents')
      .getPublicUrl(filePath);
      
    console.log('🔗 Public URL generated:', publicUrl);

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      templateId,
      conversationId
    });
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
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

// Helper function to overlay text on PDF (for non-fillable PDFs)
async function overlayTextOnPdf(pdfDoc: PDFDocument, data: any) {
  console.log('🎯 Starting text overlay process...');
  
  // Get the first page (most Ontario Purchase Agreements are multi-page, but let's start with page 1)
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  
  console.log(`📐 Page dimensions: ${width} x ${height}`);
  
  // These coordinates are estimates for a typical Ontario Purchase Agreement
  // In production, you'd want to calibrate these based on the actual form
  const textOverlays = [
    // Property Address - usually near the top
    { text: data.property_address || '', x: 150, y: height - 150, size: 10 },
    
    // Purchase Price - usually in the financial section
    { text: data.purchase_price ? `$${Number(data.purchase_price).toLocaleString()}` : '', x: 200, y: height - 200, size: 10 },
    
    // Deposit Amount
    { text: data.deposit_amount ? `$${Number(data.deposit_amount).toLocaleString()}` : '', x: 200, y: height - 250, size: 10 },
    
    // Buyer Name
    { text: data.buyer_full_name || '', x: 150, y: height - 300, size: 10 },
    
    // Seller Name
    { text: data.seller_full_name || '', x: 150, y: height - 350, size: 10 },
    
    // Closing Date
    { text: data.closing_date || '', x: 200, y: height - 400, size: 10 },
  ];
  
  // Apply text overlays
  textOverlays.forEach((overlay, index) => {
    if (overlay.text) {
      console.log(`📝 Adding overlay ${index + 1}: "${overlay.text}" at (${overlay.x}, ${overlay.y})`);
      firstPage.drawText(overlay.text, {
        x: overlay.x,
        y: overlay.y,
        size: overlay.size,
        color: rgb(0, 0, 0), // Black text
      });
    }
  });
  
  console.log('✅ Text overlay completed');
}