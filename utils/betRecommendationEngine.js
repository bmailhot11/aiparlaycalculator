// Bet Recommendation Engine for Daily Picks System

import { 
  calculateFairOdds, 
  calculateEdge, 
  findBestOdds, 
  calculateParlayOdds,
  calculateParlayEdge,
  meetsEdgeThreshold,
  americanToDecimal
} from './oddsCalculations.js';

/**
 * Main engine to generate daily recommendations
 */
export async function generateDailyRecommendations(oddsData, publishTime) {
  console.log(`🎯 Generating daily recommendations for ${publishTime}`);
  
  const recommendations = {
    single: null,
    parlay2: null,
    parlay4: null,
    noBetReason: null,
    metadata: {
      totalGamesAnalyzed: 0,
      totalOpportunitiesFound: 0,
      publishTime,
      analysisTime: new Date().toISOString()
    }
  };
  
  try {
    // Filter and prepare betting opportunities
    const opportunities = await identifyBettingOpportunities(oddsData, publishTime);
    recommendations.metadata.totalGamesAnalyzed = oddsData.length;
    recommendations.metadata.totalOpportunitiesFound = opportunities.length;
    
    console.log(`📊 Found ${opportunities.length} qualifying betting opportunities`);
    
    if (opportunities.length === 0) {
      recommendations.noBetReason = "No qualifying edges found across all sports. Minimum thresholds: 2% for singles, 3.5% for parlays.";
      return recommendations;
    }
    
    // Generate best single bet
    recommendations.single = findBestSingle(opportunities);
    
    // Generate best 2-leg parlay
    recommendations.parlay2 = findBestParlay(opportunities, 2);
    
    // Generate best 4-leg parlay  
    recommendations.parlay4 = findBestParlay(opportunities, 4);
    
    // If no qualifying bets found, set no bet reason
    if (!recommendations.single && !recommendations.parlay2 && !recommendations.parlay4) {
      recommendations.noBetReason = "No bets met minimum edge requirements after filtering constraints.";
    }
    
    console.log(`✅ Generated recommendations - Single: ${recommendations.single ? 'YES' : 'NO'}, 2-leg: ${recommendations.parlay2 ? 'YES' : 'NO'}, 4-leg: ${recommendations.parlay4 ? 'YES' : 'NO'}`);
    
    return recommendations;
    
  } catch (error) {
    console.error('🚨 Error generating recommendations:', error);
    recommendations.noBetReason = `Analysis error: ${error.message}`;
    return recommendations;
  }
}

/**
 * Identify all qualifying betting opportunities from odds data
 */
async function identifyBettingOpportunities(oddsData, publishTime) {
  const opportunities = [];
  const publishDate = new Date(publishTime);
  const usedTeams = new Set(); // Track teams to enforce one leg per team rule
  
  for (const game of oddsData) {
    try {
      // Skip games that start less than 2 hours after publish time
      const gameTime = new Date(game.commence_time);
      const hoursUntilStart = (gameTime - publishDate) / (1000 * 60 * 60);
      
      if (hoursUntilStart < 2) {
        console.log(`⏰ Skipping ${game.home_team} vs ${game.away_team} - starts in ${hoursUntilStart.toFixed(1)} hours`);
        continue;
      }
      
      // Skip if we already have a leg from either team
      if (usedTeams.has(game.home_team) || usedTeams.has(game.away_team)) {
        continue;
      }
      
      // Analyze all markets for this game
      const gameOpportunities = await analyzeGameMarkets(game);
      
      // Filter opportunities that meet edge thresholds
      const qualifyingOpportunities = gameOpportunities.filter(opp => {
        const meetsThreshold = meetsEdgeThreshold(opp.edgePercentage, 'parlay'); // Use parlay threshold (higher)
        if (meetsThreshold) {
          usedTeams.add(game.home_team);
          usedTeams.add(game.away_team);
        }
        return meetsThreshold;
      });
      
      opportunities.push(...qualifyingOpportunities);
      
    } catch (error) {
      console.error(`Error analyzing game ${game.home_team} vs ${game.away_team}:`, error);
    }
  }
  
  // Sort opportunities by edge percentage (highest first)
  opportunities.sort((a, b) => b.edgePercentage - a.edgePercentage);
  
  console.log(`🔍 Found ${opportunities.length} opportunities meeting thresholds`);
  return opportunities;
}

