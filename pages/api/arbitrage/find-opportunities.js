// Enhanced Arbitrage Finder API
const eventsCache = require('../../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, includeAllSports = false } = req.body;

  try {
    if (includeAllSports || !sport) {
      console.log(`🎯 [Arbitrage] Finding opportunities across ALL SPORTS`);
      const arbitrageData = await findAllSportsArbitrageOpportunities();
      console.log(`✅ [Arbitrage] Found ${arbitrageData.opportunities.length} arbitrage opportunities across all sports`);
      return res.status(200).json(arbitrageData);
    } else {
      console.log(`🎯 [Arbitrage] Finding opportunities for ${sport}`);
      const arbitrageData = await findArbitrageOpportunities(sport);
      console.log(`✅ [Arbitrage] Found ${arbitrageData.opportunities.length} arbitrage opportunities`);
      return res.status(200).json(arbitrageData);
    }
    
  } catch (error) {
    console.error('❌ [Arbitrage] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to find arbitrage opportunities',
      error: error.message,
      opportunities: []
    });
  }
}

// Find arbitrage across ALL available sports
async function findAllSportsArbitrageOpportunities() {
  const allSports = [
    'NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'MLS', 'UEFA', 'Soccer', 
    'UFC', 'Boxing', 'Tennis', 'Golf', 'Formula1', 'NASCAR', 'Cricket'
  ];
  
  const allOpportunities = [];
  let totalGamesChecked = 0;
  const sportsResults = {};

  console.log(`🌍 [All Sports Arbitrage] Scanning ${allSports.length} sports for opportunities...`);

  // Process sports in parallel for faster results
  const sportsPromises = allSports.map(async (sport) => {
    try {
      const result = await findArbitrageOpportunities(sport);
      sportsResults[sport] = {
        opportunities: result.opportunities.length,
        games_checked: result.total_games_checked || 0
      };
      
      if (result.opportunities.length > 0) {
        console.log(`✅ [${sport}] Found ${result.opportunities.length} arbitrage opportunities`);
        allOpportunities.push(...result.opportunities);
      }
      
      totalGamesChecked += result.total_games_checked || 0;
      return result;
    } catch (error) {
      console.log(`⚠️ [${sport}] Error: ${error.message}`);
      sportsResults[sport] = { opportunities: 0, games_checked: 0, error: error.message };
      return { opportunities: [], total_games_checked: 0 };
    }
  });

  await Promise.all(sportsPromises);

  // Sort all opportunities by profit percentage
  allOpportunities.sort((a, b) => parseFloat(b.profit_percentage) - parseFloat(a.profit_percentage));

  return {
    success: true,
    opportunities: allOpportunities,
    total_games_checked: totalGamesChecked,
    total_opportunities: allOpportunities.length,
    sports_scanned: allSports.length,
    sports_results: sportsResults,
    best_opportunity: allOpportunities[0] || null,
    timestamp: new Date().toISOString(),
    scan_type: 'all_sports'
  };
}

async function findArbitrageOpportunities(sport) {
  try {
    // Step 1: Get upcoming events
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return {
        success: true,
        message: `No upcoming events for ${sport}`,
        opportunities: [],
        total_games_checked: 0,
        sport,
        timestamp: new Date().toISOString()
      };
    }

    // Step 2: Get odds data with multiple sportsbooks
    const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, 'h2h,spreads,totals', false);
    
    if (!oddsData || oddsData.length === 0) {
      return {
        success: true,
        message: `No odds data available for ${sport}`,
        opportunities: [],
        total_games_checked: 0,
        sport,
        timestamp: new Date().toISOString()
      };
    }

    // Step 3: Analyze for arbitrage opportunities
    const opportunities = [];
    
    for (const game of oddsData) {
      if (!game.bookmakers || game.bookmakers.length < 2) continue;
      
      // Check H2H markets for arbitrage
      const h2hArbs = findH2HArbitrage(game);
      opportunities.push(...h2hArbs);
      
      // Check spread markets for arbitrage
      const spreadArbs = findSpreadArbitrage(game);
      opportunities.push(...spreadArbs);
      
      // Check totals markets for arbitrage
      const totalsArbs = findTotalsArbitrage(game);
      opportunities.push(...totalsArbs);
    }

    // Sort by profit percentage (highest first)
    opportunities.sort((a, b) => parseFloat(b.profit_percentage) - parseFloat(a.profit_percentage));

    return {
      success: true,
      opportunities,
      total_games_checked: oddsData.length,
      total_opportunities: opportunities.length,
      sport,
      timestamp: new Date().toISOString(),
      best_opportunity: opportunities[0] || null
    };

  } catch (error) {
    console.error('Error in findArbitrageOpportunities:', error);
    throw error;
  }
}

