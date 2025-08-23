// Enhanced parlay generation with precise EV calculations using Pinnacle baseline
const openai = require('../../lib/openai');
const eventsCache = require('../../lib/events-cache.js');
const { findPositiveEVBets, buildOptimalParlay } = require('../../lib/math/positive-ev-finder.js');

async function handler(req, res) {
  console.log('🎯 Generate Parlay with Precise EV Calculations');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { preferences, sport, riskLevel } = req.body;
  const config = preferences || { sport, riskLevel, legs: 3 };
  
  if (!config.sport) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sport selection required' 
    });
  }

  try {
    console.log(`🔍 Fetching ${config.sport} data with Pinnacle baseline...`);
    
    // Step 1: Get sport data including Pinnacle for baseline
    const sportData = await fetchSportDataWithPinnacle(config.sport);
    
    if (!sportData || sportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active games found for ${config.sport}`
      });
    }

    // Step 2: Find all positive EV bets using Pinnacle baseline
    const positiveEVOptions = findPositiveEVBets(sportData, {
      minEV: getMinEVForRiskLevel(config.riskLevel),
      requireBaseline: true, // Only use bets where we have Pinnacle baseline
      marketFilter: getMarketFilter(config),
      bookmakerFilter: getTopSportsbooks()
    });

    console.log(`✅ Found ${positiveEVOptions.length} positive EV betting options`);

    if (positiveEVOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No positive EV opportunities found for ${config.sport}. Markets may be too efficient.`,
        suggestion: 'Try a different sport or check back when lines move.'
      });
    }

    // Step 3: Build optimal parlay or use AI for strategic selection
    let parlayData;
    
    if (positiveEVOptions.length < 20) {
      // Few options - use mathematical optimization
      console.log('📊 Using mathematical optimization for parlay selection');
      parlayData = await buildMathematicalParlay(positiveEVOptions, config);
    } else {
      // Many options - use AI for strategic selection
      console.log('🤖 Using AI for strategic parlay selection from positive EV pool');
      parlayData = await generateAIOptimizedParlay(positiveEVOptions, config);
    }

    // Step 4: Calculate final parlay metrics
    const finalMetrics = calculateParlayMetrics(parlayData);

    return res.status(200).json({
      success: true,
      parlay: {
        ...parlayData,
        ...finalMetrics,
        sport: config.sport,
        timestamp: new Date().toISOString(),
        ev_analysis: {
          total_options_analyzed: sportData.length,
          positive_ev_found: positiveEVOptions.length,
          baseline_source: 'Pinnacle',
          confidence: finalMetrics.confidence
        }
      }
    });

  } catch (error) {
    console.error('❌ EV Parlay generation error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message,
      error_type: 'ev_parlay_generation_error'
    });
  }
}

// Fetch sport data ensuring Pinnacle is included
async function fetchSportDataWithPinnacle(sport) {
  try {
    // Get events from cache
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log(`⚠️ No upcoming events for ${sport}`);
      return [];
    }
    
    // Get odds including Pinnacle (required for baseline)
    // Always include player props in markets string for EV calculations
    const markets = getSportMarkets(sport, true);
    console.log(`📊 Fetching markets for ${sport}: ${markets.split(',').length} market types`);
    
    const oddsData = await eventsCache.getOddsForEvents(
      upcomingEvents, 
      markets, 
      true // Include player props flag for cache
    );
    
    // Ensure Pinnacle is included in bookmakers
    const gamesWithPinnacle = await ensurePinnacleOdds(oddsData, sport);
    
    return gamesWithPinnacle;
    
  } catch (error) {
    console.error('Error fetching sport data:', error);
    throw error;
  }
}

