/**
 * Line Movement API - Moneyline Time Series
 * Returns moneyline odds history for charting
 */

const { getMoneylineTimeSeries } = require('../../../../lib/line-movement');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { gameKey } = req.query;

  if (!gameKey) {
    return res.status(400).json({
      success: false,
      message: 'Game key parameter required'
    });
  }

  try {
    console.log(`📈 Fetching moneyline time series for game: ${gameKey}`);
    
    const timeSeriesData = await getMoneylineTimeSeries(gameKey);
    
    if (!timeSeriesData.series || timeSeriesData.series.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No moneyline data found for this game'
      });
    }

    console.log(`✅ Retrieved ${timeSeriesData.series.length} moneyline series`);

    return res.status(200).json({
      success: true,
      data: timeSeriesData
    });
    
  } catch (error) {
    console.error('❌ Moneyline time series error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch moneyline data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}