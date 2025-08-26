// Script to set up the daily picks database schema
const { supabase } = require('../utils/supabaseClient');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up daily picks database schema...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'sql', 'daily-picks-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema (Note: Supabase client doesn't support direct SQL execution)
    // You'll need to run this manually in Supabase SQL Editor or via psql
    
    console.log('📄 Schema SQL to run in Supabase:');
    console.log('='.repeat(80));
    console.log(schema);
    console.log('='.repeat(80));
    
    // Test connection
    const { data, error } = await supabase
      .from('daily_recos')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "daily_recos" does not exist')) {
        console.log('❌ Tables do not exist yet. Please run the SQL schema in Supabase SQL Editor.');
      } else {
        console.log('❌ Database error:', error.message);
      }
    } else {
      console.log('✅ Database connection successful! Tables exist.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run setup
setupDatabase();