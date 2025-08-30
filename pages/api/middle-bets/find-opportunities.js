const eventsCache = require('../../../lib/events-cache.js');

// Key numbers by sport for middle detection
const KEY_NUMBERS = {
  nfl: {
    spreads: [3, 7, 10, 14],
    totals: [41, 44, 47]
  },
  nba: {
    spreads: [5, 10, 15], 
    totals: [210, 215, 220]
  },
  mlb: {
    spreads: [1.5, 2.5],
    totals: [8.5, 9.5, 10.5]
  },
  nhl: {
    spreads: [1.5, 2.5], 
    totals: [5.5, 6.5]
  }
};

// Historical hit probabilities for key numbers (estimated from historical data)
const HIT_PROBABILITIES = {
  nfl: {
    spreads: { 3: 0.092, 7: 0.085, 10: 0.067, 14: 0.054 },
    totals: { 41: 0.078, 44: 0.082, 47: 0.079 }
  },
  nba: {
    spreads: { 5: 0.071, 10: 0.068, 15: 0.059 },
    totals: { 210: 0.076, 215: 0.081, 220: 0.077 }
  },
  mlb: {
    spreads: { 1.5: 0.089, 2.5: 0.073 },
    totals: { 8.5: 0.084, 9.5: 0.087, 10.5: 0.079 }
  },
  nhl: {
    spreads: { 1.5: 0.095, 2.5: 0.078 },
    totals: { 5.5: 0.088, 6.5: 0.091 }
  }
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🎯 [Middle Bets] Starting search for high-quality middle opportunities...');

    const { sport, includeAllSports = false } = req.body;

    // Get upcoming events
    let upcomingEvents = [];
    if (includeAllSports) {
      // Get events from multiple sports
      const sports = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB'];
      const allEvents = [];
      
      for (const sportKey of sports) {
        try {
          const events = await eventsCache.cacheUpcomingEvents(sportKey);
          if (events && events.length > 0) {
            allEvents.push(...events);
          }
        } catch (error) {
          console.log(`⚠️ [${sportKey}] Error getting events:`, error.message);
        }
      }
      upcomingEvents = allEvents;
    } else if (sport) {
      upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    } else {
      return res.status(400).json({ message: 'Sport parameter or includeAllSports flag required' });
    }

    if (!upcomingEvents.length) {
      return res.status(404).json({ message: 'No upcoming events found' });
    }

    console.log(`🎯 [Middle Bets] Found ${upcomingEvents.length} upcoming games`);

    // Get odds data with spreads and totals (main markets for middle bets) 
    const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, 'spreads,totals', false);
    console.log(`🎯 [Middle Bets] Retrieved odds data for ${oddsData.length} games`);

    // Find middle bet opportunities
    const middleBets = [];
    
    for (const game of oddsData) {
      if (!game.bookmakers || game.bookmakers.length < 2) continue;

      // Find spread middles
      const spreadMiddles = findSpreadMiddles(game);
      middleBets.push(...spreadMiddles);

      // Find totals middles  
      const totalsMiddles = findTotalsMiddles(game);
      middleBets.push(...totalsMiddles);
    }

    // Filter and rank by quality
    const qualityMiddles = filterQualityMiddles(middleBets);
    
    console.log(`🎯 [Middle Bets] Found ${qualityMiddles.length} high-quality middle opportunities`);

    return res.status(200).json({
      success: true,
      opportunities: qualityMiddles, // Return all quality middles
      total_opportunities: qualityMiddles.length,
      total_games_checked: oddsData.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Middle Bets] Error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

function findSpreadMiddles(game) {
  const middles = [];
  const sportKey = getSportKey(game.sport);
  
  // Get all spread markets
  const spreadBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === 'spreads')
  );

  if (spreadBooks.length < 2) return middles;

  // Extract all spread lines with their odds
  const allSpreads = [];
  spreadBooks.forEach(book => {
    const spreadMarket = book.markets.find(m => m.key === 'spreads');
    if (spreadMarket?.outcomes) {
      spreadMarket.outcomes.forEach(outcome => {
        allSpreads.push({
          sportsbook: book.title,
          team: outcome.name,
          line: outcome.point,
          odds: outcome.price,
          decimal_odds: convertToDecimal(outcome.price)
        });
      });
    }
  });

  // Find potential middles
  for (let i = 0; i < allSpreads.length; i++) {
    for (let j = i + 1; j < allSpreads.length; j++) {
      const spread1 = allSpreads[i];
      const spread2 = allSpreads[j];

      // Skip same team or same book
      if (spread1.team === spread2.team || spread1.sportsbook === spread2.sportsbook) continue;

      // Calculate middle window
      const line1 = parseFloat(spread1.line);
      const line2 = parseFloat(spread2.line);
      
      // For a valid middle: one team gets points, other gives points, with gap
      const gap = Math.abs(Math.abs(line1) - Math.abs(line2));
      if (gap < 1) continue; // Need at least 1 point gap

      // Determine middle window
      const middleStart = Math.min(Math.abs(line1), Math.abs(line2));
      const middleEnd = Math.max(Math.abs(line1), Math.abs(line2));
      const middleNumbers = [];
      
      for (let num = middleStart + 0.5; num < middleEnd; num += 0.5) {
        middleNumbers.push(num);
      }

      if (middleNumbers.length === 0) continue;

      // Check odds quality (both should be -115 or better)
      const odds1 = parseInt(spread1.odds);
      const odds2 = parseInt(spread2.odds);
      if (odds1 < -115 || odds2 < -115) continue;

      // Calculate hit probability and EV
      const hitProb = calculateMiddleHitProbability(middleNumbers, sportKey, 'spreads');
      if (hitProb < 0.05) continue; // Must be > 5%

      const ev = calculateMiddleEV(odds1, odds2, hitProb);

      middles.push({
        id: `${game.id}_spread_middle_${Date.now()}_${Math.random()}`,
        sport: game.sport,
        game_id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        market_type: 'spreads',
        type: 'middle',
        legs: [
          {
            sportsbook: spread1.sportsbook,
            selection: `${spread1.team} ${spread1.line > 0 ? '+' : ''}${spread1.line}`,
            odds: spread1.odds,
            decimal_odds: spread1.decimal_odds.toFixed(3)
          },
          {
            sportsbook: spread2.sportsbook, 
            selection: `${spread2.team} ${spread2.line > 0 ? '+' : ''}${spread2.line}`,
            odds: spread2.odds,
            decimal_odds: spread2.decimal_odds.toFixed(3)
          }
        ],
        middle_window: middleNumbers,
        middle_range: `${middleStart + 0.5} to ${middleEnd - 0.5}`,
        gap_size: gap,
        hit_probability: (hitProb * 100).toFixed(2) + '%',
        expected_value: ev,
        ev_classification: ev > 0.02 ? '🔥 Strong' : '👍 Good',
        commence_time: game.commence_time
      });
    }
  }

  return middles;
}

