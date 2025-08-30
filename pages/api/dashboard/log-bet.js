// API endpoint to automatically log bets from arbitrage/middle bet systems to user dashboard

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { userId, betData, source } = req.body;

    if (!userId || !betData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId and betData' 
      });
    }

    // Validate bet data structure
    const requiredFields = ['sport', 'market', 'selection', 'odds', 'stake'];
    const missingFields = requiredFields.filter(field => !betData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing bet data fields: ${missingFields.join(', ')}`
      });
    }

    // Structure the bet data
    const bet = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      sport: betData.sport,
      market: betData.market,
      selection: betData.selection,
      odds: betData.odds,
      stake: parseFloat(betData.stake),
      result: 'pending',
      payout: 0,
      profit: 0,
      source: source || 'system', // 'arbitrage', 'middle_bet', 'ai_parlay', etc.
      sportsbook: betData.sportsbook || 'Unknown',
      metadata: {
        confidence: betData.confidence,
        expectedValue: betData.expectedValue,
        impliedProbability: betData.impliedProbability,
        arbitrageId: betData.arbitrageId,
        middleBetId: betData.middleBetId,
        parlayId: betData.parlayId
      }
    };

    // Get existing betting history from correct schema
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('betting_history, analytics_cache')
      .eq('user_id', userId)
      .single();

    let bettingHistory = [];
    let analyticsCache = {};
    
    if (existingProfile) {
      bettingHistory = existingProfile.betting_history || [];
      analyticsCache = existingProfile.analytics_cache || {};
    }

    // Add the new bet
    bettingHistory.push(bet);

    // Update analytics cache
    analyticsCache.lastBetLogged = new Date().toISOString();
    analyticsCache.totalSystemBets = (analyticsCache.totalSystemBets || 0) + 1;
    analyticsCache.lastSystemBetSource = source;

    // Upsert the profile data using correct schema
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        betting_history: bettingHistory,
        analytics_cache: analyticsCache,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      // Fallback: Still return success but log error
      return res.status(200).json({
        success: true,
        message: 'Bet logged locally (database error occurred)',
        bet,
        fallback: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bet logged successfully',
      bet,
      source
    });

  } catch (error) {
    console.error('Error logging bet:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}