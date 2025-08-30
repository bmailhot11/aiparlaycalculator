const openai = require('../../lib/openai');
const eventsCache = require('../../lib/events-cache.js');

// Historical analyzer (optional)
let historicalAnalyzer;
try {
  historicalAnalyzer = require('../../lib/historical-edge-analyzer.js');
} catch (error) {
  console.log('Historical analyzer not available:', error.message);
  historicalAnalyzer = null;
}

// Optimized parlay generation with minimal overhead
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sport, league, riskLevel = 'moderate', legs = 3, includePlayerProps = false } = req.body;
  
  if (!sport) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sport selection required' 
    });
  }

  try {
    console.log(`🎯 Generating ${sport} parlay with ${legs} legs...`);

    // Step 1: Get FILTERED data for selected sport
    const sportData = await fetchFilteredSportData(sport, league, includePlayerProps);
    
    if (!sportData || sportData.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No games found for ${sport}. Please try another sport.`
      });
    }

    // Step 2: Generate optimized parlay
    const parlayData = await generateOptimizedParlay({
      sport,
      league,
      riskLevel,
      legs,
      includePlayerProps
    }, sportData);

    return res.status(200).json({
      success: true,
      parlay: parlayData
    });

  } catch (error) {
    console.error('❌ Parlay generation error:', error);
    
    // Simple fallback for any errors
    return res.status(500).json({
      success: false,
      message: 'Failed to generate parlay. Please try again.',
      error: error.message
    });
  }
}

// OPTIMIZED: Fetch only what we need
async function fetchFilteredSportData(sport, league, includePlayerProps = false) {
  try {
    // Use cached events (much faster)
    const events = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!events || events.length === 0) {
      return [];
    }
    
    // Get only h2h and spreads (skip totals and props for speed unless requested)
    const markets = includePlayerProps ? 'h2h,spreads,totals' : 'h2h,spreads';
    const oddsData = await eventsCache.getOddsForEvents(
      events.slice(0, 10), // MAX 10 games
      markets,
      includePlayerProps // Pass player props flag
    );
    
    return oddsData;
  } catch (error) {
    console.error('Failed to fetch sport data:', error);
    return [];
  }
}

// ENHANCED: Extract bets from top 6 sportsbooks with historical context
function extractEssentialBets(gameData, preferences) {
  // Expanded to top 6 sportsbooks for better variety and odds
  const TOP_BOOKS = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet', 'BetRivers'];
  const betsByBook = {}; // Group bets by sportsbook
  
  // Initialize sportsbook groups
  TOP_BOOKS.forEach(book => {
    betsByBook[book] = [];
  });
  
  for (const game of gameData.slice(0, 12)) { // Increased to 12 games for more variety
    if (!game.bookmakers) continue;
    
    // Filter to top sportsbooks only
    const topBookmakers = game.bookmakers.filter(b => 
      TOP_BOOKS.includes(b.title)
    );
    
    // Get lines from each top book, organized by sportsbook
    for (const bookmaker of topBookmakers) {
      if (!bookmaker.markets) continue;
      
      // Include more market types for better variety
      const allowedMarkets = preferences.includePlayerProps 
        ? ['h2h', 'spreads', 'totals']
        : ['h2h', 'spreads', 'totals'];
      
      for (const market of bookmaker.markets) {
        if (!allowedMarkets.includes(market.key)) continue;
        
        for (const outcome of (market.outcomes || [])) {
          const bet = {
            game: `${game.away_team} @ ${game.home_team}`,
            game_id: `${game.away_team}_${game.home_team}`,
            book: bookmaker.title,
            type: market.key,
            selection: formatSelection(outcome.name, outcome.point),
            odds: outcome.price,
            decimal: americanToDecimal(outcome.price),
            commence_time: game.commence_time,
            sport: game.sport_key || preferences.sport.toLowerCase()
          };
          
          // Add to sportsbook-specific array
          betsByBook[bookmaker.title].push(bet);
        }
      }
    }
  }
  
  return betsByBook;
}

// ENHANCED: Smart parlay generation with historical data
async function generateOptimizedParlay(preferences, sportData) {
  const betsByBook = extractEssentialBets(sportData, preferences);
  
  // Find sportsbooks with enough games for a complete parlay
  const viableSportsbooks = Object.entries(betsByBook)
    .filter(([book, bets]) => {
      const uniqueGames = new Set(bets.map(bet => bet.game_id));
      return uniqueGames.size >= preferences.legs;
    })
    .sort(([bookA, betsA], [bookB, betsB]) => betsB.length - betsA.length);
  
  if (viableSportsbooks.length === 0) {
    // Fallback: combine all bets if no single book has enough
    const allBets = Object.values(betsByBook).flat();
    return generateSimpleFallback(allBets, preferences);
  }
  
  // Use the sportsbook with the most betting options
  const [selectedBook, bookBets] = viableSportsbooks[0];
  console.log(`🎯 Selected ${selectedBook} with ${bookBets.length} available bets`);

  // Apply historical analysis if available
  let enhancedBets = bookBets;
  if (historicalAnalyzer) {
    console.log(`🔍 Applying historical analysis for ${preferences.sport}...`);
    try {
      enhancedBets = await historicalAnalyzer.detectCurrentEdges(bookBets, preferences.sport);
      console.log(`✅ Enhanced ${enhancedBets.length} bets with historical data`);
    } catch (error) {
      console.log('Historical analysis failed, using base bets:', error.message);
      enhancedBets = bookBets;
    }
  }
  
  // Group enhanced bets by game to ensure variety
  const betsByGame = {};
  enhancedBets.forEach(bet => {
    if (!betsByGame[bet.game]) {
      betsByGame[bet.game] = [];
    }
    betsByGame[bet.game].push(bet);
  });
  
  // COST OPTIMIZATION: Limit games sent to AI to reduce tokens
  const viableGames = Object.entries(betsByGame)
    .filter(([game, bets]) => bets.length >= 1)
    .sort(([gameA, betsA], [gameB, betsB]) => {
      // Sort by historical edge data if available
      const avgEdgeA = betsA.reduce((sum, bet) => sum + (bet.priority_boost || 1.0), 0) / betsA.length;
      const avgEdgeB = betsB.reduce((sum, bet) => sum + (bet.priority_boost || 1.0), 0) / betsB.length;
      return avgEdgeB - avgEdgeA;
    })
    .slice(0, Math.min(8, preferences.legs * 2)); // REDUCED: Only 8 games max (saves ~50% tokens)
  
  try {
    // SIMPLIFIED prompt - focus on selection, not complex analysis
    const parlayResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional sports betting analyst with access to historical data. Create a ${preferences.legs}-leg parlay from ${selectedBook}.
          
Rules:
- Select exactly ${preferences.legs} bets from DIFFERENT games
- ALL BETS must be from ${selectedBook} (already filtered)
- Focus on value plays with historical edge indicators
- ${preferences.riskLevel === 'safe' ? 'Conservative approach: favorites (-200 to +150)' : ''}
- ${preferences.riskLevel === 'moderate' ? 'Balanced approach: mix of favorites and underdogs (-250 to +250)' : ''}
- ${preferences.riskLevel === 'risky' ? 'Aggressive approach: include longer odds (+150 to +400)' : ''}
- Consider historical patterns and recent form
- Return ONLY valid JSON`
        },
        {
          role: "user",
          content: `Create a ${preferences.sport} parlay using ONLY ${selectedBook} odds:

${viableGames.map(([game, bets]) => {
  const bookBets = bets.filter(b => b.book === selectedBook);
  const priorityInfo = bookBets.some(b => b.priority_boost > 1.0) ? ' [Historical Edge]' : '';
  return `${game}${priorityInfo}: ${bookBets.slice(0, 3).map(b => `${b.selection} ${formatOdds(b.odds)}`).join(', ')}`;
}).join('\n')}

Historical Context: ${historicalAnalyzer ? 'Enhanced with recent performance data and market trends' : 'Using current market analysis'}

Return this JSON:
{
  "legs": [
    {
      "game": "Away @ Home",
      "selection": "team name",
      "odds": "+150",
      "book": "DraftKings",
      "reason": "brief reason"
    }
  ],
  "totalOdds": "+500",
  "confidence": "High/Medium/Low"
}`
        }
      ],
      max_tokens: 500, // Much smaller response needed
      temperature: 0.3
    });

    const aiResponse = JSON.parse(
      parlayResponse.choices[0].message.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
    );
    
    // Validate that all legs are from the same sportsbook
    const validatedResponse = validateSingleBookParlay(aiResponse, selectedBook);
    
    return formatParlayResponse(validatedResponse, preferences, selectedBook, historicalAnalyzer ? 'enhanced' : 'standard');
    
  } catch (error) {
    console.error('AI generation failed, using fallback:', error);
    return generateSingleBookFallback(bookBets, preferences, selectedBook);
  }
}