function findTotalsMiddles(game) {
  const middles = [];
  const sportKey = getSportKey(game.sport);
  
  // Get all totals markets
  const totalsBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === 'totals')
  );

  if (totalsBooks.length < 2) return middles;

  // Extract all totals lines with their odds
  const allTotals = [];
  totalsBooks.forEach(book => {
    const totalsMarket = book.markets.find(m => m.key === 'totals');
    if (totalsMarket?.outcomes) {
      totalsMarket.outcomes.forEach(outcome => {
        allTotals.push({
          sportsbook: book.title,
          side: outcome.name, // "Over" or "Under"
          line: outcome.point,
          odds: outcome.price,
          decimal_odds: convertToDecimal(outcome.price)
        });
      });
    }
  });

  // Find potential middles (Over X vs Under Y where Y > X)
  const overs = allTotals.filter(t => t.side === 'Over');
  const unders = allTotals.filter(t => t.side === 'Under');

  for (const over of overs) {
    for (const under of unders) {
      // Skip same book
      if (over.sportsbook === under.sportsbook) continue;

      const overLine = parseFloat(over.line);
      const underLine = parseFloat(under.line);
      
      // Valid middle: Under line > Over line
      if (underLine <= overLine) continue;
      
      const gap = underLine - overLine;
      if (gap < 1) continue; // Need at least 1 point gap

      // Middle numbers are between the two lines
      const middleNumbers = [];
      for (let num = overLine + 0.5; num < underLine; num += 0.5) {
        middleNumbers.push(num);
      }

      if (middleNumbers.length === 0) continue;

      // Check odds quality
      const overOdds = parseInt(over.odds);
      const underOdds = parseInt(under.odds);
      if (overOdds < -115 || underOdds < -115) continue;

      // Calculate hit probability and EV
      const hitProb = calculateMiddleHitProbability(middleNumbers, sportKey, 'totals');
      if (hitProb < 0.05) continue;

      const ev = calculateMiddleEV(overOdds, underOdds, hitProb);

      middles.push({
        id: `${game.id}_totals_middle_${Date.now()}_${Math.random()}`,
        sport: game.sport,
        game_id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        market_type: 'totals',
        type: 'middle',
        legs: [
          {
            sportsbook: over.sportsbook,
            selection: `Over ${over.line}`,
            odds: over.odds,
            decimal_odds: over.decimal_odds.toFixed(3)
          },
          {
            sportsbook: under.sportsbook,
            selection: `Under ${under.line}`, 
            odds: under.odds,
            decimal_odds: under.decimal_odds.toFixed(3)
          }
        ],
        middle_window: middleNumbers,
        middle_range: `${overLine + 0.5} to ${underLine - 0.5}`,
        gap_size: gap,
        hit_probability: (hitProb * 100).toFixed(2) + '%',
        expected_value: ev,
        ev_classification: ev > 0.02 ? '🔥 Strong' : '👍 Good',
        commence_time: game.commence_time
      });
    }
  }

  return middles;
}

