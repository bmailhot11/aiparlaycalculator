import openai from '../../lib/openai';
import { generateImprovedSlipImage } from '../../utils/generateImprovedSlipImage';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase body size limit for image uploads
    },
  },
};

export default async function handler(req, res) {
  // Environment Variables Check
  console.log('🔍 API Environment Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('ODDS_API_KEY exists:', !!process.env.ODDS_API_KEY);

  // Admin Override - Disabled for MVP
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'disabled';
  const isAdmin = false;
  const isDev = false;
  const hasUnlimitedAccess = false;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { image, imageBase64 } = req.body;
  const imageData = image || imageBase64;

  if (!imageData) {
    return res.status(400).json({ 
      success: false, 
      message: 'No image data provided' 
    });
  }

  try {
    console.log('🔍 Step 1: Extracting teams/players from bet slip...');

    // Step 1: Extract teams/players and basic bet info (MINIMAL TOKENS)
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract team names, player names, and bet details from this betting slip.

Return ONLY this JSON format:
{
  "teams_found": ["Team1", "Team2"],
  "players_found": ["Player1", "Player2"],
  "extracted_bets": [
    {
      "home_team": "Team Name",
      "away_team": "Team Name", 
      "bet_type": "moneyline/spread/total/prop",
      "bet_selection": "specific bet",
      "odds": "+150 or -110",
      "stake": "amount if visible"
    }
  ],
  "sportsbook": "sportsbook name",
  "total_stake": "total amount",
  "potential_payout": "payout if visible"
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ],
      max_tokens: 600, // Balanced for quality extraction
      temperature: 0.1
    });

    const aiResponse = visionResponse.choices[0].message.content;
    console.log('🤖 OpenAI Vision Response received');

    let extractedData;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      extractedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse bet slip image. Please ensure the image is clear and contains a valid bet slip.",
        error_details: parseError.message
      });
    }

    console.log('🎯 Step 2: Finding games for detected teams/players...');

    // Step 2: Smart search for ONLY the detected teams/players (TOP 5 SPORTSBOOKS)
    const targetedOddsData = await findGamesForTeamsAndPlayers(
      extractedData.teams_found || [], 
      extractedData.players_found || []
    );

    if (!targetedOddsData || targetedOddsData.length === 0) {
      console.log('🔄 No specific matches found, trying broader sport search...');
      const broadSearchData = await tryBroadSportSearch();
      
      if (!broadSearchData || broadSearchData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No active or upcoming games found for analysis in the next 14 days. The teams/players in your bet slip may not have scheduled games, or the sports may be out of season.",
          teams_searched: extractedData.teams_found,
          players_searched: extractedData.players_found,
          extracted_data: extractedData
        });
      }
    }

    console.log('🚀 Step 3: Generating analysis with top 5 sportsbooks only...');

    // Step 3: Generate optimization analysis with the targeted data (TOP 5 SPORTSBOOKS)
    const aiOptimization = await generateTargetedOptimization(extractedData, targetedOddsData || []);

    // Step 4: Generate improved bets and slip image
    console.log('🖼️ Step 4: Generating improved slip image...');
    const improvedBets = await generateImprovedBets(extractedData.extracted_bets, targetedOddsData || []);
    
    // Create improved slip image
    let improvedSlipImage = null;
    if (improvedBets && improvedBets.length > 0) {
      try {
        const explanation = generateExplanationText(improvedBets, aiOptimization);
        improvedSlipImage = await generateImprovedSlipImage({
          originalSlip: extractedData,
          improvedBets: improvedBets,
          explanation: explanation,
          analysis: aiOptimization
        });
      } catch (imageError) {
        console.error('Failed to generate improved slip image:', imageError);
      }
    }

    // Step 5: Build comprehensive response with best sportsbooks
    const analysis = {
      bet_slip_details: {
        sportsbook: extractedData.sportsbook,
        total_stake: extractedData.total_stake,
        potential_payout: extractedData.potential_payout,
        number_of_legs: extractedData.extracted_bets?.length || 0,
        extracted_bets: extractedData.extracted_bets
      },
      teams_and_players: {
        teams_found: extractedData.teams_found || [],
        players_found: extractedData.players_found || [],
        games_found: targetedOddsData?.length || 0
      },
      sportsbook_comparison: generateOddsComparison(extractedData.extracted_bets, targetedOddsData || []),
      ai_optimization: aiOptimization,
      optimization_tips: generateSmartTips(extractedData, targetedOddsData || [], aiOptimization),
      improved_bets: improvedBets,
      improved_slip_image: improvedSlipImage,
      timestamp: new Date().toISOString(),
      unlimited_access: hasUnlimitedAccess,
      sportsbooks_analyzed: "Major US sportsbooks"
    };

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('❌ Analysis Error:', error);

    return res.status(500).json({
      success: false,
      message: `Analysis failed: ${error.message}`,
      error_type: "analysis_error",
      troubleshooting: [
        "Check that your OpenAI API key is valid and has credits",
        "Ensure the image is clear and contains a valid bet slip",
        "Verify your internet connection",
        "Try uploading a different image format (PNG, JPG)"
      ]
    });
  }
}

