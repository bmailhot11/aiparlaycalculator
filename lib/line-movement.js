/**
 * Line Movement Module
 * Tracks line movements and calculates quantified signals for betting intelligence
 */

const { supabase } = require('../utils/supabaseClient');

const CONFIG = {
  SHARP_BOOK: process.env.SHARP_BOOK_KEY || 'pinnacle',
  SOFT_BOOK: process.env.SOFT_BOOK_KEY || 'draftkings',
  DRIFT_THRESHOLD: parseFloat(process.env.DRIFT_THRESHOLD) || 0.01,
  VELOCITY_THRESHOLD: parseFloat(process.env.VELOCITY_THRESHOLD) || 0.02,
  DIVERGENCE_THRESHOLD: parseFloat(process.env.DIVERGENCE_THRESHOLD) || 0.02
};

/**
 * Get moneyline time series for charts
 */
async function getMoneylineTimeSeries(gameKey) {
  const { data, error } = await supabase.rpc('get_moneyline_series', {
    p_game_key: gameKey
  });

  if (error) throw error;

  // Group by book and outcome
  const seriesMap = {};
  
  data.forEach(row => {
    const key = `${row.book}_${row.outcome}`;
    if (!seriesMap[key]) {
      seriesMap[key] = {
        book: row.book,
        outcome: row.outcome,
        points: []
      };
    }
    seriesMap[key].points.push({
      ts: row.recorded_at,
      odds_decimal: row.odds_decimal
    });
  });

  return {
    game_key: gameKey,
    commence_time: data[0]?.commence_time,
    series: Object.values(seriesMap)
  };
}

/**
 * Get spread time series for charts
 */
async function getSpreadTimeSeries(gameKey) {
  const { data, error } = await supabase.rpc('get_spread_series', {
    p_game_key: gameKey
  });

  if (error) throw error;

  const seriesMap = {};
  
  data.forEach(row => {
    const key = `${row.book}_${row.outcome}_${row.handicap}`;
    if (!seriesMap[key]) {
      seriesMap[key] = {
        book: row.book,
        outcome: row.outcome,
        handicap: row.handicap,
        points: []
      };
    }
    seriesMap[key].points.push({
      ts: row.recorded_at,
      odds_decimal: row.odds_decimal
    });
  });

  return {
    game_key: gameKey,
    commence_time: data[0]?.commence_time,
    series: Object.values(seriesMap)
  };
}

/**
 * Calculate movement signals for a specific outcome
 */
async function calculateMovementSignals(gameKey, market, outcome) {
  try {
    // Get anchors (open, t-60, close)
    const { data: anchors, error: anchorError } = await supabase.rpc('get_movement_anchors', {
      p_game_key: gameKey,
      p_market: market,
      p_book: CONFIG.SHARP_BOOK,
      p_outcome: outcome
    });

    if (anchorError || !anchors.length) {
      console.log(`No anchor data for ${gameKey} ${market} ${outcome}`);
      return null;
    }

    const anchor = anchors[0];
    
    // Get closing odds
    const { data: closing } = await supabase
      .from('v_closing_odds')
      .select('closing_odds')
      .eq('game_key', gameKey)
      .eq('market', market)
      .eq('sportsbook', CONFIG.SHARP_BOOK)
      .eq('outcome', outcome)
      .single();

    if (!closing) {
      console.log(`No closing odds for ${gameKey} ${market} ${outcome}`);
      return null;
    }

    // Calculate velocity
    const { data: velocityData } = await supabase.rpc('calculate_velocity', {
      p_game_key: gameKey,
      p_market: market,
      p_book: CONFIG.SHARP_BOOK,
      p_outcome: outcome
    });

    const velocity = velocityData?.[0]?.velocity_probpts_per_hour || 0;

    // Convert to implied probabilities
    const p_open = 1 / anchor.open_odds;
    const p_60 = anchor.t60_odds ? 1 / anchor.t60_odds : p_open;
    const p_close = 1 / closing.closing_odds;

    // Calculate raw signals
    const drift_open = p_close - p_open;
    const drift_60 = p_close - p_60;
    const velocity_120 = velocity;

    // For favorite pressure, need both sides (moneyline only)
    let favorite_pressure = 0;
    if (market === 'moneyline') {
      favorite_pressure = await calculateFavoritePressure(gameKey, outcome);
    }

    // Normalize signals
    const signals = await normalizeSignals({
      drift_open,
      drift_60,
      velocity_120,
      favorite_pressure
    }, market);

    return {
      game_key: gameKey,
      market,
      book: CONFIG.SHARP_BOOK,
      side: outcome,
      signals: {
        drift_open,
        drift_60,
        velocity_120,
        favorite_pressure,
        LM_signal: signals.LM_signal,
        Vel_signal: signals.Vel_signal,
        FP_signal: signals.FP_signal
      }
    };
  } catch (error) {
    console.error('Movement signals calculation error:', error);
    return null;
  }
}

