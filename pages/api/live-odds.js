// pages/api/live-odds.js
// Live Odds API endpoint - Real data only, no mock fallbacks

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  const { sport = 'NFL' } = req.body;
  
  console.log(`[Live Odds API] Starting request for sport: ${sport}`);
  console.log(`[Live Odds API] API Key available: ${!!process.env.ODDS_API_KEY}`);

  try {
    const result = await fetchLiveOddsForDisplay(sport);
    
    console.log(`[Live Odds API] Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[Live Odds API] Games returned: ${result.odds?.length || 0}`);
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('[Live Odds API] Unhandled error:', error);
    return res.status(200).json({
      success: false,
      message: 'Failed to fetch odds data',
      error: error.message,
      odds: []
    });
  }
}

async function fetchLiveOddsForDisplay(sport) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  console.log(`[fetchLiveOdds] Starting fetch for ${sport}`);
  
  if (!API_KEY) {
    console.log('[fetchLiveOdds] No API key found');
    return {
      success: false,
      message: 'Odds API configuration missing',
      odds: [],
      sport: sport,
      last_updated: new Date().toISOString(),
      debug: { reason: 'no_api_key' }
    };
  }

  // Map sports to API keys
  const sportKeyMap = {
    'NFL': 'americanfootball_nfl',
    'NBA': 'basketball_nba',
    'NHL': 'icehockey_nhl', 
    'MLB': 'baseball_mlb',
    'NCAAF': 'americanfootball_ncaaf',
    'NCAAB': 'basketball_ncaab'
  };

  const sportKey = sportKeyMap[sport] || 'americanfootball_nfl';
  const apiUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=american&dateFormat=iso`;
  
  console.log(`[fetchLiveOdds] Making request to: ${apiUrl.replace(API_KEY, 'HIDDEN_KEY')}`);

  try {
    const response = await fetch(apiUrl);
    
    console.log(`[fetchLiveOdds] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[fetchLiveOdds] Error response:`, errorText);
      
      // Try to parse error for better messaging
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // Handle specific API errors
      if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key or quota exceeded',
          odds: [],
          sport: sport,
          last_updated: new Date().toISOString(),
          debug: { reason: 'api_auth_error', status: response.status }
        };
      }
      
      if (response.status === 429) {
        return {
          success: false,
          message: 'Rate limit exceeded - too many requests',
          odds: [],
          sport: sport,
          last_updated: new Date().toISOString(),
          debug: { reason: 'rate_limit', status: response.status }
        };
      }
      
      throw new Error(`API Error ${response.status}: ${errorData.message || errorText}`);
    }

    const data = await response.json();
    console.log(`[fetchLiveOdds] Raw API response: ${data.length} games`);
    
    if (!Array.isArray(data)) {
      console.log(`[fetchLiveOdds] Unexpected response format:`, data);
      return {
        success: false,
        message: 'Unexpected data format from odds API',
        odds: [],
        sport: sport,
        last_updated: new Date().toISOString(),
        debug: { reason: 'invalid_format' }
      };
    }
    
    if (data.length === 0) {
      console.log(`[fetchLiveOdds] No games available from API`);
      return {
        success: true,
        message: `No upcoming ${sport} games available`,
        odds: [],
        sport: sport,
        last_updated: new Date().toISOString(),
        debug: { reason: 'no_games_available', api_response_length: 0 }
      };
    }
    
    // Filter and format for display - 30 day window for upcoming games
    const now = new Date();
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    console.log(`[fetchLiveOdds] Filtering games between ${now.toISOString()} and ${monthFromNow.toISOString()}`);
    
    const filteredOdds = data
      .filter(game => {
        const gameTime = new Date(game.commence_time);
        const isUpcoming = gameTime > now && gameTime < monthFromNow;
        
        // Additional validation
        const hasValidTeams = game.away_team && game.home_team;
        const hasBookmakers = game.bookmakers && game.bookmakers.length > 0;
        
        if (!isUpcoming) {
          console.log(`[fetchLiveOdds] Game outside window: ${game.away_team} vs ${game.home_team} at ${game.commence_time}`);
        }
        
        if (!hasValidTeams) {
          console.log(`[fetchLiveOdds] Game missing team info:`, game);
        }
        
        if (!hasBookmakers) {
          console.log(`[fetchLiveOdds] Game missing bookmaker data: ${game.away_team} vs ${game.home_team}`);
        }
        
        return isUpcoming && hasValidTeams && hasBookmakers;
      })
      .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
      .slice(0, 6) // Limit to 6 games for UI performance
      .map(game => ({
        ...game,
        // Ensure we have valid odds data
        bookmakers: game.bookmakers.filter(book => 
          book.markets && 
          book.markets.some(market => 
            market.key === 'h2h' && 
            market.outcomes && 
            market.outcomes.length >= 2
          )
        )
      }))
      .filter(game => game.bookmakers.length > 0); // Remove games without valid odds

    console.log(`[fetchLiveOdds] Final filtered games: ${filteredOdds.length}`);
    
    if (filteredOdds.length === 0) {
      return {
        success: true,
        message: `No upcoming ${sport} games with odds in the next 30 days`,
        odds: [],
        sport: sport,
        last_updated: new Date().toISOString(),
        debug: { 
          reason: 'no_upcoming_games_with_odds', 
          total_api_games: data.length,
          filtered_games: 0
        }
      };
    }

    return {
      success: true,
      message: `Found ${filteredOdds.length} upcoming ${sport} games`,
      odds: filteredOdds,
      sport: sport,
      last_updated: new Date().toISOString(),
      debug: {
        total_api_games: data.length,
        filtered_games: filteredOdds.length,
        source: 'real_api_data'
      }
    };

  } catch (error) {
    console.error(`[fetchLiveOdds] API Error:`, error);
    
    return {
      success: false,
      message: `Unable to fetch ${sport} odds: ${error.message}`,
      odds: [],
      sport: sport,
      last_updated: new Date().toISOString(),
      debug: { 
        reason: 'api_error', 
        error_message: error.message 
      }
    };
  }
}