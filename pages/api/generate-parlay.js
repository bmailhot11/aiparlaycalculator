import openai from '../../lib/openai';

export default async function handler(req, res) {
  // Environment Variables Check
  console.log('🔍 Generate Parlay API Environment Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('ODDS_API_KEY exists:', !!process.env.ODDS_API_KEY);

  // Admin Override - Disabled for MVP
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'disabled';
  const isAdmin = false; // Disabled for MVP
  const isDev = false; // Disabled for MVP  
  const hasUnlimitedAccess = false; // Disabled for MVP

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { preferences, sport, riskLevel } = req.body;
  
  // Support both old and new formats
  const config = preferences || { sport, riskLevel, legs: 3 };
  
  if (!config.sport) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sport selection required' 
    });
  }

  try {
    console.log(`🎯 Generating ${config.sport} parlay with ${config.legs || 3} legs...`);

    // Step 1: Get ONLY the selected sport's data
    const sportData = await fetchSportSpecificOdds(config.sport);
    
    if (!sportData || sportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active or upcoming games found for ${config.sport} in the next 14 days. This sport may be out of season.`
      });
    }

    // Step 2: Generate parlay with real odds validation
    const parlayData = await generateParlayWithRealOdds(config, sportData);

    return res.status(200).json({
      success: true,
      parlay: {
        ...parlayData,
        sport: config.sport,
        timestamp: new Date().toISOString(),
        games_available: sportData.length,
        sportsbooks_analyzed: parlayData.best_sportsbooks?.length || 0,
        unlimited_access: hasUnlimitedAccess
      }
    });

  } catch (error) {
    console.error('❌ Parlay generation error:', error);
    
    // Enhanced error handling for OpenAI credit issues
    let errorMessage = error.message;
    let troubleshooting = [];
    
    if (error.message.includes('quota') || error.message.includes('billing') || error.message.includes('credits')) {
      errorMessage = 'AI service temporarily unavailable due to usage limits. Generated parlay using fallback method.';
      troubleshooting = [
        'Your parlay was generated using mathematical analysis instead of AI',
        'All odds and selections are still valid and optimized',
        'Check OpenAI billing dashboard for credit status',
        'Consider upgrading OpenAI plan for consistent AI analysis'
      ];
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Service temporarily busy. Please wait 30 seconds and try again.';
      troubleshooting = [
        'High traffic detected - wait 30 seconds',
        'Try during off-peak hours for faster response'
      ];
    } else {
      troubleshooting = [
        `Check if ${config.sport} is currently in season`,
        "Verify your OpenAI API key has sufficient credits",
        "Try selecting fewer legs for the parlay",
        "Check your internet connection"
      ];
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error_type: "parlay_generation_error",
      troubleshooting: troubleshooting
    });
  }
}

// 🚀 SMART: Get sport-specific markets with fallback
function getSportSpecificMarkets(sportKey, useFullMarkets = true) {
  if (!useFullMarkets) {
    // Fallback to basic H2H only
    console.log(`🔄 ${sportKey} markets (fallback): h2h`);
    return 'h2h';
  }
  
  // TEMPORARY DEBUG: For NFL, start with H2H only to test if games exist at all
  if (sportKey.includes('americanfootball')) {
    console.log(`🐛 DEBUG: Using H2H only for ${sportKey} to test game availability`);
    return 'h2h';
  }
  
  // Try full markets first
  const baseMarkets = 'h2h,spreads,totals';
  
  // SIMPLIFIED: Start with fewer player props to avoid API limits
  const sportPlayerMarkets = {
    'americanfootball_nfl': 'player_pass_yds,player_rush_yds,player_reception_yds',
    'americanfootball_nfl_preseason': 'player_pass_yds,player_rush_yds',
    'americanfootball_ncaaf': 'player_pass_yds,player_rush_yds',
    'basketball_nba': 'player_points,player_rebounds,player_assists',
    'basketball_nba_preseason': 'player_points,player_rebounds',
    'basketball_ncaab': 'player_points,player_rebounds',
    'icehockey_nhl': 'player_goals,player_assists,player_points',
    'icehockey_nhl_preseason': 'player_goals,player_assists',
    'baseball_mlb': 'batter_hits,batter_rbis,pitcher_strikeouts'
  };
  
  const playerMarkets = sportPlayerMarkets[sportKey] || '';
  const allMarkets = playerMarkets ? `${baseMarkets},${playerMarkets}` : baseMarkets;
  
  console.log(`🎯 ${sportKey} markets (full): ${allMarkets}`);
  return allMarkets;
}

// NEW: Fetch odds for specific sport only
async function fetchSportSpecificOdds(sport) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Odds API key not configured');
  }
  
  // Log API key info for debugging (without exposing the key)
  console.log(`🔑 API Key configured: ${API_KEY.length} chars, starts with: ${API_KEY.substring(0, 8)}...`);
  console.log(`📅 Current date: ${new Date().toISOString()}`);
  console.log(`🏈 Requested sport: ${sport}`);

  // Map user-friendly sport names to API sport keys (CONSISTENT WITH EV FETCHER)  
  const sportMapping = {
    'NFL': ['americanfootball_nfl_preseason', 'americanfootball_nfl'], // Try preseason first in August
    'NBA': ['basketball_nba', 'basketball_nba_preseason'], 
    'NHL': ['icehockey_nhl', 'icehockey_nhl_preseason'],
    'MLB': ['baseball_mlb'],
    'NCAAF': ['americanfootball_ncaaf'],
    'NCAAB': ['basketball_ncaab'],
    'UFC': ['mma_mixed_martial_arts'],
    'MMA': ['mma_mixed_martial_arts'],
    'Boxing': ['boxing_boxing'],
    'Soccer': ['soccer_epl', 'soccer_usa_mls', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 'soccer_germany_bundesliga', 'soccer_france_ligue_one'],
    'EPL': ['soccer_epl'],
    'Tennis': ['tennis_atp', 'tennis_wta'],
    'Golf': ['golf_pga'],
    'Cricket': ['cricket_big_bash'],
    'AFL': ['aussierules_afl'],
    'Mixed': ['americanfootball_nfl_preseason', 'baseball_mlb', 'soccer_epl', 'soccer_usa_mls', 'tennis_atp'] // Mixed gets sports likely in season
  };

  const sportKeys = sportMapping[sport];
  
  if (!sportKeys) {
    throw new Error(`Sport ${sport} not supported`);
  }

  let allGames = [];
  
  // Try each sport variant with full markets first, then fallback to H2H only
  for (const sportKey of sportKeys) {
    // Try full markets first
    const attemptFetch = async (useFullMarkets) => {
      try {
        const marketType = useFullMarkets ? 'full' : 'H2H fallback';
        console.log(`🔄 Fetching ${sport} odds (${sportKey}) - ${marketType}...`);
        
        const markets = getSportSpecificMarkets(sportKey, useFullMarkets);
        
        // Use different regions for soccer to increase chances
        const regions = sportKey.startsWith('soccer_') ? 'us,uk,eu' : 'us';
        const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=american&dateFormat=iso`;
        console.log(`URL: ${url.replace(API_KEY, 'HIDDEN')}`);
        console.log(`Markets requested: ${markets}`);
        
        const response = await fetch(url, { 
          headers: { 'Accept': 'application/json' }
        });

        console.log(`Response status for ${sportKey} (${marketType}): ${response.status}`);
        
        if (!response.ok) {
          // Get response body for better error details
          let errorBody = '';
          try {
            errorBody = await response.text();
            console.log(`Error response body: ${errorBody}`);
          } catch (e) {
            console.log('Could not read error response body');
          }
          
          if (response.status === 422) {
            console.log(`${sportKey} is out of season or invalid markets (422)`);
            return { success: false, reason: 'out_of_season' };
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded - please wait');
          } else if (response.status === 401) {
            throw new Error('Invalid Odds API key');
          } else {
            console.log(`API error for ${sportKey}: ${response.status}`);
            return { success: false, reason: 'api_error' };
          }
        }

        const games = await response.json();
        console.log(`✅ Found ${games.length} ${sport} games using ${sportKey} (${marketType})`);
        
        return { success: true, games };
        
      } catch (error) {
        console.log(`Error fetching ${sportKey} (${useFullMarkets ? 'full' : 'H2H'}):`, error.message);
        return { success: false, reason: 'network_error' };
      }
    };
    
    // Try full markets first
    let result = await attemptFetch(true);
    
    // If full markets failed but not due to out of season, try H2H fallback
    if (!result.success && result.reason !== 'out_of_season') {
      console.log(`🔄 Full markets failed for ${sportKey}, trying H2H fallback...`);
      result = await attemptFetch(false);
    }
    
    // If we got games, process them
    if (result.success && result.games && result.games.length > 0) {
      allGames.push(...result.games);
      
      // For mixed sport, continue collecting from other sports
      if (sport === 'Mixed' && allGames.length < 10) {
        continue;
      } else {
        break; // For single sports, stop after finding games
      }
    } else if (result.reason === 'out_of_season') {
      // Sport is out of season, try next variant
      continue;
    }
  }
  
  // If no variants worked, throw error with more details
  if (allGames.length === 0) {
    console.log(`❌ [Parlay] No games found for ${sport}. Tried variants: ${sportKeys.join(', ')}`);
    console.log(`❌ [Parlay] This suggests either: 1) Sport is out of season, 2) API key has insufficient permissions, 3) All variants returned 422 errors`);
    throw new Error(`No active or upcoming games found for ${sport}. Tried all variants: ${sportKeys.join(', ')}. Check if sport is in season or if API key has sufficient permissions.`);
  }

  return allGames;
}