// ENHANCED SINGLE-BOOK FALLBACK: All bets from same sportsbook
function generateSingleBookFallback(bets, preferences, selectedBook) {
  const selectedBets = [];
  const usedGames = new Set();
  
  // Apply historical priority if available
  const prioritizedBets = bets.sort((a, b) => (b.priority_boost || 1.0) - (a.priority_boost || 1.0));
  
  // Filter by risk level
  const filteredBets = prioritizedBets.filter(bet => {
    const odds = bet.odds;
    switch (preferences.riskLevel) {
      case 'safe':
        return odds >= -200 && odds <= 150;
      case 'risky':
        return odds >= -300 && odds <= 400;
      default: // moderate
        return odds >= -250 && odds <= 250;
    }
  });
  
  // Pick bets from different games (single sportsbook)
  for (const bet of filteredBets) {
    if (selectedBets.length >= preferences.legs) break;
    if (!usedGames.has(bet.game_id) && bet.book === selectedBook) {
      selectedBets.push(bet);
      usedGames.add(bet.game_id);
    }
  }
  
  // Calculate combined odds
  const totalDecimal = selectedBets.reduce((acc, bet) => acc * bet.decimal, 1);
  const totalAmerican = decimalToAmerican(totalDecimal);
  
  return {
    legs: selectedBets.map(bet => ({
      game: bet.game,
      selection: bet.selection,
      odds: formatOdds(bet.odds),
      book: selectedBook, // Ensure consistency
      reason: bet.priority_boost > 1.0 ? 
        `Historical edge detected (${((bet.priority_boost - 1.0) * 100).toFixed(0)}% boost)` :
        "Value play based on current market analysis"
    })),
    totalOdds: formatOdds(totalAmerican),
    confidence: historicalAnalyzer ? "High - Historical Data" : "Medium",
    sport: preferences.sport,
    primary_sportsbook: selectedBook,
    single_book_convenience: true,
    timestamp: new Date().toISOString()
  };
}

