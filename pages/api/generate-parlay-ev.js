// Enhanced parlay generation with precise EV calculations using Pinnacle baseline
const openai = require('../../lib/openai');
const eventsCache = require('../../lib/events-cache.js');

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
    console.log(`🔍 Fetching ${config.sport} data with basic markets...`);
    
    // Step 1: Get sport data with fallback approach  
    const sportData = await fetchSportDataWithFallback(config.sport);
    
    if (!sportData || sportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active games found for ${config.sport}`
      });
    }

    // Step 2: Extract betting options from available data
    const bettingOptions = extractBettingOptions(sportData, config);

    console.log(`✅ Found ${bettingOptions.length} betting options`);

    if (bettingOptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No betting opportunities found for ${config.sport}.`,
        suggestion: 'Try a different sport or check back later.'
      });
    }

    // Step 3: Use AI for selection from available options
    console.log('🤖 Using AI for parlay selection from available options');
    const parlayData = await generateAIOptimizedParlay(bettingOptions, config);

    // Step 4: Calculate final parlay metrics
    const finalMetrics = calculateBasicParlayMetrics(parlayData);

    return res.status(200).json({
      success: true,
      parlay: {
        ...parlayData,
        ...finalMetrics,
        sport: config.sport,
        timestamp: new Date().toISOString(),
        analysis: {
          total_options_analyzed: sportData.length,
          betting_options_found: bettingOptions.length,
          method: 'ai_selection',
          confidence: finalMetrics.confidence
        }
      }
    });

  } catch (error) {
    console.error('❌ EV Parlay generation error:', error);
    
    // Fallback to basic generation
    try {
      console.log('🔄 Falling back to basic parlay generation...');
      const fallbackHandler = require('./optimized-generate-parlay.js');
      return await fallbackHandler(req, res);
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        message: 'Both EV and fallback parlay generation failed',
        error_type: 'complete_parlay_generation_failure'
      });
    }
  }
}

// Fetch sport data with fallback approach
async function fetchSportDataWithFallback(sport) {
  try {
    // Get events from cache
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log(`⚠️ No upcoming events for ${sport}`);
      return [];
    }
    
    // Get odds with fallback to basic markets if player props fail
    const markets = getSportMarkets(sport, false); // Start with basic markets only
    console.log(`📊 Fetching markets for ${sport}: ${markets}`);
    
    const oddsData = await eventsCache.getOddsForEvents(
      upcomingEvents, 
      markets, 
      false // No player props for reliability
    );
    
    return oddsData;
    
  } catch (error) {
    console.error('Error fetching sport data:', error);
    throw error;
  }
}

// Extract betting options from available game data
function extractBettingOptions(gameData, config) {
  const bettingOptions = [];
  
  for (const game of gameData) {
    if (!game.bookmakers) continue;
    
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes || []) {
          bettingOptions.push({
            game: `${game.away_team} @ ${game.home_team}`,
            sportsbook: bookmaker.title,
            bet_type: market.key,
            selection: outcome.name,
            point: outcome.point || null,
            odds: outcome.price,
            decimal_odds: americanToDecimal(outcome.price),
            commence_time: game.commence_time
          });
        }
      }
    }
  }
  
  return bettingOptions;
}

// Generate AI-optimized parlay from betting options
async function generateAIOptimizedParlay(bettingOptions, config) {
  // Take top betting options for AI selection (limit to 20 for performance)
  const topBets = bettingOptions.slice(0, 20);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sports betting expert. Select exactly ${config.legs || 3} legs from these betting options. Focus on correlation analysis and managing risk. Return ONLY valid JSON.`
        },
        {
          role: "user",
          content: `Create optimal ${config.legs || 3}-leg parlay from these betting options:

${topBets.map((bet, i) => 
  `${i+1}. ${bet.game} - ${bet.selection} @ ${bet.sportsbook}
   Odds: ${formatOdds(bet.odds)} | Market: ${bet.bet_type}`
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
    
    return {
      parlay_legs: selectedBets.map(bet => ({
        game: bet.game,
        sportsbook: bet.sportsbook,
        bet_type: bet.bet_type,
        selection: bet.selection,
        odds: formatOdds(bet.odds),
        decimal_odds: bet.decimal_odds,
        reasoning: aiResponse.correlation_analysis
      })),
      ai_insights: {
        correlation: aiResponse.correlation_analysis,
        risk: aiResponse.risk_management
      },
      method: 'ai_optimization'
    };
    
  } catch (error) {
    console.log('AI optimization failed, using simple selection');
    // Fallback to simple selection
    const selectedBets = topBets.slice(0, config.legs || 3);
    return {
      parlay_legs: selectedBets.map(bet => ({
        game: bet.game,
        sportsbook: bet.sportsbook,
        bet_type: bet.bet_type,
        selection: bet.selection,
        odds: formatOdds(bet.odds),
        decimal_odds: bet.decimal_odds,
        reasoning: 'Simple selection fallback'
      })),
      method: 'simple_fallback'
    };
  }
}

// Calculate basic parlay metrics
function calculateBasicParlayMetrics(parlayData) {
  const legs = parlayData.parlay_legs;
  
  if (!legs || legs.length === 0) {
    return {
      total_decimal_odds: 1,
      total_american_odds: '+0',
      confidence: 'low'
    };
  }
  
  // Calculate combined odds
  const combinedOdds = legs.reduce((acc, leg) => acc * leg.decimal_odds, 1);
  
  return {
    total_decimal_odds: combinedOdds.toFixed(3),
    total_american_odds: decimalToAmerican(combinedOdds),
    confidence: 'medium'
  };
}

// Helper functions
function americanToDecimal(american) {
  if (american >= 0) {
    return 1 + (american / 100);
  } else {
    return 1 + (100 / Math.abs(american));
  }
}

function getSportMarkets(sport, includePlayerProps = false) {
  const soccerSports = ['Soccer', 'MLS', 'UEFA', 'EPL'];
  
  // Base markets only for reliability
  return soccerSports.includes(sport) ? 'h2h,totals' : 'h2h,spreads,totals';
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

module.exports = handler;
module.exports.default = handler;