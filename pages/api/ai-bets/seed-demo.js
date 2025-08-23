// Demo API endpoint to seed sample AI bet data for development/demonstration
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Safety check - only allow in development or with admin key
  const { admin_key } = req.body;
  if (process.env.NODE_ENV === 'production' && admin_key !== process.env.ADMIN_SEED_KEY) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Sample AI parlay data
    const sampleAIBets = [
      {
        bet_type: 'ai_parlay',
        source_type: 'generated',
        total_legs: 3,
        combined_odds: 650,
        decimal_odds: 7.50,
        stake_amount: 10.00,
        potential_payout: 75.00,
        ai_reasoning: 'AI identified value in Chiefs home favorite, Lakers undervalued after rest, and Celtics-Heat over trending.',
        expected_value: 12.5,
        status: 'settled',
        actual_result: 'win',
        actual_payout: 75.00,
        user_downloaded: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        settlement_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        bet_type: 'ai_parlay',
        source_type: 'generated',
        total_legs: 4,
        combined_odds: 1200,
        decimal_odds: 13.00,
        stake_amount: 10.00,
        potential_payout: 130.00,
        ai_reasoning: 'Four-leg parlay targeting undervalued road teams with strong ATS records.',
        expected_value: 8.2,
        status: 'settled',
        actual_result: 'loss',
        actual_payout: 0.00,
        user_downloaded: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        settlement_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        bet_type: 'improved_slip',
        source_type: 'analyzed',
        total_legs: 2,
        combined_odds: 280,
        decimal_odds: 3.80,
        stake_amount: 10.00,
        potential_payout: 38.00,
        ai_reasoning: 'Found better odds at FanDuel and DraftKings, improving payout by 15%.',
        improvement_percentage: 15.0,
        status: 'settled',
        actual_result: 'win',
        actual_payout: 38.00,
        user_downloaded: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        settlement_date: new Date().toISOString()
      },
      {
        bet_type: 'ai_parlay',
        source_type: 'generated',
        total_legs: 2,
        combined_odds: 150,
        decimal_odds: 2.50,
        stake_amount: 10.00,
        potential_payout: 25.00,
        ai_reasoning: 'Conservative two-leg parlay with strong home favorites.',
        expected_value: 6.8,
        status: 'settled',
        actual_result: 'win',
        actual_payout: 25.00,
        user_downloaded: false,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        settlement_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        bet_type: 'ai_parlay',
        source_type: 'generated',
        total_legs: 3,
        combined_odds: 450,
        decimal_odds: 5.50,
        stake_amount: 10.00,
        potential_payout: 55.00,
        ai_reasoning: 'Three-leg value play targeting player props with strong statistical edges.',
        expected_value: 11.2,
        status: 'pending',
        actual_result: null,
        actual_payout: 0.00,
        user_downloaded: true,
        created_at: new Date().toISOString()
      }
    ];

    // Insert sample AI bets
    const { data: insertedBets, error: betsError } = await supabase
      .from('ai_generated_bets')
      .insert(sampleAIBets)
      .select();

    if (betsError) {
      console.error('Error inserting sample bets:', betsError);
      return res.status(500).json({ error: 'Failed to seed AI bets', details: betsError.message });
    }

    // Create sample bet legs for each bet
    const sampleLegs = [];
    insertedBets.forEach((bet, betIndex) => {
      const legCount = bet.total_legs;
      for (let i = 0; i < legCount; i++) {
        sampleLegs.push({
          ai_bet_id: bet.id,
          leg_index: i,
          sport: ['NFL', 'NBA', 'NHL'][i % 3],
          home_team: ['Chiefs', 'Lakers', 'Celtics', 'Cowboys', 'Warriors'][betIndex % 5],
          away_team: ['Ravens', 'Heat', 'Bruins', 'Eagles', 'Rockets'][betIndex % 5],
          commence_time: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
          market_type: ['h2h', 'spreads', 'totals'][i % 3],
          selection: ['Moneyline Win', 'Spread -3.5', 'Over 215.5'][i % 3],
          recommended_odds: [-110, 120, -105][i % 3],
          decimal_odds: [1.91, 2.20, 1.95][i % 3],
          sportsbook: ['DraftKings', 'FanDuel', 'BetMGM'][i % 3],
          result: bet.status === 'settled' ? (i === 0 && bet.actual_result === 'loss' ? 'loss' : 'win') : null
        });
      }
    });

    const { error: legsError } = await supabase
      .from('ai_bet_legs')
      .insert(sampleLegs);

    if (legsError) {
      console.error('Error inserting sample legs:', legsError);
    }

    // Update daily KPIs with sample data
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sampleKPIs = [
      {
        kpi_date: today,
        bet_type: 'all',
        total_bets_generated: 5,
        total_bets_downloaded: 4,
        total_bets_settled: 4,
        wins: 3,
        losses: 1,
        pushes: 0,
        win_rate: 75.0,
        total_stake: 40.00,
        total_payout: 138.00,
        net_profit: 98.00,
        roi_percentage: 245.0,
        cumulative_bets: 5,
        cumulative_wins: 3,
        cumulative_profit: 98.00,
        cumulative_roi: 245.0
      },
      {
        kpi_date: today,
        bet_type: 'ai_parlay',
        total_bets_generated: 4,
        total_bets_downloaded: 3,
        total_bets_settled: 3,
        wins: 2,
        losses: 1,
        pushes: 0,
        win_rate: 66.7,
        total_stake: 30.00,
        total_payout: 100.00,
        net_profit: 70.00,
        roi_percentage: 233.3
      },
      {
        kpi_date: today,
        bet_type: 'improved_slip',
        total_bets_generated: 1,
        total_bets_downloaded: 1,
        total_bets_settled: 1,
        wins: 1,
        losses: 0,
        pushes: 0,
        win_rate: 100.0,
        total_stake: 10.00,
        total_payout: 38.00,
        net_profit: 28.00,
        roi_percentage: 280.0
      }
    ];

    const { error: kpiError } = await supabase
      .from('ai_bet_kpis')
      .upsert(sampleKPIs, {
        onConflict: 'kpi_date,bet_type'
      });

    if (kpiError) {
      console.error('Error updating KPIs:', kpiError);
    }

    console.log('✅ Successfully seeded AI bet demo data');

    return res.status(200).json({
      success: true,
      message: 'AI bet demo data seeded successfully',
      data: {
        bets_created: insertedBets.length,
        legs_created: sampleLegs.length,
        kpis_updated: sampleKPIs.length
      }
    });

  } catch (error) {
    console.error('Error seeding demo data:', error);
    return res.status(500).json({
      error: 'Failed to seed demo data',
      message: error.message
    });
  }
}