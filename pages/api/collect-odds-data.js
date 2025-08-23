// Automated odds data collection for historical analysis
import { OddsHistoryDB } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      manualTrigger = false,
      sports = ['NFL', 'NBA', 'NHL', 'MLB'] 
    } = req.body;

    console.log('[Odds Collection] Starting data collection...');

    const results = {
      success: true,
      collected: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    // Collect odds for each sport
    for (const sport of sports) {
      try {
        console.log(`[Odds Collection] Fetching ${sport} odds...`);
        
        const oddsData = await fetchOddsForStorage(sport);
        
        if (oddsData.success && oddsData.odds.length > 0) {
          // Store in historical database
          const snapshotId = OddsHistoryDB.storeOddsSnapshot(oddsData);
          
          results.collected.push({
            sport,
            games: oddsData.odds.length,
            snapshotId,
            timestamp: new Date().toISOString()
          });
          
          console.log(`[Odds Collection] Stored ${oddsData.odds.length} ${sport} games`);
        } else {
          results.errors.push({
            sport,
            error: oddsData.message || 'No odds data available'
          });
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[Odds Collection] Error for ${sport}:`, error);
        results.errors.push({
          sport,
          error: error.message
        });
      }
    }

    console.log(`[Odds Collection] Complete. Collected: ${results.collected.length}, Errors: ${results.errors.length}`);

    return res.status(200).json(results);

  } catch (error) {
    console.error('[Odds Collection] Fatal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Odds collection failed',
      error: error.message
    });
  }
}

// Fetch odds data for storage (similar to live-odds but optimized for storage)
async function fetchOddsForStorage(sport) {
  const API_KEY = process.env.ODDS_API_KEY;
  
  if (!API_KEY) {
    return {
      success: false,
      message: 'Odds API key not configured',
      odds: [],
      sport: sport
    };
  }

  // Map sports to API endpoints
  const sportKeyMap = {
    'NFL': ['americanfootball_nfl'],
    'NBA': ['basketball_nba'],
    'NHL': ['icehockey_nhl'],
    'MLB': ['baseball_mlb'],
    'NCAAF': ['americanfootball_ncaaf'],
    'NCAAB': ['basketball_ncaab']
  };

  const sportKeys = sportKeyMap[sport] || ['americanfootball_nfl'];
  const sportKey = sportKeys[0];
  
  // Fetch with multiple markets for comprehensive data
  const markets = ['h2h', 'spreads', 'totals'];
  const apiUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=${markets.join(',')}&oddsFormat=american&dateFormat=iso`;
  
  console.log(`[fetchOddsForStorage] Fetching: ${sportKey}`);

  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[fetchOddsForStorage] API Error ${response.status}:`, errorText);
      
      return {
        success: false,
        message: `API Error ${response.status}: ${errorText}`,
        odds: [],
        sport: sport
      };
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        message: `No ${sport} games available`,
        odds: [],
        sport: sport
      };
    }

    // Filter for upcoming games (next 7 days for storage)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const filteredOdds = data.filter(game => {
      const gameTime = new Date(game.commence_time);
      return gameTime > now && 
             gameTime < weekFromNow && 
             game.bookmakers && 
             game.bookmakers.length > 0;
    });

    console.log(`[fetchOddsForStorage] Filtered ${filteredOdds.length}/${data.length} games for ${sport}`);

    return {
      success: true,
      message: `Collected ${filteredOdds.length} ${sport} games`,
      odds: filteredOdds,
      sport: sport,
      markets: markets,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[fetchOddsForStorage] Network error:`, error);
    return {
      success: false,
      message: `Network error: ${error.message}`,
      odds: [],
      sport: sport
    };
  }
}