function calculateMiddleHitProbability(middleNumbers, sportKey, marketType) {
  if (!KEY_NUMBERS[sportKey] || !HIT_PROBABILITIES[sportKey]) {
    return 0.06; // Default 6% for unknown sports
  }

  let totalProb = 0;
  const keyNums = KEY_NUMBERS[sportKey][marketType] || [];
  const hitProbs = HIT_PROBABILITIES[sportKey][marketType] || {};

  // Check if any middle numbers are key numbers
  for (const middleNum of middleNumbers) {
    if (keyNums.includes(middleNum)) {
      totalProb += hitProbs[middleNum] || 0.06;
    } else {
      // Non-key numbers have lower probability
      totalProb += 0.03;
    }
  }

  // Cap at reasonable maximum
  return Math.min(totalProb, 0.15);
}

function calculateMiddleEV(odds1, odds2, hitProb) {
  const decimal1 = convertToDecimal(odds1);
  const decimal2 = convertToDecimal(odds2);
  
  // Standard bet amount
  const betSize = 100;
  
  // If middle hits: win both bets
  const middleWin = (betSize * (decimal1 - 1)) + (betSize * (decimal2 - 1));
  
  // If middle misses: lose one bet, win the other
  const missLoss = betSize - (betSize * Math.max(decimal1 - 1, decimal2 - 1));
  
  // Expected Value
  const ev = (hitProb * middleWin) - ((1 - hitProb) * missLoss);
  
  return ev / (2 * betSize); // Return as percentage of total investment
}

function filterQualityMiddles(middles) {
  return middles
    .filter(middle => {
      // Only show positive EV middles
      return middle.expected_value > 0;
    })
    .sort((a, b) => {
      // Sort by EV descending, then by hit probability
      if (b.expected_value !== a.expected_value) {
        return b.expected_value - a.expected_value;
      }
      return parseFloat(b.hit_probability) - parseFloat(a.hit_probability);
    });
}

function getSportKey(sport) {
  if (!sport) return 'nfl';
  const sportLower = sport.toLowerCase();
  if (sportLower.includes('nfl') || sportLower.includes('football')) return 'nfl';
  if (sportLower.includes('nba') || sportLower.includes('basketball')) return 'nba'; 
  if (sportLower.includes('mlb') || sportLower.includes('baseball')) return 'mlb';
  if (sportLower.includes('nhl') || sportLower.includes('hockey')) return 'nhl';
  return 'nfl'; // Default
}

function convertToDecimal(americanOdds) {
  const odds = parseInt(americanOdds.toString().replace('+', ''));
  return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
}

module.exports = handler;
module.exports.default = handler;