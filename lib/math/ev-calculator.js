const Decimal = require('decimal.js-light');
const { normalizeOddsToDecimal } = require('./odds-conversion.js');
const { removeVigFromOdds, getPinnacleBaselineProbabilities } = require('./vig-removal.js');

/**
 * Calculate Expected Value for a single outcome
 * Formula: EV = (true_probability * (decimal_odds - 1)) - (1 - true_probability)
 * @param {Decimal} trueProbability - True probability from Pinnacle baseline
 * @param {Decimal} decimalOdds - Decimal odds from sportsbook
 * @returns {Decimal} - Expected value per $1 staked
 */
function calculateSingleOutcomeEV(trueProbability, decimalOdds) {
  const winAmount = decimalOdds.minus(1);
  const expectedWin = trueProbability.mul(winAmount);
  const expectedLoss = new Decimal(1).minus(trueProbability);
  
  return expectedWin.minus(expectedLoss);
}

/**
 * Calculate edge percentage
 * @param {Decimal} expectedValue - EV per $1
 * @returns {Decimal} - Edge as percentage
 */
function calculateEdgePercentage(expectedValue) {
  return expectedValue.mul(100);
}

/**
 * Process a single outcome with all calculations
 * @param {Object} outcome - Single outcome data
 * @param {Decimal} trueProbability - Pinnacle baseline probability
 * @returns {Object} - Complete outcome analysis
 */
function processOutcome(outcome, trueProbability) {
  const decimalOdds = normalizeOddsToDecimal(outcome.odds, outcome.format);
  const impliedProbability = new Decimal(1).div(decimalOdds);
  const expectedValue = calculateSingleOutcomeEV(trueProbability, decimalOdds);
  const edgePercentage = calculateEdgePercentage(expectedValue);
  const isValueBet = expectedValue.gt(0);

  return {
    book: outcome.book,
    outcome: outcome.outcome,
    rawOdds: {
      american: outcome.format === 'american' ? outcome.odds : decimalOdds.minus(1).gte(1) ? 
        decimalOdds.minus(1).mul(100).toNumber() : 
        new Decimal(-100).div(decimalOdds.minus(1)).toNumber(),
      decimal: decimalOdds.toNumber()
    },
    impliedProbability: impliedProbability.toNumber(),
    trueProbability: trueProbability.toNumber(),
    expectedValue: expectedValue.toNumber(),
    edgePercentage: edgePercentage.toNumber(),
    isValueBet,
    projectedPayout: {
      perDollar: decimalOdds.toNumber(),
      profit: decimalOdds.minus(1).toNumber()
    }
  };
}

/**
 * Process a complete market with multiple outcomes and books
 * @param {Object} marketData - Market data with all books and outcomes
 * @returns {Object} - Complete market analysis
 */
function processMarket(marketData) {
  try {
    // Get Pinnacle baseline probabilities
    const pinnacleBaseline = getPinnacleBaselineProbabilities(marketData);
    
    if (!pinnacleBaseline) {
      throw new Error('Pinnacle data not found for baseline probabilities');
    }

    const processedOutcomes = [];
    const marketVigData = {};

    // Process each book
    for (const book of marketData.books) {
      const bookOdds = book.odds.map(odds => normalizeOddsToDecimal(odds));
      const vigData = removeVigFromOdds(bookOdds);
      
      marketVigData[book.name] = {
        vigPercentage: vigData.vigPercentage.mul(100).toNumber(),
        overround: vigData.overround.toNumber()
      };

      // Process each outcome for this book
      book.odds.forEach((odds, outcomeIndex) => {
        if (outcomeIndex >= pinnacleBaseline.length) {
          return; // Skip if more outcomes than Pinnacle baseline
        }

        const outcome = {
          book: book.name,
          odds: odds,
          format: book.format || 'decimal',
          outcome: marketData.outcomes?.[outcomeIndex] || `Outcome ${outcomeIndex + 1}`
        };

        const processedOutcome = processOutcome(outcome, pinnacleBaseline[outcomeIndex]);
        processedOutcomes.push(processedOutcome);
      });
    }

    // Find best value bets
    const valueBets = processedOutcomes.filter(outcome => outcome.isValueBet);
    const bestValueBet = valueBets.reduce((best, current) => 
      !best || current.expectedValue > best.expectedValue ? current : best, null
    );

    return {
      market: marketData.market || 'Unknown Market',
      outcomes: marketData.outcomes || [],
      pinnacleBaseline: pinnacleBaseline.map(prob => prob.toNumber()),
      processedOutcomes,
      marketVig: marketVigData,
      valueBets,
      bestValueBet,
      analysis: {
        totalOutcomes: processedOutcomes.length,
        valueBetsFound: valueBets.length,
        booksAnalyzed: marketData.books.length
      }
    };
  } catch (error) {
    return {
      error: error.message,
      market: marketData.market || 'Unknown Market',
      processedOutcomes: [],
      analysis: {
        error: true,
        message: error.message
      }
    };
  }
}

module.exports = {
  calculateSingleOutcomeEV,
  calculateEdgePercentage,
  processOutcome,
  processMarket
};