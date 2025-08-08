// ESM seed script for templates
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  console.error('\nPlease add these to your .env.local file');
  process.exit(1);
}

// Use service role to bypass RLS for seeding
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Ontario Purchase Agreement template fields
const ontarioPurchaseAgreementFields = [
  // Property Information
  {
    id: 'property_address',
    name: 'property_address',
    label: 'Property Address',
    type: 'address',
    description: 'Full legal address of the property being purchased',
    validation: { required: true, min_length: 10 },
    placeholder: '123 Main Street, Toronto, ON M5V 3A8'
  },
  {
    id: 'legal_description',
    name: 'legal_description',
    label: 'Legal Description',
    type: 'text',
    description: 'Legal description and PIN number',
    validation: { required: false },
    placeholder: 'PIN 12345-6789 (LT)'
  },

  // Financial Information
  {
    id: 'purchase_price',
    name: 'purchase_price',
    label: 'Purchase Price',
    type: 'currency',
    description: 'Total purchase price for the property',
    validation: { required: true, min_value: 1000 },
    placeholder: '800000'
  },
  {
    id: 'deposit_amount',
    name: 'deposit_amount',
    label: 'Deposit Amount',
    type: 'currency',
    description: 'Initial deposit amount',
    validation: { required: true, min_value: 1000 },
    placeholder: '40000'
  },
  {
    id: 'deposit_due_date',
    name: 'deposit_due_date',
    label: 'Deposit Due Date',
    type: 'date',
    description: 'When the deposit must be paid',
    validation: { required: true },
    placeholder: 'YYYY-MM-DD'
  },
  {
    id: 'balance_due_date',
    name: 'balance_due_date',
    label: 'Balance Due on Closing',
    type: 'date',
    description: 'Closing date when balance is due',
    validation: { required: true },
    placeholder: 'YYYY-MM-DD'
  },

  // Buyer Information
  {
    id: 'buyer_full_name',
    name: 'buyer_full_name',
    label: 'Buyer Full Name',
    type: 'text',
    description: 'Full legal name of the buyer(s)',
    validation: { required: true, min_length: 2 },
    placeholder: 'John Smith and Jane Smith'
  },
  {
    id: 'buyer_address',
    name: 'buyer_address',
    label: 'Buyer Address',
    type: 'address',
    description: 'Current address of the buyer',
    validation: { required: true },
    placeholder: '456 Current St, Toronto, ON M1A 2B3'
  },
  {
    id: 'buyer_phone',
    name: 'buyer_phone',
    label: 'Buyer Phone',
    type: 'phone',
    description: 'Primary phone number for buyer',
    validation: { required: true },
    placeholder: '(416) 555-0123'
  },
  {
    id: 'buyer_email',
    name: 'buyer_email',
    label: 'Buyer Email',
    type: 'email',
    description: 'Email address for buyer',
    validation: { required: true },
    placeholder: 'buyer@example.com'
  },

  // Seller Information
  {
    id: 'seller_full_name',
    name: 'seller_full_name',
    label: 'Seller Full Name',
    type: 'text',
    description: 'Full legal name of the seller(s)',
    validation: { required: true, min_length: 2 },
    placeholder: 'Robert Johnson and Mary Johnson'
  },
  {
    id: 'seller_address',
    name: 'seller_address',
    label: 'Seller Address',
    type: 'address',
    description: 'Current address of the seller',
    validation: { required: true },
    placeholder: 'Same as property address or different'
  },
  {
    id: 'seller_phone',
    name: 'seller_phone',
    label: 'Seller Phone',
    type: 'phone',
    description: 'Primary phone number for seller',
    validation: { required: true },
    placeholder: '(416) 555-0456'
  },
  {
    id: 'seller_email',
    name: 'seller_email',
    label: 'Seller Email',
    type: 'email',
    description: 'Email address for seller',
    validation: { required: true },
    placeholder: 'seller@example.com'
  },

  // Agent Information
  {
    id: 'buyer_agent_name',
    name: 'buyer_agent_name',
    label: "Buyer's Agent Name",
    type: 'text',
    description: 'Name of the buying agent',
    validation: { required: false },
    placeholder: 'Agent Name'
  },
  {
    id: 'buyer_agent_brokerage',
    name: 'buyer_agent_brokerage',
    label: "Buyer's Agent Brokerage",
    type: 'text',
    description: 'Brokerage representing the buyer',
    validation: { required: false },
    placeholder: 'ABC Realty Inc.'
  },
  {
    id: 'seller_agent_name',
    name: 'seller_agent_name',
    label: "Seller's Agent Name",
    type: 'text',
    description: 'Name of the listing agent',
    validation: { required: false },
    placeholder: 'Agent Name'
  },
  {
    id: 'seller_agent_brokerage',
    name: 'seller_agent_brokerage',
    label: "Seller's Agent Brokerage",
    type: 'text',
    description: 'Brokerage representing the seller',
    validation: { required: false },
    placeholder: 'XYZ Realty Ltd.'
  },

  // Conditions and Contingencies
  {
    id: 'financing_condition',
    name: 'financing_condition',
    label: 'Financing Condition',
    type: 'boolean',
    description: 'Subject to buyer obtaining financing',
    validation: { required: false },
    placeholder: 'true'
  },
  {
    id: 'financing_deadline',
    name: 'financing_deadline',
    label: 'Financing Condition Deadline',
    type: 'date',
    description: 'Deadline for financing condition',
    validation: { required: false },
    placeholder: 'YYYY-MM-DD'
  },
  {
    id: 'inspection_condition',
    name: 'inspection_condition',
    label: 'Home Inspection Condition',
    type: 'boolean',
    description: 'Subject to satisfactory home inspection',
    validation: { required: false },
    placeholder: 'true'
  },
  {
    id: 'inspection_deadline',
    name: 'inspection_deadline',
    label: 'Inspection Condition Deadline',
    type: 'date',
    description: 'Deadline for inspection condition',
    validation: { required: false },
    placeholder: 'YYYY-MM-DD'
  },
  {
    id: 'status_certificate_condition',
    name: 'status_certificate_condition',
    label: 'Status Certificate Condition (Condo)',
    type: 'boolean',
    description: 'Subject to review of status certificate',
    validation: { required: false },
    placeholder: 'false'
  },

  // Additional Terms
  {
    id: 'inclusions',
    name: 'inclusions',
    label: 'Inclusions',
    type: 'text',
    description: 'Items included with the sale',
    validation: { required: false, max_length: 500 },
    placeholder: 'All existing light fixtures, window coverings, built-in appliances...'
  },
  {
    id: 'exclusions',
    name: 'exclusions',
    label: 'Exclusions',
    type: 'text',
    description: 'Items excluded from the sale',
    validation: { required: false, max_length: 200 },
    placeholder: 'Dining room chandelier, basement freezer...'
  },
  {
    id: 'additional_terms',
    name: 'additional_terms',
    label: 'Additional Terms',
    type: 'text',
    description: 'Any additional terms and conditions',
    validation: { required: false, max_length: 1000 },
    placeholder: 'Any special conditions or agreements...'
  },

  // Dates
  {
    id: 'irrevocable_date',
    name: 'irrevocable_date',
    label: 'Irrevocable Date',
    type: 'date',
    description: 'Date and time offer remains open',
    validation: { required: true },
    placeholder: 'YYYY-MM-DD'
  },
  {
    id: 'irrevocable_time',
    name: 'irrevocable_time',
    label: 'Irrevocable Time',
    type: 'text',
    description: 'Time offer expires',
    validation: { required: true, pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    placeholder: '23:59'
  }
];

const ontarioPurchaseAgreementTemplate = {
  name: 'Ontario Agreement of Purchase and Sale',
  type: 'purchase_agreement',
  region: 'ontario',
  version: '2024.1',
  description: 'Standard OREA Agreement of Purchase and Sale for residential properties in Ontario',
  pdf_form_url: '/templates/ontario-purchase-agreement-2024.pdf',
  required_fields: ontarioPurchaseAgreementFields.filter(field => field.validation?.required),
  optional_fields: ontarioPurchaseAgreementFields.filter(field => !field.validation?.required),
  is_active: true
};

async function seedDocumentTemplates() {
  try {
    console.log('🌱 Seeding document templates...');

    // Check if the template already exists
    const { data: existingTemplate } = await supabaseAdmin
      .from('document_templates')
      .select('id')
      .eq('name', ontarioPurchaseAgreementTemplate.name)
      .eq('region', ontarioPurchaseAgreementTemplate.region)
      .single();

    if (existingTemplate) {
      console.log('✅ Ontario Purchase Agreement template already exists');
      return existingTemplate;
    }

    // Insert the Ontario Purchase Agreement template
    const { data: template, error } = await supabaseAdmin
      .from('document_templates')
      .insert({
        name: ontarioPurchaseAgreementTemplate.name,
        type: ontarioPurchaseAgreementTemplate.type,
        region: ontarioPurchaseAgreementTemplate.region,
        version: ontarioPurchaseAgreementTemplate.version,
        description: ontarioPurchaseAgreementTemplate.description,
        pdf_form_url: ontarioPurchaseAgreementTemplate.pdf_form_url,
        required_fields: ontarioPurchaseAgreementTemplate.required_fields,
        optional_fields: ontarioPurchaseAgreementTemplate.optional_fields,
        is_active: ontarioPurchaseAgreementTemplate.is_active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error seeding template:', error);
      throw error;
    }

    console.log('✅ Successfully seeded Ontario Purchase Agreement template');
    return template;

  } catch (error) {
    console.error('❌ Failed to seed templates:', error);
    throw error;
  }
}

// Run the seeding
console.log('🌱 Starting template seeding...');

seedDocumentTemplates()
  .then(() => {
    console.log('🎉 Template seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Template seeding failed:', error);
    process.exit(1);
  });