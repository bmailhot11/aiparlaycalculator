const Decimal = require('decimal.js-light');
const { normalizeOddsToDecimal, americanToDecimal } = require('./odds-conversion.js');
const { removeVigFromOdds } = require('./vig-removal.js');
const { calculateSingleOutcomeEV } = require('./ev-calculator.js');

/**
 * Find Pinnacle odds for baseline probabilities
 * @param {Array} gameData - Array of games with bookmaker data
 * @returns {Object} - Pinnacle odds by game and market
 */
function extractPinnacleOdds(gameData) {
  const pinnacleOdds = {};
  
  for (const game of gameData) {
    if (!game.bookmakers) continue;
    
    const gameKey = `${game.away_team}_${game.home_team}`;
    const pinnacleBook = game.bookmakers.find(b => 
      b.title?.toLowerCase().includes('pinnacle') || 
      b.key?.toLowerCase().includes('pinnacle')
    );
    
    if (!pinnacleBook || !pinnacleBook.markets) continue;
    
    pinnacleOdds[gameKey] = {};
    
    for (const market of pinnacleBook.markets) {
      const marketOdds = [];
      
      for (const outcome of market.outcomes || []) {
        marketOdds.push({
          name: outcome.name,
          price: outcome.price,
          decimal: americanToDecimal(outcome.price).toNumber(),
          point: outcome.point
        });
      }
      
      if (marketOdds.length > 0) {
        // Calculate no-vig probabilities for this market
        const decimalOdds = marketOdds.map(o => new Decimal(o.decimal));
        const vigData = removeVigFromOdds(decimalOdds);
        
        pinnacleOdds[gameKey][market.key] = {
          outcomes: marketOdds,
          noVigProbabilities: vigData.noVigProbabilities.map(p => p.toNumber()),
          vigPercentage: vigData.vigPercentage.toNumber()
        };
      }
    }
  }
  
  return pinnacleOdds;
}

/**
 * Calculate EV for all available bets using Pinnacle baseline
 * @param {Array} availableBets - Array of all betting options
 * @param {Object} pinnacleOdds - Pinnacle baseline odds
 * @returns {Array} - Bets with EV calculations
 */
function calculateBetEVs(availableBets, pinnacleOdds) {
  const betsWithEV = [];
  
  for (const bet of availableBets) {
    try {
      const gameKey = `${bet.game.split(' @ ')[0]}_${bet.game.split(' @ ')[1]}`;
      const pinnacleMarket = pinnacleOdds[gameKey]?.[bet.market_type];
      
      if (!pinnacleMarket) {
        // No Pinnacle baseline - estimate EV with caution
        bet.expectedValue = estimateEVWithoutPinnacle(bet);
        bet.hasBaseline = false;
        bet.confidence = 'low';
      } else {
        // Find matching outcome in Pinnacle data
        const outcomeIndex = findMatchingOutcomeIndex(
          bet.selection,
          bet.point,
          pinnacleMarket.outcomes
        );
        
        if (outcomeIndex >= 0 && pinnacleMarket.noVigProbabilities[outcomeIndex]) {
          const trueProbability = new Decimal(pinnacleMarket.noVigProbabilities[outcomeIndex]);
          const decimalOdds = new Decimal(bet.decimal_odds);
          const ev = calculateSingleOutcomeEV(trueProbability, decimalOdds);
          
          bet.expectedValue = ev.toNumber();
          bet.trueProbability = trueProbability.toNumber();
          bet.impliedProbability = new Decimal(1).div(decimalOdds).toNumber();
          bet.edgePercentage = ev.mul(100).toNumber();
          bet.hasBaseline = true;
          bet.confidence = getConfidenceLevel(ev.toNumber());
          bet.pinnacleOdds = pinnacleMarket.outcomes[outcomeIndex]?.price;
        } else {
          bet.expectedValue = estimateEVWithoutPinnacle(bet);
          bet.hasBaseline = false;
          bet.confidence = 'low';
        }
      }
      
      betsWithEV.push(bet);
    } catch (error) {
      // If calculation fails, include bet with estimated EV
      bet.expectedValue = estimateEVWithoutPinnacle(bet);
      bet.hasBaseline = false;
      bet.confidence = 'low';
      bet.error = error.message;
      betsWithEV.push(bet);
    }
  }
  
  return betsWithEV;
}

/**
 * Find matching outcome index in Pinnacle data
 */
