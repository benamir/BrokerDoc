import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// Check for required environment variables
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
};

console.log('🔧 Checking environment variables...');
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key, _]) => `- ${key}: ❌`);

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  console.log(missingVars.join('\n'));
  process.exit(1);
}

console.log('✅ Environment variables loaded');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTemplateUrl() {
  try {
    console.log('🔄 Fixing template PDF URL...');
    
    // REPLACE THIS URL WITH THE CORRECT ONE FROM SUPABASE
    const correctUrl = 'REPLACE_WITH_CORRECT_URL_FROM_SUPABASE';
    
    if (correctUrl === 'REPLACE_WITH_CORRECT_URL_FROM_SUPABASE') {
      console.log('❌ Please replace the URL in this script with the correct one from Supabase!');
      console.log('   1. Go to Supabase Storage');
      console.log('   2. Click on ontario-purchase-agreement-2024.pdf');
      console.log('   3. Click "Get URL" → "Public URL"');
      console.log('   4. Replace the URL in this script');
      process.exit(1);
    }
    
    // Update the template record
    const { data, error } = await supabase
      .from('document_templates')
      .update({
        pdf_form_url: correctUrl,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Ontario Agreement of Purchase and Sale')
      .select();

    if (error) {
      console.error('❌ Error updating template:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated template PDF URL');
      console.log('📄 Updated template:', data[0].name);
      console.log('🔗 New URL:', data[0].pdf_form_url);
      console.log('🎉 Template URL update completed successfully!');
    } else {
      console.log('❌ No template found to update');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
fixTemplateUrl();