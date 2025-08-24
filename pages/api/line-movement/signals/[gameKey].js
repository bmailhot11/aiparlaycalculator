/**
 * Line Movement API - Movement Signals
 * Returns calculated movement signals for specific game/market/outcome
 */

const { calculateMovementSignals } = require('../../../../lib/line-movement');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { gameKey, market, outcome } = req.query;

  if (!gameKey || !market || !outcome) {
    return res.status(400).json({ 
      success: false, 
      message: 'Game key, market, and outcome parameters required',
      required_params: {
        gameKey: 'string',
        market: 'moneyline | spread',
        outcome: 'home | away | draw (for moneyline) or team name (for spread)'
      }
    });
  }

  try {
    console.log(`🎯 Calculating movement signals for: ${gameKey} ${market} ${outcome}`);
    
    const signals = await calculateMovementSignals(gameKey, market, outcome);
    
    if (!signals) {
      return res.status(404).json({
        success: false,
        message: 'No movement data available for this selection',
        details: {
          gameKey,
          market,
          outcome,
          possible_reasons: [
            'Game not found in odds history',
            'No data for specified sportsbook',
            'Insufficient data points for calculation'
          ]
        }
      });
    }

    console.log(`✅ Movement signals calculated successfully`);

    return res.status(200).json({
      success: true,
      data: signals
    });
    
  } catch (error) {
    console.error('❌ Movement signals error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate movement signals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}