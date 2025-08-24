/**
 * Betting Math Specification v2.1 Implementation
 * Core mathematical calculations for parlay generation and slip analysis
 */

// ==========================================
// SECTION 0: GLOBAL RULES & CONVERSIONS
// ==========================================

/**
 * Convert American odds to decimal odds
 */
function americanToDecimal(american) {
  if (typeof american === 'string') {
    american = parseInt(american.replace('+', ''));
  }
  if (american > 0) {
    return 1 + (american / 100);
  } else {
    return 1 + (100 / Math.abs(american));
  }
}

/**
 * Convert decimal odds to American odds
 */
function decimalToAmerican(decimal) {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Calculate implied probability from decimal odds
 */
function impliedProbability(decimalOdds) {
  return 1 / decimalOdds;
}

/**
 * Remove vig from a two-way market
 */
function removeVig(odds1, odds2) {
  const r1 = 1 / odds1;
  const r2 = 1 / odds2;
  const overround = r1 + r2;
  
  return {
    p1: r1 / overround,
    p2: r2 / overround,
    vig: (overround - 1) * 100
  };
}

/**
 * Remove vig from n-way market
 */
function removeVigMultiway(oddsArray) {
  const rawImplieds = oddsArray.map(o => 1 / o);
  const overround = rawImplieds.reduce((sum, r) => sum + r, 0);
  
  return {
    probabilities: rawImplieds.map(r => r / overround),
    vig: (overround - 1) * 100,
    overround
  };
}

// ==========================================
// SECTION 1: TRUE PROBABILITY CALCULATION
// ==========================================

/**
 * Configuration for probability weights
 */
const PROB_WEIGHTS = {
  sharp: 0.60,
  consensus: 0.25, 
  prior: 0.15
};

/**
 * Calculate true probability by blending sharp, consensus, and prior
 */
function calculateTrueProbability(sharpProb, consensusProb, priorProb) {
  let weights = { ...PROB_WEIGHTS };
  let components = [];
  
  // If sharp unavailable, reallocate weights
  if (sharpProb === null || sharpProb === undefined) {
    const totalRemaining = weights.consensus + weights.prior;
    weights.consensus = weights.consensus / totalRemaining;
    weights.prior = weights.prior / totalRemaining;
    weights.sharp = 0;
  } else {
    components.push(sharpProb * weights.sharp);
  }
  
  if (consensusProb !== null && consensusProb !== undefined) {
    components.push(consensusProb * weights.consensus);
  }
  
  if (priorProb !== null && priorProb !== undefined) {
    components.push(priorProb * weights.prior);
  }
  
  // Return weighted average
  const pTrue = components.reduce((sum, c) => sum + c, 0);
  
  // Ensure probability is in valid range
  return Math.max(0.01, Math.min(0.99, pTrue));
}

/**
 * Get sharp book probability from Pinnacle or similar
 */
function getSharpProbability(bookmakers, market, selection) {
  if (!bookmakers || !Array.isArray(bookmakers)) {
    return null;
  }
  
  const sharpBooks = ['Pinnacle', 'Circa Sports', 'Bookmaker'];
  
  for (const sharpBook of sharpBooks) {
    const bookmaker = bookmakers.find(b => b.title === sharpBook);
    if (bookmaker) {
      const marketData = bookmaker.markets?.find(m => m.key === market);
      if (marketData) {
        const outcome = marketData.outcomes?.find(o => 
          o.name === selection || o.description === selection
        );
        if (outcome && outcome.price) {
          const decimalOdds = americanToDecimal(outcome.price);
          // For two-way markets, we need the opposite side to remove vig
          const oppositeOutcome = marketData.outcomes?.find(o => o.name !== selection);
          if (oppositeOutcome) {
            const oppositeOdds = americanToDecimal(oppositeOutcome.price);
            const { p1 } = removeVig(decimalOdds, oppositeOdds);
            return p1;
          }
          // Single outcome, use implied with vig estimate
          return impliedProbability(decimalOdds) * 0.97; // Remove estimated 3% vig
        }
      }
    }
  }
  
  return null;
}

/**
 * Get consensus probability from multiple books
 */
function getConsensusProbability(bookmakers, market, selection) {
  if (!bookmakers || !Array.isArray(bookmakers)) {
    return null;
  }
  
  const consensusBooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
  const odds = [];
  
  for (const book of consensusBooks) {
    const bookmaker = bookmakers.find(b => b.title === book);
    if (bookmaker) {
      const marketData = bookmaker.markets?.find(m => m.key === market);
      if (marketData) {
        const outcome = marketData.outcomes?.find(o => 
          o.name === selection || o.description === selection
        );
        if (outcome && outcome.price) {
          odds.push(americanToDecimal(outcome.price));
        }
      }
    }
  }
  
  if (odds.length >= 2) {
    // Average the no-vig probabilities
    const avgOdds = odds.reduce((sum, o) => sum + o, 0) / odds.length;
    return impliedProbability(avgOdds) * 0.97; // Remove estimated 3% vig
  }
  
  return null;
}

// ==========================================
// SECTION 2: EV & FILTERING
// ==========================================

/**
 * Calculate expected value for a single bet
 */
function calculateEV(trueProb, decimalOdds) {
  const payoutMultiple = decimalOdds - 1;
  return trueProb * payoutMultiple - (1 - trueProb);
}

/**
 * Quality filters for bet selection
 */
const QUALITY_FILTERS = {
  probMin: 0.15, // More lenient for testing
  probMax: 0.85, // More lenient for testing
  evMin: -0.05, // Allow some negative EV for testing
  oddsMinAmerican: -500,
  oddsMaxAmerican: 500
};

/**
 * Check if a bet passes quality filters
 */
function passesQualityFilters(trueProb, ev, americanOdds) {
  return (
    trueProb >= QUALITY_FILTERS.probMin &&
    trueProb <= QUALITY_FILTERS.probMax &&
    ev > QUALITY_FILTERS.evMin &&
    americanOdds >= QUALITY_FILTERS.oddsMinAmerican &&
    americanOdds <= QUALITY_FILTERS.oddsMaxAmerican
  );
}

// ==========================================
// SECTION 3: KELLY CRITERION
// ==========================================

/**
 * Calculate full Kelly fraction for a single bet
 */
function calculateKelly(trueProb, decimalOdds) {
  const b = decimalOdds - 1;
  const kelly = (trueProb * decimalOdds - 1) / b;
  return Math.max(0, kelly);
}

/**
 * Apply fractional Kelly with cap
 */
function fractionalKelly(fullKelly, k = 0.25, cap = 0.05) {
  return Math.min(k * fullKelly, cap);
}

// ==========================================
// SECTION 4: PARLAY CORRELATION
// ==========================================

/**
 * Correlation matrix for different bet types
 */
const CORRELATION_MATRIX = {
  sameGameSameMarket: 0.20,
  sameGameDiffMarket: 0.10,
  sameTeamDiffGame: 0.05,
  samePlayerProps: 0.15,
  sameDivision: 0.03,
  differentGames: 0.00
};

/**
 * Calculate pairwise correlation between two legs
 */
function calculatePairwiseCorrelation(leg1, leg2) {
  // Same game check
  if (leg1.game === leg2.game || leg1.game_id === leg2.game_id) {
    if (leg1.market_type === leg2.market_type) {
      return CORRELATION_MATRIX.sameGameSameMarket;
    }
    return CORRELATION_MATRIX.sameGameDiffMarket;
  }
  
  // Same team check (extract team names from game string)
  const teams1 = (leg1.game || '').split(/[@vs]/i).map(t => t.trim());
  const teams2 = (leg2.game || '').split(/[@vs]/i).map(t => t.trim());
  const hasCommonTeam = teams1.some(t1 => teams2.some(t2 => t1 === t2));
  
  if (hasCommonTeam) {
    return CORRELATION_MATRIX.sameTeamDiffGame;
  }
  
  // Player props check
  if (leg1.market_type?.includes('player_') && leg2.market_type?.includes('player_')) {
    // Check if same player
    if (leg1.description?.includes(leg2.description?.split(' ')[0] || '')) {
      return CORRELATION_MATRIX.samePlayerProps;
    }
  }
  
  return CORRELATION_MATRIX.differentGames;
}

/**
 * Calculate correlation factor for entire parlay
 */
function calculateCorrelationFactor(legs) {
  let totalCorrelation = 0;
  const pairs = [];
  
  // Calculate all pairwise correlations
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const correlation = calculatePairwiseCorrelation(legs[i], legs[j]);
      totalCorrelation += correlation;
      if (correlation > 0) {
        pairs.push({ legs: [i, j], correlation });
      }
    }
  }
  
  // Apply scaling factor (less aggressive penalty)
  const scalingFactor = 2;
  const correlationFactor = Math.max(0.5, 1 - totalCorrelation / scalingFactor);
  
  return {
    factor: correlationFactor,
    totalCorrelation,
    pairs
  };
}

