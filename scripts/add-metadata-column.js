// Script to add the missing metadata column to daily_recos table
const { createClient } = require('@supabase/supabase-js');

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function addMetadataColumn() {
  try {
    console.log('🔧 Adding metadata column to daily_recos table...');
    
    // Use RPC to execute SQL (if you have this function in your database)
    // Or we'll need to do this manually in Supabase SQL Editor
    
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log('ALTER TABLE daily_recos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';');
    console.log('ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';');
    console.log('ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';');
    console.log('='.repeat(80));
    
    // Test if the column exists by trying to query it
    const { data, error } = await supabase
      .from('daily_recos')
      .select('id, metadata')
      .limit(1);
    
    if (error) {
      if (error.message.includes('metadata')) {
        console.log('❌ metadata column still missing - please run the SQL above');
        return false;
      } else {
        console.log('❌ Other error:', error.message);
        return false;
      }
    } else {
      console.log('✅ metadata column exists and is accessible!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Run the check
addMetadataColumn().then(success => {
  if (success) {
    console.log('\n🎉 Ready to test daily picks publishing!');
  } else {
    console.log('\n⚠️ Manual SQL execution needed in Supabase dashboard');
  }
});