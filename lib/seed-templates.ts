// Seed script for document templates
import { createClient } from '@supabase/supabase-js';
import { ontarioPurchaseAgreementTemplate, ontarioPurchaseAgreementFields } from './template-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role to bypass RLS for seeding
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function seedDocumentTemplates() {
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

// Function to run seed manually
export async function runSeed() {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for seeding');
    return;
  }

  try {
    await seedDocumentTemplates();
    console.log('🎉 Template seeding completed successfully');
  } catch (error) {
    console.error('💥 Template seeding failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runSeed();
}