// Ensure Pinnacle odds are fetched
async function ensurePinnacleOdds(gameData, sport) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  // Check if we already have Pinnacle
  const hasPinnacle = gameData.some(game => 
    game.bookmakers?.some(b => b.title?.toLowerCase().includes('pinnacle'))
  );
  
  if (hasPinnacle) {
    return gameData;
  }
  
  console.log('📍 Fetching Pinnacle odds for baseline...');
  
  // Fetch Pinnacle specifically with all markets including player props
  const sportKey = getSportKey(sport);
  const markets = getSportMarkets(sport, true);
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&bookmakers=pinnacle&markets=${markets}&oddsFormat=american`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log('⚠️ Could not fetch Pinnacle odds, using estimation');
      return gameData;
    }
    
    const pinnacleData = await response.json();
    
    // Merge Pinnacle data with existing game data
    return mergeBookmakerData(gameData, pinnacleData);
  } catch (error) {
    console.log('⚠️ Pinnacle fetch failed, continuing with estimation');
    return gameData;
  }
}

// Build parlay using mathematical optimization
async function buildMathematicalParlay(positiveEVBets, config) {
  const optimalParlay = buildOptimalParlay(positiveEVBets, {
    legs: config.legs,
    requirePlayerProps: config.includePlayerProps,
    playerPropsRatio: config.includePlayerProps ? 0.5 : 0
  });
  
  return {
    parlay_legs: optimalParlay.legs.map(bet => ({
      game: bet.game,
      sportsbook: bet.sportsbook,
      bet_type: bet.market_type,
      selection: bet.selection,
      odds: formatOdds(bet.odds),
      decimal_odds: bet.decimal_odds,
      expected_value: bet.expectedValue,
      true_probability: bet.trueProbability,
      reasoning: `${(bet.expectedValue * 100).toFixed(1)}% EV with ${(bet.trueProbability * 100).toFixed(1)}% win probability`
    })),
    total_decimal_odds: optimalParlay.metrics.combinedOdds,
    expected_value: optimalParlay.metrics.expectedValue,
    confidence: optimalParlay.metrics.confidence,
    method: 'mathematical_optimization'
  };
}

// Generate AI-optimized parlay from positive EV pool
async function generateAIOptimizedParlay(positiveEVBets, config) {
  // Take top 15 highest EV bets for AI selection
  const topBets = positiveEVBets.slice(0, 15);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sports betting expert. Select exactly ${config.legs} legs from these positive EV bets. ${config.includePlayerProps ? 'Include player props.' : ''} Focus on correlation analysis and maximizing expected value while managing risk. Return ONLY valid JSON.`
        },
        {
          role: "user",
          content: `Create optimal ${config.legs}-leg parlay from these positive EV bets:

${topBets.map((bet, i) => 
  `${i+1}. ${bet.game} - ${bet.selection} @ ${bet.sportsbook}
   Odds: ${formatOdds(bet.odds)} | EV: ${(bet.expectedValue * 100).toFixed(2)}% | True Prob: ${(bet.trueProbability * 100).toFixed(1)}%`
).join('\n')}

Return JSON:
{
  "selected_indices": [array of bet indices],
  "correlation_analysis": "brief correlation assessment",
  "risk_management": "risk consideration"
}`
        }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    const selectedBets = aiResponse.selected_indices.map(i => topBets[i]);
    
    // Build parlay from AI selection
    const optimalParlay = buildOptimalParlay(selectedBets, {
      legs: config.legs
    });
    
    return {
      parlay_legs: optimalParlay.legs.map(bet => ({
        game: bet.game,
        sportsbook: bet.sportsbook,
        bet_type: bet.market_type,
        selection: bet.selection,
        odds: formatOdds(bet.odds),
        decimal_odds: bet.decimal_odds,
        expected_value: bet.expectedValue,
        true_probability: bet.trueProbability,
        reasoning: `${(bet.expectedValue * 100).toFixed(1)}% EV - ${aiResponse.correlation_analysis}`
      })),
      total_decimal_odds: optimalParlay.metrics.combinedOdds,
      expected_value: optimalParlay.metrics.expectedValue,
      confidence: optimalParlay.metrics.confidence,
      ai_insights: {
        correlation: aiResponse.correlation_analysis,
        risk: aiResponse.risk_management
      },
      method: 'ai_optimization'
    };
    
  } catch (error) {
    console.log('AI optimization failed, using mathematical approach');
    return buildMathematicalParlay(positiveEVBets, config);
  }
}

