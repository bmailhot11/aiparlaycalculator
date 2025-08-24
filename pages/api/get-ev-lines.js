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
    console.log(`🎯 Fetching positive EV lines for ${sport}... (Premium: ${isPremium})`);
    
    // Quick test mode - return basic response if no data
    if (!sport || !['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB'].includes(sport)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported sport: ${sport}. Try NFL, NBA, NHL, MLB, NCAAF, or NCAAB.`,
        lines: [],
        arbitrage: []
      });
    }
    
    // Add timeout to prevent hanging
    const fetchPromise = optimizedEVFetcher.fetchOptimalEVLines(sport, {
      isPremium: isPremium || false,
      maxLines: isPremium ? 50 : 20 // More lines for testing
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000)
    );
    
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log(`📊 EV Fetcher Result:`, {
      success: result.success,
      linesCount: result.lines?.length || 0,
      reason: result.reason,
      arbitrageCount: result.arbitrage?.length || 0
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.reason === 'no_candidates' 
          ? `No positive EV lines found for ${sport}. This sport may be out of season or we're building our data coverage.`
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
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch positive EV lines. Please try again.',
      error: error.message,
      lines: [],
      arbitrage: []
    });
  }
}