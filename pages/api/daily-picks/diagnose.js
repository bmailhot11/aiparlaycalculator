// Diagnostic endpoint to check Supabase data for daily picks
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnosis = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  try {
    // 1. Check if mv_current_best_odds exists and has data
    console.log('🔍 Checking mv_current_best_odds...');
    const { data: bestOdds, error: oddsError, count: oddsCount } = await supabase
      .from('mv_current_best_odds')
      .select('*', { count: 'exact' })
      .limit(5);
    
    diagnosis.checks.mv_current_best_odds = {
      exists: !oddsError || oddsError.code !== 'PGRST204',
      error: oddsError?.message,
      count: oddsCount,
      sampleData: bestOdds?.slice(0, 3) || null
    };
    
    // 2. Check ai_generated_bets table
    console.log('🔍 Checking ai_generated_bets...');
    const { data: aiBets, error: aiError, count: aiCount } = await supabase
      .from('ai_generated_bets')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .limit(3);
    
    diagnosis.checks.ai_generated_bets = {
      exists: !aiError || aiError.code !== 'PGRST204',
      error: aiError?.message,
      count: aiCount,
      sampleData: aiBets?.slice(0, 2) || null
    };
    
    // 3. Check if there are any odds tables with recent data
    console.log('🔍 Checking for other odds tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names_containing', { search_term: 'odds' });
    
    diagnosis.checks.odds_tables = {
      error: tablesError?.message,
      tables: tables || 'RPC not available'
    };
    
    // 4. Try checking a few other common table names
    const tablesToCheck = ['odds_history', 'live_odds', 'current_odds', 'best_odds'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        diagnosis.checks[tableName] = {
          exists: !error,
          error: error?.message,
          count: count,
          hasData: data && data.length > 0
        };
      } catch (e) {
        diagnosis.checks[tableName] = {
          exists: false,
          error: e.message
        };
      }
    }
    
    // 5. Check daily_recos to see if we have any historical data
    console.log('🔍 Checking daily_recos history...');
    const { data: dailyRecos, count: recosCount } = await supabase
      .from('daily_recos')
      .select('*', { count: 'exact' })
      .order('reco_date', { ascending: false })
      .limit(5);
    
    diagnosis.checks.daily_recos = {
      count: recosCount,
      recentRecords: dailyRecos || []
    };
    
    return res.status(200).json(diagnosis);
    
  } catch (error) {
    console.error('Error in diagnosis:', error);
    return res.status(500).json({
      error: error.message,
      diagnosis
    });
  }
}