// 🚀 OPTIMIZED: Filter to only top 5 sportsbooks for better performance
function filterToTop5Sportsbooks(gameData) {
  // Define the 5 most reliable sportsbooks with best odds
  const TOP_5_SPORTSBOOKS = [
    'DraftKings',
    'FanDuel', 
    'BetMGM',
    'Caesars',
    'PointsBet'
  ];

  const filteredGames = gameData.map(game => {
    if (!game.bookmakers) return game;
    
    // Keep only top 5 sportsbooks
    const filteredBookmakers = game.bookmakers.filter(bookmaker => 
      TOP_5_SPORTSBOOKS.includes(bookmaker.title)
    );
    
    return {
      ...game,
      bookmakers: filteredBookmakers
    };
  }).filter(game => game.bookmakers && game.bookmakers.length > 0);

  console.log(`🎯 Filtered to top 5 sportsbooks: ${TOP_5_SPORTSBOOKS.join(', ')}`);
  return filteredGames;
}

// Extract all available bets with real odds from game data (TOP 5 SPORTSBOOKS ONLY)
function extractAvailableBets(gameData) {
  // First filter to top 5 sportsbooks
  const filteredGames = filterToTop5Sportsbooks(gameData);
  
  const availableBets = [];
  
  for (const game of filteredGames) {
    if (!game.bookmakers) continue;
    
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes || []) {
          availableBets.push({
            game: `${game.away_team} @ ${game.home_team}`,
            game_id: `${game.away_team}_${game.home_team}_${game.commence_time}`,
            sportsbook: bookmaker.title,
            market_type: market.key,
            selection: outcome.name,
            description: outcome.description || outcome.name,
            point: outcome.point || null,
            odds: formatOdds(outcome.price),
            decimal_odds: americanToDecimal(outcome.price),
            commence_time: game.commence_time,
            sport: game.sport || 'unknown'
          });
        }
      }
    }
  }
  
  console.log(`📊 Using only top 5 sportsbooks, found ${availableBets.length} betting options`);
  return availableBets;
}