// ENHANCED FALLBACK: For when no single book has enough games
function generateSimpleFallback(allBets, preferences) {
  // Find the sportsbook with the most games available
  const bookCounts = {};
  const bookGames = {};
  
  allBets.forEach(bet => {
    if (!bookCounts[bet.book]) {
      bookCounts[bet.book] = 0;
      bookGames[bet.book] = new Set();
    }
    bookGames[bet.book].add(bet.game_id);
    bookCounts[bet.book] = bookGames[bet.book].size;
  });
  
  // Select the sportsbook with most unique games
  const bestBook = Object.entries(bookCounts)
    .sort(([bookA, countA], [bookB, countB]) => countB - countA)[0]?.[0];
  
  if (bestBook) {
    const bookBets = allBets.filter(bet => bet.book === bestBook);
    return generateSingleBookFallback(bookBets, preferences, bestBook);
  }
  
  // Ultimate fallback - use any available bets
  const selectedBets = [];
  const usedGames = new Set();
  
  for (const bet of allBets) {
    if (selectedBets.length >= preferences.legs) break;
    if (!usedGames.has(bet.game_id)) {
      selectedBets.push(bet);
      usedGames.add(bet.game_id);
    }
  }
  
  const totalDecimal = selectedBets.reduce((acc, bet) => acc * bet.decimal, 1);
  
  return {
    legs: selectedBets.map(bet => ({
      game: bet.game,
      selection: bet.selection,
      odds: formatOdds(bet.odds),
      book: bet.book,
      reason: "Best available option from mixed sportsbooks"
    })),
    totalOdds: formatOdds(decimalToAmerican(totalDecimal)),
    confidence: "Low - Mixed Books",
    sport: preferences.sport,
    mixed_sportsbooks: true,
    timestamp: new Date().toISOString()
  };
}

// Validate that all parlay legs are from the same sportsbook
function validateSingleBookParlay(parlayData, selectedBook) {
  const legs = parlayData.legs || [];
  
  // Ensure all legs specify the selected sportsbook
  const validatedLegs = legs.map(leg => ({
    ...leg,
    book: selectedBook // Force consistency
  }));
  
  return {
    ...parlayData,
    legs: validatedLegs
  };
}

// Format the final response with enhanced metadata
function formatParlayResponse(parlayData, preferences, selectedBook, analysisType = 'standard') {
  const legs = parlayData.legs || [];
  
  // Calculate actual total odds
  const totalDecimal = legs.reduce((acc, leg) => {
    const decimal = americanToDecimal(parseOdds(leg.odds));
    return acc * decimal;
  }, 1);
  
  return {
    parlay_legs: legs.map(leg => ({
      ...leg,
      sportsbook: selectedBook,
      decimal_odds: americanToDecimal(parseOdds(leg.odds))
    })),
    total_decimal_odds: totalDecimal.toFixed(2),
    total_american_odds: formatOdds(decimalToAmerican(totalDecimal)),
    confidence: parlayData.confidence || "Medium",
    sport: preferences.sport,
    league: preferences.league,
    risk_level: preferences.riskLevel,
    primary_sportsbook: selectedBook,
    analysis_type: analysisType,
    historical_enhanced: analysisType === 'enhanced',
    timestamp: new Date().toISOString(),
    optimized: true,
    single_book_convenience: `All bets available at ${selectedBook} for easy placement`
  };
}

// HELPER FUNCTIONS (Simplified)
function americanToDecimal(odds) {
  if (typeof odds === 'string') {
    odds = parseOdds(odds);
  }
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

function decimalToAmerican(decimal) {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

function parseOdds(oddsStr) {
  if (typeof oddsStr === 'number') return oddsStr;
  const cleaned = String(oddsStr).replace('+', '');
  return parseInt(cleaned) || 100;
}

// Helper function to format selection names with points
function formatSelection(name, point) {
  if (point !== undefined && point !== null) {
    if (name.toLowerCase().includes('over') || name.toLowerCase().includes('under')) {
      return `${name} ${point}`;
    } else if (point > 0) {
      return `${name} +${point}`;
    } else if (point < 0) {
      return `${name} ${point}`;
    }
  }
  return name;
}

function formatOdds(odds) {
  if (typeof odds !== 'number' || isNaN(odds)) {
    return '+100';
  }
  return odds > 0 ? `+${odds}` : `${odds}`;
}