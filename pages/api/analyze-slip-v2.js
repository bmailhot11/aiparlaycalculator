/**
 * Analyze Slip API v2 - Using Betting Math Specification v2.1
 * Provides comprehensive analysis of user-submitted bet slips
 */

const bettingMath = require('../../lib/betting-math.js');
const eventsCache = require('../../lib/events-cache.js');
const { calculateParlayCLV } = require('../../lib/clv-calculator');
const { calculateMovementSignals, getMovementRecommendation } = require('../../lib/line-movement');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { legs, sport } = req.body;
  
  if (!legs || !Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Bet slip legs required' 
    });
  }

  try {
    console.log(`📊 Analyzing slip with ${legs.length} legs...`);
    
    // Fetch current odds data for the sport
    let sportData = [];
    if (sport) {
      // Get cached events for the sport
      const events = await eventsCache.cacheUpcomingEvents(sport);
      if (events && events.length > 0) {
        // Get odds for those events
        const markets = 'h2h,spreads,totals';
        sportData = await eventsCache.getOddsForEvents(events, markets, false);
      }
    }
    
    // Analyze the slip using betting math
    const analysis = await bettingMath.analyzeSlip(legs, sportData);
    
    // Add CLV analysis for completed games
    let clvAnalysis = null;
    try {
      const legsWithGameKeys = legs.map(leg => ({
        ...leg,
        game_key: leg.game_key || generateGameKey(leg),
        market: leg.market_type || 'moneyline',
        sportsbook: leg.sportsbook || 'unknown',
        outcome: leg.outcome || leg.selection,
        entry_odds: leg.decimal_odds || leg.odds
      }));
      
      clvAnalysis = await calculateParlayCLV(legsWithGameKeys);
      console.log('✅ CLV analysis completed');
    } catch (error) {
      console.error('CLV analysis failed:', error);
    }
    
    // Add movement analysis for each leg
    const legsWithMovement = await Promise.all(
      legs.map(async (leg, index) => {
        try {
          const gameKey = leg.game_key || generateGameKey(leg);
          const signals = await calculateMovementSignals(
            gameKey,
            leg.market_type || 'moneyline',
            leg.outcome || leg.selection
          );
          
          return {
            ...analysis.legs[index],
            clv_data: clvAnalysis?.legs_clv[index] || null,
            movement_signals: signals?.signals || null,
            movement_recommendation: signals ? 
              getMovementRecommendation(signals.signals, analysis.legs[index].metrics.ev) : 
              'hold'
          };
        } catch (error) {
          console.error(`Movement analysis failed for leg ${index}:`, error);
          return {
            ...analysis.legs[index],
            clv_data: clvAnalysis?.legs_clv[index] || null,
            movement_signals: null,
            movement_recommendation: 'hold'
          };
        }
      })
    );
    
    // Generate enhanced recommendations with CLV and movement data
    const recommendations = generateRecommendations(analysis, sportData, clvAnalysis, legsWithMovement);
    
    // Calculate hedge options if applicable
    const hedgeOptions = calculateHedgeOptions(legs, analysis);
    
    // Track slip analysis for CLV (if EV is positive)
    if (analysis.parlay.metrics.ev > 0) {
      await trackSlipForCLV(legs, analysis, sport);
    }

    // Build response
    const response = {
      success: true,
      analysis: {
        summary: {
          total_odds: {
            decimal: analysis.parlay.odds.decimal.toFixed(2),
            american: `${analysis.parlay.odds.american > 0 ? '+' : ''}${analysis.parlay.odds.american}`
          },
          win_probability: {
            naive: (analysis.parlay.probability.naive * 100).toFixed(1),
            adjusted: (analysis.parlay.probability.adjusted * 100).toFixed(1),
            correlation_factor: analysis.parlay.probability.correlationFactor.toFixed(2)
          },
          expected_value: {
            ev: analysis.parlay.metrics.ev.toFixed(3),
            ev_percent: analysis.parlay.metrics.evPercent.toFixed(1),
            verdict: getVerdict(analysis.parlay.metrics.ev)
          },
          kelly_stake: {
            full: (analysis.parlay.metrics.kellyFull * 100).toFixed(2),
            fractional_25: (analysis.parlay.metrics.kellyFractional * 100).toFixed(2),
            recommended_dollars: Math.round(analysis.parlay.metrics.kellyFractional * 10000)
          },
          smart_score: analysis.parlay.metrics.smartScore.toFixed(0),
          confidence: analysis.parlay.confidence
        },
        clv_analysis: clvAnalysis ? {
          aggregate: clvAnalysis.aggregate,
          has_clv_data: clvAnalysis.legs_clv.some(leg => leg.clv_percent !== null)
        } : null,
        legs_detail: legsWithMovement.map((leg, index) => ({
          position: index + 1,
          selection: leg.selection,
          book: leg.sportsbook,
          odds: leg.odds,
          probabilities: {
            implied: (leg.probabilities.implied * 100).toFixed(1),
            sharp: leg.probabilities.sharp ? (leg.probabilities.sharp * 100).toFixed(1) : null,
            consensus: leg.probabilities.consensus ? (leg.probabilities.consensus * 100).toFixed(1) : null,
            true: (leg.probabilities.true * 100).toFixed(1)
          },
          metrics: {
            ev: leg.metrics.ev.toFixed(3),
            ev_percent: leg.metrics.evPercent.toFixed(1),
            kelly: (leg.metrics.kellyFractional * 100).toFixed(2),
            passes_filters: leg.metrics.passesFilters
          },
          confidence: leg.confidence,
          issues: identifyLegIssues(leg, index),
          clv: leg.clv_data ? {
            clv_percent: leg.clv_data.clv_percent?.toFixed(2),
            closing_status: leg.clv_data.closing_status,
            beat_market: leg.clv_data.clv_percent > 0,
            closing_odds: leg.clv_data.closing_odds
          } : null,
          movement: leg.movement_signals ? {
            drift_open: leg.movement_signals.drift_open?.toFixed(3),
            drift_60: leg.movement_signals.drift_60?.toFixed(3),
            velocity_120: leg.movement_signals.velocity_120?.toFixed(3),
            favorite_pressure: leg.movement_signals.favorite_pressure?.toFixed(3),
            signals: {
              lm_signal: leg.movement_signals.LM_signal?.toFixed(2),
              fp_signal: leg.movement_signals.FP_signal?.toFixed(2),
              vel_signal: leg.movement_signals.Vel_signal?.toFixed(2)
            },
            recommendation: leg.movement_recommendation,
            movement_summary: getMovementSummary(leg.movement_signals)
          } : null
        })),
        quality_gates: analysis.parlay.qualityGates,
        recommendations,
        hedge_options: hedgeOptions
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Slip analysis error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze slip',
      error_type: 'analysis_error'
    });
  }
}

