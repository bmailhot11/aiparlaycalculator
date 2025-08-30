/**
 * Check what tables actually exist in Supabase
 */

const { supabase } = require('./utils/supabaseClient');

async function checkSupabaseTables() {
  console.log('🔍 Checking Supabase tables...\n');
  
  try {
    // Query to get all table names from information schema
    const { data: tables, error } = await supabase
      .rpc('get_table_names');
    
    if (error) {
      // If RPC doesn't exist, try different approach
      console.log('RPC not available, trying direct queries...\n');
      
      // List of potential table names to check
      const potentialTables = [
        'daily_picks_results',
        'performance_metrics',
        'bet_leg_results',
        'reco_bet_legs',
        'reco_bets',
        'reco_settlements',
        'reco_daily_kpis',
        'ai_generated_bets',
        'ai_bet_legs',
        'ai_bet_kpis',
        'clv_bet_tracking',
        'cache_data',
        'odds_history',
        'users',
        'profiles'
      ];
      
      console.log('📋 Checking for existence of tables:\n');
      
      for (const table of potentialTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error) {
            console.log(`✅ ${table} - EXISTS`);
            
            // Try to get column info
            if (data && data.length > 0) {
              const columns = Object.keys(data[0]);
              console.log(`   Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
            }
          } else {
            console.log(`❌ ${table} - NOT FOUND`);
          }
        } catch (e) {
          console.log(`❌ ${table} - ERROR`);
        }
      }
      
      // Check for tables with 'reco' prefix (recommendation system)
      console.log('\n📊 Checking for reco_* tables (recommendation system):\n');
      
      const recoTables = [
        'reco_bets',
        'reco_bet_legs', 
        'reco_settlements',
        'reco_daily_kpis',
        'daily_recos'
      ];
      
      for (const table of recoTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`✅ ${table} - EXISTS (${count || 0} records)`);
            
            // Get sample structure
            const { data: sample } = await supabase
              .from(table)
              .select('*')
              .limit(1);
              
            if (sample && sample.length > 0) {
              const columns = Object.keys(sample[0]);
              console.log(`   Key columns: ${columns.filter(c => 
                c.includes('result') || 
                c.includes('odds') || 
                c.includes('team') ||
                c.includes('sport') ||
                c.includes('market')
              ).join(', ')}`);
            }
          } else {
            console.log(`❌ ${table} - ${error.message}`);
          }
        } catch (e) {
          console.log(`❌ ${table} - ERROR: ${e.message}`);
        }
      }
      
      // Check cache_data structure
      console.log('\n💾 Checking cache_data structure:\n');
      
      const { data: cacheStructure } = await supabase
        .from('cache_data')
        .select('cache_key, sport, cache_type, market')
        .limit(3);
        
      if (cacheStructure) {
        console.log('Sample cache keys:');
        cacheStructure.forEach(item => {
          console.log(`  • ${item.cache_key} (${item.sport} - ${item.market || item.cache_type})`);
        });
      }
      
    } else {
      console.log('Tables found via RPC:', tables);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

// Run the check
checkSupabaseTables();