/**
 * Calculate parlay win probability with correlation adjustment
 */
function calculateParlayProbability(legs, trueProbabilities) {
  // Calculate naive probability
  const naiveProb = trueProbabilities.reduce((product, p) => product * p, 1);
  
  // Calculate correlation adjustment
  const { factor } = calculateCorrelationFactor(legs);
  
  // Adjust for correlation
  const adjustedProb = naiveProb * factor;
  
  return {
    naive: naiveProb,
    adjusted: adjustedProb,
    correlationFactor: factor
  };
}

/**
 * Calculate parlay EV
 */
function calculateParlayEV(adjustedProb, parlayOdds) {
  const payoutMultiple = parlayOdds - 1;
  return adjustedProb * payoutMultiple - (1 - adjustedProb);
}

// ==========================================
// SECTION 5: CLV TRACKING
// ==========================================

/**
 * Calculate CLV metrics
 */
function calculateCLV(userOdds, sharpClose, sharpOpen) {
  const clvPercent = ((sharpClose - userOdds) / userOdds) * 100;
  const probShift = impliedProbability(sharpOpen) - impliedProbability(sharpClose);
  
  return {
    clvPercent,
    probShift,
    positive: clvPercent > 0
  };
}

// ==========================================
// SECTION 6: ARBITRAGE & HEDGE
// ==========================================