/**
 * Generate recommendations based on analysis, CLV, and movement data
 */
function generateRecommendations(analysis, sportData, clvAnalysis = null, legsWithMovement = null) {
  const recommendations = {
    primary_action: '',
    improvements: [],
    weak_legs: [],
    line_shopping: [],
    alternatives: []
  };
  
  // Determine primary action
  if (analysis.parlay.metrics.ev < 0) {
    recommendations.primary_action = 'AVOID - Negative expected value';
  } else if (analysis.parlay.metrics.ev < 0.02) {
    recommendations.primary_action = 'MARGINAL - Consider improvements';
  } else if (analysis.parlay.metrics.ev < 0.05) {
    recommendations.primary_action = 'PLAYABLE - Positive expected value';
  } else {
    recommendations.primary_action = 'STRONG PLAY - High expected value';
  }
  
  // Identify weak legs
  analysis.recommendations.weakLegs.forEach(leg => {
    recommendations.weak_legs.push({
      position: leg.index + 1,
      selection: leg.selection,
      issue: leg.metrics.ev < 0.015 ? 'Below EV threshold' : 
             leg.probabilities.true < 0.25 ? 'Probability too low' :
             leg.probabilities.true > 0.65 ? 'Probability too high' : 'Other',
      current_ev: (leg.metrics.evPercent).toFixed(1),
      suggestion: 'Consider removing or replacing'
    });
  });
  
  // Line shopping opportunities
  analysis.recommendations.lineShoppingOpps.forEach(opp => {
    recommendations.line_shopping.push({
      selection: opp.leg,
      current: `${opp.currentBook} @ ${opp.currentOdds.toFixed(2)}`,
      better: `${opp.bestBook} @ ${opp.bestOdds.toFixed(2)}`,
      ev_gain: `+${opp.evGainPercent.toFixed(1)}%`,
      value_per_100: `$${(opp.evGain * 100).toFixed(2)}`
    });
  });
  
  // Correlation warnings
  if (analysis.parlay.probability.correlationFactor < 0.85) {
    recommendations.improvements.push({
      type: 'correlation',
      message: 'High correlation detected between legs',
      impact: `Reduces win probability by ${((1 - analysis.parlay.probability.correlationFactor) * 100).toFixed(0)}%`,
      suggestion: 'Consider legs from different games'
    });
  }
  
  // EV improvements
  if (analysis.parlay.metrics.ev < 0.02 && analysis.parlay.metrics.ev > 0) {
    recommendations.improvements.push({
      type: 'ev_boost',
      message: 'Parlay EV below optimal threshold',
      current_ev: `${analysis.parlay.metrics.evPercent.toFixed(1)}%`,
      target_ev: '2.0%+',
      suggestion: 'Replace lowest EV legs or shop for better lines'
    });
  }

  // CLV-based recommendations
  if (clvAnalysis?.aggregate) {
    if (clvAnalysis.aggregate.lagged_market_count > clvAnalysis.aggregate.beat_market_count) {
      recommendations.improvements.push({
        type: 'clv_warning',
        message: 'Most legs show negative CLV',
        beat_market: clvAnalysis.aggregate.beat_market_count,
        lagged_market: clvAnalysis.aggregate.lagged_market_count,
        avg_clv: `${(clvAnalysis.aggregate.clv_mean * 100).toFixed(1)}%`,
        suggestion: 'Consider if these bets had value when placed vs market closing prices'
      });
    } else if (clvAnalysis.aggregate.beat_market_count > 0) {
      recommendations.improvements.push({
        type: 'clv_positive',
        message: 'Good CLV performance detected',
        beat_market: clvAnalysis.aggregate.beat_market_count,
        avg_clv: `${(clvAnalysis.aggregate.clv_mean * 100).toFixed(1)}%`,
        suggestion: 'Your original pricing beat the closing market on multiple legs'
      });
    }
  }

  // Movement-based recommendations
  if (legsWithMovement) {
    const strongNegativeMovement = legsWithMovement.filter(leg => 
      leg.movement_signals?.drift_open < -0.02 && leg.metrics.ev < 0.01
    );
    
    if (strongNegativeMovement.length > 0) {
      recommendations.improvements.push({
        type: 'movement_warning',
        message: `${strongNegativeMovement.length} legs show strong movement against position`,
        affected_legs: strongNegativeMovement.map(leg => leg.selection),
        suggestion: 'Consider hedging or replacing these legs due to unfavorable line movement'
      });
    }

    const replacementSuggestions = legsWithMovement.filter(leg => 
      leg.movement_recommendation === 'replace'
    );
    
    if (replacementSuggestions.length > 0) {
      recommendations.improvements.push({
        type: 'replacement_suggested',
        message: 'Movement analysis suggests replacing some legs',
        legs_to_replace: replacementSuggestions.map(leg => ({
          selection: leg.selection,
          reason: getMovementSummary(leg.movement_signals)
        })),
        suggestion: 'Strong movement against these positions with poor EV'
      });
    }
  }
  
  return recommendations;
}

