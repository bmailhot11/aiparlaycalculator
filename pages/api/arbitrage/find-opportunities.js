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

    // Step 2: Get odds data with ALL markets and maximum sportsbook coverage
    const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, 'h2h,spreads,totals,player_points,player_rebounds,player_assists,player_threes,player_combos,player_receptions,player_rushing_yards,player_passing_yards,alternate_spreads,alternate_totals', true);
    
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
      
      // Check ALL available markets for arbitrage
      const allMarketArbs = findAllMarketArbitrage(game);
      opportunities.push(...allMarketArbs);
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

function findAllMarketArbitrage(game) {
  const opportunities = [];
  
  if (!game.bookmakers || game.bookmakers.length < 2) return opportunities;
  
  // Process all available markets
  const allMarkets = new Set();
  game.bookmakers.forEach(book => {
    book.markets?.forEach(market => allMarkets.add(market.key));
  });
  
  console.log(`🎯 [Arbitrage] Checking ${allMarkets.size} markets for ${game.away_team} @ ${game.home_team}`);
  
  for (const marketKey of allMarkets) {
    const marketOpportunities = findMarketArbitrage(game, marketKey);
    opportunities.push(...marketOpportunities);
  }
  
  return opportunities;
}

function findMarketArbitrage(game, marketKey) {
  const opportunities = [];
  
  // Get all bookmakers with this market
  const marketBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === marketKey)
  );
  
  if (marketBooks.length < 2) return opportunities;
  
  // Handle different market types
  if (marketKey === 'h2h') {
    return findTwoWayMarketArbitrage(game, marketKey, 'Moneyline');
  } else if (marketKey === 'spreads') {
    return findPointMarketArbitrage(game, marketKey, 'Point Spread');
  } else if (marketKey === 'totals') {
    return findPointMarketArbitrage(game, marketKey, 'Total Points');
  } else if (marketKey.includes('alternate_')) {
    return findPointMarketArbitrage(game, marketKey, `Alternate ${marketKey.replace('alternate_', '').replace('_', ' ')}`);
  } else if (marketKey.startsWith('player_')) {
    return findPlayerPropArbitrage(game, marketKey);
  } else {
    // Generic two-way market handling
    return findTwoWayMarketArbitrage(game, marketKey, marketKey.replace('_', ' ').toUpperCase());
  }
}

function findTwoWayMarketArbitrage(game, marketKey, displayName) {
  const opportunities = [];
  
  const marketBooks = game.bookmakers.filter(book => 
    book.markets?.some(market => market.key === marketKey)
  );
  
  // Collect all odds
  const allOdds = [];
  marketBooks.forEach(book => {
    const market = book.markets.find(m => m.key === marketKey);
    if (market?.outcomes) {
      market.outcomes.forEach(outcome => {
        const decimal = convertToDecimal(outcome.price);
        allOdds.push({
          sportsbook: book.title,
          selection: outcome.name,
          point: outcome.point,
          american_odds: outcome.price,
          decimal_odds: decimal,
          implied_prob: 1 / decimal
        });
      });
    }
  });
  
  // For spreads/totals: Group by point AND ensure opposite selections
  // For other markets: Group all and find opposing outcomes
  if (marketKey === 'spreads') {
    return findSpreadArbitrageFixed(allOdds, game, marketKey, displayName);
  } else if (marketKey === 'totals') {
    return findTotalsArbitrageFixed(allOdds, game, marketKey, displayName);
  } else {
    // Regular two-way markets (h2h, props, etc.)
    const uniqueOutcomes = [...new Set(allOdds.map(o => o.selection))];
    
    if (uniqueOutcomes.length >= 2) {
      const bestOdds = uniqueOutcomes.map(outcome => {
        const outcomeOdds = allOdds.filter(o => o.selection === outcome);
        return outcomeOdds.reduce((best, current) => 
          current.decimal_odds > best.decimal_odds ? current : best
        );
      });
      
      // Filter out unrealistic odds (likely stale/suspended markets)
      const maxRealisticOdds = 50.0;
      if (bestOdds.some(odd => odd.decimal_odds > maxRealisticOdds)) return opportunities;
      
      const totalImpliedProb = bestOdds.reduce((sum, odd) => sum + odd.implied_prob, 0);
      
      // Filter out unrealistic arbitrage margins (>20% profit is suspicious)
      const profitMargin = ((1 - totalImpliedProb) * 100);
      if (profitMargin > 20) return opportunities;
      
      if (totalImpliedProb < 1) {
        const profitMargin = ((1 - totalImpliedProb) * 100);
        
        // Calculate proper stake distribution using the formula
        const T = 100; // Total stake
        const d1 = bestOdds[0].decimal_odds;
        const d2 = bestOdds[1].decimal_odds;
        const s1 = (T * d2) / (d1 + d2);
        const s2 = (T * d1) / (d1 + d2);
        const guaranteedProfit = T * ((d1 * d2) / (d1 + d2) - 1);
        
        opportunities.push({
          id: `${game.id || game.away_team + game.home_team}_${marketKey}_${Date.now()}`,
          sport: game.sport || 'Unknown',
          game_id: game.id,
          matchup: `${game.away_team} @ ${game.home_team}`,
          market_type: marketKey,
          market_display: displayName,
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
          investment_needed: T,
          guaranteed_profit: guaranteedProfit.toFixed(2),
          stake_distribution: [
            {
              sportsbook: bestOdds[0].sportsbook,
              selection: bestOdds[0].selection,
              stake: `$${s1.toFixed(2)}`,
              payout: `$${(s1 * d1).toFixed(2)}`
            },
            {
              sportsbook: bestOdds[1].sportsbook,
              selection: bestOdds[1].selection,
              stake: `$${s2.toFixed(2)}`,
              payout: `$${(s2 * d2).toFixed(2)}`
            }
          ],
          risk_level: 'Low',
          time_sensitivity: 'High'
        });
      }
    }
  }
  
  return opportunities;
}