/**
 * Check for arbitrage opportunity
 */
function checkArbitrage(odds1, odds2) {
  const sum = (1 / odds1) + (1 / odds2);
  if (sum < 1) {
    return {
      isArb: true,
      profitPercent: (1 - sum) * 100
    };
  }
  return { isArb: false };
}

/**
 * Calculate hedge stakes
 */
function calculateHedge(originalStake, originalOdds, oppositeOdds, target = 'breakeven') {
  const originalPayout = originalStake * originalOdds;
  
  if (target === 'breakeven') {
    // Guarantee no loss
    return originalStake * (originalOdds - 1) / oppositeOdds;
  } else if (target === 'equal') {
    // Equal payout both sides
    return originalStake * originalOdds / oppositeOdds;
  } else if (typeof target === 'number') {
    // Target specific profit percentage (0-1)
    const targetWin = originalStake * (originalOdds - 1) * target;
    return (originalPayout - targetWin - originalStake) / oppositeOdds;
  }
  
  return 0;
}

// ==========================================
// SECTION 7: SMART SCORE
// ==========================================

/**
 * Calculate SmartScore for ranking bets (v2.1 with Line Movement)
 */
function calculateSmartScore(ev, kelly, clvSignal = 0, lineMoveSignal = 0, variance, correlationFactor = 1) {
  // Normalize components (0-1 scale)
  const evNorm = Math.min(Math.max(ev / 0.10, 0), 1); // Cap at 10% EV
  const kellyNorm = Math.min(Math.max(kelly / 0.05, 0), 1); // Cap at 5% Kelly
  const clvNorm = Math.max(0, Math.min(clvSignal / 5, 1)); // 0-5% CLV range
  const lineMoveNorm = Math.max(0, Math.min(lineMoveSignal, 1)); // Already 0-1
  const variancePenalty = Math.max(0, variance);
  const correlationPenalty = Math.max(0, 1 - correlationFactor);
  
  // Configurable weights from environment or defaults
  const weights = {
    ev: parseFloat(process.env.SMARTSCORE_EV_WEIGHT) || 0.35,
    kelly: parseFloat(process.env.SMARTSCORE_KELLY_WEIGHT) || 0.25,
    clv: parseFloat(process.env.SMARTSCORE_CLV_WEIGHT) || 0.15,
    lineMove: parseFloat(process.env.SMARTSCORE_MOVEMENT_WEIGHT) || 0.10,
    variance: parseFloat(process.env.SMARTSCORE_VARIANCE_PENALTY) || 0.10,
    correlation: parseFloat(process.env.SMARTSCORE_CORRELATION_PENALTY) || 0.05
  };
  
  // Calculate score with line movement component
  const score = (
    weights.ev * evNorm +
    weights.kelly * kellyNorm +
    weights.clv * clvNorm +
    weights.lineMove * lineMoveNorm -
    weights.variance * variancePenalty -
    weights.correlation * correlationPenalty
  );
  
  // Convert to 0-100 scale
  return Math.max(0, Math.min(100, score * 100));
}

