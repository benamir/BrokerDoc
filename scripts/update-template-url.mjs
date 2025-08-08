// Update the PDF URL for the existing template
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Use service role to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function updateTemplateUrl() {
  try {
    console.log('🔄 Updating template PDF URL...');

    const { data, error } = await supabaseAdmin
      .from('document_templates')
      .update({
        pdf_form_url: 'https://vnjzyiucwrfuzdhhqztu.supabase.co/storage/v1/object/public/pdf-templates/ontario-purchase-agreement-2024.pdf'
      })
      .eq('name', 'Ontario Agreement of Purchase and Sale')
      .eq('region', 'ontario')
      .select();

    if (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }

    console.log('✅ Successfully updated template PDF URL');
    console.log('📄 Updated template:', data[0]?.name);
    return data;

  } catch (error) {
    console.error('❌ Failed to update template:', error);
    throw error;
  }
}

// Run the update
console.log('🔄 Starting template URL update...');

updateTemplateUrl()
  .then(() => {
    console.log('🎉 Template update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Template update failed:', error);
    process.exit(1);
  });