/**
 * Analyze all betting markets for a single game
 */
async function analyzeGameMarkets(game) {
  const opportunities = [];
  
  if (!game.bookmakers || game.bookmakers.length < 3) {
    return opportunities; // Need at least 3 books for reliable fair odds
  }
  
  // Analyze each market type
  for (const bookmaker of game.bookmakers) {
    if (!bookmaker.markets) continue;
    
    for (const market of bookmaker.markets) {
      try {
        const marketOpportunities = await analyzeMarket(game, market);
        opportunities.push(...marketOpportunities);
      } catch (error) {
        console.error(`Error analyzing ${market.key} market:`, error);
      }
    }
  }
  
  // Deduplicate opportunities (same selection from multiple books)
  const uniqueOpportunities = deduplicateOpportunities(opportunities);
  
  return uniqueOpportunities;
}

/**
 * Analyze a specific market and return opportunities
 */
async function analyzeMarket(game, market) {
  const opportunities = [];
  
  // Reconstruct full market data for fair odds calculation
  const marketData = {
    game_id: game.id,
    sport: game.sport_title,
    home_team: game.home_team,
    away_team: game.away_team,
    commence_time: game.commence_time,
    bookmakers: game.bookmakers.filter(book => 
      book.markets.some(m => m.key === market.key)
    )
  };
  
  // Analyze each outcome in the market
  if (market.outcomes) {
    for (const outcome of market.outcomes) {
      try {
        // Calculate fair odds for this selection
        const fairOdds = calculateFairOdds(marketData, outcome.name);
        
        // Find best odds across all books for this selection
        const bestOdds = findBestOdds(marketData, outcome.name);
        
        if (bestOdds.odds && fairOdds.fairDecimalOdds) {
          // Calculate edge
          const edge = calculateEdge(bestOdds.odds, fairOdds);
          
          const opportunity = {
            gameId: game.id,
            sport: game.sport_title,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            commenceTime: game.commence_time,
            
            marketType: market.key,
            selection: outcome.name,
            selectionKey: normalizeSelectionKey(outcome.name),
            
            bestSportsbook: bestOdds.sportsbook,
            bestOdds: bestOdds.odds,
            decimalOdds: bestOdds.decimal,
            
            fairOdds: fairOdds.fairDecimalOdds,
            fairAmericanOdds: fairOdds.fairAmericanOdds,
            impliedProbability: fairOdds.impliedProbability,
            edgePercentage: edge.edgePercentage,
            
            pinnacleOdds: fairOdds.pinnacleOdds || null,
            calculationMethod: fairOdds.method,
            confidence: fairOdds.confidence,
            
            metadata: {
              totalBooks: marketData.bookmakers.length,
              vigPercentage: fairOdds.vigPercentage || null
            }
          };
          
          opportunities.push(opportunity);
        }
      } catch (error) {
        console.error(`Error analyzing outcome ${outcome.name}:`, error);
      }
    }
  }
  
  return opportunities;
}

/**
 * Remove duplicate opportunities (same selection, keep best odds)
 */
function deduplicateOpportunities(opportunities) {
  const unique = new Map();
  
  opportunities.forEach(opp => {
    const key = `${opp.gameId}-${opp.marketType}-${opp.selectionKey}`;
    
    if (!unique.has(key) || unique.get(key).edgePercentage < opp.edgePercentage) {
      unique.set(key, opp);
    }
  });
  
  return Array.from(unique.values());
}

/**
 * Find the best single bet opportunity
 */
