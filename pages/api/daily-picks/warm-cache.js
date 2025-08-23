// API Route for Warming Odds Cache (Pre-publish)
// Triggered by Vercel Cron at 10:55 AM CT daily

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('🔥 Starting cache warming process');

  try {
    const sportsToWarm = ['NFL', 'NBA', 'MLB', 'NHL', 'soccer', 'mma', 'tennis'];
    const cacheResults = [];

    for (const sport of sportsToWarm) {
      try {
        const warmResult = await warmSportCache(sport);
        cacheResults.push({
          sport,
          success: true,
          games: warmResult.games,
          duration_ms: warmResult.duration
        });
        console.log(`✅ ${sport}: ${warmResult.games} games cached in ${warmResult.duration}ms`);
      } catch (error) {
        cacheResults.push({
          sport,
          success: false,
          error: error.message
        });
        console.error(`❌ ${sport} cache warming failed:`, error.message);
      }
    }

    const totalGames = cacheResults.reduce((sum, result) => sum + (result.games || 0), 0);
    const successfulSports = cacheResults.filter(r => r.success).length;
    const duration = Date.now() - startTime;

    console.log(`🔥 Cache warming complete: ${successfulSports}/${sportsToWarm.length} sports, ${totalGames} games in ${duration}ms`);

    return res.status(200).json({
      success: true,
      sports_warmed: successfulSports,
      total_sports: sportsToWarm.length,
      total_games: totalGames,
      results: cacheResults,
      duration_ms: duration
    });

  } catch (error) {
    console.error('🚨 Cache warming failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Cache warming failed',
      message: error.message,
      duration_ms: Date.now() - startTime
    });
  }
}

/**
 * Warm cache for a specific sport
 */
async function warmSportCache(sport) {
  const sportMap = {
    'NFL': 'americanfootball_nfl',
    'NBA': 'basketball_nba', 
    'MLB': 'baseball_mlb',
    'NHL': 'icehockey_nhl',
    'soccer': 'soccer_epl',
    'mma': 'mma_mixed_martial_arts',
    'tennis': 'tennis_atp'
  };

  const sportKey = sportMap[sport];
  if (!sportKey) {
    throw new Error(`Unknown sport: ${sport}`);
  }

  const startTime = Date.now();

  // Use existing live-odds API to warm the cache
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/live-odds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sport: sportKey })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  
  return {
    games: data.success ? data.odds?.length || 0 : 0,
    duration: Date.now() - startTime
  };
}