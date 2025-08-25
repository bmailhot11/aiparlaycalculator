// API endpoint for today's daily picks (real database data)
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 Fetching daily picks for ${today}`);

    // Test Supabase connection first
    if (!supabase) {
      console.error('Supabase client not initialized');
      return res.status(200).json({
        success: false,
        message: 'Database connection not configured. Daily picks are temporarily unavailable.',
        error: 'SUPABASE_NOT_CONFIGURED'
      });
    }

    // Test if we can connect to the database
    const { error: testError } = await supabase
      .from('daily_recos')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      return res.status(200).json({
        success: false,
        message: 'Unable to connect to database. Daily picks are temporarily unavailable.',
        error: testError.message
      });
    }

    // Get today's recommendation
    const { data: dailyReco, error: recoError } = await supabase
      .from('daily_recos')
      .select(`
        *,
        single_bet:single_bet_id (*),
        parlay_2:parlay_2_id (*),
        parlay_4:parlay_4_id (*)
      `)
      .eq('reco_date', today)
      .eq('status', 'published')
      .single();

    if (recoError) {
      console.error('Database error:', recoError);
      // Check if it's a "no data found" error
      if (recoError.code === 'PGRST116') {
        return res.status(200).json({
          success: false,
          message: 'No picks published for today yet. Check back later.',
          date: today,
          error: 'NO_DATA'
        });
      }
      return res.status(200).json({
        success: false,
        message: 'Database query error',
        error: recoError.message,
        code: recoError.code
      });
    }

    if (!dailyReco) {
      return res.status(200).json({
        success: false,
        message: 'No picks published for today yet. Check back later.',
        date: today,
        error: 'NO_DATA'
      });
    }

    // If it's a no-bet day
    if (dailyReco.no_bet_reason) {
      return res.status(200).json({
        success: true,
        date: today,
        published_at: dailyReco.published_at,
        status: 'no_bet',
        message: dailyReco.no_bet_reason,
        metadata: dailyReco.metadata
      });
    }

    // Fetch bet legs for each recommendation
    const picks = {
      success: true,
      date: today,
      published_at: dailyReco.published_at,
      status: 'active'
    };

    // Get single bet legs
    if (dailyReco.single_bet_id) {
      const { data: singleLegs } = await supabase
        .from('reco_bet_legs')
        .select('*')
        .eq('reco_bet_id', dailyReco.single_bet_id)
        .order('id');

      if (singleLegs && singleLegs.length > 0) {
        picks.single = formatPick(dailyReco.single_bet, singleLegs);
      }
    }

    // Get 2-leg parlay
    if (dailyReco.parlay_2_id) {
      const { data: parlay2Legs } = await supabase
        .from('reco_bet_legs')
        .select('*')
        .eq('reco_bet_id', dailyReco.parlay_2_id)
        .order('id');

      if (parlay2Legs && parlay2Legs.length > 0) {
        picks.parlay2 = formatPick(dailyReco.parlay_2, parlay2Legs);
      }
    }

    // Get 4-leg parlay  
    if (dailyReco.parlay_4_id) {
      const { data: parlay4Legs } = await supabase
        .from('reco_bet_legs')
        .select('*')
        .eq('reco_bet_id', dailyReco.parlay_4_id)
        .order('id');

      if (parlay4Legs && parlay4Legs.length > 0) {
        picks.parlay4 = formatPick(dailyReco.parlay_4, parlay4Legs);
      }
    }

    return res.status(200).json(picks);

  } catch (error) {
    console.error('Error fetching daily picks:', error);
    return res.status(200).json({
      success: false,
      message: 'An error occurred while fetching picks',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper function to format pick data
function formatPick(bet, legs) {
  if (!bet || !legs) return null;

  return {
    legs: legs.map(leg => ({
      sport: leg.sport,
      homeTeam: leg.home_team,
      awayTeam: leg.away_team,
      selection: leg.selection_text || leg.selection,
      bestOdds: leg.best_odds,
      bestSportsbook: leg.best_sportsbook,
      marketType: leg.market_type,
      edgePercentage: leg.edge_percentage
    })),
    combinedOdds: bet.combined_odds,
    estimatedPayout: bet.estimated_payout,
    edgePercentage: bet.edge_percentage,
    impliedProbability: calculateImpliedProbability(bet.combined_odds)
  };
}

// Helper function to calculate implied probability from American odds
function calculateImpliedProbability(americanOdds) {
  if (!americanOdds) return 0;
  
  const odds = parseInt(americanOdds.replace('+', ''));
  
  if (odds > 0) {
    return (100 / (odds + 100) * 100);
  } else {
    return (Math.abs(odds) / (Math.abs(odds) + 100) * 100);
  }
}