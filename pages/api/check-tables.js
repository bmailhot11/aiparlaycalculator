// API endpoint to check what tables exist in Supabase
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  console.log('🔍 Checking Supabase tables...');
  
  const results = {
    existing: [],
    missing: [],
    withData: []
  };
  
  // Tables we're looking for
  const expectedTables = [
    'bet_leg_results',
    'performance_metrics',
    'daily_picks_results',
    'ai_generated_bets',
    'ai_bet_legs',
    'clv_bet_tracking'
  ];
  
  // Tables that might exist with different names
  const alternativeTables = [
    'reco_bets',
    'reco_bet_legs',
    'reco_settlements',
    'reco_daily_kpis',
    'daily_recos',
    'cache_data',
    'odds_history'
  ];
  
  console.log('Checking expected tables...');
  
  // Check expected tables
  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        results.existing.push({ name: table, count });
        if (count > 0) {
          results.withData.push(table);
        }
        console.log(`✅ ${table} - EXISTS (${count} records)`);
      } else {
        results.missing.push(table);
        console.log(`❌ ${table} - NOT FOUND`);
      }
    } catch (e) {
      results.missing.push(table);
    }
  }
  
  console.log('Checking alternative tables...');
  
  // Check alternative tables
  for (const table of alternativeTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        results.existing.push({ name: table, count });
        
        // Get sample structure for reco tables
        if (table.startsWith('reco_')) {
          const { data: sample } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            const relevantColumns = columns.filter(c => 
              c.includes('result') || 
              c.includes('odds') || 
              c.includes('team') ||
              c.includes('sport') ||
              c.includes('market') ||
              c.includes('selection') ||
              c.includes('hit_rate') ||
              c.includes('clv')
            );
            
            results.existing[results.existing.length - 1].relevantColumns = relevantColumns;
          }
        }
        
        console.log(`✅ ${table} - EXISTS (${count} records)`);
      }
    } catch (e) {
      // Silent fail for alternative tables
    }
  }
  
  // Check if we have reco_bet_legs with historical data
  try {
    const { data: historicalCheck } = await supabase
      .from('reco_bet_legs')
      .select('sport, market_type, selection, result')
      .not('result', 'is', null)
      .limit(5);
    
    if (historicalCheck && historicalCheck.length > 0) {
      results.historicalDataAvailable = true;
      results.sampleHistoricalData = historicalCheck;
    }
  } catch (e) {
    // Silent fail
  }
  
  return res.status(200).json({
    success: true,
    results,
    summary: {
      totalExisting: results.existing.length,
      totalMissing: results.missing.length,
      tablesWithData: results.withData.length,
      recommendation: results.existing.some(t => t.name.startsWith('reco_')) 
        ? 'Use reco_bet_legs instead of bet_leg_results'
        : 'Need to create historical tracking tables'
    }
  });
}