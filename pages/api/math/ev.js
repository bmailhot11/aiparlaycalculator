const { processMarket } = require('../../../lib/math/ev-calculator.js');
const { calculateParlayEV, processLeg, compareParlays } = require('../../../lib/math/parlay-calculator.js');
const { getPinnacleBaselineProbabilities } = require('../../../lib/math/vig-removal.js');
const { validateEVRequest } = require('../../../lib/math/validation-schemas.js');
const Decimal = require('decimal.js-light');

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed', 
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // Validate the request
    const validation = validateEVRequest(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error
      });
    }

    const { type, data } = validation.data;

    // Route to appropriate calculation based on type
    switch (type) {
      case 'market':
        return handleMarketCalculation(req, res, data);
      
      case 'parlay':
        return handleParlayCalculation(req, res, data);
      
      case 'parlays':
        return handleParlaysComparison(req, res, data);
      
      default:
        return res.status(400).json({
          error: 'Invalid calculation type',
          message: 'Type must be "market", "parlay", or "parlays"'
        });
    }
  } catch (error) {
    console.error('EV Calculation Error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Calculation failed'
    });
  }
}

/**
 * Handle market-based EV calculations
 */
async function handleMarketCalculation(req, res, marketData) {
  try {
    const result = processMarket(marketData);
    
    if (result.error) {
      return res.status(400).json({
        error: 'Market calculation failed',
        message: result.error,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      type: 'market',
      result,
      metadata: {
        calculatedAt: new Date().toISOString(),
        pinnacleBaseline: result.pinnacleBaseline,
        booksAnalyzed: result.analysis.booksAnalyzed
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Market calculation error',
      message: error.message
    });
  }
}

/**
 * Handle single parlay EV calculations
 */
async function handleParlayCalculation(req, res, parlayData) {
  try {
    // We need to get true probabilities for each leg from Pinnacle data
    // For now, we'll expect trueProbability to be provided in each leg
    // In a real implementation, you'd fetch this from your odds data source
    
    const processedLegs = parlayData.legs.map(leg => {
      if (!leg.trueProbability) {
        throw new Error(`True probability missing for leg: ${leg.outcome || 'Unknown'}`);
      }
      
      return processLeg(leg, new Decimal(leg.trueProbability));
    });

    const result = calculateParlayEV(processedLegs, parlayData.stake);

    if (result.error) {
      return res.status(400).json({
        error: 'Parlay calculation failed',
        message: result.error,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      type: 'parlay',
      result,
      metadata: {
        calculatedAt: new Date().toISOString(),
        legCount: processedLegs.length,
        stake: parlayData.stake
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Parlay calculation error',
      message: error.message
    });
  }
}

/**
 * Handle multiple parlays comparison
 */
async function handleParlaysComparison(req, res, parlaysData) {
  try {
    // Process each parlay individually first
    const processedParlaysData = await Promise.all(
      parlaysData.parlays.map(async (parlay) => {
        const processedLegs = parlay.legs.map(leg => {
          if (!leg.trueProbability) {
            throw new Error(`True probability missing for leg: ${leg.outcome || 'Unknown'}`);
          }
          
          return processLeg(leg, new Decimal(leg.trueProbability));
        });

        return {
          ...parlay,
          legs: processedLegs
        };
      })
    );

    const result = compareParlays(processedParlaysData);

    return res.status(200).json({
      success: true,
      type: 'parlays',
      result,
      metadata: {
        calculatedAt: new Date().toISOString(),
        parlaysCompared: parlaysData.parlays.length,
        valueBetsFound: result.analysis.valueBets
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Parlays comparison error',
      message: error.message
    });
  }
}

// Helper function to get health check info
function getHealthCheck() {
  return {
    service: 'EV Calculator API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      'POST /api/math/ev': 'Calculate expected value for markets and parlays'
    },
    supportedTypes: ['market', 'parlay', 'parlays'],
    features: [
      'Vig removal using Pinnacle baseline',
      'American/Decimal odds conversion',
      'Push handling in parlays',
      'Multi-book EV comparison',
      'Value bet identification'
    ]
  };
}

module.exports = handler;
module.exports.default = handler;

// Export health check for monitoring
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};