/**
 * Calculate favorite pressure for moneyline
 */
async function calculateFavoritePressure(gameKey, outcome) {
  try {
    const { data: bothSides } = await supabase.rpc('get_favorite_pressure_data', {
      p_game_key: gameKey
    });

    if (!bothSides || bothSides.length < 2) return 0;

    // Find favorite (higher implied probability)
    const sides = bothSides.map(side => ({
      ...side,
      p_open: 1 / side.open_odds,
      p_close: 1 / side.close_odds
    }));

    const favorite = sides.reduce((fav, side) => 
      side.p_close > fav.p_close ? side : fav
    );

    const dog = sides.find(side => side.outcome !== favorite.outcome);

    if (!dog) return 0;

    const fav_drift = favorite.p_close - favorite.p_open;
    const dog_drift = dog.p_close - dog.p_open;

    return fav_drift - dog_drift;
  } catch (error) {
    console.error('Favorite pressure calculation error:', error);
    return 0;
  }
}

/**
 * Normalize signals to 0-1 scale
 */
async function normalizeSignals(rawSignals, market) {
  // Simplified normalization - in production, use sport-specific rolling windows
  const abs_drift_open = Math.abs(rawSignals.drift_open);
  const abs_velocity = Math.abs(rawSignals.velocity_120);
  const abs_fp = Math.abs(rawSignals.favorite_pressure);

  // Dynamic bounds based on market type
  const bounds = market === 'moneyline' ? {
    drift_max: 0.10,
    velocity_max: 0.05,
    fp_max: 0.08
  } : {
    drift_max: 0.12,
    velocity_max: 0.06,
    fp_max: 0.10
  };

  const LM_signal = Math.min(abs_drift_open / bounds.drift_max, 1.0);
  const Vel_signal = Math.min(abs_velocity / bounds.velocity_max, 1.0);
  const FP_signal = Math.min(abs_fp / bounds.fp_max, 1.0);

  return {
    LM_signal,
    Vel_signal, 
    FP_signal
  };
}

/**
 * Calculate composite LineMoveSignal for SmartScore
 */
function calculateLineMoveSignal(LM_signal, Vel_signal) {
  return 0.5 * LM_signal + 0.5 * Vel_signal;
}

/**
 * Get movement recommendation based on signals and EV
 */
function getMovementRecommendation(signals, ev, isDrift = true) {
  if (!signals) return 'hold';
  
  const { FP_signal, drift_open, drift_60, LM_signal } = signals;
  
  // Strong movement against position with poor EV
  if (FP_signal > 0.7 && drift_open < 0 && ev < 0.01) {
    return 'replace';
  }
  
  // Recent negative movement with negative EV
  if (drift_60 < -0.02 && ev < 0) {
    return 'hedge';
  }
  
  // Strong positive signals with good EV
  if (LM_signal > 0.6 && ev > 0.02) {
    return 'strong_hold';
  }
  
  return 'hold';
}

/**
 * Calculate spread tightening signal
 */
async function calculateSpreadTightening(gameKey, outcome) {
  try {
    const { data: spreadData } = await supabase
      .from('v_odds_clean')
      .select('point, recorded_at')
      .eq('game_key', gameKey)
      .eq('market', 'spread')
      .eq('sportsbook', CONFIG.SHARP_BOOK)
      .eq('outcome', outcome)
      .order('recorded_at', { ascending: true });

    if (!spreadData || spreadData.length < 2) return 0;

    const openSpread = Math.abs(spreadData[0].point);
    const closeSpread = Math.abs(spreadData[spreadData.length - 1].point);
    
    // Positive = line tightened toward pick, negative = moved away
    return openSpread - closeSpread;
  } catch (error) {
    console.error('Spread tightening calculation error:', error);
    return 0;
  }
}

// Module exports
module.exports = {
  getMoneylineTimeSeries,
  getSpreadTimeSeries,
  calculateMovementSignals,
  calculateLineMoveSignal,
  getMovementRecommendation,
  calculateSpreadTightening
};