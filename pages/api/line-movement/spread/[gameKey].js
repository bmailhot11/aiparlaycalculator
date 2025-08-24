/**
 * Line Movement API - Spread Time Series
 * Returns spread odds history for charting
 */

const { getSpreadTimeSeries } = require('../../../../lib/line-movement');

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
    console.log(`📈 Fetching spread time series for game: ${gameKey}`);
    
    const timeSeriesData = await getSpreadTimeSeries(gameKey);
    
    if (!timeSeriesData.series || timeSeriesData.series.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No spread data found for this game'
      });
    }

    console.log(`✅ Retrieved ${timeSeriesData.series.length} spread series`);

    return res.status(200).json({
      success: true,
      data: timeSeriesData
    });
    
  } catch (error) {
    console.error('❌ Spread time series error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch spread data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}