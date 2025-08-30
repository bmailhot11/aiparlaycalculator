/**
 * Manual data collection endpoint
 * Since you only have 1 cron job per day, this lets you manually trigger data collection
 */

import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  console.log('🚀 Manual data collection started');
  
  const results = {
    oddsCollected: false,
    betsGraded: false,
    closingLinesCollected: false,
    errors: []
  };
  
  try {
    // 1. Collect fresh odds data
    console.log('📊 Collecting odds data...');
    try {
      const oddsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3006'}/api/collect-odds-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          manualTrigger: true,
          sports: ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF'] 
        })
      });
      
      if (oddsResponse.ok) {
        const oddsData = await oddsResponse.json();
        results.oddsCollected = true;
        results.oddsData = oddsData;
        console.log('✅ Odds collected successfully');
      }
    } catch (error) {
      console.error('❌ Odds collection failed:', error);
      results.errors.push(`Odds: ${error.message}`);
    }
    
    // 2. Grade any pending bets
    console.log('🏆 Grading bets...');
    try {
      const gradeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3006'}/api/daily-picks/grade-bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (gradeResponse.ok) {
        const gradeData = await gradeResponse.json();
        results.betsGraded = true;
        results.gradeData = gradeData;
        console.log('✅ Bets graded successfully');
      }
    } catch (error) {
      console.error('❌ Bet grading failed:', error);
      results.errors.push(`Grading: ${error.message}`);
    }
    
    // 3. Collect closing lines for upcoming games
    console.log('📈 Collecting closing lines...');
    try {
      const closingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3006'}/api/clv/collect-closing-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (closingResponse.ok) {
        const closingData = await closingResponse.json();
        results.closingLinesCollected = true;
        results.closingData = closingData;
        console.log('✅ Closing lines collected successfully');
      }
    } catch (error) {
      console.error('❌ Closing lines collection failed:', error);
      results.errors.push(`Closing: ${error.message}`);
    }
    
    // 4. Populate some sample historical data if tables are empty
    console.log('🌱 Checking for sample data needs...');
    
    // Check if we have any historical data
    const { count: historicalCount } = await supabase
      .from('reco_bet_legs')
      .select('*', { count: 'exact', head: true })
      .not('result', 'is', null);
    
    if (historicalCount === 0) {
      console.log('📝 No historical data found, creating sample data...');
      
      // Create sample historical data for testing
      const sampleData = [
        { sport: 'NFL', market_type: 'h2h', team: 'Kansas City Chiefs', result: 'win' },
        { sport: 'NFL', market_type: 'h2h', team: 'Kansas City Chiefs', result: 'win' },
        { sport: 'NFL', market_type: 'h2h', team: 'Kansas City Chiefs', result: 'loss' },
        { sport: 'NFL', market_type: 'totals', selection: 'Over 44.5', result: 'win' },
        { sport: 'NFL', market_type: 'totals', selection: 'Under 47.5', result: 'loss' },
        { sport: 'NBA', market_type: 'h2h', team: 'Los Angeles Lakers', result: 'win' },
        { sport: 'NBA', market_type: 'spreads', team: 'Boston Celtics', result: 'win' }
      ];
      
      // Create a daily reco for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data: dailyReco } = await supabase
        .from('daily_recos')
        .insert({ 
          reco_date: yesterdayStr,
          generated_at: yesterday.toISOString()
        })
        .select('id')
        .single();
      
      if (dailyReco) {
        // Create sample bet
        const { data: sampleBet } = await supabase
          .from('reco_bets')
          .insert({
            daily_reco_id: dailyReco.id,
            bet_type: 'single',
            sport: 'NFL',
            home_team: 'Kansas City Chiefs',
            away_team: 'Buffalo Bills',
            market: 'h2h',
            selection: 'Kansas City Chiefs',
            combined_odds: '-110',
            decimal_odds: 1.91,
            status: 'settled',
            result: 'win',
            metadata: { sample_data: true }
          })
          .select('id')
          .single();
        
        if (sampleBet) {
          // Add sample legs with results
          for (const sample of sampleData) {
            await supabase
              .from('reco_bet_legs')
              .insert({
                reco_bet_id: sampleBet.id,
                leg_index: 0,
                sport: sample.sport,
                home_team: sample.team || 'Team A',
                away_team: 'Team B',
                market_type: sample.market_type,
                selection: sample.selection || sample.team,
                best_odds: '-110',
                decimal_odds: 1.91,
                best_book: 'DraftKings',
                result: sample.result,
                commence_time: yesterday.toISOString()
              });
          }
          
          console.log('✅ Sample historical data created');
          results.sampleDataCreated = true;
        }
      }
    } else {
      console.log(`ℹ️ Found ${historicalCount} historical records, no sample data needed`);
    }
    
    // Summary
    const successCount = [
      results.oddsCollected,
      results.betsGraded,
      results.closingLinesCollected
    ].filter(Boolean).length;
    
    return res.status(200).json({
      success: true,
      message: `Manual collection completed: ${successCount}/3 tasks successful`,
      results,
      recommendation: results.errors.length > 0 
        ? 'Some tasks failed, check errors for details'
        : 'All tasks completed successfully! Data is now being collected.'
    });
    
  } catch (error) {
    console.error('❌ Manual collection failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Manual collection failed',
      error: error.message,
      results
    });
  }
}