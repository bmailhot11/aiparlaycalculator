const Decimal = require('decimal.js-light');
const { decimalToImpliedProbability } = require('./odds-conversion.js');

/**
 * Calculate the total overround (vig) from implied probabilities
 * @param {Decimal[]} impliedProbabilities - Array of implied probabilities
 * @returns {Decimal} - Total overround (sum of probabilities)
 */
function calculateOverround(impliedProbabilities) {
  return impliedProbabilities.reduce((sum, prob) => sum.plus(prob), new Decimal(0));
}

/**
 * Remove vig from implied probabilities to get fair probabilities
 * @param {Decimal[]} impliedProbabilities - Array of implied probabilities with vig
 * @returns {Decimal[]} - Array of no-vig probabilities
 */
function removeVig(impliedProbabilities) {
  const overround = calculateOverround(impliedProbabilities);
  
  if (overround.lte(0)) {
    throw new Error('Invalid probabilities: sum must be greater than 0');
  }
  
  return impliedProbabilities.map(prob => prob.div(overround));
}

/**
 * Calculate vig percentage
 * @param {Decimal[]} impliedProbabilities - Array of implied probabilities
 * @returns {Decimal} - Vig as percentage (e.g., 0.05 for 5%)
 */
function calculateVigPercentage(impliedProbabilities) {
  const overround = calculateOverround(impliedProbabilities);
  return overround.minus(1);
}

/**
 * Remove vig from decimal odds for a market
 * @param {Decimal[]} decimalOdds - Array of decimal odds for all outcomes
 * @returns {Object} - Contains noVigProbabilities, vigPercentage, and overround
 */
function removeVigFromOdds(decimalOdds) {
  const impliedProbabilities = decimalOdds.map(odds => decimalToImpliedProbability(odds));
  const overround = calculateOverround(impliedProbabilities);
  const vigPercentage = calculateVigPercentage(impliedProbabilities);
  const noVigProbabilities = removeVig(impliedProbabilities);
  
  return {
    impliedProbabilities,
    noVigProbabilities,
    vigPercentage,
    overround
  };
}

/**
 * Get Pinnacle's no-vig probabilities as baseline truth
 * @param {Object} marketData - Market data with all sportsbooks
 * @returns {Decimal[]|null} - Pinnacle's no-vig probabilities or null if not found
 */
function getPinnacleBaselineProbabilities(marketData) {
  const pinnacleData = marketData.books?.find(book => 
    book.name?.toLowerCase().includes('pinnacle')
  );
  
  if (!pinnacleData || !pinnacleData.odds) {
    return null;
  }
  
  const pinnacleOdds = pinnacleData.odds.map(odds => new Decimal(odds));
  const result = removeVigFromOdds(pinnacleOdds);
  
  return result.noVigProbabilities;
}

/**
 * Normalize probabilities to sum to 1.0 (handle rounding errors)
 * @param {Decimal[]} probabilities - Array of probabilities
 * @returns {Decimal[]} - Normalized probabilities
 */
function normalizeProbabilities(probabilities) {
  const sum = probabilities.reduce((acc, prob) => acc.plus(prob), new Decimal(0));
  
  if (sum.eq(0)) {
    throw new Error('Cannot normalize probabilities that sum to zero');
  }
  
  return probabilities.map(prob => prob.div(sum));
}

module.exports = {
  calculateOverround,
  removeVig,
  calculateVigPercentage,
  removeVigFromOdds,
  getPinnacleBaselineProbabilities,
  normalizeProbabilities
};