function findH2HArbitrage(game) {
  const opportunities = [];
  
  // Get all H2H markets
  const h2hBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === 'h2h')
  );
  
  if (h2hBooks.length < 2) return opportunities;
  
  // Collect all odds
  const allOdds = [];
  h2hBooks.forEach(book => {
    const h2hMarket = book.markets.find(m => m.key === 'h2h');
    if (h2hMarket?.outcomes) {
      h2hMarket.outcomes.forEach(outcome => {
        const decimal = convertToDecimal(outcome.price);
        allOdds.push({
          sportsbook: book.title,
          selection: outcome.name,
          american_odds: outcome.price,
          decimal_odds: decimal,
          implied_prob: 1 / decimal
        });
      });
    }
  });
  
  // Find best odds for each outcome
  const outcomes = [...new Set(allOdds.map(o => o.selection))];
  
  if (outcomes.length >= 2) {
    const bestOdds = outcomes.map(outcome => {
      const outcomeOdds = allOdds.filter(o => o.selection === outcome);
      return outcomeOdds.reduce((best, current) => 
        current.decimal_odds > best.decimal_odds ? current : best
      );
    });
    
    // Calculate total implied probability
    const totalImpliedProb = bestOdds.reduce((sum, odd) => sum + odd.implied_prob, 0);
    
    if (totalImpliedProb < 1) {
      // Arbitrage opportunity found!
      const profitMargin = ((1 - totalImpliedProb) * 100);
      
      opportunities.push({
        id: `${game.id || game.away_team + game.home_team}_h2h_${Date.now()}`,
        sport: game.sport || 'Unknown',
        game_id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        market_type: 'h2h',
        market_display: 'Moneyline',
        commence_time: game.commence_time,
        legs: bestOdds.map(odd => ({
          sportsbook: odd.sportsbook,
          selection: odd.selection,
          american_odds: odd.american_odds,
          decimal_odds: odd.decimal_odds.toFixed(3),
          implied_prob: (odd.implied_prob * 100).toFixed(2) + '%'
        })),
        profit_percentage: profitMargin.toFixed(2),
        total_implied_prob: (totalImpliedProb * 100).toFixed(2) + '%',
        investment_needed: 100, // Base calculation
        guaranteed_profit: profitMargin.toFixed(2),
        stake_distribution: calculateOptimalStakes(bestOdds, 100),
        risk_level: 'Low',
        time_sensitivity: 'High'
      });
    }
  }
  
  return opportunities;
}

function findSpreadArbitrage(game) {
  const opportunities = [];
  
  // Similar logic for spread markets
  const spreadBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === 'spreads')
  );
  
  if (spreadBooks.length < 2) return opportunities;
  
  // Group by point spread and find arbitrage
  const spreadGroups = {};
  
  spreadBooks.forEach(book => {
    const spreadMarket = book.markets.find(m => m.key === 'spreads');
    if (spreadMarket?.outcomes) {
      spreadMarket.outcomes.forEach(outcome => {
        const point = outcome.point;
        if (!spreadGroups[point]) spreadGroups[point] = [];
        
        spreadGroups[point].push({
          sportsbook: book.title,
          selection: outcome.name,
          point: outcome.point,
          american_odds: outcome.price,
          decimal_odds: convertToDecimal(outcome.price),
          implied_prob: 1 / convertToDecimal(outcome.price)
        });
      });
    }
  });
  
  // Check each spread group for arbitrage
  Object.keys(spreadGroups).forEach(point => {
    const spreadOdds = spreadGroups[point];
    if (spreadOdds.length < 2) return;
    
    // Find best odds for each side
    const sides = [...new Set(spreadOdds.map(o => o.selection))];
    if (sides.length >= 2) {
      const bestOdds = sides.map(side => {
        const sideOdds = spreadOdds.filter(o => o.selection === side);
        return sideOdds.reduce((best, current) => 
          current.decimal_odds > best.decimal_odds ? current : best
        );
      });
      
      const totalImpliedProb = bestOdds.reduce((sum, odd) => sum + odd.implied_prob, 0);
      
      if (totalImpliedProb < 1) {
        const profitMargin = ((1 - totalImpliedProb) * 100);
        
        opportunities.push({
          id: `${game.id || game.away_team + game.home_team}_spread_${point}_${Date.now()}`,
          sport: game.sport || 'Unknown',
          game_id: game.id,
          matchup: `${game.away_team} @ ${game.home_team}`,
          market_type: 'spreads',
          market_display: `Point Spread (${point})`,
          commence_time: game.commence_time,
          legs: bestOdds.map(odd => ({
            sportsbook: odd.sportsbook,
            selection: `${odd.selection} ${odd.point > 0 ? '+' : ''}${odd.point}`,
            american_odds: odd.american_odds,
            decimal_odds: odd.decimal_odds.toFixed(3),
            implied_prob: (odd.implied_prob * 100).toFixed(2) + '%'
          })),
          profit_percentage: profitMargin.toFixed(2),
          total_implied_prob: (totalImpliedProb * 100).toFixed(2) + '%',
          investment_needed: 100,
          guaranteed_profit: profitMargin.toFixed(2),
          stake_distribution: calculateOptimalStakes(bestOdds, 100),
          risk_level: 'Low',
          time_sensitivity: 'High'
        });
      }
    }
  });
  
  return opportunities;
}

