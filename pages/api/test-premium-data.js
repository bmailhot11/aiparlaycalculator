// Simple test endpoint to verify data adapter functionality
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test adapters without calling external APIs
    const { toPreviewEV, toArbRows, toLineShop, toParlayPreview, toCLVData } = 
      await import('../../lib/adapters/premium-data-adapters');
    
    // Test with empty data (should return empty arrays)
    const emptyData = {
      evFeed: toPreviewEV([]),
      arbitrage: toArbRows([]),
      lineShop: toLineShop([]),
      parlay: toParlayPreview(null),
      clv: toCLVData([])
    };
    
    // Test with sample data structure
    const sampleArbitrageData = [{
      id: 'test-1',
      matchup: 'Test Team A vs Test Team B',
      profit_percentage: 2.5,
      legs: [
        { sportsbook: 'BookA', american_odds: '+120' },
        { sportsbook: 'BookB', american_odds: '-110' }
      ]
    }];
    
    const sampleData = {
      evFeed: toPreviewEV(sampleArbitrageData),
      arbitrage: toArbRows(sampleArbitrageData),
      lineShop: toLineShop([]),
      parlay: toParlayPreview(null),
      clv: toCLVData([])
    };
    
    res.status(200).json({
      success: true,
      message: 'Premium data adapters working correctly',
      emptyDataTest: {
        evFeed: emptyData.evFeed.length,
        arbitrage: emptyData.arbitrage.length,
        lineShop: emptyData.lineShop.length,
        parlay: emptyData.parlay,
        clv: emptyData.clv
      },
      sampleDataTest: {
        evFeed: sampleData.evFeed.length,
        arbitrage: sampleData.arbitrage.length,
        lineShop: sampleData.lineShop.length,
        parlay: sampleData.parlay,
        clv: sampleData.clv
      }
    });
    
  } catch (error) {
    console.error('Premium data test error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}