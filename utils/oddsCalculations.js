// Odds Calculations for Daily Picks System

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds) {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimalOdds) {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Convert decimal odds to implied probability
 */
export function decimalToImpliedProbability(decimalOdds) {
  return 1 / decimalOdds;
}

/**
 * Calculate no-vig fair odds using Pinnacle as the sharp anchor
 * @param {Object} market - Market with odds from multiple books including Pinnacle
 * @param {string} selection - The selection key (e.g., 'home', 'away', 'over', 'under')
 * @returns {Object} Fair odds calculation result
 */
export function calculateFairOdds(market, selection) {
  const pinnacleBook = market.bookmakers?.find(book => 
    book.key === 'pinnacle' || book.title?.toLowerCase().includes('pinnacle')
  );
  
  if (!pinnacleBook) {
    // Fallback: calculate no-vig odds from available books
    return calculateNoVigFairOdds(market, selection);
  }
  
  // Use Pinnacle as the sharp anchor
  const pinnacleMarket = pinnacleBook.markets?.[0]; // Assume first market
  const pinnacleOutcome = pinnacleMarket?.outcomes?.find(outcome => 
    normalizeSelection(outcome.name) === normalizeSelection(selection)
  );
  
  if (!pinnacleOutcome) {
    return calculateNoVigFairOdds(market, selection);
  }
  
  const pinnacleDecimal = americanToDecimal(pinnacleOutcome.price);
  const pinnacleImplied = decimalToImpliedProbability(pinnacleDecimal);
  
  // Apply small vig adjustment (Pinnacle typically has ~2-3% vig)
  const estimatedVig = 0.025; // 2.5% vig estimate for Pinnacle
  const adjustedProbability = pinnacleImplied * (1 - estimatedVig/2);
  const fairDecimalOdds = 1 / adjustedProbability;
  
  return {
    fairDecimalOdds,
    fairAmericanOdds: decimalToAmerican(fairDecimalOdds),
    impliedProbability: adjustedProbability,
    method: 'pinnacle_anchor',
    pinnacleOdds: pinnacleOutcome.price,
    confidence: 0.95
  };
}

/**
 * Calculate no-vig fair odds from available books (fallback method)
 */
export function calculateNoVigFairOdds(market, selection) {
  const outcomes = [];
  
  // Collect all outcomes for this market across books
  market.bookmakers?.forEach(book => {
    book.markets?.[0]?.outcomes?.forEach(outcome => {
      const normalizedName = normalizeSelection(outcome.name);
      outcomes.push({
        selection: normalizedName,
        odds: outcome.price,
        decimal: americanToDecimal(outcome.price),
        implied: decimalToImpliedProbability(americanToDecimal(outcome.price)),
        book: book.title
      });
    });
  });
  
  // Group by selection
  const selectionGroups = {};
  outcomes.forEach(outcome => {
    if (!selectionGroups[outcome.selection]) {
      selectionGroups[outcome.selection] = [];
    }
    selectionGroups[outcome.selection].push(outcome);
  });
  
  // Calculate average implied probability for each selection
  const avgImpliedProbabilities = {};
  Object.keys(selectionGroups).forEach(sel => {
    const group = selectionGroups[sel];
    const avgImplied = group.reduce((sum, outcome) => sum + outcome.implied, 0) / group.length;
    avgImpliedProbabilities[sel] = avgImplied;
  });
  
  // Remove vig by normalizing probabilities to sum to 1
  const totalImplied = Object.values(avgImpliedProbabilities).reduce((sum, prob) => sum + prob, 0);
  const vigPercentage = ((totalImplied - 1) / totalImplied) * 100;
  
  Object.keys(avgImpliedProbabilities).forEach(sel => {
    avgImpliedProbabilities[sel] = avgImpliedProbabilities[sel] / totalImplied;
  });
  
  const targetSelection = normalizeSelection(selection);
  const fairProbability = avgImpliedProbabilities[targetSelection];
  
  if (!fairProbability) {
    throw new Error(`Selection "${selection}" not found in market`);
  }
  
  const fairDecimalOdds = 1 / fairProbability;
  
  return {
    fairDecimalOdds,
    fairAmericanOdds: decimalToAmerican(fairDecimalOdds),
    impliedProbability: fairProbability,
    method: 'no_vig_average',
    vigPercentage,
    confidence: 0.75
  };
}

/**
 * Calculate edge percentage for a bet
 */
export function calculateEdge(bestOdds, fairOdds) {
  const bestDecimal = americanToDecimal(bestOdds);
  const fairDecimal = fairOdds.fairDecimalOdds;
  
  // Edge = (Best Odds / Fair Odds) - 1
  const edge = (bestDecimal / fairDecimal) - 1;
  
  return {
    edgePercentage: edge * 100,
    bestDecimalOdds: bestDecimal,
    fairDecimalOdds: fairDecimal,
    impliedProbability: fairOdds.impliedProbability,
    expectedValue: edge,
    confidence: fairOdds.confidence
  };
}

/**
 * Find the best odds across all sportsbooks for a selection
 */
export function findBestOdds(market, selection) {
  let bestOdds = null;
  let bestBook = null;
  let bestDecimal = 0;
  
  const targetSelection = normalizeSelection(selection);
  
  market.bookmakers?.forEach(book => {
    book.markets?.[0]?.outcomes?.forEach(outcome => {
      if (normalizeSelection(outcome.name) === targetSelection) {
        const decimal = americanToDecimal(outcome.price);
        if (decimal > bestDecimal) {
          bestDecimal = decimal;
          bestOdds = outcome.price;
          bestBook = book.title;
        }
      }
    });
  });
  
  return {
    odds: bestOdds,
    decimal: bestDecimal,
    sportsbook: bestBook,
    selection: targetSelection
  };
}

/**
 * Calculate combined parlay odds
 */
export function calculateParlayOdds(legs) {
  if (!legs || legs.length === 0) return { decimal: 1, american: 0 };
  
  const combinedDecimal = legs.reduce((product, leg) => {
    return product * leg.decimalOdds;
  }, 1);
  
  return {
    decimal: combinedDecimal,
    american: decimalToAmerican(combinedDecimal),
    impliedProbability: 1 / combinedDecimal
  };
}

/**
 * Calculate parlay edge based on individual leg edges
 */
export function calculateParlayEdge(legs) {
  if (!legs || legs.length === 0) return 0;
  
  // Calculate expected value as product of (1 + edge) for each leg
  const combinedExpectedValue = legs.reduce((product, leg) => {
    return product * (1 + (leg.edgePercentage / 100));
  }, 1) - 1;
  
  return combinedExpectedValue * 100; // Convert to percentage
}

/**
 * Normalize selection names for consistent matching
 */
function normalizeSelection(selection) {
  return selection
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.-]/g, ''); // Remove special characters except dots and dashes
}