function findMatchingOutcomeIndex(selection, point, pinnacleOutcomes) {
  for (let i = 0; i < pinnacleOutcomes.length; i++) {
    const outcome = pinnacleOutcomes[i];
    
    // Direct name match
    if (outcome.name === selection) {
      // If point exists, it must match
      if (point !== null && point !== undefined) {
        if (Math.abs(outcome.point - point) < 0.01) {
          return i;
        }
      } else {
        return i;
      }
    }
    
    // Try flexible matching for common variations
    const normalizedSelection = selection.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedOutcome = outcome.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (normalizedSelection === normalizedOutcome) {
      if (point !== null && point !== undefined) {
        if (Math.abs(outcome.point - point) < 0.01) {
          return i;
        }
      } else {
        return i;
      }
    }
  }
  
  return -1;
}

/**
 * Estimate EV when Pinnacle baseline is not available
 */
function estimateEVWithoutPinnacle(bet) {
  const decimalOdds = new Decimal(bet.decimal_odds);
  const impliedProb = new Decimal(1).div(decimalOdds);
  
  // Conservative estimation: assume 3-5% vig
  const estimatedVig = bet.market_type?.includes('player_') ? 0.06 : 0.04;
  const estimatedTrueProb = impliedProb.div(new Decimal(1).plus(estimatedVig));
  
  // Calculate conservative EV
  const ev = calculateSingleOutcomeEV(estimatedTrueProb, decimalOdds);
  
  // Reduce confidence for estimated values
  return ev.mul(0.7).toNumber(); // 30% reduction for uncertainty
}

/**
 * Get confidence level based on EV
 */
function getConfidenceLevel(ev) {
  if (ev > 0.05) return 'high';
  if (ev > 0.02) return 'medium';
  if (ev > 0) return 'low';
  return 'negative';
}

/**
 * Find all positive EV bets
 * @param {Array} gameData - Raw game data from API
 * @param {Object} options - Filtering options
 * @returns {Array} - Sorted array of positive EV bets
 */
function findPositiveEVBets(gameData, options = {}) {
  const {
    minEV = 0.01, // Minimum 1% EV
    maxBets = 50,
    requireBaseline = false,
    sportFilter = null,
    marketFilter = null,
    bookmakerFilter = null
  } = options;
  
  // Extract Pinnacle baseline
  const pinnacleOdds = extractPinnacleOdds(gameData);
  
  // Extract all available bets
  const availableBets = extractAllBets(gameData, { sportFilter, marketFilter, bookmakerFilter });
  
  // Calculate EVs
  const betsWithEV = calculateBetEVs(availableBets, pinnacleOdds);
  
  // Filter positive EV bets
  let positiveEVBets = betsWithEV.filter(bet => {
    if (bet.expectedValue < minEV) return false;
    if (requireBaseline && !bet.hasBaseline) return false;
    return true;
  });
  
  // Sort by EV (highest first)
  positiveEVBets.sort((a, b) => b.expectedValue - a.expectedValue);
  
  // Limit results
  return positiveEVBets.slice(0, maxBets);
}

/**
 * Extract all bets from game data
 */
function extractAllBets(gameData, filters = {}) {
  const bets = [];
  
  for (const game of gameData) {
    if (!game.bookmakers) continue;
    if (filters.sportFilter && game.sport !== filters.sportFilter) continue;
    
    for (const bookmaker of game.bookmakers) {
      if (filters.bookmakerFilter && !filters.bookmakerFilter.includes(bookmaker.title)) continue;
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        if (filters.marketFilter && !filters.marketFilter.includes(market.key)) continue;
        
        for (const outcome of market.outcomes || []) {
          bets.push({
            game: `${game.away_team} @ ${game.home_team}`,
            game_id: `${game.away_team}_${game.home_team}_${game.commence_time}`,
            sportsbook: bookmaker.title,
            market_type: market.key,
            selection: outcome.name,
            point: outcome.point || null,
            odds: outcome.price,
            decimal_odds: americanToDecimal(outcome.price).toNumber(),
            commence_time: game.commence_time,
            sport: game.sport_title || game.sport_key
          });
        }
      }
    }
  }
  
  return bets;
}

/**
 * Build optimal parlay from positive EV bets
 */