function findTotalsArbitrage(game) {
  const opportunities = [];
  
  const totalsBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === 'totals')
  );
  
  if (totalsBooks.length < 2) return opportunities;
  
  // Group by total point value
  const totalsGroups = {};
  
  totalsBooks.forEach(book => {
    const totalsMarket = book.markets.find(m => m.key === 'totals');
    if (totalsMarket?.outcomes) {
      totalsMarket.outcomes.forEach(outcome => {
        const point = outcome.point;
        if (!totalsGroups[point]) totalsGroups[point] = [];
        
        totalsGroups[point].push({
          sportsbook: book.title,
          selection: outcome.name, // "Over" or "Under"
          point: outcome.point,
          american_odds: outcome.price,
          decimal_odds: convertToDecimal(outcome.price),
          implied_prob: 1 / convertToDecimal(outcome.price)
        });
      });
    }
  });
  
  // Check each totals group for arbitrage
  Object.keys(totalsGroups).forEach(point => {
    const totalsOdds = totalsGroups[point];
    if (totalsOdds.length < 2) return;
    
    // Find best odds for Over and Under
    const overOdds = totalsOdds.filter(o => o.selection === 'Over');
    const underOdds = totalsOdds.filter(o => o.selection === 'Under');
    
    if (overOdds.length > 0 && underOdds.length > 0) {
      const bestOver = overOdds.reduce((best, current) => 
        current.decimal_odds > best.decimal_odds ? current : best
      );
      const bestUnder = underOdds.reduce((best, current) => 
        current.decimal_odds > best.decimal_odds ? current : best
      );
      
      const totalImpliedProb = bestOver.implied_prob + bestUnder.implied_prob;
      
      if (totalImpliedProb < 1) {
        const profitMargin = ((1 - totalImpliedProb) * 100);
        
        opportunities.push({
          id: `${game.id || game.away_team + game.home_team}_totals_${point}_${Date.now()}`,
          sport: game.sport || 'Unknown',
          game_id: game.id,
          matchup: `${game.away_team} @ ${game.home_team}`,
          market_type: 'totals',
          market_display: `Total Points (${point})`,
          commence_time: game.commence_time,
          legs: [bestOver, bestUnder].map(odd => ({
            sportsbook: odd.sportsbook,
            selection: `${odd.selection} ${odd.point}`,
            american_odds: odd.american_odds,
            decimal_odds: odd.decimal_odds.toFixed(3),
            implied_prob: (odd.implied_prob * 100).toFixed(2) + '%'
          })),
          profit_percentage: profitMargin.toFixed(2),
          total_implied_prob: (totalImpliedProb * 100).toFixed(2) + '%',
          investment_needed: 100,
          guaranteed_profit: profitMargin.toFixed(2),
          stake_distribution: calculateOptimalStakes([bestOver, bestUnder], 100),
          risk_level: 'Low',
          time_sensitivity: 'High'
        });
      }
    }
  });
  
  return opportunities;
}

// Helper functions
function convertToDecimal(americanOdds) {
  return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
}

function calculateOptimalStakes(bestOdds, totalStake) {
  const totalImpliedProb = bestOdds.reduce((sum, odd) => sum + (1 / odd.decimal_odds), 0);
  
  return bestOdds.map(odd => {
    const stake = (totalStake / odd.decimal_odds) / totalImpliedProb;
    return {
      sportsbook: odd.sportsbook,
      selection: odd.selection,
      stake: `$${stake.toFixed(2)}`,
      payout: `$${(stake * odd.decimal_odds).toFixed(2)}`
    };
  });
}