// 🚀 NEW: Get sport-specific markets including player spreads (SHARED WITH PARLAY GENERATION)
function getSportSpecificMarkets(sportKey) {
  const baseMarkets = 'h2h,spreads,totals';
  
  // Add sport-specific player spread markets with validation
  const sportPlayerMarkets = {
    'americanfootball_nfl': 'player_pass_yds,player_rush_yds,player_reception_yds,player_pass_tds,player_rush_tds,player_reception_tds',
    'americanfootball_nfl_preseason': 'player_pass_yds,player_rush_yds,player_reception_yds',
    'americanfootball_ncaaf': 'player_pass_yds,player_rush_yds,player_reception_yds',
    'basketball_nba': 'player_points,player_rebounds,player_assists,player_threes,player_blocks,player_steals',
    'basketball_nba_preseason': 'player_points,player_rebounds,player_assists',
    'basketball_ncaab': 'player_points,player_rebounds,player_assists',
    'icehockey_nhl': 'player_goals,player_assists,player_points,player_shots_on_goal',
    'icehockey_nhl_preseason': 'player_goals,player_assists,player_points',
    'baseball_mlb': 'batter_hits,batter_total_bases,batter_rbis,batter_runs_scored,batter_home_runs,pitcher_strikeouts'
  };
  
  const playerMarkets = sportPlayerMarkets[sportKey] || '';
  const allMarkets = playerMarkets ? `${baseMarkets},${playerMarkets}` : baseMarkets;
  
  console.log(`🎯 Analyze Slip - ${sportKey} markets: ${allMarkets}`);
  return allMarkets;
}

// 🚀 OPTIMIZED: Filter to top 10 sportsbooks for comprehensive analysis
function filterToTop10Sportsbooks(gameData) {
  const TOP_10_SPORTSBOOKS = [
    'DraftKings',
    'FanDuel', 
    'BetMGM',
    'Caesars',
    'PointsBet',
    'BetRivers',
    'WynnBET',
    'Unibet',
    'ESPN BET',
    'Hard Rock Bet',
    'BetOnline.ag'  // Add for MMA/UFC coverage
  ];

  const filteredGames = gameData.map(game => {
    if (!game.bookmakers) return game;
    
    const filteredBookmakers = game.bookmakers.filter(bookmaker => 
      TOP_10_SPORTSBOOKS.includes(bookmaker.title)
    );
    
    return {
      ...game,
      bookmakers: filteredBookmakers
    };
  }).filter(game => game.bookmakers && game.bookmakers.length > 0);

  console.log(`🎯 Analysis limited to top 10 sportsbooks: ${TOP_10_SPORTSBOOKS.join(', ')}`);
  return filteredGames;
}

