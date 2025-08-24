/**
 * CLV Calculator - Supabase Integration
 * Calculates Closing Line Value using v_closing_odds view
 */

const { supabase } = require('../utils/supabaseClient');

/**
 * Calculate CLV for individual leg using Supabase closing odds
 */
async function calculateLegCLV(leg) {
  const { game_key, market, sportsbook, outcome, entry_odds } = leg;
  
  try {
    const { data: closingData, error } = await supabase
      .from('v_closing_odds')
      .select('closing_odds, closing_ts')
      .eq('game_key', game_key)
      .eq('market', market)
      .eq('sportsbook', sportsbook)
      .eq('outcome', outcome)
      .single();

    if (error || !closingData) {
      return {
        ...leg,
        closing_odds: null,
        closing_ts: null,
        clv_percent: null,
        closing_status: 'unknown'
      };
    }

    const clv_percent = (closingData.closing_odds - entry_odds) / entry_odds;

    return {
      ...leg,
      closing_odds: closingData.closing_odds,
      closing_ts: closingData.closing_ts,
      clv_percent,
      closing_status: 'available'
    };
  } catch (error) {
    console.error('CLV calculation error:', error);
    return {
      ...leg,
      closing_odds: null,
      closing_ts: null,
      clv_percent: null,
      closing_status: 'error'
    };
  }
}

/**
 * Calculate parlay CLV with aggregation
 */
async function calculateParlayCLV(legs) {
  const legsWithCLV = await Promise.all(
    legs.map(leg => calculateLegCLV(leg))
  );

  const validCLVs = legsWithCLV
    .filter(leg => leg.clv_percent !== null)
    .map(leg => leg.clv_percent);

  if (validCLVs.length === 0) {
    return {
      legs_clv: legsWithCLV,
      aggregate: {
        clv_mean: null,
        clv_worst: null,
        beat_market_count: 0,
        lagged_market_count: 0
      }
    };
  }

  const clv_mean = validCLVs.reduce((sum, clv) => sum + clv, 0) / validCLVs.length;
  const clv_worst = Math.min(...validCLVs);
  const beat_market_count = validCLVs.filter(clv => clv > 0).length;
  const lagged_market_count = validCLVs.filter(clv => clv < 0).length;

  return {
    legs_clv: legsWithCLV,
    aggregate: {
      clv_mean,
      clv_worst,
      beat_market_count,
      lagged_market_count
    }
  };
}

/**
 * Calculate CLV for betting math integration (existing function signature)
 */
function calculateCLV(userOdds, sharpClose, sharpOpen) {
  if (!sharpClose || !userOdds) {
    return {
      clv: null,
      clvPercent: null,
      category: 'unknown'
    };
  }
  
  const clv = (sharpClose - userOdds) / userOdds;
  const clvPercent = clv * 100;
  
  let category = 'neutral';
  if (clvPercent > 5) category = 'excellent';
  else if (clvPercent > 2) category = 'good';
  else if (clvPercent > 0) category = 'positive';
  else if (clvPercent < -5) category = 'poor';
  else if (clvPercent < 0) category = 'negative';
  
  return {
    clv,
    clvPercent,
    category,
    closing_odds: sharpClose,
    entry_odds: userOdds
  };
}

// Module exports
module.exports = {
  calculateLegCLV,
  calculateParlayCLV,
  calculateCLV
};