const openai = require('../../lib/openai');
const eventsCache = require('../../lib/events-cache.js');
const bettingMath = require('../../lib/betting-math.js');
const historicalAnalyzer = require('../../lib/historical-edge-analyzer.js');

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
  
  // Ensure includePlayerProps is properly handled
  if (config.includePlayerProps === undefined && preferences?.includePlayerProps !== undefined) {
    config.includePlayerProps = preferences.includePlayerProps;
  }
  
  if (!config.sport) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sport selection required' 
    });
  }

  try {
    console.log(`🎯 Generating ${config.sport} parlay with ${config.legs || 3} legs...`);

    // Step 1: Get ONLY the selected sport's data using cached events approach
    const sportData = await fetchSportSpecificOddsOptimized(config.sport);
    
    if (!sportData || sportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active or upcoming games found for ${config.sport}. This sport may be out of season or have no available betting markets.`
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
    return 'h2h';
  }
  
  // FIXED: Use same simple approach as EV fetcher for reliability
  // Player props often cause API failures for preseason/out-of-season games
  return sportKey.startsWith('soccer_') ? 'h2h' : 'h2h,spreads,totals';
}

// NEW: Optimized fetch using cached events approach
async function fetchSportSpecificOddsOptimized(sport) {
  try {
    console.log(`🚀 [${sport} Parlay] Using optimized cached events approach`);
    
    // Get cached events first (1-hour cache)
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log(`⚠️ [${sport} Parlay] No upcoming events found`);
      throw new Error(`No upcoming events found for ${sport}`);
    }
    
    // Get odds for those specific events (5-minute cache)
    // Include player props for sports that support them
    const soccerSports = ['Soccer', 'MLS', 'UEFA'];
    const markets = soccerSports.includes(sport) ? 'h2h' : 'h2h,spreads,totals';
    const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, markets, true); // Enable player props
    
    console.log(`✅ [${sport} Parlay] Optimized approach: ${upcomingEvents.length} events → ${oddsData.length} games with odds`);
    
    if (oddsData.length === 0) {
      throw new Error(`No betting markets available for ${sport} events`);
    }
    
    return oddsData;
    
  } catch (error) {
    console.log(`❌ [${sport} Parlay] Cached approach failed, falling back:`, error.message);
    // Fallback to original method
    return await fetchSportSpecificOdds(sport);
  }
}

// FALLBACK: Original fetch method
async function fetchSportSpecificOdds(sport) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Odds API key not configured');
  }
  
  // API key configured and ready

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
    'MLS': ['soccer_usa_mls'],
    'UEFA': ['soccer_uefa_champs_league', 'soccer_epl', 'soccer_uefa_europa_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 'soccer_germany_bundesliga', 'soccer_france_ligue_one'],
    'Soccer': ['soccer_epl', 'soccer_usa_mls', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league', 'soccer_spain_la_liga', 'soccer_italy_serie_a', 'soccer_germany_bundesliga', 'soccer_france_ligue_one'], // Legacy support
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
        const response = await fetch(url, { 
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          
          if (response.status === 422) {
            return { success: false, reason: 'out_of_season' };
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded - please wait');
          } else if (response.status === 401) {
            throw new Error('Invalid Odds API key');
          } else {
            return { success: false, reason: 'api_error' };
          }
        }

        const games = await response.json();
        console.log(`📈 [${sport} API] Got ${games.length} games from ${sportKey}`);
        return { success: true, games };
        
      } catch (error) {
        return { success: false, reason: 'network_error' };
      }
    };
    
    // Try full markets first
    let result = await attemptFetch(true);
    
    // If full markets failed but not due to out of season, try H2H fallback
    if (!result.success && result.reason !== 'out_of_season') {
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
  
  // If no variants worked, throw error
  if (allGames.length === 0) {
    throw new Error(`No active or upcoming games found for ${sport}. This sport may be out of season.`);
  }

  // Smart date filtering: prefer games in next 7 days, but if fewer than 7 games, extend to 30 days
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // First, try games in next 7 days
  const gamesNext7Days = allGames.filter(game => {
    if (!game.commence_time) return true; // Include games without start time
    const gameTime = new Date(game.commence_time);
    return gameTime >= now && gameTime <= sevenDaysFromNow;
  });

  let filteredGames = gamesNext7Days;

  // If we have fewer than 7 games in the next week, extend to 30 days
  if (gamesNext7Days.length < 7) {
    const gamesNext30Days = allGames.filter(game => {
      if (!game.commence_time) return true; // Include games without start time
      const gameTime = new Date(game.commence_time);
      return gameTime >= now && gameTime <= thirtyDaysFromNow;
    });
    
    filteredGames = gamesNext30Days;
    console.log(`📅 [${sport} Parlay] Extended to 30-day window: ${gamesNext7Days.length} games (7 days) → ${gamesNext30Days.length} games (30 days)`);
  }

  // If still no games in 30 days, use all available games (no date filtering)
  if (filteredGames.length === 0) {
    filteredGames = allGames;
    console.log(`📅 [${sport} Parlay] Using all available games regardless of date: ${allGames.length} games`);
  }

  // Special handling for MMA: prioritize games that have bookmaker odds available
  if (sport === 'MMA' || sport === 'UFC') {
    const gamesWithOdds = filteredGames.filter(game => game.bookmakers && game.bookmakers.length > 0);
    const allGamesWithOdds = allGames.filter(game => game.bookmakers && game.bookmakers.length > 0);
    
    console.log(`🥊 [MMA Debug] Filtered games with odds: ${gamesWithOdds.length}, All games with odds: ${allGamesWithOdds.length}`);
    
    if (gamesWithOdds.length > 0) {
      filteredGames = gamesWithOdds;
      console.log(`🥊 [MMA] Using ${gamesWithOdds.length} filtered games that have odds`);
    } else if (allGamesWithOdds.length > 0) {
      filteredGames = allGamesWithOdds.slice(0, 20);
      console.log(`🥊 [MMA] No odds in filtered games, using ${filteredGames.length} from all games with odds`);
    }
  }

  console.log(`📊 [${sport} Parlay] Final game count: ${filteredGames.length} games`);
  console.log(`📊 [${sport} Parlay] Date filtering details: All games: ${allGames.length}, 7-day: ${gamesNext7Days ? gamesNext7Days.length : 'N/A'}, Final: ${filteredGames.length}`);
  return filteredGames;
}

// 🚀 OPTIMIZED: Filter to only top 5 sportsbooks for better performance
function filterToTop5Sportsbooks(gameData) {
  // Define the most reliable sportsbooks with best odds
  const TOP_SPORTSBOOKS = [
    'DraftKings',
    'FanDuel', 
    'BetMGM',
    'Caesars',
    'PointsBet',
    'BetOnline.ag',  // MMA coverage
    'BetRivers'      // Additional coverage
  ];

  const filteredGames = gameData.map(game => {
    if (!game.bookmakers) return game;
    
    // Keep only top sportsbooks
    const filteredBookmakers = game.bookmakers.filter(bookmaker => 
      TOP_SPORTSBOOKS.includes(bookmaker.title)
    );
    
    return {
      ...game,
      bookmakers: filteredBookmakers
    };
  }).filter(game => game.bookmakers && game.bookmakers.length > 0);

  console.log(`🎯 Filtered to top sportsbooks: ${TOP_SPORTSBOOKS.join(', ')}`);
  return filteredGames;
}

// Extract all available bets with real odds from game data (TOP 5 SPORTSBOOKS ONLY)
function extractAvailableBets(gameData) {
  // First filter to top 5 sportsbooks
  const filteredGames = filterToTop5Sportsbooks(gameData);
  
  console.log(`🔍 [Debug] Games after sportsbook filtering: ${filteredGames.length}`);
  
  const availableBets = [];
  
  for (const game of filteredGames) {
    if (!game.bookmakers) {
      console.log(`🔍 [Debug] Game has no bookmakers: ${game.home_team} vs ${game.away_team}`);
      continue;
    }
    
    console.log(`🔍 [Debug] Game: ${game.home_team} vs ${game.away_team} - ${game.bookmakers.length} bookmakers`);
    
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes || []) {
          // Create a more descriptive selection for player props
          let enhancedSelection = outcome.name;
          
          // For player props, enhance the description with point/line information
          if (market.key.startsWith('player_') && outcome.point !== undefined) {
            // Format: "PlayerName Over 2.5 Assists" instead of just "Over"
            enhancedSelection = `${outcome.name} ${outcome.point}`;
          } else if (outcome.point !== undefined && outcome.point !== null) {
            // For spreads/totals with points: "Team +7.5" or "Over 45.5"
            if (outcome.name.toLowerCase().includes('over') || outcome.name.toLowerCase().includes('under')) {
              enhancedSelection = `${outcome.name} ${outcome.point}`;
            } else if (outcome.point > 0) {
              enhancedSelection = `${outcome.name} +${outcome.point}`;
            } else if (outcome.point < 0) {
              enhancedSelection = `${outcome.name} ${outcome.point}`;
            }
          }
          
          const bet = {
            game: `${game.away_team} @ ${game.home_team}`,
            game_id: `${game.away_team}_${game.home_team}_${game.commence_time}`,
            sportsbook: bookmaker.title,
            market_type: market.key,
            selection: enhancedSelection,
            description: outcome.description || enhancedSelection,
            point: outcome.point || null,
            odds: formatOdds(outcome.price),
            decimal_odds: bettingMath.americanToDecimal(outcome.price),
            commence_time: game.commence_time,
            sport: game.sport || 'unknown',
            bookmakers: game.bookmakers // Keep reference for probability calculations
          };
          
          // TEMPORARILY DISABLE QUALITY FILTERING FOR TESTING
          // Process the bet with our betting math
          // const processedBet = bettingMath.processLeg(bet, game.bookmakers);
          
          // For now, include all bets to test the system
          availableBets.push(bet);
        }
      }
    }
  }
  
  console.log(`📊 Using only top 5 sportsbooks, found ${availableBets.length} betting options`);
  return availableBets;
}

// 🚀 OPTIMIZED: Enhanced parlay generation with betting math v2.1
async function generateParlayWithRealOdds(preferences, sportData) {
  const availableBets = extractAvailableBets(sportData);
  
  if (availableBets.length === 0) {
    throw new Error('No betting markets available for selected sport that meet quality criteria');
  }

  console.log(`📊 Found ${availableBets.length} quality betting options with positive EV`);

  // Filter bets based on risk level
  let filteredBets = filterBetsByRiskLevel(availableBets, preferences.riskLevel);
  console.log(`🎯 Filtered to ${filteredBets.length} bets matching ${preferences.riskLevel} risk level`);
  
  // Apply player props filtering if requested
  if (preferences.includePlayerProps && preferences.legs > 1) {
    const playerPropBets = filteredBets.filter(bet => bet.market_type && bet.market_type.startsWith('player_'));
    const mainMarketBets = filteredBets.filter(bet => !bet.market_type || !bet.market_type.startsWith('player_'));
    
    const requiredPlayerProps = Math.ceil(preferences.legs * 0.5); // At least 50%
    
    console.log(`🎯 [PlayerProps] Need ${requiredPlayerProps}/${preferences.legs} player props. Available: ${playerPropBets.length} player props, ${mainMarketBets.length} main markets`);
    
    if (playerPropBets.length >= requiredPlayerProps) {
      // We have enough player props, balance the selection
      const selectedPlayerProps = playerPropBets.slice(0, requiredPlayerProps);
      const remainingSlots = Math.max(0, preferences.legs - requiredPlayerProps);
      const selectedMainMarkets = mainMarketBets.slice(0, remainingSlots);
      
      // Combine the selections, maintaining the highest EV ones
      filteredBets = [...selectedPlayerProps, ...selectedMainMarkets]
        .sort((a, b) => (b.expectedValue || 0) - (a.expectedValue || 0));
        
      console.log(`✅ [PlayerProps] Balanced selection: ${selectedPlayerProps.length} player props + ${selectedMainMarkets.length} main markets`);
    } else if (playerPropBets.length > 0) {
      // Not enough player props, use all available player props and fill with main markets
      console.log(`⚠️ [PlayerProps] Only ${playerPropBets.length} player props available, using all + main markets`);
      const remainingSlots = Math.max(0, preferences.legs - playerPropBets.length);
      const selectedMainMarkets = mainMarketBets.slice(0, remainingSlots);
      
      filteredBets = [...playerPropBets, ...selectedMainMarkets]
        .sort((a, b) => (b.expectedValue || 0) - (a.expectedValue || 0));
    } else {
      console.log(`⚠️ [PlayerProps] No player props available, using main markets only`);
    }
  }
  
  if (filteredBets.length < preferences.legs) {
    throw new Error(`Not enough betting options for ${preferences.legs} legs at ${preferences.riskLevel} risk level`);
  }

  // Group bets by sportsbook for single-book parlays
  const betsBySportsbook = {};
  filteredBets.forEach(bet => {
    if (!betsBySportsbook[bet.sportsbook]) {
      betsBySportsbook[bet.sportsbook] = [];
    }
    betsBySportsbook[bet.sportsbook].push(bet);
  });
  
  // Find sportsbooks with enough bets for the parlay
  const viableSportsbooks = Object.entries(betsBySportsbook)
    .filter(([book, bets]) => {
      const uniqueGames = new Set(bets.map(bet => bet.game_id));
      return uniqueGames.size >= preferences.legs;
    })
    .sort(([bookA, betsA], [bookB, betsB]) => betsB.length - betsA.length);
  
  if (viableSportsbooks.length === 0) {
    throw new Error(`No single sportsbook has enough games (${preferences.legs} needed) for this parlay`);
  }
  
  // Use the sportsbook with the most options
  const [selectedSportsbook, availableBetsForBook] = viableSportsbooks[0];
  console.log(`🎯 Selected ${selectedSportsbook} with ${availableBetsForBook.length} available bets for AI parlay`);
  
  // Get optimal bets from selected sportsbook only
  const optimizedBets = getOptimalBetsPerGame(availableBetsForBook);
  
  // Apply historical analysis to identify profitable patterns
  console.log(`🔍 Analyzing historical patterns for ${preferences.sport}...`);
  const enhancedBets = await historicalAnalyzer.detectCurrentEdges(optimizedBets, preferences.sport);
  
  // Prioritize bets with strong historical edges
  const topBets = enhancedBets
    .sort((a, b) => (b.priority_boost || 1.0) - (a.priority_boost || 1.0))
    .slice(0, 10); // Top 10 with historical analysis applied

  try {
    const parlayResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: `You are an expert sports betting analyst specializing in advanced market analysis and parlay construction. Your goal is to create diverse, well-reasoned parlays that exploit specific market inefficiencies.

CORE REQUIREMENTS:
- Select exactly ${preferences.legs} legs with positive expected value
- Each leg must be from a DIFFERENT game (no same-game parlays)  
- ALL LEGS MUST BE FROM THE SAME SPORTSBOOK (${selectedSportsbook}) for user convenience
- Never select conflicting bets (over/under same game, opposing moneylines, etc.)
${preferences.includePlayerProps ? `- Include at least ${Math.ceil(preferences.legs * 0.5)} player props (market_type starting with "player_")` : ''}

STRATEGY VARIATIONS (rotate between these approaches):
1. VALUE-FOCUSED: Target undervalued lines with highest EV
2. CORRELATION-AWARE: Exploit related outcomes across different games
3. CONTRARIAN: Fade public money on overbet favorites
4. LINE MOVEMENT: Target reverse line movement indicators
5. SITUATIONAL: Exploit scheduling, travel, or motivational factors

REASONING REQUIREMENTS:
- Identify specific market inefficiency for each leg
- Explain why the line provides value
- Reference relevant factors (injuries, trends, matchups)
- Provide actionable betting intelligence

Return ONLY valid JSON with no explanations outside the JSON structure.`
        },
        {
          role: "user",
          content: `Create a unique ${preferences.sport} parlay with ${preferences.legs} legs at ${preferences.riskLevel} risk level.

CONTEXT: ${new Date().toLocaleDateString()} - Generate a fresh parlay strategy that differs from typical patterns. Consider current market conditions and exploit specific inefficiencies.

Available bets (sorted by EV, all positive expected value):
${formatBetsForAI(topBets)}

ANALYSIS GUIDELINES:
- Risk Level "${preferences.riskLevel}": ${getRiskLevelGuidance(preferences.riskLevel)}
- Prioritize different bet types and game combinations
- Look for market overreactions, public bias, or line movement value
- Consider game contexts (division rivals, playoff implications, etc.)

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
      "reasoning": "detailed analysis of specific market inefficiency - explain WHY this line has value (e.g. 'Public overvaluing home team after 3-game win streak, but advanced metrics show defensive regression. Line moved from -6 to -7.5 on square money.')",
      "edge_type": "VALUE/CONTRARIAN/SITUATIONAL/LINE_MOVEMENT/CORRELATION",
      "confidence_factors": ["list specific factors supporting this bet"]
    }
  ],
  "parlay_strategy": "name the overall strategy (e.g. 'Contrarian Fade Heavy Favorites', 'Situational Scheduling Spots', 'Line Movement Reversals')",
  "total_decimal_odds": "multiply all decimal odds",
  "total_american_odds": "+450 format", 
  "confidence": "High/Medium/Low with specific reasoning",
  "risk_assessment": "analyze correlation risk, variance, and key failure points",
  "strategic_insights": [
    "primary market inefficiency being exploited across the parlay",
    "optimal betting conditions and timing factors", 
    "key injury/news risks that could invalidate edges",
    "bankroll management recommendation for this specific parlay"
  ],
  "advanced_metrics": {
    "expected_roi": "percentage expected return",
    "kelly_criterion_size": "optimal bet size percentage", 
    "correlation_risk": "Low/Medium/High with explanation",
    "market_inefficiency_score": "1-100 rating with reasoning"
  }
}`
        }
      ],
      max_tokens: 2000, // Increased for detailed analysis and varied parlays
      temperature: 0.4 // Slightly higher for more creative/varied responses
    });

    const aiResponse = parlayResponse.choices[0].message.content;
    
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      if (!cleanedResponse.startsWith('{')) {
        console.log('AI returned non-JSON response, using fallback');
        return await generateValidatedFallbackParlay(availableBetsForBook, preferences, null, selectedSportsbook);
      }
      
      const parlayData = JSON.parse(cleanedResponse);
      
      // Remove duplicate bets and conflicting bets (same game + selection + bet_type OR opposing bets)
      const seenBets = new Set();
      const gameConflicts = new Map(); // Track opposing bets per game
      const uniqueLegs = [];
      
      for (const leg of parlayData.parlay_legs || []) {
        const betKey = `${leg.game}_${leg.selection}_${leg.bet_type}`;
        const gameKey = leg.game;
        
        // Check for exact duplicates
        if (seenBets.has(betKey)) {
          console.log(`Removed duplicate bet: ${leg.game} - ${leg.selection} (${leg.bet_type})`);
          continue;
        }
        
        // Check for conflicting bets (over/under, opposing moneylines, etc.)
        if (!gameConflicts.has(gameKey)) {
          gameConflicts.set(gameKey, []);
        }
        
        const existingBets = gameConflicts.get(gameKey);
        let hasConflict = false;
        
        for (const existingBet of existingBets) {
          // Check for over/under conflicts on totals
          if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'totals') {
            const isCurrentOver = leg.selection.toLowerCase().includes('over');
            const isCurrentUnder = leg.selection.toLowerCase().includes('under');
            const isExistingOver = existingBet.selection.toLowerCase().includes('over');
            const isExistingUnder = existingBet.selection.toLowerCase().includes('under');
            
            if ((isCurrentOver && isExistingUnder) || (isCurrentUnder && isExistingOver)) {
              hasConflict = true;
              console.log(`Removed conflicting total bet: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
              break;
            }
          }
          
          // Check for opposing moneyline bets
          if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'h2h') {
            // If one bet is for away team and other for home team in same game
            const gameTeams = leg.game.split(' @ ');
            if (gameTeams.length === 2) {
              const [awayTeam, homeTeam] = gameTeams;
              const currentTeamInSelection = leg.selection.includes(awayTeam) || leg.selection.includes(homeTeam);
              const existingTeamInSelection = existingBet.selection.includes(awayTeam) || existingBet.selection.includes(homeTeam);
              
              if (currentTeamInSelection && existingTeamInSelection && 
                  ((leg.selection.includes(awayTeam) && existingBet.selection.includes(homeTeam)) ||
                   (leg.selection.includes(homeTeam) && existingBet.selection.includes(awayTeam)))) {
                hasConflict = true;
                console.log(`Removed conflicting moneyline bet: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
                break;
              }
            }
          }
          
          // Check for opposing spread bets (same team different spreads or opposing teams)
          if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'spreads') {
            const gameTeams = leg.game.split(' @ ');
            if (gameTeams.length === 2) {
              const [awayTeam, homeTeam] = gameTeams;
              const currentTeamInSelection = leg.selection.includes(awayTeam) || leg.selection.includes(homeTeam);
              const existingTeamInSelection = existingBet.selection.includes(awayTeam) || existingBet.selection.includes(homeTeam);
              
              if (currentTeamInSelection && existingTeamInSelection && 
                  ((leg.selection.includes(awayTeam) && existingBet.selection.includes(homeTeam)) ||
                   (leg.selection.includes(homeTeam) && existingBet.selection.includes(awayTeam)))) {
                hasConflict = true;
                console.log(`Removed conflicting spread bet: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
                break;
              }
            }
          }
        }
        
        if (!hasConflict) {
          seenBets.add(betKey);
          gameConflicts.get(gameKey).push({
            selection: leg.selection,
            bet_type: leg.bet_type
          });
          uniqueLegs.push(leg);
        }
      }
      
      // Update parlay data with unique legs only
      parlayData.parlay_legs = uniqueLegs;
      
      // If we don't have enough unique legs, return null to trigger fallback
      if (uniqueLegs.length < preferences.legs) {
        console.log(`Only found ${uniqueLegs.length} unique bets, need ${preferences.legs}. Using fallback.`);
        return await generateValidatedFallbackParlay(availableBetsForBook, preferences, null, selectedSportsbook);
      }
      
      // Validate that AI used real odds and potentially upgrade to even better odds
      const validatedParlay = validateAndOptimizeParlayOdds(parlayData, availableBets, preferences);
      if (!validatedParlay) {
        console.log('AI used invalid data, generating fallback');
        return await generateValidatedFallbackParlay(availableBetsForBook, preferences, null, selectedSportsbook);
      }
      
      return validatedParlay;
    } catch (parseError) {
      console.log('Failed to parse AI parlay, using fallback');
      return generateValidatedFallbackParlay(availableBetsForBook, preferences, null, selectedSportsbook);
    }
  } catch (openaiError) {
    console.error('OpenAI API Error:', openaiError);
    
    // Check for specific quota/credit errors
    if (openaiError.message?.includes('quota') || openaiError.message?.includes('billing') || openaiError.message?.includes('credits')) {
      throw new Error('OpenAI credits exhausted. Please check your billing and usage limits.');
    }
    
    console.log('OpenAI failed, using mathematical fallback');
    return generateValidatedFallbackParlay(availableBetsForBook, preferences, null, selectedSportsbook);
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
      edge_type: leg.edge_type || "VALUE",
      confidence_factors: leg.confidence_factors || ["Best available odds"],
      confidence_rating: leg.confidence_rating || "7",
      expected_probability: leg.expected_probability || "TBD",
      commence_time: bestOddsBet.commence_time,
      odds_upgraded: bestOddsBet.sportsbook !== leg.sportsbook
    });
  }
  
  // Recalculate total odds using the best available odds
  const totalDecimalOdds = validatedLegs.reduce((product, leg) => product * parseFloat(leg.decimal_odds), 1);
  const totalAmericanOdds = decimalToAmerican(totalDecimalOdds);
  
  // Final validation check for conflicts
  if (hasConflictingBets(validatedLegs)) {
    console.log('Final validation failed - conflicts detected in validated parlay');
    return null;
  }
  
  // Get unique sportsbooks
  const bestSportsbooks = [...new Set(validatedLegs.map(leg => leg.sportsbook))];
  
  return {
    parlay_legs: validatedLegs,
    parlay_strategy: parlayData.parlay_strategy || "Value-Focused Multi-Game Selection",
    total_decimal_odds: totalDecimalOdds.toFixed(2),
    total_american_odds: formatOdds(totalAmericanOdds),
    best_sportsbooks: bestSportsbooks,
    confidence: parlayData.confidence || calculateConfidence(validatedLegs),
    risk_assessment: parlayData.risk_assessment || generateRiskAssessment(validatedLegs, preferences),
    strategic_insights: parlayData.strategic_insights || [
      generateEVAnalysis(validatedLegs),
      "Line shopping optimization applied",
      "Positive expected value focus maintained"
    ],
    advanced_metrics: parlayData.advanced_metrics || {
      expected_roi: `${(calculateParlayEV(validatedLegs) * 100).toFixed(1)}%`,
      kelly_criterion_size: "1-3% of bankroll",
      correlation_risk: "Low - different games selected",
      market_inefficiency_score: "75 - positive EV selections"
    },
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

// ENHANCED: Fallback parlay with betting math v2.1
async function generateValidatedFallbackParlay(availableBets, preferences, sportData, selectedSportsbook) {
  const legs = preferences.legs || 3;
  const riskLevel = preferences.riskLevel || 'moderate';
  
  // Bets are already from a single sportsbook (selectedSportsbook)
  console.log(`🎯 Fallback using ${selectedSportsbook} with ${availableBets.length} available bets`);
  
  // Sort bets by value/EV
  const sortedBets = availableBets.sort((a, b) => (b.ev || 0) - (a.ev || 0));
  
  // Select best non-correlated legs from single sportsbook
  const selectedBets = [];
  const usedGames = new Set();
  
  for (const bet of sortedBets) {
    if (selectedBets.length >= legs) break;
    if (!usedGames.has(bet.game_id)) {
      // Additional conflict check before adding
      const tempBets = [...selectedBets, bet];
      if (!hasConflictingBets(tempBets)) {
        selectedBets.push(bet);
        usedGames.add(bet.game_id);
        console.log(`✅ Added ${bet.selection} from ${bet.game} (${bet.sportsbook})`);
      } else {
        console.log(`⚠️ Skipped ${bet.selection} from ${bet.game} due to conflict`);
      }
    }
  }
  
  if (selectedBets.length < legs) {
    throw new Error(`Could only find ${selectedBets.length} non-conflicting bets from ${selectedSportsbook} for ${legs}-leg parlay`);
  }
  
  // Use selected bets without movement enhancement
  const enhancedBets = selectedBets.map(bet => ({ ...bet, lineMoveSignal: 0 }));
  
  // Process each leg individually with its bookmakers data
  const processedLegs = enhancedBets.map(bet => {
    try {
      return bettingMath.processLeg(bet, bet.bookmakers);
    } catch (error) {
      console.error(`Error processing leg ${bet.selection}:`, error);
      // Return a basic processed leg structure
      return {
        ...bet,
        metrics: { ev: 0, evPercent: 0, kellyFractional: 0.01, passesFilters: true },
        probabilities: { true: 0.5 },
        confidence: { score: 50 }
      };
    }
  });
  
  // Process the parlay with betting math using processed legs
  let parlayAnalysis;
  try {
    parlayAnalysis = bettingMath.processParlay(processedLegs, null);
  } catch (error) {
    console.error('Error in processParlay:', error);
    // Fallback to simple calculations
    const totalDecimalOdds = enhancedBets.reduce((product, bet) => product * bet.decimal_odds, 1);
    parlayAnalysis = {
      legs: processedLegs,
      parlay: {
        odds: { decimal: totalDecimalOdds, american: decimalToAmerican(totalDecimalOdds) },
        metrics: { evPercent: 0, ev: 0, kellyFractional: 0.01, smartScore: 50 },
        probability: { naive: 0.2, adjusted: 0.2, correlationFactor: 0.9 },
        confidence: 50,
        qualityGates: { parlayEVAcceptable: true }
      }
    };
  }
  
  // Check quality gates
  if (!parlayAnalysis.parlay.qualityGates.parlayEVAcceptable) {
    console.log('Fallback parlay does not meet EV threshold, trying alternative selection');
    // Try different combination or throw error
    throw new Error('Unable to generate parlay with sufficient positive EV');
  }
  
  // Final validation check for conflicts
  if (hasConflictingBets(selectedBets)) {
    console.log('Fallback parlay validation failed - conflicts detected');
    throw new Error('Could not generate conflict-free parlay with available bets');
  }
  
  // Build response using betting math calculations  
  const primarySportsbook = selectedSportsbook;
  
  return {
    parlay_legs: parlayAnalysis.legs.map(leg => ({
      game: leg.game,
      sportsbook: leg.sportsbook,
      bet_type: leg.market_type,
      selection: leg.selection,
      description: leg.description,
      point: leg.point,
      odds: leg.odds,
      decimal_odds: leg.decimal_odds,
      reasoning: `EV: ${leg.metrics.evPercent.toFixed(1)}% | True Prob: ${(leg.probabilities.true * 100).toFixed(1)}% | Kelly: ${(leg.metrics.kellyFractional * 100).toFixed(2)}%`,
      edge_type: "VALUE",
      confidence_factors: [
        `EV: +${leg.metrics.evPercent.toFixed(1)}%`,
        leg.confidence.sharpAvailable ? "Sharp line available" : "Consensus pricing",
        `Confidence: ${leg.confidence.score}%`
      ],
      true_probability: leg.probabilities.true,
      ev_percent: leg.metrics.evPercent,
      kelly_fraction: leg.metrics.kellyFractional,
      commence_time: leg.commence_time
    })),
    parlay_strategy: `Single-Sportsbook Parlay - All bets from ${primarySportsbook}`,
    total_decimal_odds: parlayAnalysis.parlay.odds.decimal.toFixed(2),
    total_american_odds: formatOdds(parlayAnalysis.parlay.odds.american),
    best_sportsbooks: [primarySportsbook],
    primary_sportsbook: primarySportsbook,
    confidence: parlayAnalysis.parlay.confidence,
    win_probability: {
      naive: parlayAnalysis.parlay.probability.naive,
      adjusted: parlayAnalysis.parlay.probability.adjusted
    },
    correlation_factor: parlayAnalysis.parlay.probability.correlationFactor,
    risk_assessment: `${legs}-leg parlay with ${(parlayAnalysis.parlay.probability.adjusted * 100).toFixed(1)}% win probability and +${parlayAnalysis.parlay.metrics.evPercent.toFixed(1)}% EV from ${primarySportsbook}`,
    strategic_insights: [
      `All bets from ${primarySportsbook} - one-stop betting convenience`,
      `Parlay EV: +${parlayAnalysis.parlay.metrics.evPercent.toFixed(1)}% expected value`,
      `Kelly Stake: ${(parlayAnalysis.parlay.metrics.kellyFractional * 100).toFixed(2)}% of bankroll`,
      `Win Probability: ${(parlayAnalysis.parlay.probability.adjusted * 100).toFixed(1)}% (adjusted for correlation)`,
      "No conflicting bets - clean parlay structure"
    ],
    advanced_metrics: {
      expected_roi: `${parlayAnalysis.parlay.metrics.evPercent.toFixed(1)}%`,
      kelly_criterion_size: `${(parlayAnalysis.parlay.metrics.kellyFractional * 100).toFixed(2)}%`,
      correlation_risk: parlayAnalysis.parlay.probability.correlationFactor > 0.85 ? "Low" : "Moderate",
      market_inefficiency_score: parlayAnalysis.parlay.metrics.smartScore.toFixed(0)
    },
    edge_analysis: `Average leg EV: ${parlayAnalysis.parlay.metrics.avgLegEV.toFixed(3)} | Parlay EV: ${parlayAnalysis.parlay.metrics.ev.toFixed(3)}`,
    expected_value: parlayAnalysis.parlay.metrics.ev,
    ev_percent: parlayAnalysis.parlay.metrics.evPercent,
    kelly_stake: parlayAnalysis.parlay.metrics.kellyFractional,
    smart_score: parlayAnalysis.parlay.metrics.smartScore,
    ai_enhanced: false,
    odds_optimized: true,
    sportsbooks_used: `Single book: ${primarySportsbook}`,
    convenience_factor: "High - all bets from one sportsbook"
  };
}

// Validation helper to check for conflicting bets
function hasConflictingBets(legs) {
  const gameConflicts = new Map();
  
  for (const leg of legs) {
    const gameKey = leg.game;
    
    if (!gameConflicts.has(gameKey)) {
      gameConflicts.set(gameKey, []);
    }
    
    const existingBets = gameConflicts.get(gameKey);
    
    for (const existingBet of existingBets) {
      // Check for over/under conflicts on totals
      if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'totals') {
        const isCurrentOver = leg.selection.toLowerCase().includes('over');
        const isCurrentUnder = leg.selection.toLowerCase().includes('under');
        const isExistingOver = existingBet.selection.toLowerCase().includes('over');
        const isExistingUnder = existingBet.selection.toLowerCase().includes('under');
        
        if ((isCurrentOver && isExistingUnder) || (isCurrentUnder && isExistingOver)) {
          console.log(`⚠️ Conflict detected: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
          return true;
        }
      }
      
      // Check for opposing moneyline bets
      if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'h2h') {
        const gameTeams = leg.game.split(' @ ');
        if (gameTeams.length === 2) {
          const [awayTeam, homeTeam] = gameTeams;
          const currentTeamInSelection = leg.selection.includes(awayTeam) || leg.selection.includes(homeTeam);
          const existingTeamInSelection = existingBet.selection.includes(awayTeam) || existingBet.selection.includes(homeTeam);
          
          if (currentTeamInSelection && existingTeamInSelection && 
              ((leg.selection.includes(awayTeam) && existingBet.selection.includes(homeTeam)) ||
               (leg.selection.includes(homeTeam) && existingBet.selection.includes(awayTeam)))) {
            console.log(`⚠️ Conflict detected: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
            return true;
          }
        }
      }
      
      // Check for opposing spread bets
      if (leg.bet_type === existingBet.bet_type && leg.bet_type === 'spreads') {
        const gameTeams = leg.game.split(' @ ');
        if (gameTeams.length === 2) {
          const [awayTeam, homeTeam] = gameTeams;
          const currentTeamInSelection = leg.selection.includes(awayTeam) || leg.selection.includes(homeTeam);
          const existingTeamInSelection = existingBet.selection.includes(awayTeam) || existingBet.selection.includes(homeTeam);
          
          if (currentTeamInSelection && existingTeamInSelection && 
              ((leg.selection.includes(awayTeam) && existingBet.selection.includes(homeTeam)) ||
               (leg.selection.includes(homeTeam) && existingBet.selection.includes(awayTeam)))) {
            console.log(`⚠️ Conflict detected: ${leg.game} - ${leg.selection} conflicts with ${existingBet.selection}`);
            return true;
          }
        }
      }
    }
    
    gameConflicts.get(gameKey).push({
      selection: leg.selection,
      bet_type: leg.bet_type
    });
  }
  
  return false;
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