/**
 * Calculate hedge options
 */
function calculateHedgeOptions(legs, analysis) {
  if (legs.length !== 2) {
    return null; // Only calculate hedge for 2-leg parlays for simplicity
  }
  
  const hedgeOptions = [];
  
  // Breakeven hedge
  const breakevenHedge = bettingMath.calculateHedge(
    100, // $100 stake example
    analysis.parlay.odds.decimal,
    2.0, // Approximate opposite odds
    'breakeven'
  );
  
  hedgeOptions.push({
    scenario: 'Guarantee Breakeven',
    original_stake: 100,
    hedge_stake: breakevenHedge.toFixed(2),
    guaranteed_return: 0,
    description: 'No loss regardless of outcome'
  });
  
  // 50% profit hedge
  const halfProfitHedge = bettingMath.calculateHedge(
    100,
    analysis.parlay.odds.decimal,
    2.0,
    0.5
  );
  
  hedgeOptions.push({
    scenario: 'Lock 50% Profit',
    original_stake: 100,
    hedge_stake: halfProfitHedge.toFixed(2),
    guaranteed_profit: ((analysis.parlay.odds.decimal - 1) * 100 * 0.5).toFixed(2),
    description: 'Secure half of potential winnings'
  });
  
  return hedgeOptions;
}

/**
 * Identify issues with individual legs
 */
function identifyLegIssues(leg, index) {
  const issues = [];
  
  if (leg.metrics.ev < 0) {
    issues.push('Negative EV');
  } else if (leg.metrics.ev < 0.015) {
    issues.push('Below minimum EV threshold');
  }
  
  if (leg.probabilities.true < 0.25) {
    issues.push('Probability too low (high variance)');
  } else if (leg.probabilities.true > 0.65) {
    issues.push('Probability too high (low payout)');
  }
  
  if (!leg.confidence.sharpAvailable) {
    issues.push('No sharp line available');
  }
  
  if (leg.confidence.score < 50) {
    issues.push('Low confidence score');
  }
  
  return issues;
}

/**
 * Get verdict based on EV
 */
function getVerdict(ev) {
  if (ev < -0.05) return 'STRONG AVOID';
  if (ev < 0) return 'NEGATIVE EV';
  if (ev < 0.01) return 'MARGINAL';
  if (ev < 0.02) return 'PLAYABLE';
  if (ev < 0.05) return 'GOOD VALUE';
  return 'EXCELLENT VALUE';
}