/**
 * Validate edge thresholds
 */
export function meetsEdgeThreshold(edgePercentage, betType) {
  const thresholds = {
    single: 2.0,    // 2% minimum for singles
    parlay: 3.5     // 3.5% minimum for parlay legs
  };
  
  return edgePercentage >= thresholds[betType];
}

/**
 * Calculate Closing Line Value (CLV)
 */
export function calculateCLV(openingOdds, closingOdds) {
  const openingDecimal = americanToDecimal(openingOdds);
  const closingDecimal = americanToDecimal(closingOdds);
  
  // CLV = (Opening Odds / Closing Odds) - 1
  const clv = (openingDecimal / closingDecimal) - 1;
  
  return {
    clvPercentage: clv * 100,
    beatClosing: clv > 0,
    openingDecimal,
    closingDecimal
  };
}

/**
 * Format odds for display
 */
export function formatOdds(americanOdds) {
  if (americanOdds > 0) {
    return `+${americanOdds}`;
  }
  return `${americanOdds}`;
}

/**
 * Calculate kelly criterion bet size
 */
export function calculateKellyBetSize(edge, probability, bankroll, maxKelly = 0.25) {
  // Kelly = (edge * probability - (1 - probability)) / edge
  const kellyFraction = (edge * probability - (1 - probability)) / edge;
  const cappedKelly = Math.min(kellyFraction, maxKelly);
  
  return {
    kellyFraction: cappedKelly,
    recommendedBetSize: bankroll * cappedKelly,
    fullKellySize: bankroll * kellyFraction
  };
}