// Calculate comprehensive parlay metrics
function calculateParlayMetrics(parlayData) {
  const legs = parlayData.parlay_legs;
  
  // Calculate combined metrics
  const combinedOdds = legs.reduce((acc, leg) => acc * leg.decimal_odds, 1);
  const combinedProb = legs.reduce((acc, leg) => acc * (leg.true_probability || 0.5), 1);
  const combinedEV = (combinedProb * (combinedOdds - 1)) - (1 - combinedProb);
  
  // Determine confidence based on data quality
  const allHaveBaseline = legs.every(leg => leg.true_probability > 0);
  const avgEV = legs.reduce((sum, leg) => sum + (leg.expected_value || 0), 0) / legs.length;
  
  let confidence = 'medium';
  if (allHaveBaseline && avgEV > 0.03) confidence = 'high';
  if (!allHaveBaseline || avgEV < 0.01) confidence = 'low';
  
  return {
    total_decimal_odds: combinedOdds.toFixed(3),
    total_american_odds: decimalToAmerican(combinedOdds),
    win_probability: (combinedProb * 100).toFixed(2) + '%',
    expected_value: (combinedEV * 100).toFixed(2) + '%',
    expected_return_per_dollar: (1 + combinedEV).toFixed(3),
    confidence,
    kelly_criterion: calculateKellyCriterion(combinedEV, combinedOdds, combinedProb)
  };
}

// Helper functions
function getMinEVForRiskLevel(riskLevel) {
  switch(riskLevel?.toLowerCase()) {
    case 'conservative': return 0.03; // 3% minimum EV
    case 'moderate': return 0.02; // 2% minimum EV
    case 'aggressive': return 0.01; // 1% minimum EV
    default: return 0.02;
  }
}

function getMarketFilter(config) {
  // Always return null to include all markets (including player props)
  // The filtering will be done at the parlay building stage
  return null;
}

function getTopSportsbooks() {
  return [
    'DraftKings',
    'FanDuel',
    'BetMGM',
    'Caesars',
    'PointsBet',
    'BetRivers',
    'Unibet',
    'BetOnline.ag'
  ];
}

function getSportMarkets(sport, includePlayerProps = true) {
  const soccerSports = ['Soccer', 'MLS', 'UEFA', 'EPL'];
  
  // Base markets
  let markets = soccerSports.includes(sport) ? 'h2h,totals' : 'h2h,spreads,totals';
  
  // Add player props for supported sports
  if (includePlayerProps && !soccerSports.includes(sport)) {
    // Add all player prop markets
    const playerPropMarkets = [
      'player_pass_tds',
      'player_pass_yds', 
      'player_rush_yds',
      'player_receptions',
      'player_reception_yds',
      'player_anytime_td',
      'player_points',
      'player_rebounds',
      'player_assists',
      'player_threes',
      'player_goals',
      'player_hits',
      'player_home_runs',
      'player_rbis',
      'pitcher_strikeouts'
    ].join(',');
    
    markets = `${markets},${playerPropMarkets}`;
  }
  
  return markets;
}

function getSportKey(sport) {
  const mapping = {
    'NFL': 'americanfootball_nfl',
    'NBA': 'basketball_nba',
    'NHL': 'icehockey_nhl',
    'MLB': 'baseball_mlb',
    'NCAAF': 'americanfootball_ncaaf',
    'NCAAB': 'basketball_ncaab'
  };
  return mapping[sport] || 'americanfootball_nfl';
}

function formatOdds(odds) {
  if (typeof odds === 'number') {
    return odds >= 0 ? `+${odds}` : `${odds}`;
  }
  return odds;
}

function decimalToAmerican(decimal) {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
}

function calculateKellyCriterion(ev, odds, prob) {
  // Kelly % = (bp - q) / b
  // where b = decimal odds - 1, p = win probability, q = loss probability
  const b = odds - 1;
  const kellyPercent = ((b * prob) - (1 - prob)) / b;
  
  // Apply fractional Kelly (25%) for safety
  const fractionalKelly = Math.max(0, kellyPercent * 0.25);
  
  return {
    full: (kellyPercent * 100).toFixed(2) + '%',
    fractional: (fractionalKelly * 100).toFixed(2) + '%',
    recommended: fractionalKelly > 0.1 ? '5-10%' : (fractionalKelly * 100).toFixed(1) + '%'
  };
}

function mergeBookmakerData(existingData, pinnacleData) {
  // Implementation to merge Pinnacle data with existing bookmaker data
  return existingData.map(game => {
    const pinnacleGame = pinnacleData.find(p => 
      p.home_team === game.home_team && p.away_team === game.away_team
    );
    
    if (pinnacleGame && pinnacleGame.bookmakers) {
      game.bookmakers = [...(game.bookmakers || []), ...pinnacleGame.bookmakers];
    }
    
    return game;
  });
}

module.exports = handler;
module.exports.default = handler;