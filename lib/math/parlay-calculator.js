const Decimal = require('decimal.js-light');
const { normalizeOddsToDecimal, getPushOdds } = require('./odds-conversion.js');
const { calculateSingleOutcomeEV } = require('./ev-calculator.js');

/**
 * Calculate combined decimal odds for a parlay
 * @param {Decimal[]} decimalOdds - Array of decimal odds for each leg
 * @returns {Decimal} - Combined decimal odds
 */
function calculateParlayOdds(decimalOdds) {
  return decimalOdds.reduce((total, odds) => total.mul(odds), new Decimal(1));
}

/**
 * Calculate combined true probability for a parlay
 * @param {Decimal[]} trueProbabilities - Array of true probabilities for each leg
 * @returns {Decimal} - Combined true probability
 */
function calculateParlayProbability(trueProbabilities) {
  return trueProbabilities.reduce((total, prob) => total.mul(prob), new Decimal(1));
}

/**
 * Handle push scenarios in parlays
 * @param {Object[]} legs - Array of parlay legs with push status
 * @returns {Object} - Adjusted legs and push information
 */
function handleParlayPushes(legs) {
  const adjustedLegs = legs.map(leg => {
    if (leg.isPush) {
      return {
        ...leg,
        decimalOdds: getPushOdds(),
        trueProbability: new Decimal(1) // Certainty for push
      };
    }
    return leg;
  });

  const pushCount = legs.filter(leg => leg.isPush).length;
  const activeLegCount = legs.length - pushCount;

  return {
    adjustedLegs,
    pushCount,
    activeLegCount,
    hasPushes: pushCount > 0
  };
}

/**
 * Process a single parlay leg
 * @param {Object} leg - Single leg data
 * @param {Decimal} trueProbability - True probability for this outcome
 * @returns {Object} - Processed leg data
 */
function processLeg(leg, trueProbability) {
  const decimalOdds = normalizeOddsToDecimal(leg.odds, leg.format);
  
  return {
    ...leg,
    decimalOdds,
    trueProbability,
    impliedProbability: new Decimal(1).div(decimalOdds),
    isPush: leg.isPush || false
  };
}

/**
 * Calculate EV for a complete parlay
 * @param {Object[]} legs - Array of processed parlay legs
 * @param {number} stake - Stake amount (default 1 for per-dollar calculation)
 * @returns {Object} - Complete parlay EV analysis
 */
function calculateParlayEV(legs, stake = 1) {
  try {
    // Handle pushes
    const { adjustedLegs, pushCount, activeLegCount, hasPushes } = handleParlayPushes(legs);
    
    if (activeLegCount === 0) {
      // All legs are pushes - return stake
      return {
        stake,
        combinedOdds: 1,
        combinedTrueProbability: 1,
        projectedPayout: stake,
        profit: 0,
        expectedValue: 0,
        edgePercentage: 0,
        isValueBet: false,
        pushInfo: {
          hasPushes: true,
          pushCount,
          activeLegCount: 0,
          allPushes: true
        },
        legs: adjustedLegs.map(leg => ({
          ...leg,
          decimalOdds: leg.decimalOdds.toNumber(),
          trueProbability: leg.trueProbability.toNumber(),
          impliedProbability: leg.impliedProbability.toNumber()
        }))
      };
    }

    // Calculate combined odds and probabilities
    const decimalOddsArray = adjustedLegs.map(leg => leg.decimalOdds);
    const trueProbabilitiesArray = adjustedLegs.map(leg => leg.trueProbability);
    
    const combinedOdds = calculateParlayOdds(decimalOddsArray);
    const combinedTrueProbability = calculateParlayProbability(trueProbabilitiesArray);
    
    // Calculate EV using the single outcome formula with combined values
    const expectedValue = calculateSingleOutcomeEV(combinedTrueProbability, combinedOdds);
    const edgePercentage = expectedValue.mul(100);
    
    const stakeDecimal = new Decimal(stake);
    const projectedPayout = combinedOdds.mul(stakeDecimal);
    const profit = projectedPayout.minus(stakeDecimal);
    const scaledEV = expectedValue.mul(stakeDecimal);

    return {
      stake,
      combinedOdds: combinedOdds.toNumber(),
      combinedTrueProbability: combinedTrueProbability.toNumber(),
      projectedPayout: projectedPayout.toNumber(),
      profit: profit.toNumber(),
      expectedValue: scaledEV.toNumber(),
      edgePercentage: edgePercentage.toNumber(),
      isValueBet: expectedValue.gt(0),
      pushInfo: {
        hasPushes,
        pushCount,
        activeLegCount,
        allPushes: false
      },
      legs: adjustedLegs.map(leg => ({
        ...leg,
        decimalOdds: leg.decimalOdds.toNumber(),
        trueProbability: leg.trueProbability.toNumber(),
        impliedProbability: leg.impliedProbability.toNumber()
      }))
    };
  } catch (error) {
    return {
      error: error.message,
      stake,
      legs: legs.map(leg => ({
        ...leg,
        error: 'Processing failed'
      }))
    };
  }
}

/**
 * Process multiple parlays for comparison
 * @param {Object[]} parlays - Array of parlay configurations
 * @returns {Object} - Comparison of all parlays
 */
function compareParlays(parlays) {
  const processedParlays = parlays.map((parlay, index) => {
    const result = calculateParlayEV(parlay.legs, parlay.stake);
    return {
      id: parlay.id || `parlay_${index}`,
      book: parlay.book,
      ...result
    };
  });

  // Find best EV parlay
  const validParlays = processedParlays.filter(p => !p.error && p.isValueBet);
  const bestEVParlay = validParlays.reduce((best, current) => 
    !best || current.expectedValue > best.expectedValue ? current : best, null
  );

  // Find highest payout parlay
  const highestPayoutParlay = processedParlays.reduce((highest, current) => 
    !highest || (current.projectedPayout || 0) > (highest.projectedPayout || 0) ? current : highest, null
  );

  return {
    parlays: processedParlays,
    bestEVParlay,
    highestPayoutParlay,
    analysis: {
      totalParlays: processedParlays.length,
      valueBets: validParlays.length,
      averageEV: validParlays.length > 0 ? 
        validParlays.reduce((sum, p) => sum + p.expectedValue, 0) / validParlays.length : 0
    }
  };
}

module.exports = {
  calculateParlayOdds,
  calculateParlayProbability,
  handleParlayPushes,
  processLeg,
  calculateParlayEV,
  compareParlays
};