function findBestSingle(opportunities) {
  // Filter for single bet threshold
  const singleCandidates = opportunities.filter(opp => 
    meetsEdgeThreshold(opp.edgePercentage, 'single')
  );
  
  if (singleCandidates.length === 0) return null;
  
  // Return highest edge opportunity
  const bestSingle = singleCandidates[0]; // Already sorted by edge
  
  return {
    type: 'single',
    legs: [bestSingle],
    combinedOdds: bestSingle.bestOdds,
    decimalOdds: bestSingle.decimalOdds,
    edgePercentage: bestSingle.edgePercentage,
    estimatedPayout: calculatePayout(bestSingle.decimalOdds, 100), // Assume $100 bet
    confidence: bestSingle.confidence
  };
}

/**
 * Find the best parlay of specified leg count
 */
function findBestParlay(opportunities, legCount) {
  if (opportunities.length < legCount) return null;
  
  // Use greedy approach: select highest edge opportunities that don't conflict
  const selectedLegs = [];
  const usedGames = new Set();
  const usedTeams = new Set();
  
  for (const opp of opportunities) {
    // Skip if we already have this game or teams involved
    if (usedGames.has(opp.gameId) || 
        usedTeams.has(opp.homeTeam) || 
        usedTeams.has(opp.awayTeam)) {
      continue;
    }
    
    // Check if leg meets parlay edge threshold
    if (!meetsEdgeThreshold(opp.edgePercentage, 'parlay')) {
      continue;
    }
    
    selectedLegs.push(opp);
    usedGames.add(opp.gameId);
    usedTeams.add(opp.homeTeam);
    usedTeams.add(opp.awayTeam);
    
    if (selectedLegs.length === legCount) break;
  }
  
  if (selectedLegs.length < legCount) return null;
  
  // Calculate combined parlay odds and edge
  const parlayOdds = calculateParlayOdds(selectedLegs);
  const parlayEdge = calculateParlayEdge(selectedLegs);
  
  return {
    type: `parlay${legCount}`,
    legs: selectedLegs,
    combinedOdds: parlayOdds.american,
    decimalOdds: parlayOdds.decimal,
    edgePercentage: parlayEdge,
    estimatedPayout: calculatePayout(parlayOdds.decimal, 100), // Assume $100 bet
    confidence: Math.min(...selectedLegs.map(leg => leg.confidence)) // Lowest confidence of legs
  };
}

/**
 * Calculate payout for given odds and stake
 */
function calculatePayout(decimalOdds, stake) {
  return (decimalOdds * stake) - stake; // Profit only
}

/**
 * Normalize selection key for consistent identification
 */
function normalizeSelectionKey(selection) {
  return selection
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, ''); // Keep only word chars, dots, and dashes
}

/**
 * Validate recommendations before publishing
 */
export function validateRecommendations(recommendations) {
  const errors = [];
  
  // Check single bet
  if (recommendations.single) {
    if (!meetsEdgeThreshold(recommendations.single.edgePercentage, 'single')) {
      errors.push('Single bet does not meet minimum 2% edge threshold');
    }
  }
  
  // Check parlays
  ['parlay2', 'parlay4'].forEach(parlayType => {
    const parlay = recommendations[parlayType];
    if (parlay) {
      // Check each leg meets parlay threshold
      parlay.legs.forEach((leg, index) => {
        if (!meetsEdgeThreshold(leg.edgePercentage, 'parlay')) {
          errors.push(`${parlayType} leg ${index + 1} does not meet minimum 3.5% edge threshold`);
        }
      });
      
      // Check no duplicate teams
      const teams = new Set();
      parlay.legs.forEach(leg => {
        if (teams.has(leg.homeTeam) || teams.has(leg.awayTeam)) {
          errors.push(`${parlayType} contains duplicate teams`);
        }
        teams.add(leg.homeTeam);
        teams.add(leg.awayTeam);
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}