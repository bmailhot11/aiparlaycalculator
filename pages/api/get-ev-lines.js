import optimizedEVFetcher from '../../lib/optimized-ev-fetcher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sport, isPremium } = req.body;
  
  if (!sport) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sport selection required' 
    });
  }

  try {
    console.log(`🎯 Fetching positive EV lines for ${sport}...`);
    
    // Use the optimized EV fetcher
    const result = await optimizedEVFetcher.fetchOptimalEVLines(sport, {
      isPremium: isPremium || false,
      maxLines: isPremium ? 50 : 10 // Limit free users to 10 lines
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason === 'no_candidates' 
          ? `No positive EV lines found for ${sport}. This sport may be out of season.`
          : `Failed to fetch EV lines: ${result.reason}`,
        lines: [],
        arbitrage: []
      });
    }

    return res.status(200).json({
      success: true,
      lines: result.lines,
      arbitrage: result.arbitrage,
      performance: result.performance,
      sport: sport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ EV lines fetch error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch positive EV lines. Please try again.',
      error: error.message,
      lines: [],
      arbitrage: []
    });
  }
}