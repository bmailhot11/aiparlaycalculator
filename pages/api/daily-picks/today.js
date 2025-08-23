// API Route for Fetching Today's Picks (Premium)

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, isPremium } = await authenticateUser(req);
    
    // Non-premium users get limited data
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        error: 'Premium subscription required',
        message: 'Upgrade to Premium to access daily picks'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's recommendations
    const { data: dailyReco, error: fetchError } = await supabase
      .from('daily_recos')
      .select(`
        *,
        single_bet:single_bet_id (
          id,
          bet_type,
          combined_odds,
          decimal_odds,
          edge_percentage,
          estimated_payout,
          status,
          reco_bet_legs (
            sport,
            home_team,
            away_team,
            commence_time,
            market_type,
            selection,
            best_sportsbook,
            best_odds,
            edge_percentage,
            metadata
          )
        ),
        parlay_2:parlay_2_id (
          id,
          bet_type,
          combined_odds,
          decimal_odds,
          edge_percentage,
          estimated_payout,
          status,
          reco_bet_legs (
            sport,
            home_team,
            away_team,
            commence_time,
            market_type,
            selection,
            best_sportsbook,
            best_odds,
            edge_percentage,
            metadata
          )
        ),
        parlay_4:parlay_4_id (
          id,
          bet_type,
          combined_odds,
          decimal_odds,
          edge_percentage,
          estimated_payout,
          status,
          reco_bet_legs (
            sport,
            home_team,
            away_team,
            commence_time,
            market_type,
            selection,
            best_sportsbook,
            best_odds,
            edge_percentage,
            metadata
          )
        )
      `)
      .eq('reco_date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!dailyReco) {
      return res.status(404).json({
        success: false,
        message: 'No recommendations available for today',
        date: today
      });
    }

    // Calculate time until games start for countdown
    const bets = [dailyReco.single_bet, dailyReco.parlay_2, dailyReco.parlay_4]
      .filter(bet => bet)
      .map(bet => enrichBetData(bet));

    // Track user's view
    await trackUserView(userId, today);

    return res.status(200).json({
      success: true,
      date: today,
      published_at: dailyReco.published_at,
      status: dailyReco.status,
      no_bet_reason: dailyReco.no_bet_reason,
      bets: {
        single: dailyReco.single_bet ? enrichBetData(dailyReco.single_bet) : null,
        parlay2: dailyReco.parlay_2 ? enrichBetData(dailyReco.parlay_2) : null,
        parlay4: dailyReco.parlay_4 ? enrichBetData(dailyReco.parlay_4) : null
      },
      metadata: {
        ...dailyReco.metadata,
        earliest_game_time: getEarliestGameTime(bets),
        countdown_to_first_game: getCountdownToFirstGame(bets)
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s picks:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch picks',
      message: error.message
    });
  }
}

/**
 * Authenticate user and check premium status
 */
async function authenticateUser(req) {
  // Extract user ID from headers/auth token
  const authHeader = req.headers.authorization;
  const userIdentifier = req.headers['x-user-id'] || 'anonymous';
  
  if (userIdentifier === 'anonymous') {
    return { userId: null, isPremium: false };
  }

  // Check user's premium status
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('is_premium, premium_expires_at')
    .eq('user_id', userIdentifier)
    .single();

  let isPremium = false;
  if (userProfile) {
    isPremium = userProfile.is_premium && 
                (!userProfile.premium_expires_at || 
                 new Date(userProfile.premium_expires_at) > new Date());
  }

  return {
    userId: userIdentifier,
    isPremium
  };
}

/**
 * Enrich bet data with additional calculated fields
 */
function enrichBetData(bet) {
  if (!bet) return null;

  const legs = bet.reco_bet_legs || [];
  
  return {
    ...bet,
    legs: legs.map(leg => ({
      ...leg,
      game_display: `${leg.away_team} @ ${leg.home_team}`,
      formatted_odds: formatOdds(leg.best_odds),
      time_until_start: getTimeUntilStart(leg.commence_time),
      starts_in_hours: Math.max(0, (new Date(leg.commence_time) - new Date()) / (1000 * 60 * 60))
    })),
    formatted_combined_odds: formatOdds(bet.combined_odds),
    roi_percentage: bet.edge_percentage,
    payout_multiple: bet.decimal_odds,
    legs_count: legs.length,
    earliest_start: legs.length > 0 ? 
      Math.min(...legs.map(leg => new Date(leg.commence_time).getTime())) : null
  };
}

/**
 * Format odds for display
 */
function formatOdds(americanOdds) {
  if (!americanOdds) return 'N/A';
  return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`;
}

/**
 * Calculate time until game starts
 */
function getTimeUntilStart(commenceTime) {
  const now = new Date();
  const gameTime = new Date(commenceTime);
  const diffMs = gameTime - now;
  
  if (diffMs <= 0) return 'Started';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Get earliest game time across all bets
 */
function getEarliestGameTime(bets) {
  if (!bets || bets.length === 0) return null;
  
  const allLegs = bets.flatMap(bet => bet?.legs || []);
  if (allLegs.length === 0) return null;
  
  const earliestTime = Math.min(...allLegs.map(leg => new Date(leg.commence_time).getTime()));
  return new Date(earliestTime).toISOString();
}

/**
 * Get countdown to first game
 */
function getCountdownToFirstGame(bets) {
  const earliestTime = getEarliestGameTime(bets);
  if (!earliestTime) return null;
  
  return getTimeUntilStart(earliestTime);
}

/**
 * Track that user viewed today's picks
 */
async function trackUserView(userId, date) {
  if (!userId) return;

  try {
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        last_seen_picks_date: date,
        total_picks_viewed: supabase.raw('COALESCE(total_picks_viewed, 0) + 1')
      }, {
        onConflict: 'user_id'
      });
  } catch (error) {
    console.error('Error tracking user view:', error);
  }
}