// SHARED: Use same function as generate-parlay but with TOP 10 FILTER
async function findGamesForTeamsAndPlayers(teams, players) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('Odds API key not configured');
  }

  const allGameData = [];
  const searchTargets = [...teams, ...players];
  
  if (searchTargets.length === 0) {
    console.log('⚠️ No teams or players detected in bet slip');
    return [];
  }

  console.log(`🔍 Searching for games involving: ${searchTargets.join(', ')}`);

  // Current active sports - focus on in-season sports (preseason prioritized for August)
  const sportKeys = [
    'americanfootball_nfl_preseason',
    'americanfootball_nfl',
    'basketball_nba',
    'icehockey_nhl',
    'baseball_mlb',
    'americanfootball_ncaaf',
    'basketball_ncaab',
    'soccer_epl',
    'soccer_usa_mls',
    'mma_mixed_martial_arts'
  ];

  // Search through sports until we find the teams/players
  for (const sportKey of sportKeys) {
    try {
      console.log(`🔄 Checking ${sportKey} for target teams/players...`);

      // 🚀 ENHANCED: Use same sport-specific market function as parlay generation
      const markets = getSportSpecificMarkets(sportKey);
      
      const response = await fetch(
        // Don't filter by date - get all upcoming games
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=${markets}&oddsFormat=american&dateFormat=iso`,
        { 
          headers: { 'Accept': 'application/json' },
          timeout: 8000
        }
      );

      if (!response.ok) {
        if (response.status === 422) {
          console.log(`${sportKey} out of season, skipping...`);
          continue;
        } else if (response.status === 429) {
          console.log(`Rate limit hit for ${sportKey}, continuing...`);
          continue;
        } else {
          console.log(`Error ${response.status} for ${sportKey}, skipping...`);
          continue;
        }
      }

      const games = await response.json();
      
      // Filter games that match our teams/players
      const matchingGames = games.filter(game => {
        return searchTargets.some(target => {
          const targetLower = target.toLowerCase();
          return (
            game.home_team?.toLowerCase().includes(targetLower) ||
            game.away_team?.toLowerCase().includes(targetLower) ||
            targetLower.includes(game.home_team?.toLowerCase()) ||
            targetLower.includes(game.away_team?.toLowerCase())
          );
        });
      });

      if (matchingGames.length > 0) {
        console.log(`✅ Found ${matchingGames.length} matching games in ${sportKey}`);
        // 🚀 APPLY TOP 10 FILTER HERE
        const filteredGames = filterToTop10Sportsbooks(matchingGames);
        allGameData.push(...filteredGames.map(game => ({ ...game, sport: sportKey })));
      }

      // Stop searching once we have enough data
      if (allGameData.length >= 5) { // Reduced from 10 to 5
        console.log('🎯 Found sufficient game data, stopping search');
        break;
      }

    } catch (error) {
      console.log(`Error searching ${sportKey}:`, error.message);
      continue;
    }
  }

  console.log(`📊 Total games found: ${allGameData.length} (top 10 sportsbooks only)`);
  return allGameData;
}

// NEW: Broad search when specific teams/players don't match (TOP 10 SPORTSBOOKS)
async function tryBroadSportSearch() {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    return [];
  }

  console.log('🔄 Attempting broad search for any active games...');

  const prioritySports = ['americanfootball_nfl_preseason', 'americanfootball_nfl', 'basketball_nba', 'icehockey_nhl'];
  
  for (const sportKey of prioritySports) {
    try {
      const response = await fetch(
        // Don't filter by date - get all upcoming games
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (response.ok) {
        const games = await response.json();
        if (games.length > 0) {
          console.log(`✅ Found ${games.length} games in ${sportKey} for broad analysis`);
          // 🚀 APPLY TOP 10 FILTER HERE TOO
          const filteredGames = filterToTop10Sportsbooks(games);
          return filteredGames.slice(0, 3).map(game => ({ ...game, sport: sportKey })); // Reduced from 5 to 3
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return [];
}

// Extract all available bets with real odds from game data (TOP 10 SPORTSBOOKS ONLY)
function extractAvailableBets(gameData) {
  // Games are already filtered to top 10 sportsbooks from the API call
  const availableBets = [];
  
  for (const game of gameData) {
    if (!game.bookmakers) continue;
    
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes || []) {
          availableBets.push({
            game: `${game.away_team} @ ${game.home_team}`,
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
  
  console.log(`📊 Found ${availableBets.length} betting options from top sportsbooks`);
  return availableBets;
}

// 🚀 OPTIMIZED: Enhanced optimization function with MASSIVELY reduced token usage
async function generateTargetedOptimization(extractedData, gameData) {
  try {
    // Create structured data with REAL odds only (TOP 5 SPORTSBOOKS)
    const availableBets = extractAvailableBets(gameData);
    
    if (availableBets.length === 0) {
      console.log('No valid betting markets found, using fallback optimization');
      return generateFallbackOptimization(extractedData, gameData);
    }

    // 🚀 MAJOR TOKEN REDUCTION: Use only first 10 bets instead of 20
    const limitedBets = availableBets.slice(0, 10);

    const optimizationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional sports betting analyst. Analyze the bet slip and provide actionable insights based on the sportsbook data. Return valid JSON only."
        },
        {
          role: "user",
          content: `Analyze this bet slip against top 5 sportsbooks:

CURRENT BETS: ${JSON.stringify(extractedData.extracted_bets, null, 2)}

TOP 5 SPORTSBOOKS DATA (first 10 entries):
${JSON.stringify(limitedBets, null, 2)}

Return this JSON structure with 1-2 insights per category:
{
  "market_inefficiencies": ["Identify mispriced lines (1-2 sentences)"],
  "correlation_analysis": ["Check for correlated bets that reduce EV"], 
  "line_movement_strategy": ["When to place bets for best value"],
  "ev_optimization": ["Mathematical edge improvements"],
  "bankroll_management": ["Recommended bet sizing"],
  "alternative_constructions": ["Better parlay structures"],
  "sharp_money_signals": ["Where professionals are betting"],
  "advanced_insights": ["Key strategic recommendations"]
}`
        }
      ],
      max_tokens: 800, // Increased for comprehensive analysis
      temperature: 0.2
    });

    const optimizationText = optimizationResponse.choices[0].message.content;
    
    try {
      const cleaned = optimizationText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.log('Optimization parsing failed, using fallback');
      return generateFallbackOptimization(extractedData, gameData);
    }

  } catch (error) {
    console.log('OpenAI optimization failed, using fallback:', error.message);
    return generateFallbackOptimization(extractedData, gameData);
  }
}

// Enhanced function to find all sportsbooks for specific bets (TOP 10)
function findAllSportsbooksForBet(bet, gameData) {
  const matchingGames = gameData.filter(game => {
    return (
      (bet.home_team && game.home_team?.toLowerCase().includes(bet.home_team.toLowerCase())) ||
      (bet.away_team && game.away_team?.toLowerCase().includes(bet.away_team.toLowerCase())) ||
      (bet.home_team && game.away_team?.toLowerCase().includes(bet.home_team.toLowerCase())) ||
      (bet.away_team && game.home_team?.toLowerCase().includes(bet.away_team.toLowerCase()))
    );
  });

  if (matchingGames.length === 0) return [];

  const game = matchingGames[0];
  if (!game.bookmakers) return [];

  const allSportsbooks = [];

  for (const bookmaker of game.bookmakers) {
    if (!bookmaker.markets) continue;
    
    for (const market of bookmaker.markets) {
      const isMatchingMarket = isMatchingBetType(bet, market);
      if (!isMatchingMarket) continue;

      for (const outcome of market.outcomes || []) {
        if (isMatchingSelection(bet, outcome, market)) {
          const odds = outcome.price;
          
          allSportsbooks.push({
            name: bookmaker.title,
            odds: formatOdds(odds),
            market: market.key,
            selection: outcome.name,
            point: outcome.point || null
          });
        }
      }
    }
  }

  return allSportsbooks;
}

// 🚀 ENHANCED: Helper function to match bet type to market including ALL player spreads
function isMatchingBetType(bet, market) {
  const betType = bet.bet_type?.toLowerCase();
  const marketKey = market.key?.toLowerCase();
  const betSelection = bet.bet_selection?.toLowerCase() || '';
  
  // Basic market matches
  if (betType === 'moneyline' && marketKey === 'h2h') return true;
  if (betType === 'spread' && marketKey === 'spreads') return true;
  if (betType === 'total' && (marketKey === 'totals' || marketKey === 'over_under')) return true;
  if (betType === 'player_prop' && marketKey.includes('player_')) return true;
  if (betType === 'prop' && marketKey.includes('player_')) return true;
  
  // Enhanced player spread matching for ALL sports
  const playerSpreadMatches = {
    // Basketball
    'points': ['player_points'],
    'rebounds': ['player_rebounds'], 
    'assists': ['player_assists'],
    'threes': ['player_threes'],
    'blocks': ['player_blocks'],
    'steals': ['player_steals'],
    
    // Football (NFL/NCAAF)
    'passing yards': ['player_pass_yds'],
    'rushing yards': ['player_rush_yds'], 
    'receiving yards': ['player_reception_yds'],
    'passing touchdowns': ['player_pass_tds'],
    'rushing touchdowns': ['player_rush_tds'],
    'receiving touchdowns': ['player_reception_tds'],
    'pass yds': ['player_pass_yds'],
    'rush yds': ['player_rush_yds'],
    'rec yds': ['player_reception_yds'],
    
    // Hockey
    'goals': ['player_goals'],
    'hockey assists': ['player_assists'],
    'hockey points': ['player_points'],
    'shots on goal': ['player_shots_on_goal'],
    
    // Baseball
    'hits': ['batter_hits'],
    'total bases': ['batter_total_bases'],
    'rbis': ['batter_rbis'],
    'runs scored': ['batter_runs_scored'],
    'home runs': ['batter_home_runs'],
    'strikeouts': ['pitcher_strikeouts']
  };
  
  // Check for player spread matches by selection text
  for (const [keyword, markets] of Object.entries(playerSpreadMatches)) {
    if (betSelection.includes(keyword) && markets.includes(marketKey)) {
      return true;
    }
  }
  
  // Fallback: any player market containing similar keywords
  if (marketKey.includes('player_')) {
    const marketStat = marketKey.replace('player_', '');
    if (betSelection.includes(marketStat) || betSelection.includes(marketStat.slice(0, -1))) {
      return true;
    }
  }
  
  return false;
}

// Helper function to match selection to outcome
function isMatchingSelection(bet, outcome, market) {
  const betSelection = bet.bet_selection?.toLowerCase() || '';
  const outcomeName = outcome.name?.toLowerCase() || '';
  
  if (market.key === 'h2h') {
    return betSelection.includes(outcomeName) || outcomeName.includes(betSelection.split(' ')[0]);
  }
  
  if (market.key === 'spreads') {
    const teamMatches = betSelection.includes(outcomeName) || outcomeName.includes(betSelection.split(' ')[0]);
    if (!teamMatches) return false;
    
    const betHasPlus = betSelection.includes('+');
    const betHasMinus = betSelection.includes('-');
    const outcomePoint = outcome.point;
    
    if (betHasPlus && outcomePoint > 0) return true;
    if (betHasMinus && outcomePoint < 0) return true;
    
    return !betHasPlus && !betHasMinus;
  }
  
  if (market.key === 'totals') {
    const isOver = betSelection.includes('over') && outcomeName.includes('over');
    const isUnder = betSelection.includes('under') && outcomeName.includes('under');
    return isOver || isUnder;
  }
  
  // 🚀 ENHANCED: Player spread line parsing for ALL player markets
  if (market.key.includes('player_')) {
    const outcomeDesc = outcome.description?.toLowerCase() || '';
    const outcomeName = outcome.name?.toLowerCase() || '';
    
    // Multiple matching strategies for player spreads
    const matches = [
      // Direct description match
      outcomeDesc.includes(betSelection) || betSelection.includes(outcomeDesc),
      // Player name extraction
      outcomeName.includes(betSelection) || betSelection.includes(outcomeName),
      // Over/under pattern matching
      (betSelection.includes('over') && (outcomeDesc.includes('over') || outcomeName.includes('over'))),
      (betSelection.includes('under') && (outcomeDesc.includes('under') || outcomeName.includes('under'))),
      // Threshold matching (e.g., "25.5" in both)
      extractNumberFromString(betSelection) === extractNumberFromString(outcomeDesc),
      // Player last name matching
      extractPlayerName(betSelection) === extractPlayerName(outcomeDesc)
    ];
    
    return matches.some(match => match === true);
  }
  
  return false;
}

// Helper function to determine if odds are better
function isBetterOdds(newOdds, currentBestOdds) {
  if (currentBestOdds === null) return true;
  
  if (newOdds > 0 && currentBestOdds > 0) {
    return newOdds > currentBestOdds;
  } else if (newOdds < 0 && currentBestOdds < 0) {
    return Math.abs(newOdds) < Math.abs(currentBestOdds);
  } else if (newOdds > 0 && currentBestOdds < 0) {
    return true;
  } else {
    return false;
  }
}

// Calculate odds improvement
function calculateOddsImprovement(originalOdds, bestOdds) {
  const originalPayout = calculatePayout(100, originalOdds);
  const bestPayout = calculatePayout(100, bestOdds);
  
  const improvement = ((bestPayout - originalPayout) / originalPayout) * 100;
  const extraPayout = bestPayout - originalPayout;
  
  return {
    percentage: Math.round(improvement * 100) / 100,
    description: improvement > 0 ? `${improvement.toFixed(1)}% better payout` : 'No improvement',
    extraPayout: extraPayout > 0 ? `$${extraPayout.toFixed(2)} extra per $100 bet` : null
  };
}

// Calculate payout for given stake and odds
function calculatePayout(stake, odds) {
  if (odds > 0) {
    return stake + (stake * odds / 100);
  } else {
    return stake + (stake * 100 / Math.abs(odds));
  }
}

// ENHANCED: Enhanced odds comparison function - show only top 3 best options
function generateOddsComparison(extractedBets, gameData) {
  const allComparisons = [];

  for (const bet of extractedBets || []) {
    const allSportsbooks = findAllSportsbooksForBet(bet, gameData);
    
    if (allSportsbooks && allSportsbooks.length > 0) {
      // Sort by improvement percentage and take top 3
      const topSportsbooks = allSportsbooks
        .map(sportsbook => {
          const originalOdds = parseOdds(bet.odds);
          const bestOdds = parseOdds(sportsbook.odds);
          const improvement = calculateOddsImprovement(originalOdds, bestOdds);
          
          return {
            original_bet: `${bet.away_team} @ ${bet.home_team} - ${bet.bet_selection}`,
            original_odds: bet.odds,
            original_sportsbook: bet.sportsbook || 'Your Book',
            best_sportsbook: sportsbook.name,
            best_odds: sportsbook.odds,
            improvement_percentage: improvement.percentage,
            improvement_description: improvement.description,
            potential_extra_payout: improvement.extraPayout,
            recommendation: improvement.percentage > 5 ? 'Switch recommended' : 'Minimal difference'
          };
        })
        .sort((a, b) => b.improvement_percentage - a.improvement_percentage)
        .slice(0, 3); // Only show top 3

      allComparisons.push(...topSportsbooks);
    } else {
      allComparisons.push({
        original_bet: `${bet.away_team} @ ${bet.home_team} - ${bet.bet_selection}`,
        original_odds: bet.odds,
        original_sportsbook: bet.sportsbook || 'Your Book',
        best_sportsbook: 'No match found',
        best_odds: null,
        improvement_percentage: 0,
        improvement_description: 'Unable to find matching bet in available sportsbooks',
        recommendation: 'Verify bet details or check if game is available'
      });
    }
  }

  return {
    available: allComparisons.length > 0,
    comparisons: allComparisons,
    summary: {
      bets_analyzed: allComparisons.length,
      better_odds_found: allComparisons.filter(c => c.improvement_percentage > 0).length,
      average_improvement: allComparisons.length > 0 ? 
        (allComparisons.reduce((sum, c) => sum + c.improvement_percentage, 0) / allComparisons.length).toFixed(1) : 0,
      sportsbooks_compared: "Major US sportsbooks"
    }
  };
}

// Enhanced smart tips focused on major sportsbooks
function generateSmartTips(extractedData, gameData, aiOptimization) {
  const tips = [];

  // Add AI-generated insights with proper icons (if available)
  if (aiOptimization.market_inefficiencies) {
    tips.push(...aiOptimization.market_inefficiencies.map(tip => `🎯 Market Inefficiency: ${tip}`));
  }

  if (aiOptimization.ev_optimization) {
    tips.push(...aiOptimization.ev_optimization.map(tip => `🧮 EV Optimization: ${tip}`));
  }

  if (aiOptimization.bankroll_management) {
    tips.push(...aiOptimization.bankroll_management.map(tip => `💰 Bankroll Strategy: ${tip}`));
  }

  // Add general sportsbook tips without naming specific books
  const availableBets = extractAvailableBets(gameData);
  const uniqueSportsbooks = [...new Set(availableBets.map(bet => bet.sportsbook))];
  
  if (uniqueSportsbooks.length > 0) {
    tips.push(`📱 Sportsbook Analysis: Compared ${uniqueSportsbooks.length} major US sportsbooks for best odds`);
    tips.push(`🏆 Comprehensive Coverage: Analyzed the biggest sportsbooks in the country for optimal line shopping`);
  }

  // Add game-specific insights
  if (gameData.length > 0) {
    tips.push(`📊 Market Data: Analyzed ${gameData.length} games across major sportsbooks for optimization opportunities`);
  } else {
    tips.push(`⚠️ Limited Market Data: No matching games found in available sportsbooks - teams may be out of season`);
  }

  return tips;
}

// Enhanced fallback optimization with major sportsbooks
function generateFallbackOptimization(extractedData, gameData) {
  const numLegs = extractedData.extracted_bets?.length || 0;
  const availableBets = extractAvailableBets(gameData);
  const uniqueBooks = [...new Set(availableBets.map(bet => bet.sportsbook))];
  
  return {
    market_inefficiencies: [
      `Analysis across major US sportsbooks - found ${availableBets.length} bets across ${uniqueBooks.length} premium books`,
      `${numLegs}-leg structure optimized for best odds comparison`
    ],
    correlation_analysis: [
      numLegs > 2 ? "Multiple legs may reduce expected value" : "Structure reduces correlation risk",
      "Major sportsbooks provide reliable correlation analysis"
    ],
    line_movement_strategy: [
      "Monitor major sportsbooks for best line movement timing",
      "Premium books typically offer most accurate closing lines"
    ],
    ev_optimization: [
      "Compare odds across major sportsbooks for maximum expected value",
      "Premium sportsbooks typically offer best overall value"
    ],
    bankroll_management: [
      `${numLegs}-leg parlay should represent 1-2% of bankroll maximum`,
      "Use major sportsbooks for most reliable bankroll tracking"
    ],
    alternative_constructions: [
      "Consider round-robin using major sportsbooks for diversification",
      "Premium books offer best alternative betting structures"
    ],
    sharp_money_signals: [
      "Monitor line movement across major books for sharp action",
      "Premium sportsbooks typically reflect sharp money earliest"
    ],
    advanced_insights: [
      "Major US sportsbooks provide most accurate market pricing",
      "Premium book line shopping can improve EV by 2-5% per bet"
    ]
  };
}

// 🚀 NEW: Helper functions for player spread matching
function extractNumberFromString(str) {
  if (!str) return null;
  const matches = str.match(/(\d+\.?\d*)/);
  return matches ? parseFloat(matches[1]) : null;
}

function extractPlayerName(str) {
  if (!str) return '';
  // Extract player name (usually the first part before stats)
  const words = str.split(' ');
  // Look for capitalized words (likely player names)
  const nameWords = words.filter(word => 
    word.length > 1 && word[0] === word[0].toUpperCase() && !word.includes('Over') && !word.includes('Under')
  );
  return nameWords.slice(0, 2).join(' ').toLowerCase(); // First and last name
}

// Generate improved bets with better odds and EV
async function generateImprovedBets(originalBets, gameData) {
  if (!originalBets || originalBets.length === 0) return [];
  
  const improvedBets = [];
  
  for (const bet of originalBets) {
    // Find the best available odds for this bet
    const allSportsbooks = findAllSportsbooksForBet(bet, gameData);
    
    if (allSportsbooks && allSportsbooks.length > 0) {
      // Get the best odds
      const bestOption = allSportsbooks
        .map(sportsbook => ({
          ...sportsbook,
          originalOdds: parseOdds(bet.odds),
          bestOdds: parseOdds(sportsbook.odds),
          improvement: calculateOddsImprovement(parseOdds(bet.odds), parseOdds(sportsbook.odds))
        }))
        .sort((a, b) => b.improvement.percentage - a.improvement.percentage)[0];
      
      // Use improved odds if significant improvement (>3%), otherwise keep original
      const useImprovedOdds = bestOption.improvement.percentage > 3;
      
      improvedBets.push({
        league: extractLeagueFromGameData(gameData, bet),
        matchup: bet.home_team && bet.away_team ? `${bet.away_team} vs ${bet.home_team}` : bet.game || 'Game',
        market: bet.bet_type || 'Bet',
        selection: bet.bet_selection || 'Selection',
        odds: useImprovedOdds ? bestOption.odds : bet.odds,
        decimal_odds: useImprovedOdds ? americanToDecimal(bestOption.bestOdds).toFixed(2) : americanToDecimal(parseOdds(bet.odds)).toFixed(2),
        sportsbook: useImprovedOdds ? bestOption.name : (bet.sportsbook || 'Original'),
        improved: useImprovedOdds,
        improvement_percentage: bestOption.improvement.percentage,
        original_odds: bet.odds
      });
    } else {
      // No matching bet found, keep original
      improvedBets.push({
        league: 'League',
        matchup: bet.home_team && bet.away_team ? `${bet.away_team} vs ${bet.home_team}` : bet.game || 'Game',
        market: bet.bet_type || 'Bet',
        selection: bet.bet_selection || 'Selection',
        odds: bet.odds,
        decimal_odds: americanToDecimal(parseOdds(bet.odds)).toFixed(2),
        sportsbook: bet.sportsbook || 'Original',
        improved: false,
        improvement_percentage: 0,
        original_odds: bet.odds
      });
    }
  }
  
  return improvedBets;
}

// Generate explanation text for the notes section
function generateExplanationText(improvedBets, aiOptimization) {
  const improvedCount = improvedBets.filter(bet => bet.improved).length;
  
  if (improvedCount === 0) {
    return "Your original slip has competitive odds across major sportsbooks. No significant improvements were found at this time.";
  }
  
  let explanation = `We improved ${improvedCount} of your ${improvedBets.length} bets by finding better odds. `;
  
  const avgImprovement = improvedBets
    .filter(bet => bet.improved)
    .reduce((sum, bet) => sum + bet.improvement_percentage, 0) / improvedCount;
  
  explanation += `Average improvement: ${avgImprovement.toFixed(1)}%. `;
  
  // Add AI insights if available
  if (aiOptimization.ev_optimization && aiOptimization.ev_optimization.length > 0) {
    explanation += aiOptimization.ev_optimization[0];
  } else if (aiOptimization.market_inefficiencies && aiOptimization.market_inefficiencies.length > 0) {
    explanation += aiOptimization.market_inefficiencies[0];
  }
  
  return explanation;
}

// Extract league from game data
function extractLeagueFromGameData(gameData, bet) {
  if (!gameData || gameData.length === 0) return 'League';
  
  const matchingGame = gameData.find(game => 
    (bet.home_team && game.home_team?.toLowerCase().includes(bet.home_team.toLowerCase())) ||
    (bet.away_team && game.away_team?.toLowerCase().includes(bet.away_team.toLowerCase()))
  );
  
  if (matchingGame && matchingGame.sport) {
    const sportMap = {
      'americanfootball_nfl': 'NFL',
      'americanfootball_nfl_preseason': 'NFL',
      'americanfootball_ncaaf': 'NCAAF',
      'basketball_nba': 'NBA',
      'basketball_ncaab': 'NCAAB',
      'icehockey_nhl': 'NHL',
      'baseball_mlb': 'MLB',
      'soccer_epl': 'EPL',
      'soccer_usa_mls': 'MLS',
      'mma_mixed_martial_arts': 'MMA'
    };
    return sportMap[matchingGame.sport] || 'League';
  }
  
  return 'League';
}

// SHARED Helper functions
function parseOdds(oddsValue) {
  if (!oddsValue) return 100;
  const cleaned = String(oddsValue).replace('+', '');
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 100 : parsed;
}

function formatOdds(odds) {
  if (typeof odds !== 'number' || isNaN(odds)) return '+100';
  return odds > 0 ? `+${odds}` : `${odds}`;
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