function findPointMarketArbitrage(game, marketKey, displayName) {
  return findTwoWayMarketArbitrage(game, marketKey, displayName);
}

function findPlayerPropArbitrage(game, marketKey) {
  const propName = marketKey.replace('player_', '').replace('_', ' ').toUpperCase();
  return findTwoWayMarketArbitrage(game, marketKey, `Player ${propName}`);
}

function findSpreadArbitrageFixed(allOdds, game, marketKey, displayName) {
  const opportunities = [];
  
  // For spread arbitrage, we need to check ALL possible pairs for the arbitrage formula
  // Line differences don't matter - only the math: 1/d1 + 1/d2 < 1
  
  for (let i = 0; i < allOdds.length; i++) {
    for (let j = i + 1; j < allOdds.length; j++) {
      const odd1 = allOdds[i];
      const odd2 = allOdds[j];
      
      // Ensure different teams (no betting same team on both sides)
      if (odd1.selection === odd2.selection) continue;
      
      // Filter out unrealistic odds (likely stale/suspended markets)
      const maxRealisticOdds = 50.0; // Decimal odds above 50 (4900% return) are likely stale
      if (odd1.decimal_odds > maxRealisticOdds || odd2.decimal_odds > maxRealisticOdds) continue;
      
      // Apply the ONLY test that matters: arbitrage formula
      const totalImpliedProb = odd1.implied_prob + odd2.implied_prob;
      
      // Filter out unrealistic arbitrage margins (>20% profit is suspicious)
      const profitMargin = ((1 - totalImpliedProb) * 100);
      if (profitMargin > 20) continue;
      
      if (totalImpliedProb < 1) {
        const profitMargin = ((1 - totalImpliedProb) * 100);
        
        // Calculate proper stake distribution using the formula
        const T = 100; // Total stake
        const d1 = odd1.decimal_odds;
        const d2 = odd2.decimal_odds;
        const s1 = (T * d2) / (d1 + d2);
        const s2 = (T * d1) / (d1 + d2);
        const guaranteedProfit = T * ((d1 * d2) / (d1 + d2) - 1);
        
        opportunities.push({
          id: `${game.id || game.away_team + game.home_team}_${marketKey}_${odd1.point}_${odd2.point}_${Date.now()}`,
          sport: game.sport || 'Unknown',
          game_id: game.id,
          matchup: `${game.away_team} @ ${game.home_team}`,
          market_type: marketKey,
          market_display: `${displayName} (${odd1.point}/${odd2.point})`,
          commence_time: game.commence_time,
          legs: [
            {
              sportsbook: odd1.sportsbook,
              selection: `${odd1.selection} ${odd1.point > 0 ? '+' : ''}${odd1.point}`,
              american_odds: odd1.american_odds,
              decimal_odds: odd1.decimal_odds.toFixed(3),
              implied_prob: (odd1.implied_prob * 100).toFixed(2) + '%'
            },
            {
              sportsbook: odd2.sportsbook,
              selection: `${odd2.selection} ${odd2.point > 0 ? '+' : ''}${odd2.point}`,
              american_odds: odd2.american_odds,
              decimal_odds: odd2.decimal_odds.toFixed(3),
              implied_prob: (odd2.implied_prob * 100).toFixed(2) + '%'
            }
          ],
          profit_percentage: profitMargin.toFixed(2),
          total_implied_prob: (totalImpliedProb * 100).toFixed(2) + '%',
          investment_needed: T,
          guaranteed_profit: guaranteedProfit.toFixed(2),
          stake_distribution: [
            {
              sportsbook: odd1.sportsbook,
              selection: odd1.selection,
              stake: `$${s1.toFixed(2)}`,
              payout: `$${(s1 * d1).toFixed(2)}`
            },
            {
              sportsbook: odd2.sportsbook,
              selection: odd2.selection,
              stake: `$${s2.toFixed(2)}`,
              payout: `$${(s2 * d2).toFixed(2)}`
            }
          ],
          risk_level: 'Low',
          time_sensitivity: 'High'
        });
      }
    }
  }
  
  return opportunities;
}

