// API endpoint for tracking AI-generated bets
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      user_id,
      bet_type, // 'ai_parlay', 'improved_slip', 'slip_analysis'
      source_type, // 'generated', 'uploaded', 'analyzed'
      original_data,
      recommended_legs,
      ai_reasoning,
      expected_value,
      confidence_score,
      improvement_percentage,
      user_action // 'generated', 'downloaded', 'shared'
    } = req.body;

    // Validate required fields
    if (!bet_type || !source_type || !recommended_legs || !Array.isArray(recommended_legs)) {
      return res.status(400).json({ 
        error: 'Missing required fields: bet_type, source_type, recommended_legs' 
      });
    }

    // Calculate bet totals
    const total_legs = recommended_legs.length;
    const combined_decimal_odds = recommended_legs.reduce((acc, leg) => 
      acc * (leg.decimal_odds || convertAmericanToDecimal(leg.odds)), 1
    );
    const stake_amount = 10.00; // Standard $10 stake
    const potential_payout = (stake_amount * combined_decimal_odds);
    const combined_odds = convertDecimalToAmerican(combined_decimal_odds);

    // Insert AI bet record
    const { data: aiBet, error: betError } = await supabase
      .from('ai_generated_bets')
      .insert({
        user_id: user_id || null,
        bet_type,
        source_type,
        original_data,
        recommended_legs,
        total_legs,
        combined_odds,
        decimal_odds: combined_decimal_odds,
        stake_amount,
        potential_payout,
        ai_reasoning,
        expected_value,
        confidence_score,
        improvement_percentage,
        user_downloaded: user_action === 'downloaded',
        user_shared: user_action === 'shared',
        status: 'pending'
      })
      .select()
      .single();

    if (betError) {
      console.error('Error inserting AI bet:', betError);
      return res.status(500).json({ error: 'Failed to track bet', details: betError.message });
    }

    // Insert individual bet legs
    const legInserts = recommended_legs.map((leg, index) => ({
      ai_bet_id: aiBet.id,
      leg_index: index,
      sport: leg.league || leg.sport || 'Unknown',
      home_team: extractHomeTeam(leg.matchup || leg.game),
      away_team: extractAwayTeam(leg.matchup || leg.game),
      commence_time: leg.commence_time || null,
      market_type: leg.market || leg.bet_type || 'unknown',
      selection: leg.selection,
      point: leg.point || null,
      recommended_odds: parseAmericanOdds(leg.odds),
      decimal_odds: leg.decimal_odds || convertAmericanToDecimal(leg.odds),
      sportsbook: leg.sportsbook
    }));

    const { error: legsError } = await supabase
      .from('ai_bet_legs')
      .insert(legInserts);

    if (legsError) {
      console.error('Error inserting AI bet legs:', legsError);
      // Don't fail the request, but log the error
    }

    // Update daily KPIs
    await updateDailyKPIs(bet_type, user_action);

    // Update user confidence tracking if user provided
    if (user_id) {
      await updateUserConfidence(user_id, bet_type, total_legs);
    }

    console.log(`✅ Tracked AI bet: ${bet_type} with ${total_legs} legs for user ${user_id || 'anonymous'}`);

    return res.status(200).json({
      success: true,
      ai_bet_id: aiBet.id,
      message: 'AI bet tracked successfully',
      tracking_data: {
        bet_type,
        total_legs,
        potential_payout: potential_payout.toFixed(2),
        combined_odds: formatAmericanOdds(combined_odds)
      }
    });

  } catch (error) {
    console.error('Error tracking AI bet:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper function to update daily KPIs
async function updateDailyKPIs(bet_type, user_action) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update specific bet type KPIs
    const { error: typeError } = await supabase
      .from('ai_bet_kpis')
      .upsert({
        kpi_date: today,
        bet_type: bet_type,
        total_bets_generated: 1, // Will be handled by database increment
        total_bets_downloaded: user_action === 'downloaded' ? 1 : 0,
      }, {
        onConflict: 'kpi_date,bet_type',
        ignoreDuplicates: false
      });

    // Update 'all' KPIs
    const { error: allError } = await supabase
      .from('ai_bet_kpis')
      .upsert({
        kpi_date: today,
        bet_type: 'all',
        total_bets_generated: 1,
        total_bets_downloaded: user_action === 'downloaded' ? 1 : 0,
      }, {
        onConflict: 'kpi_date,bet_type',
        ignoreDuplicates: false
      });

    if (typeError || allError) {
      console.error('Error updating KPIs:', { typeError, allError });
    }

  } catch (error) {
    console.error('Error in updateDailyKPIs:', error);
  }
}

// Helper function to update user confidence tracking
async function updateUserConfidence(user_id, bet_type, total_legs) {
  try {
    const { error } = await supabase
      .from('user_ai_confidence')
      .upsert({
        user_id,
        total_ai_bets_generated: 1, // Will be incremented by database
        avg_parlay_legs: total_legs, // Will be averaged by database
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error updating user confidence:', error);
    }

  } catch (error) {
    console.error('Error in updateUserConfidence:', error);
  }
}

// Helper functions for odds conversion
function convertAmericanToDecimal(americanOdds) {
  if (!americanOdds) return 2.0;
  const odds = parseAmericanOdds(americanOdds);
  
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

function convertDecimalToAmerican(decimalOdds) {
  if (decimalOdds >= 2.0) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

function parseAmericanOdds(odds) {
  if (!odds) return 100;
  const cleaned = String(odds).replace('+', '');
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 100 : parsed;
}

function formatAmericanOdds(odds) {
  if (typeof odds !== 'number' || isNaN(odds)) return '+100';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function extractHomeTeam(matchup) {
  if (!matchup) return 'Unknown';
  // Handle "Team A vs Team B" or "Team A @ Team B" format
  const parts = matchup.split(/ vs | @ | - /);
  return parts.length > 1 ? parts[1].trim() : matchup;
}

function extractAwayTeam(matchup) {
  if (!matchup) return 'Unknown';
  // Handle "Team A vs Team B" or "Team A @ Team B" format
  const parts = matchup.split(/ vs | @ | - /);
  return parts[0].trim();
}