function buildOptimalParlay(positiveEVBets, options = {}) {
  const {
    legs = 3,
    maxCorrelation = 0.3,
    requirePlayerProps = false,
    playerPropsRatio = 0.5
  } = options;
  
  // Separate player props and main markets
  const playerProps = positiveEVBets.filter(bet => bet.market_type?.includes('player_'));
  const mainMarkets = positiveEVBets.filter(bet => !bet.market_type?.includes('player_'));
  
  console.log(`🎯 Building parlay: ${playerProps.length} player props, ${mainMarkets.length} main markets available`);
  
  let selectedBets = [];
  const usedGameMarkets = new Set(); // Track game+market combinations to avoid duplicates
  
  if (requirePlayerProps && playerProps.length > 0) {
    const playerPropsNeeded = Math.ceil(legs * playerPropsRatio);
    const mainMarketsNeeded = legs - playerPropsNeeded;
    
    // Select player props avoiding same player/market
    const selectedProps = [];
    const usedPlayers = new Set();
    
    for (const prop of playerProps) {
      if (selectedProps.length >= playerPropsNeeded) break;
      
      // Extract player name from selection (e.g., "Patrick Mahomes Over 2.5 TDs")
      const playerName = prop.selection.split(' ')[0] + ' ' + (prop.selection.split(' ')[1] || '');
      const gameMarketKey = `${prop.game}_${prop.market_type}`;
      
      // Avoid same player or same game+market combo
      if (!usedPlayers.has(playerName) && !usedGameMarkets.has(gameMarketKey)) {
        selectedProps.push(prop);
        usedPlayers.add(playerName);
        usedGameMarkets.add(gameMarketKey);
      }
    }
    
    // Select main markets avoiding games already used
    const selectedMainMarkets = [];
    const usedGames = new Set();
    
    // Extract games from selected props
    selectedProps.forEach(prop => {
      const gameId = prop.game.replace(' @ ', '_');
      usedGames.add(gameId);
    });
    
    for (const bet of mainMarkets) {
      if (selectedMainMarkets.length >= mainMarketsNeeded) break;
      
      const gameId = bet.game.replace(' @ ', '_');
      const gameMarketKey = `${bet.game}_${bet.market_type}_${bet.selection}`;
      
      // Avoid same game or same game+market+selection combo
      if (!usedGames.has(gameId) && !usedGameMarkets.has(gameMarketKey)) {
        selectedMainMarkets.push(bet);
        usedGames.add(gameId);
        usedGameMarkets.add(gameMarketKey);
      }
    }
    
    selectedBets = [...selectedProps, ...selectedMainMarkets];
    console.log(`✅ Selected ${selectedProps.length} player props + ${selectedMainMarkets.length} main markets`);
    
  } else {
    // Select highest EV bets avoiding same game+market combos
    const usedGames = new Set();
    
    for (const bet of positiveEVBets) {
      if (selectedBets.length >= legs) break;
      
      const gameId = bet.game.replace(' @ ', '_');
      const gameMarketKey = `${bet.game}_${bet.market_type}_${bet.selection}`;
      
      // For main markets, avoid same game entirely
      // For props, allow same game but different markets
      const isPlayerProp = bet.market_type?.includes('player_');
      const shouldSkip = isPlayerProp 
        ? usedGameMarkets.has(gameMarketKey)
        : usedGames.has(gameId);
      
      if (!shouldSkip) {
        selectedBets.push(bet);
        usedGames.add(gameId);
        usedGameMarkets.add(gameMarketKey);
      }
    }
  }
  
  // Calculate parlay metrics
  const parlayDecimalOdds = selectedBets.reduce((acc, bet) => 
    acc.mul(new Decimal(bet.decimal_odds)), new Decimal(1)
  );
  
  const parlayTrueProbability = selectedBets.reduce((acc, bet) => 
    acc.mul(new Decimal(bet.trueProbability || 0.5)), new Decimal(1)
  );
  
  const parlayEV = calculateSingleOutcomeEV(parlayTrueProbability, parlayDecimalOdds);
  
  return {
    legs: selectedBets,
    metrics: {
      combinedOdds: parlayDecimalOdds.toNumber(),
      combinedProbability: parlayTrueProbability.toNumber(),
      expectedValue: parlayEV.toNumber(),
      edgePercentage: parlayEV.mul(100).toNumber(),
      confidence: selectedBets.every(b => b.hasBaseline) ? 'high' : 'medium'
    }
  };
}

module.exports = {
  extractPinnacleOdds,
  calculateBetEVs,
  findPositiveEVBets,
  buildOptimalParlay,
  estimateEVWithoutPinnacle,
  extractAllBets
};