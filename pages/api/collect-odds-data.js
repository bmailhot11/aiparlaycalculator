// Automated odds data collection for Supabase storage
import { supabase } from '../../utils/supabaseClient.js';

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
          // Store in Supabase
          const snapshotId = await storeOddsInSupabase(sport, oddsData);
          
          results.collected.push({
            sport,
            games: oddsData.odds.length,
            snapshotId,
            timestamp: new Date().toISOString()
          });
          
          console.log(`[Odds Collection] Stored ${oddsData.odds.length} ${sport} games in Supabase`);
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

// Store odds data in Supabase
async function storeOddsInSupabase(sport, oddsData) {
  const timestamp = new Date().toISOString();
  const snapshotId = `${sport}_${Date.now()}`;
  
  try {
    // Store in cache_data table for immediate use
    const cacheKey = `${sport}_h2h_us_manual`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const { error: cacheError } = await supabase
      .from('cache_data')
      .upsert({
        cache_key: cacheKey,
        data: oddsData.odds,
        sport: sport,
        cache_type: 'h2h',
        market: 'moneyline',
        expires_at: expiresAt.toISOString(),
        updated_at: timestamp
      }, {
        onConflict: 'cache_key'
      });

    if (cacheError) {
      console.error('❌ [Supabase] Cache storage error:', cacheError.message);
    } else {
      console.log(`✅ [Supabase] Cached ${oddsData.odds.length} ${sport} games`);
    }
    
    // Also store in historical odds table if it exists
    try {
      const { error: historyError } = await supabase
        .from('odds_history')
        .insert({
          snapshot_id: snapshotId,
          sport: sport,
          timestamp: timestamp,
          game_count: oddsData.odds.length,
          odds_data: oddsData.odds,
          markets: ['h2h', 'spreads', 'totals'],
          source: 'manual_collection'
        });
        
      if (!historyError) {
        console.log(`✅ [Supabase] Stored historical snapshot: ${snapshotId}`);
      }
    } catch (historyError) {
      console.log('ℹ️ [Supabase] Historical table not available, using cache only');
    }
    
    return snapshotId;
    
  } catch (error) {
    console.error('❌ [Supabase] Storage error:', error.message);
    throw error;
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