// CLV Tracking Integration for user-submitted slips
async function trackSlipForCLV(legs, analysis, sport) {
  try {
    console.log(`📈 Starting CLV tracking for user slip analysis (${legs.length} legs)...`);

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const legAnalysis = analysis.legs[i];
      
      // Extract team names from the leg data
      const { home_team, away_team } = extractTeamsFromLeg(leg);
      
      const trackingData = {
        sport: sport || 'unknown',
        home_team,
        away_team,
        market_type: leg.market_type || 'unknown',
        selection: leg.selection,
        game_id: generateSlipGameId(leg, home_team, away_team),
        commence_time: leg.commence_time || new Date(Date.now() + 24*60*60*1000).toISOString(), // Default to 24h from now
        opening_odds_decimal: parseFloat(leg.decimal_odds || leg.odds || 2.0),
        opening_odds_american: formatOddsForTracking(leg.odds),
        opening_sportsbook: leg.sportsbook || 'Unknown',
        suggested_probability: legAnalysis.probabilities.true,
        ev_at_suggestion: legAnalysis.metrics.ev,
        kelly_size_suggested: legAnalysis.metrics.kellyFractional,
        suggestion_source: 'user_slip',
        confidence_score: Math.round(legAnalysis.confidence.score || 70),
        model_version: 'v2.1',
        notes: `User Slip Analysis - EV: ${legAnalysis.metrics.evPercent.toFixed(1)}%`
      };

      // Call CLV tracking API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/clv/track-bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ CLV tracking started for user slip: ${leg.selection} (ID: ${result.bet_id})`);
      } else {
        console.error(`❌ CLV tracking failed for ${leg.selection}:`, await response.text());
      }
    }
  } catch (error) {
    console.error('❌ CLV tracking error:', error);
    // Don't throw - CLV tracking failure shouldn't break slip analysis
  }
}

// Helper functions for CLV tracking in slip analysis
function extractTeamsFromLeg(leg) {
  // Try to extract team names from various possible fields
  let home_team = 'Unknown';
  let away_team = 'Unknown';
  
  if (leg.home_team && leg.away_team) {
    home_team = leg.home_team;
    away_team = leg.away_team;
  } else if (leg.game && leg.game.includes(' @ ')) {
    const parts = leg.game.split(' @ ');
    if (parts.length === 2) {
      away_team = parts[0];
      home_team = parts[1];
    }
  } else if (leg.game && leg.game.includes(' vs ')) {
    const parts = leg.game.split(' vs ');
    if (parts.length === 2) {
      home_team = parts[0];
      away_team = parts[1];
    }
  } else if (leg.selection) {
    // Try to extract from selection string
    const selection = leg.selection;
    // This is a basic extraction - could be enhanced
    home_team = selection.split(' ')[0] || 'Unknown';
    away_team = 'Unknown';
  }
  
  return { home_team, away_team };
}

function generateSlipGameId(leg, home_team, away_team) {
  const today = new Date().toISOString().split('T')[0];
  const gameKey = `${away_team}-${home_team}`.toLowerCase().replace(/\s+/g, '-');
  return `slip-${gameKey}-${today}`;
}

function formatOddsForTracking(odds) {
  if (!odds) return '+100';
  if (typeof odds === 'string') return odds;
  if (typeof odds === 'number') {
    return odds > 0 ? `+${odds}` : `${odds}`;
  }
  return '+100';
}

// Helper functions for odds intelligence integration

/**
 * Generate game key from leg data
 */
function generateGameKey(leg) {
  const today = new Date().toISOString().split('T')[0];
  if (leg.game_key) return leg.game_key;
  
  if (leg.home_team && leg.away_team) {
    return `${leg.away_team}-${leg.home_team}-${today}`.toLowerCase().replace(/\s+/g, '-');
  }
  
  if (leg.game && leg.game.includes(' @ ')) {
    const [away, home] = leg.game.split(' @ ');
    return `${away}-${home}-${today}`.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Fallback
  return `unknown-game-${today}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get movement summary text for UI
 */
function getMovementSummary(signals) {
  if (!signals) return 'No movement data';
  
  const drift = signals.drift_open || 0;
  const velocity = signals.velocity_120 || 0;
  const fpSignal = signals.FP_signal || 0;
  
  if (Math.abs(drift) < 0.005 && Math.abs(velocity) < 0.005) {
    return 'Stable line';
  }
  
  let summary = '';
  
  if (drift > 0.01) {
    summary += 'Line moved toward selection';
  } else if (drift < -0.01) {
    summary += 'Line moved away from selection';
  } else {
    summary += 'Minimal line movement';
  }
  
  if (Math.abs(velocity) > 0.01) {
    const direction = velocity > 0 ? 'accelerating toward' : 'accelerating away';
    summary += `, ${direction}`;
  }
  
  if (fpSignal > 0.6) {
    summary += ', high favorite pressure';
  }
  
  return summary;
}