// ==========================================
// MAIN PROCESSING FUNCTIONS
// ==========================================

/**
 * Process a single leg with full calculations
 */
function processLeg(bet, bookmakers, historicalData = null) {
  // Extract odds
  const decimalOdds = bet.decimal_odds || americanToDecimal(bet.odds);
  const americanOdds = bet.odds ? parseInt(bet.odds.replace('+', '')) : decimalToAmerican(decimalOdds);
  
  // Get probabilities
  const sharpProb = getSharpProbability(bookmakers, bet.market_type, bet.selection);
  const consensusProb = getConsensusProbability(bookmakers, bet.market_type, bet.selection);
  const priorProb = historicalData?.hit_rate || null;
  
  // Calculate true probability
  const trueProb = calculateTrueProbability(sharpProb, consensusProb, priorProb);
  
  // Calculate value metrics
  const ev = calculateEV(trueProb, decimalOdds);
  const evPercent = ev * 100;
  const kellyFull = calculateKelly(trueProb, decimalOdds);
  const kellyFractional = fractionalKelly(kellyFull);
  
  // Check filters
  const passesFilters = passesQualityFilters(trueProb, ev, americanOdds);
  
  // Calculate variance
  const variance = trueProb * (1 - trueProb);
  
  return {
    ...bet,
    probabilities: {
      implied: impliedProbability(decimalOdds),
      sharp: sharpProb,
      consensus: consensusProb,
      prior: priorProb,
      true: trueProb
    },
    metrics: {
      ev,
      evPercent,
      kellyFull,
      kellyFractional,
      variance,
      passesFilters
    },
    confidence: {
      sharpAvailable: sharpProb !== null,
      consensusAvailable: consensusProb !== null,
      priorAvailable: priorProb !== null,
      score: (sharpProb ? 50 : 0) + (consensusProb ? 30 : 0) + (priorProb ? 20 : 0)
    }
  };
}

/**
 * Process a full parlay
 */
function processParlay(legs, bookmakers) {
  // Process each leg
  const processedLegs = legs.map(leg => processLeg(leg, bookmakers));
  
  // Filter for quality
  const qualityLegs = processedLegs.filter(leg => leg.metrics.passesFilters);
  
  // Calculate parlay odds
  const parlayOdds = processedLegs.reduce((product, leg) => 
    product * (leg.decimal_odds || americanToDecimal(leg.odds)), 1
  );
  
  // Get true probabilities
  const trueProbabilities = processedLegs.map(leg => leg.probabilities.true);
  
  // Calculate parlay probability
  const { naive, adjusted, correlationFactor } = calculateParlayProbability(
    processedLegs, 
    trueProbabilities
  );
  
  // Calculate parlay metrics
  const parlayEV = calculateParlayEV(adjusted, parlayOdds);
  const parlayEVPercent = parlayEV * 100;
  const parlayKellyFull = calculateKelly(adjusted, parlayOdds);
  const parlayKellyFractional = fractionalKelly(parlayKellyFull, 0.25, 0.03);
  
  // Calculate average leg EV
  const avgLegEV = processedLegs.reduce((sum, leg) => sum + leg.metrics.ev, 0) / processedLegs.length;
  
  // Calculate SmartScore with movement signals
  const parlayVariance = 1 - adjusted; // Higher variance for lower win probability
  const avgLineMoveSignal = processedLegs.reduce((sum, leg) => 
    sum + (leg.lineMoveSignal || 0), 0) / processedLegs.length;
  
  const smartScore = calculateSmartScore(
    parlayEV,
    parlayKellyFractional,
    0, // No CLV signal yet (calculated post-kick)
    avgLineMoveSignal,
    parlayVariance,
    correlationFactor
  );
  
  // Determine confidence level
  let confidence = 'low';
  if (parlayEV > 0.05 && correlationFactor > 0.85) confidence = 'high';
  else if (parlayEV > 0.02 && correlationFactor > 0.75) confidence = 'medium';
  
  return {
    legs: processedLegs,
    parlay: {
      odds: {
        decimal: parlayOdds,
        american: decimalToAmerican(parlayOdds)
      },
      probability: {
        naive,
        adjusted,
        correlationFactor
      },
      metrics: {
        ev: parlayEV,
        evPercent: parlayEVPercent,
        kellyFull: parlayKellyFull,
        kellyFractional: parlayKellyFractional,
        avgLegEV,
        smartScore
      },
      confidence,
      qualityGates: {
        allLegsPass: qualityLegs.length === processedLegs.length,
        correlationAcceptable: correlationFactor >= 0.50, // More lenient
        avgEdgeAcceptable: avgLegEV >= -0.05, // More lenient for testing
        parlayEVAcceptable: parlayEV >= -0.10 // More lenient for testing
      }
    }
  };
}