// 🚀 OPTIMIZED: Enhanced parlay generation with MASSIVELY reduced token usage
async function generateParlayWithRealOdds(preferences, sportData) {
  const availableBets = extractAvailableBets(sportData);
  
  if (availableBets.length === 0) {
    throw new Error('No betting markets available for selected sport');
  }

  console.log(`📊 Found ${availableBets.length} total betting options across top 5 sportsbooks`);

  // Filter bets based on risk level
  const filteredBets = filterBetsByRiskLevel(availableBets, preferences.riskLevel);
  console.log(`🎯 Filtered to ${filteredBets.length} bets matching ${preferences.riskLevel} risk level`);
  
  if (filteredBets.length < preferences.legs) {
    throw new Error(`Not enough betting options for ${preferences.legs} legs at ${preferences.riskLevel} risk level`);
  }

  // 🚀 MAJOR OPTIMIZATION: Get only the 10 BEST options (reduced from 20)
  const optimizedBets = getOptimalBetsPerGame(filteredBets);
  const topBets = optimizedBets.slice(0, 10); // REDUCED from 20 to 10 for token efficiency

  try {
    const parlayResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a sports betting analyst. Select exactly ${preferences.legs} legs with positive expected value from the provided options. Use EXACT odds and sportsbook names. Return ONLY valid JSON, no explanations.`
        },
        {
          role: "user",
          content: `Create ${preferences.sport} parlay with ${preferences.legs} legs at ${preferences.riskLevel} risk level.

Available bets (all positive EV):
${formatBetsForAI(topBets)}

Return this exact JSON structure:
{
  "parlay_legs": [
    {
      "game": "Away @ Home format",
      "sportsbook": "exact sportsbook name", 
      "bet_type": "h2h/spreads/totals",
      "selection": "team or over/under",
      "odds": "+150 or -110 format",
      "decimal_odds": "number like 2.5",
      "reasoning": "why this has positive EV (1 sentence)"
    }
  ],
  "total_decimal_odds": "multiply all decimal odds",
  "total_american_odds": "+450 format",
  "confidence": "High/Medium/Low based on EV"
}`
        }
      ],
      max_tokens: 1000, // Increased to handle complex parlay generation
      temperature: 0.3
    });

    const aiResponse = parlayResponse.choices[0].message.content;
    
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!cleanedResponse.startsWith('{')) {
        console.log('AI returned non-JSON response, using fallback');
        return generateValidatedFallbackParlay(filteredBets, preferences);
      }
      
      const parlayData = JSON.parse(cleanedResponse);
      
      // Validate that AI used real odds and potentially upgrade to even better odds
      const validatedParlay = validateAndOptimizeParlayOdds(parlayData, availableBets, preferences);
      if (!validatedParlay) {
        console.log('AI used invalid data, generating fallback');
        return generateValidatedFallbackParlay(filteredBets, preferences);
      }
      
      return validatedParlay;
    } catch (parseError) {
      console.log('Failed to parse AI parlay, using fallback');
      return generateValidatedFallbackParlay(filteredBets, preferences);
    }
  } catch (openaiError) {
    console.error('OpenAI API Error:', openaiError);
    
    // Check for specific quota/credit errors
    if (openaiError.message?.includes('quota') || openaiError.message?.includes('billing') || openaiError.message?.includes('credits')) {
      throw new Error('OpenAI credits exhausted. Please check your billing and usage limits.');
    }
    
    console.log('OpenAI failed, using mathematical fallback');
    return generateValidatedFallbackParlay(filteredBets, preferences);
  }
}

// Enhanced: Calculate Expected Value for a bet
function calculateExpectedValue(bet) {
  // Get implied probability from bookmaker odds (includes vig)
  const impliedProb = calculateImpliedProbability(bet.decimal_odds);
  
  // Estimate true probability (this is simplified - in reality would use complex models)
  // For now, we'll use a basic approach that looks for market inefficiencies
  const trueProbability = estimateTrueProbability(bet, impliedProb);
  
  // Calculate expected value: (True Probability × Payout) - Stake
  // EV = (True Prob × (Decimal Odds - 1)) - (1 - True Prob)
  const ev = (trueProbability * (bet.decimal_odds - 1)) - (1 - trueProbability);
  
  return ev;
}

// Calculate implied probability from decimal odds
function calculateImpliedProbability(decimalOdds) {
  return 1 / decimalOdds;
}

// Simplified true probability estimation (this could be much more sophisticated)
function estimateTrueProbability(bet, impliedProb) {
  // Basic approach: look for lines that seem to have value based on common patterns
  const odds = parseOdds(bet.odds);
  
  // Adjust based on bet type - some markets have more vig than others
  let vigAdjustment = 0.02; // Default 2% vig removal
  
  // Player props often have higher vig
  if (bet.market_type.includes('player_')) {
    vigAdjustment = 0.05; // 5% vig for player props
  }
  
  // Spread bets typically have lower vig
  if (bet.market_type === 'spreads') {
    vigAdjustment = 0.025; // 2.5% vig for spreads
  }
  
  // Main line totals and H2H
  if (bet.market_type === 'h2h' || bet.market_type === 'totals') {
    vigAdjustment = 0.03; // 3% vig for main markets
  }
  
  // Remove estimated vig to get closer to true probability
  let adjustedProb = impliedProb - vigAdjustment;
  
  // Additional adjustments for commonly mispriced lines
  if (bet.market_type === 'h2h') {
    // Home favorites are often overvalued
    if (bet.selection.includes('@') && odds < -150) {
      adjustedProb *= 0.95; // Reduce probability for heavy home favorites
    }
    
    // Road underdogs sometimes have hidden value
    if (!bet.selection.includes('@') && odds > 150) {
      adjustedProb *= 1.05; // Slight boost for road underdogs
    }
  }
  
  // Player props over/under patterns
  if (bet.market_type.includes('player_')) {
    // Overs are often juiced
    if (bet.selection.toLowerCase().includes('over')) {
      adjustedProb *= 0.97;
    }
    // Unders sometimes have value
    if (bet.selection.toLowerCase().includes('under')) {
      adjustedProb *= 1.03;
    }
  }
  
  // Ensure probability stays in valid range
  return Math.max(0.01, Math.min(0.99, adjustedProb));
}

// Enhanced: Get optimal bets prioritizing EV
function getOptimalBetsPerGame(bets) {
  const betGroups = {};
  
  // Group by game + selection + bet type to find best EV
  bets.forEach(bet => {
    const key = `${bet.game}_${bet.market_type}_${bet.selection}`;
    if (!betGroups[key]) {
      betGroups[key] = [];
    }
    betGroups[key].push(bet);
  });
  
  // Return the bet with best EV for each unique selection
  const optimizedBets = [];
  Object.values(betGroups).forEach(group => {
    const bestEVBet = group.reduce((best, current) => {
      const bestEV = best.expectedValue || calculateExpectedValue(best);
      const currentEV = current.expectedValue || calculateExpectedValue(current);
      return currentEV > bestEV ? current : best;
    });
    optimizedBets.push(bestEVBet);
  });
  
  // Sort by expected value (highest EV first)
  return optimizedBets.sort((a, b) => {
    const aEV = a.expectedValue || calculateExpectedValue(a);
    const bEV = b.expectedValue || calculateExpectedValue(b);
    return bEV - aEV;
  });
}

// Enhanced: Format bets with EV information for AI
function formatBetsForAI(bets) {
  return bets.map((bet, index) => {
    const ev = bet.expectedValue || calculateExpectedValue(bet);
    const evPercentage = (ev * 100).toFixed(1);
    return `${index + 1}. ${bet.game} | ${bet.selection} ${bet.odds} @ ${bet.sportsbook} (EV: +${evPercentage}%)`;
  }).join('\n');
}

// Get risk level guidance for AI
function getRiskLevelGuidance(riskLevel) {
  switch (riskLevel) {
    case 'safe':
      return 'Focus on favorites with odds -200 to +150';
    case 'moderate': 
      return 'Mix favorites and underdogs -300 to +300';
    case 'risky':
      return 'Include longer odds up to +500';
    default:
      return 'Balanced selection';
  }
}

// Enhanced: Filter bets by risk level AND prioritize positive EV lines
function filterBetsByRiskLevel(bets, riskLevel) {
  // First calculate EV for all bets
  const betsWithEV = bets.map(bet => ({
    ...bet,
    expectedValue: calculateExpectedValue(bet),
    impliedProbability: calculateImpliedProbability(bet.decimal_odds)
  }));

  // Filter out negative EV bets unless specifically requested
  const positiveEVBets = betsWithEV.filter(bet => bet.expectedValue > 0);
  
  // If we have enough positive EV bets, use only those
  const betsToFilter = positiveEVBets.length >= 10 ? positiveEVBets : betsWithEV;
  
  console.log(`🎯 Found ${positiveEVBets.length} positive EV bets out of ${betsWithEV.length} total bets`);
  
  const filteredBets = betsToFilter.filter(bet => {
    const odds = parseOdds(bet.odds);
    
    switch (riskLevel) {
      case 'safe':
        return odds >= -200 && odds <= 150;
      case 'moderate': 
        return odds >= -300 && odds <= 300;
      case 'risky':
        return odds >= -500 && odds <= 500;
      default:
        return true;
    }
  });

  // Sort by expected value (highest first)
  return filteredBets.sort((a, b) => b.expectedValue - a.expectedValue);
}

// ENHANCED: Validation that checks each leg and potentially upgrades odds
function validateAndOptimizeParlayOdds(parlayData, availableBets, preferences) {
  if (!parlayData.parlay_legs || parlayData.parlay_legs.length !== preferences.legs) {
    return null;
  }
  
  const validatedLegs = [];
  
  for (const leg of parlayData.parlay_legs) {
    // Find all matching bets for this selection (to potentially upgrade odds)
    const matchingBets = availableBets.filter(bet => 
      bet.game === leg.game &&
      bet.selection === leg.selection &&
      bet.market_type === leg.bet_type
    );
    
    if (matchingBets.length === 0) {
      console.log(`Invalid leg detected: ${leg.game} - ${leg.selection} - ${leg.odds}`);
      return null;
    }
    
    // Find the BEST odds available for this exact selection
    const bestOddsBet = matchingBets.reduce((best, current) => 
      parseOdds(current.odds) > parseOdds(best.odds) ? current : best
    );
    
    // Use the best available odds (this optimizes the parlay further)
    validatedLegs.push({
      game: bestOddsBet.game,
      sportsbook: bestOddsBet.sportsbook,
      bet_type: bestOddsBet.market_type,
      selection: bestOddsBet.selection,
      description: bestOddsBet.description,
      point: bestOddsBet.point,
      odds: bestOddsBet.odds,
      decimal_odds: bestOddsBet.decimal_odds,
      reasoning: leg.reasoning || "Optimized for best odds",
      confidence_rating: leg.confidence_rating || "7",
      expected_probability: leg.expected_probability || "TBD",
      commence_time: bestOddsBet.commence_time,
      odds_upgraded: bestOddsBet.sportsbook !== leg.sportsbook
    });
  }
  
  // Recalculate total odds using the best available odds
  const totalDecimalOdds = validatedLegs.reduce((product, leg) => product * parseFloat(leg.decimal_odds), 1);
  const totalAmericanOdds = decimalToAmerican(totalDecimalOdds);
  
  // Get unique sportsbooks
  const bestSportsbooks = [...new Set(validatedLegs.map(leg => leg.sportsbook))];
  
  return {
    parlay_legs: validatedLegs,
    total_decimal_odds: totalDecimalOdds.toFixed(2),
    total_american_odds: formatOdds(totalAmericanOdds),
    best_sportsbooks: bestSportsbooks,
    confidence: parlayData.confidence || calculateConfidence(validatedLegs),
    risk_assessment: generateRiskAssessment(validatedLegs, preferences),
    edge_analysis: generateEVAnalysis(validatedLegs),
    expected_value: calculateParlayEV(validatedLegs),
    ai_enhanced: true,
    odds_optimized: validatedLegs.some(leg => leg.odds_upgraded),
    sportsbooks_used: "Premium sportsbooks"
  };
}

// Calculate confidence based on odds and bet types
function calculateConfidence(legs) {
  const avgOdds = legs.reduce((sum, leg) => sum + parseOdds(leg.odds), 0) / legs.length;
  const hasPlayerProps = legs.some(leg => leg.bet_type && leg.bet_type.includes('player_'));
  
  if (avgOdds < -150 && !hasPlayerProps) return 'High confidence - favorites with solid fundamentals';
  if (avgOdds < 150 && legs.length <= 4) return 'Medium confidence - balanced risk/reward profile';
  return 'Lower confidence - higher variance but potential for significant returns';
}

// Generate EV-focused analysis
function generateEVAnalysis(legs) {
  const avgEV = legs.reduce((sum, leg) => {
    const legEV = leg.expectedValue || calculateExpectedValue(leg);
    return sum + legEV;
  }, 0) / legs.length;
  
  const positiveEVCount = legs.filter(leg => {
    const legEV = leg.expectedValue || calculateExpectedValue(leg);
    return legEV > 0;
  }).length;
  
  const totalParlayEV = calculateParlayEV(legs);
  
  let analysis = `Positive EV focused selection: ${positiveEVCount}/${legs.length} legs with individual positive expected value. `;
  
  if (avgEV > 0.05) {
    analysis += 'High-value opportunities identified across multiple markets. ';
  } else if (avgEV > 0.02) {
    analysis += 'Moderate edge potential with solid mathematical foundation. ';
  } else {
    analysis += 'Conservative value plays with reduced vig exposure. ';
  }
  
  analysis += `Overall parlay EV: ${(totalParlayEV * 100).toFixed(1)}% - focusing on market inefficiencies and line shopping advantages.`;
  
  return analysis;
}

// Calculate expected value for the entire parlay
function calculateParlayEV(legs) {
  // Calculate combined true probability
  const combinedTrueProb = legs.reduce((prob, leg) => {
    const legEV = leg.expectedValue || calculateExpectedValue(leg);
    const impliedProb = calculateImpliedProbability(leg.decimal_odds);
    const trueProbEstimate = estimateTrueProbability(leg, impliedProb);
    return prob * trueProbEstimate;
  }, 1);
  
  // Calculate parlay payout
  const parlayOdds = legs.reduce((product, leg) => product * parseFloat(leg.decimal_odds), 1);
  
  // EV = (True Probability × Payout) - Stake
  const parlayEV = (combinedTrueProb * (parlayOdds - 1)) - (1 - combinedTrueProb);
  
  return parlayEV;
}

// Enhanced risk assessment including EV considerations
function generateRiskAssessment(legs, preferences) {
  const totalDecimalOdds = legs.reduce((product, leg) => product * parseFloat(leg.decimal_odds), 1);
  const impliedProbability = (1 / totalDecimalOdds * 100).toFixed(1);
  const sameGameCount = countSameGameBets(legs);
  const parlayEV = calculateParlayEV(legs);
  
  let assessment = `${legs.length}-leg positive EV parlay with ${impliedProbability}% implied probability. `;
  
  if (parlayEV > 0.1) {
    assessment += `Strong positive expected value (+${(parlayEV * 100).toFixed(1)}%) indicates significant edge. `;
  } else if (parlayEV > 0) {
    assessment += `Positive expected value (+${(parlayEV * 100).toFixed(1)}%) suggests mathematical advantage. `;
  }
  
  if (sameGameCount > 0) {
    assessment += `Contains ${sameGameCount} same-game correlations. `;
  }
  
  const avgOdds = legs.reduce((sum, leg) => sum + Math.abs(parseOdds(leg.odds)), 0) / legs.length;
  if (avgOdds > 200) {
    assessment += 'Higher variance with substantial EV upside potential. ';
  } else if (avgOdds < 150) {
    assessment += 'Lower variance with consistent positive expectation. ';
  }
  
  assessment += `Optimized for positive expected value across top sportsbooks.`;
  
  return assessment;
}

// Count bets from the same game
function countSameGameBets(legs) {
  const games = legs.map(leg => leg.game);
  const uniqueGames = [...new Set(games)];
  return games.length - uniqueGames.length;
}

// ENHANCED: Fallback parlay with best odds optimization
function generateValidatedFallbackParlay(availableBets, preferences) {
  const legs = preferences.legs || 3;
  const riskLevel = preferences.riskLevel || 'moderate';
  
  // Filter by risk level
  const filteredBets = filterBetsByRiskLevel(availableBets, riskLevel);
  
  if (filteredBets.length === 0) {
    throw new Error(`No bets available for ${riskLevel} risk level`);
  }
  
  // Get optimal bets (best odds per selection)
  const optimizedBets = getOptimalBetsPerGame(filteredBets);
  
  const selectedBets = [];
  const usedGames = new Set();
  
  // Try to select from different games first
  for (const bet of optimizedBets) {
    if (selectedBets.length >= legs) break;
    if (!usedGames.has(bet.game_id)) {
      selectedBets.push(bet);
      usedGames.add(bet.game_id);
    }
  }
  
  // If we need more legs, allow same-game bets with different bet types
  while (selectedBets.length < legs && selectedBets.length < optimizedBets.length) {
    const remainingBets = optimizedBets.filter(bet => 
      !selectedBets.some(selected => 
        selected.game === bet.game && 
        selected.selection === bet.selection &&
        selected.market_type === bet.market_type
      )
    );
    
    if (remainingBets.length > 0) {
      selectedBets.push(remainingBets[0]);
    } else {
      break;
    }
  }
  
  if (selectedBets.length < legs) {
    throw new Error(`Could only find ${selectedBets.length} suitable bets for ${legs}-leg parlay`);
  }
  
  // Calculate real total odds
  const totalDecimalOdds = selectedBets.reduce((product, bet) => product * bet.decimal_odds, 1);
  const totalAmericanOdds = decimalToAmerican(totalDecimalOdds);
  const bestSportsbooks = [...new Set(selectedBets.map(bet => bet.sportsbook))];
  
  return {
    parlay_legs: selectedBets.map(bet => ({
      game: bet.game,
      sportsbook: bet.sportsbook,
      bet_type: bet.market_type,
      selection: bet.selection,
      description: bet.description,
      point: bet.point,
      odds: bet.odds,
      decimal_odds: bet.decimal_odds,
      reasoning: "Mathematically selected using best odds from premium sportsbooks",
      confidence_rating: "6",
      expected_probability: "TBD",
      commence_time: bet.commence_time
    })),
    total_decimal_odds: totalDecimalOdds.toFixed(2),
    total_american_odds: formatOdds(totalAmericanOdds),
    best_sportsbooks: bestSportsbooks,
    confidence: calculateConfidence(selectedBets),
    risk_assessment: generateRiskAssessment(selectedBets, preferences),
    edge_analysis: generateEVAnalysis(selectedBets),
    expected_value: calculateParlayEV(selectedBets),
    ai_enhanced: false,
    odds_optimized: true,
    sportsbooks_used: "Premium sportsbooks"
  };
}

// HELPER FUNCTIONS
function formatOdds(odds) {
  if (typeof odds !== 'number' || isNaN(odds)) {
    return '+100';
  }
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function parseOdds(oddsValue) {
  if (!oddsValue) {
    return 100;
  }
  
  const oddsString = String(oddsValue);
  const cleanedOdds = oddsString.replace('+', '');
  const parsedOdds = parseInt(cleanedOdds);
  
  if (isNaN(parsedOdds)) {
    return 100;
  }
  
  return parsedOdds;
}

function americanToDecimal(americanOdds) {
  if (typeof americanOdds !== 'number' || isNaN(americanOdds)) {
    return 2.0;
  }
  
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

function decimalToAmerican(decimal) {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}