function findTotalsArbitrageFixed(allOdds, game, marketKey, displayName) {
  const opportunities = [];
  
  // Apply pure arbitrage test: check ALL pairs for 1/d1 + 1/d2 < 1
  for (let i = 0; i < allOdds.length; i++) {
    for (let j = i + 1; j < allOdds.length; j++) {
      const odd1 = allOdds[i];
      const odd2 = allOdds[j];
      
      // Ensure different selections (Over vs Under, not Over vs Over)
      if (odd1.selection === odd2.selection) continue;
      
      // Filter out unrealistic odds (likely stale/suspended markets)
      const maxRealisticOdds = 50.0;
      if (odd1.decimal_odds > maxRealisticOdds || odd2.decimal_odds > maxRealisticOdds) continue;
      
      // Apply the arbitrage formula
      const totalImpliedProb = odd1.implied_prob + odd2.implied_prob;
      
      // Filter out unrealistic arbitrage margins (>20% profit is suspicious)
      const profitMargin = ((1 - totalImpliedProb) * 100);
      if (profitMargin > 20) continue;
      
      if (totalImpliedProb < 1) {
        const profitMargin = ((1 - totalImpliedProb) * 100);
        
        // Calculate proper stake distribution
        const T = 100;
        const d1 = odd1.decimal_odds;
        const d2 = odd2.decimal_odds;
        const s1 = (T * d2) / (d1 + d2);
        const s2 = (T * d1) / (d1 + d2);
        const guaranteedProfit = T * ((d1 * d2) / (d1 + d2) - 1);
        
        opportunities.push({
          id: `${game.id || game.away_team + game.home_team}_${marketKey}_${odd1.point}_${odd2.point}_${Date.now()}`,
          sport: game.sport || 'Unknown',
          game_id: game.id,
          matchup: `${game.away_team} @ ${game.home_team}`,
          market_type: marketKey,
          market_display: `${displayName} (${odd1.point}/${odd2.point})`,
          commence_time: game.commence_time,
          legs: [
            {
              sportsbook: odd1.sportsbook,
              selection: `${odd1.selection} ${odd1.point}`,
              american_odds: odd1.american_odds,
              decimal_odds: odd1.decimal_odds.toFixed(3),
              implied_prob: (odd1.implied_prob * 100).toFixed(2) + '%'
            },
            {
              sportsbook: odd2.sportsbook,
              selection: `${odd2.selection} ${odd2.point}`,
              american_odds: odd2.american_odds,
              decimal_odds: odd2.decimal_odds.toFixed(3),
              implied_prob: (odd2.implied_prob * 100).toFixed(2) + '%'
            }
          ],
          profit_percentage: profitMargin.toFixed(2),
          total_implied_prob: (totalImpliedProb * 100).toFixed(2) + '%',
          investment_needed: T,
          guaranteed_profit: guaranteedProfit.toFixed(2),
          stake_distribution: [
            {
              sportsbook: odd1.sportsbook,
              selection: odd1.selection,
              stake: `$${s1.toFixed(2)}`,
              payout: `$${(s1 * d1).toFixed(2)}`
            },
            {
              sportsbook: odd2.sportsbook,
              selection: odd2.selection,
              stake: `$${s2.toFixed(2)}`,
              payout: `$${(s2 * d2).toFixed(2)}`
            }
          ],
          risk_level: 'Low',
          time_sensitivity: 'High'
        });
      }
    }
  }
  
  return opportunities;
}

// Helper functions
function convertToDecimal(americanOdds) {
  const odds = parseInt(americanOdds.toString().replace('+', ''));
  return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
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