/**
 * Analyze an existing slip
 */
function analyzeSlip(legs, bookmakers) {
  const analysis = processParlay(legs, bookmakers);
  
  // Identify weak legs
  const weakLegs = analysis.legs
    .map((leg, index) => ({ ...leg, index }))
    .filter(leg => 
      leg.metrics.ev < 0.015 || 
      leg.probabilities.true < 0.25 || 
      leg.probabilities.true > 0.65
    );
  
  // Calculate line shopping opportunities
  const lineShoppingOpps = [];
  for (const leg of analysis.legs) {
    // Find best odds across all books
    let bestOdds = leg.decimal_odds;
    let bestBook = leg.sportsbook;
    
    for (const bookmaker of bookmakers) {
      const market = bookmaker.markets?.find(m => m.key === leg.market_type);
      const outcome = market?.outcomes?.find(o => o.name === leg.selection);
      if (outcome) {
        const odds = americanToDecimal(outcome.price);
        if (odds > bestOdds) {
          bestOdds = odds;
          bestBook = bookmaker.title;
        }
      }
    }
    
    if (bestOdds > leg.decimal_odds) {
      const evGain = calculateEV(leg.probabilities.true, bestOdds) - leg.metrics.ev;
      lineShoppingOpps.push({
        leg: leg.selection,
        currentBook: leg.sportsbook,
        currentOdds: leg.decimal_odds,
        bestBook,
        bestOdds,
        evGain,
        evGainPercent: evGain * 100
      });
    }
  }
  
  // Generate recommendations
  const recommendations = {
    verdict: analysis.parlay.metrics.ev > 0.02 ? 'POSITIVE_EV' : 
             analysis.parlay.metrics.ev > 0 ? 'MARGINAL' : 'NEGATIVE_EV',
    weakLegs,
    lineShoppingOpps,
    suggestedStake: {
      kelly25: Math.round(analysis.parlay.metrics.kellyFractional * 10000) / 100,
      conservative: Math.round(analysis.parlay.metrics.kellyFractional * 0.4 * 10000) / 100
    }
  };
  
  return {
    ...analysis,
    recommendations
  };
}

// Export all functions
module.exports = {
  // Conversions
  americanToDecimal,
  decimalToAmerican,
  impliedProbability,
  removeVig,
  removeVigMultiway,
  
  // Probability calculations
  calculateTrueProbability,
  getSharpProbability,
  getConsensusProbability,
  
  // EV and Kelly
  calculateEV,
  calculateKelly,
  fractionalKelly,
  passesQualityFilters,
  
  // Parlay calculations
  calculatePairwiseCorrelation,
  calculateCorrelationFactor,
  calculateParlayProbability,
  calculateParlayEV,
  
  // CLV and hedging
  calculateCLV,
  checkArbitrage,
  calculateHedge,
  
  // Scoring
  calculateSmartScore,
  
  // Main processing
  processLeg,
  processParlay,
  analyzeSlip,
  
  // Constants
  PROB_WEIGHTS,
  QUALITY_FILTERS,
  CORRELATION_MATRIX
};