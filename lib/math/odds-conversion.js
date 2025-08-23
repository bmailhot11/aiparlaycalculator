const Decimal = require('decimal.js-light');

/**
 * Convert American odds to decimal odds
 * @param {number} american - American odds (e.g., +150, -200)
 * @returns {Decimal} - Decimal odds
 */
function americanToDecimal(american) {
  if (american >= 0) {
    return new Decimal(1).plus(new Decimal(american).div(100));
  } else {
    return new Decimal(1).plus(new Decimal(100).div(new Decimal(american).abs()));
  }
}

/**
 * Convert decimal odds to American odds
 * @param {Decimal|number} decimal - Decimal odds
 * @returns {number} - American odds
 */
function decimalToAmerican(decimal) {
  const dec = new Decimal(decimal);
  
  if (dec.gte(2)) {
    return dec.minus(1).mul(100).toNumber();
  } else {
    return new Decimal(-100).div(dec.minus(1)).toNumber();
  }
}

/**
 * Convert decimal odds to implied probability
 * @param {Decimal|number} decimal - Decimal odds
 * @returns {Decimal} - Implied probability (0-1)
 */
function decimalToImpliedProbability(decimal) {
  return new Decimal(1).div(new Decimal(decimal));
}

/**
 * Convert implied probability to decimal odds
 * @param {Decimal|number} probability - Probability (0-1)
 * @returns {Decimal} - Decimal odds
 */
function probabilityToDecimal(probability) {
  return new Decimal(1).div(new Decimal(probability));
}

/**
 * Convert American odds to implied probability
 * @param {number} american - American odds
 * @returns {Decimal} - Implied probability (0-1)
 */
function americanToImpliedProbability(american) {
  const decimal = americanToDecimal(american);
  return decimalToImpliedProbability(decimal);
}

/**
 * Normalize odds input to decimal format
 * @param {number|string} odds - Odds in any format
 * @param {string} format - 'american', 'decimal', or 'auto'
 * @returns {Decimal} - Decimal odds
 */
function normalizeOddsToDecimal(odds, format = 'auto') {
  const numericOdds = typeof odds === 'string' ? parseFloat(odds) : odds;
  
  if (isNaN(numericOdds)) {
    throw new Error('Invalid odds value');
  }

  if (format === 'decimal' || (format === 'auto' && numericOdds >= 1 && numericOdds <= 10)) {
    return new Decimal(numericOdds);
  } else if (format === 'american' || format === 'auto') {
    return americanToDecimal(numericOdds);
  }
  
  throw new Error('Unable to determine odds format');
}

/**
 * Handle push scenarios (return stake)
 * @returns {Decimal} - Decimal odds for push (1.0)
 */
function getPushOdds() {
  return new Decimal(1);
}

module.exports = {
  americanToDecimal,
  decimalToAmerican,
  decimalToImpliedProbability,
  probabilityToDecimal,
  americanToImpliedProbability,
  normalizeOddsToDecimal,
  getPushOdds
};