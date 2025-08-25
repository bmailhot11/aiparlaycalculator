/**
 * Historical Edge Analyzer
 * Identifies profitable betting patterns from historical data
 */

const { supabase } = require('../utils/supabaseClient');

/**
 * Analyze team underdog performance patterns
 * Find teams that consistently outperform as underdogs
 */
async function analyzeUnderdogPatterns(sport, daysBack = 365) {
  try {
    const { data, error } = await supabase.rpc('analyze_underdog_performance', {
      p_sport: sport,
      p_days_back: daysBack
    });

    if (error) throw error;

    // Process results to find profitable patterns
    return data.map(team => ({
      team: team.team_name,
      games_as_underdog: team.underdog_games,
      win_rate: team.win_percentage,
      avg_odds: team.avg_underdog_odds,
      roi: team.roi_percentage,
      profitable: team.roi_percentage > 5, // 5%+ ROI threshold
      edge_score: calculateEdgeScore(team)
    }));

  } catch (error) {
    console.error('Underdog analysis error:', error);
    return [];
  }
}

/**
 * Analyze situational betting edges
 * Home vs Away, After Loss, Back-to-back, etc.
 */
async function analyzeSituationalEdges(sport, situation) {
  const situations = {
    'home_underdog': 'team_is_home = true AND odds_decimal > 2.0',
    'after_loss': 'previous_game_result = \'loss\'',
    'back_to_back': 'days_since_last_game <= 1',
    'divisional_underdog': 'is_divisional_game = true AND odds_decimal > 2.0'
  };

  try {
    const { data, error } = await supabase.rpc('analyze_situational_performance', {
      p_sport: sport,
      p_situation: situations[situation] || situation
    });

    return data;
  } catch (error) {
    console.error('Situational analysis error:', error);
    return [];
  }
}

/**
 * Real-time edge detection for current games
 * Apply historical patterns to today's lines with fallback
 */
async function detectCurrentEdges(availableBets, sport) {
  try {
    console.log(`🔍 Attempting historical analysis for ${sport}...`);
    const underdogPatterns = await analyzeUnderdogPatterns(sport, 180); // Last 6 months
    
    // Check if we have meaningful historical data
    if (!underdogPatterns || underdogPatterns.length === 0) {
      console.log(`⚠️ No historical data available for ${sport}, using basic analysis`);
      return applyBasicEdgeAnalysis(availableBets, sport);
    }

    console.log(`✅ Found ${underdogPatterns.length} historical patterns for ${sport}`);
    const enhancedBets = [];

    for (const bet of availableBets) {
      const teamPattern = underdogPatterns.find(p => 
        bet.selection.includes(p.team) && p.profitable
      );

      if (teamPattern && bet.decimal_odds > 2.0) {
        // This team has profitable underdog history
        const historicalEdge = {
          pattern_type: 'underdog_history',
          historical_win_rate: teamPattern.win_rate,
          historical_roi: teamPattern.roi,
          sample_size: teamPattern.games_as_underdog,
          edge_strength: teamPattern.edge_score,
          recommendation: teamPattern.edge_score > 0.7 ? 'strong_bet' : 'consider'
        };

        enhancedBets.push({
          ...bet,
          historical_edge: historicalEdge,
          ev_boost: teamPattern.roi / 100, // Add historical ROI to EV calculation
          priority_boost: teamPattern.edge_score > 0.7 ? 2.0 : 1.0
        });
      } else {
        enhancedBets.push(bet);
      }
    }

    return enhancedBets;
    
  } catch (error) {
    console.error(`❌ Historical analysis failed for ${sport}:`, error.message);
    console.log(`🔄 Falling back to basic edge analysis`);
    return applyBasicEdgeAnalysis(availableBets, sport);
  }
}

/**
 * Fallback edge analysis when historical data is unavailable
 * Uses basic heuristics and market patterns
 */
function applyBasicEdgeAnalysis(availableBets, sport) {
  console.log(`📊 Applying basic edge analysis (no historical data)`);
  
  return availableBets.map(bet => {
    let priorityBoost = 1.0;
    let edgeInsights = [];
    
    // Basic underdog boost for reasonable odds
    if (bet.decimal_odds >= 2.5 && bet.decimal_odds <= 4.0) {
      priorityBoost = 1.3;
      edgeInsights.push('Moderate underdog - potential market inefficiency');
    }
    
    // Home underdog boost (typically undervalued)
    if (bet.selection && bet.game && bet.decimal_odds > 2.0) {
      const gameTeams = bet.game.split(' @ ');
      if (gameTeams.length === 2) {
        const homeTeam = gameTeams[1];
        if (bet.selection.includes(homeTeam)) {
          priorityBoost = Math.max(priorityBoost, 1.4);
          edgeInsights.push('Home underdog - historically undervalued');
        }
      }
    }
    
    // Market inefficiency indicators for player props
    if (bet.market_type && bet.market_type.includes('player_')) {
      priorityBoost = Math.max(priorityBoost, 1.2);
      edgeInsights.push('Player prop - less efficient market');
    }
    
    // Avoid extreme longshots and heavy favorites
    if (bet.decimal_odds > 6.0) {
      priorityBoost = 0.8;
      edgeInsights.push('Long shot - proceed with caution');
    } else if (bet.decimal_odds < 1.4) {
      priorityBoost = 0.9;
      edgeInsights.push('Heavy favorite - limited value');
    }

    return {
      ...bet,
      priority_boost: priorityBoost,
      fallback_analysis: {
        pattern_type: 'basic_heuristics',
        insights: edgeInsights,
        confidence: 'low', // Low confidence without historical data
        data_status: 'fallback'
      }
    };
  });
}

/**
 * Calculate edge score based on historical performance
 */
function calculateEdgeScore(teamData) {
  const { win_percentage, roi_percentage, underdog_games, avg_underdog_odds } = teamData;
  
  // Components of edge score
  const winRateScore = Math.min(win_percentage / 50, 1.0); // 50%+ is excellent for underdog
  const roiScore = Math.min(roi_percentage / 20, 1.0); // 20%+ ROI is excellent  
  const sampleScore = Math.min(underdog_games / 20, 1.0); // 20+ games is good sample
  const oddsScore = Math.min((avg_underdog_odds - 2.0) / 3.0, 1.0); // Higher odds = more edge
  
  // Weighted combination
  return (winRateScore * 0.4 + roiScore * 0.3 + sampleScore * 0.2 + oddsScore * 0.1);
}

/**
 * Generate historical insights for parlay construction
 */
async function generateHistoricalInsights(legs) {
  const insights = [];
  
  for (const leg of legs) {
    // Check for underdog patterns
    const underdogInsight = await checkUnderdogPattern(leg);
    if (underdogInsight) insights.push(underdogInsight);
    
    // Check for situational edges
    const situationalInsight = await checkSituationalEdges(leg);
    if (situationalInsight) insights.push(situationalInsight);
  }
  
  return insights;
}

module.exports = {
  analyzeUnderdogPatterns,
  analyzeSituationalEdges, 
  detectCurrentEdges,
  generateHistoricalInsights,
  calculateEdgeScore
};