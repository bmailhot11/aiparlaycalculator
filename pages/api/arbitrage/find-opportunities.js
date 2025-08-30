// Enhanced Arbitrage Finder API
const eventsCache = require('../../../lib/events-cache.js');
const { findStrictArbitrage } = require('../../../lib/strict-arbitrage-detector.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, includeAllSports = true, maxResults = 1000 } = req.body;

  try {
    if (includeAllSports || !sport) {
      console.log(`🎯 [Arbitrage] Finding opportunities across ALL SPORTS (max ${maxResults})`);
      const arbitrageData = await findAllSportsArbitrageOpportunities(maxResults);
      console.log(`✅ [Arbitrage] Found ${arbitrageData.opportunities.length} arbitrage opportunities across all sports`);
      return res.status(200).json(arbitrageData);
    } else {
      console.log(`🎯 [Arbitrage] Finding opportunities for ${sport} (max ${maxResults})`);
      const arbitrageData = await findArbitrageOpportunities(sport, maxResults);
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

// Find arbitrage across major sports only to prevent timeouts
async function findAllSportsArbitrageOpportunities(maxResults = 1000) {
  // Limit to major active sports to prevent timeout
  const allSports = [
    'NBA', 'NFL', 'NHL', 'MLB', 'NCAAB', 'Soccer'
  ];
  
  const allOpportunities = [];
  let totalGamesChecked = 0;
  const sportsResults = {};

  console.log(`🌍 [All Sports Arbitrage] Scanning ${allSports.length} sports for opportunities...`);

  // Process sports sequentially to prevent overwhelming the API
  for (const sport of allSports) {
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
      
      // Early exit if we found enough opportunities
      if (allOpportunities.length >= maxResults) {
        console.log(`🎯 Early exit: Found ${allOpportunities.length} opportunities, stopping scan`);
        break;
      }
    } catch (error) {
      console.log(`⚠️ [${sport}] Error: ${error.message}`);
      sportsResults[sport] = { opportunities: 0, games_checked: 0, error: error.message };
    }
  }

  // Sort all opportunities by profit percentage
  allOpportunities.sort((a, b) => parseFloat(b.profit_percentage) - parseFloat(a.profit_percentage));

  // Limit results to prevent huge responses
  const limitedOpportunities = allOpportunities.slice(0, maxResults);

  return {
    success: true,
    opportunities: limitedOpportunities,
    total_games_checked: totalGamesChecked,
    total_opportunities: allOpportunities.length,
    returned_opportunities: limitedOpportunities.length,
    sports_scanned: allSports.length,
    sports_results: sportsResults,
    best_opportunity: allOpportunities[0] || null,
    timestamp: new Date().toISOString(),
    scan_type: 'all_sports'
  };
}

async function findArbitrageOpportunities(sport, maxResults = 1000) {
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

    // Return all opportunities (no artificial limits)
    const limitedOpportunities = opportunities; // Remove slice limit

    return {
      success: true,
      opportunities: limitedOpportunities,
      total_games_checked: oddsData.length,
      total_opportunities: opportunities.length,
      returned_opportunities: limitedOpportunities.length,
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

// Old function kept for backward compatibility - now delegates to strict detector
function findMarketArbitrage(game, marketKey) {
  const displayName = getMarketDisplayName(marketKey);
  return findStrictArbitrage(game, marketKey, displayName);
}

// Legacy functions removed - now using strict arbitrage detector

// Old spread arbitrage function - replaced by strict detector
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
function toDecimal(american) {
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

function convertToDecimal(americanOdds) {
  return toDecimal(americanOdds);
}

function getMarketDisplayName(marketKey) {
  const displayNames = {
    'h2h': 'Moneyline',
    'spreads': 'Point Spread',
    'totals': 'Over/Under',
    // NFL markets
    'player_pass_tds': 'Passing TDs',
    'player_pass_yds': 'Passing Yards',
    'player_rush_yds': 'Rushing Yards',
    'player_rush_tds': 'Rushing TDs',
    'player_receptions': 'Receptions',
    'player_reception_yds': 'Receiving Yards',
    'player_reception_tds': 'Receiving TDs',
    // NBA markets
    'player_points': 'Points',
    'player_rebounds': 'Rebounds',
    'player_assists': 'Assists',
    'player_threes': '3-Pointers Made',
    'player_blocks': 'Blocks',
    'player_steals': 'Steals',
    // NHL markets
    'player_goals': 'Goals',
    'player_shots_on_goal': 'Shots on Goal',
    // MLB markets (corrected to batter_)
    'batter_hits': 'Hits',
    'batter_home_runs': 'Home Runs',
    'batter_rbis': 'RBIs',
    'batter_total_bases': 'Total Bases',
    'pitcher_strikeouts': 'Strikeouts'
  };
  
  return displayNames[marketKey] || marketKey;
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

