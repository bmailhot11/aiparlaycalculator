// OPTIMIZED ODDS API - Supabase Pro Compliant
// Paginated responses, aggressive caching, minimal egress usage

import cacheLayer from '../../../lib/optimized-cache-layer.js';
import tokenEfficientLLM from '../../../lib/token-efficient-llm.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  let responseSize = 0;
  
  try {
    const { method } = req;
    const { 
      sport, 
      game_id, 
      market, 
      page = 1, 
      limit = 20,
      include_analysis = false,
      fresh = false 
    } = req.query;

    if (method !== 'GET') {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }

    // Validate pagination limits (prevent large responses that waste egress)
    const pageLimit = Math.min(parseInt(limit) || 20, 50); // Max 50 per page
    const pageNum = Math.max(parseInt(page) || 1, 1);

    if (!sport) {
      return res.status(400).json({
        success: false,
        message: 'Sport parameter required',
        available_sports: ['NFL', 'NBA', 'NHL', 'MLB', 'MLS', 'UFC']
      });
    }

    let result;

    // Route 1: Specific game odds
    if (game_id) {
      result = await getGameOdds(game_id, market, include_analysis, fresh);
    }
    // Route 2: Paginated sport odds
    else {
      result = await getPaginatedOdds(sport, market, pageNum, pageLimit, fresh);
    }

    // Track response size for egress monitoring
    const responseJson = JSON.stringify(result);
    responseSize = Buffer.byteLength(responseJson, 'utf8');
    
    // Track egress usage
    cacheLayer.trackEgressUsage(responseSize, req.url);
    
    const processingTime = Date.now() - startTime;
    
    // Add metadata for monitoring
    result.meta = {
      processing_time_ms: processingTime,
      response_size_bytes: responseSize,
      cached: result.cached || false,
      egress_optimized: true,
      supabase_pro_compliant: true
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ [ProOdds] API error:', error);
    
    const errorResponse = {
      success: false,
      message: 'Failed to fetch odds',
      error: error.message,
      meta: {
        processing_time_ms: Date.now() - startTime,
        response_size_bytes: responseSize
      }
    };
    
    return res.status(500).json(errorResponse);
  }
}

// =============================================================================
// OPTIMIZED DATA FETCHING FUNCTIONS
// =============================================================================

async function getGameOdds(gameId, market, includeAnalysis, fresh) {
  const maxAge = fresh ? 30 : 300; // 30s fresh, 5min normal
  
  // Get cached game summary (includes best odds)
  const gameData = await cacheLayer.getCachedGameSummary(gameId, maxAge);
  
  if (!gameData) {
    return {
      success: false,
      message: `Game ${gameId} not found`,
      cached: false
    };
  }

  // Filter to specific market if requested
  let odds = gameData.best_odds;
  if (market && odds[market]) {
    odds = { [market]: odds[market] };
  }

  const result = {
    success: true,
    game: {
      game_id: gameData.game_id,
      sport: gameData.sport,
      home_team: gameData.home_team,
      away_team: gameData.away_team,
      commence_time: gameData.commence_time,
      status: gameData.status
    },
    odds: odds,
    cached: true
  };

  // Add AI analysis if requested (minimal tokens)
  if (includeAnalysis && odds.h2h && odds.h2h.length > 0) {
    try {
      const bestOdds = odds.h2h[0];
      const analysis = await tokenEfficientLLM.generateBetAnalysis({
        odds: bestOdds.odds_american,
        probability: tokenEfficientLLM.impliedProbability(bestOdds.odds_american),
        line_movement: 0 // Would need historical data
      });
      
      result.ai_analysis = analysis;
    } catch (error) {
      result.ai_analysis = { error: 'Analysis unavailable' };
    }
  }

  return result;
}

async function getPaginatedOdds(sport, market, page, limit, fresh) {
  const maxAge = fresh ? 60 : 300; // 1min fresh, 5min normal
  
  // Use cached paginated response to minimize egress
  const oddsData = await cacheLayer.getCachedPaginatedOdds(
    sport, page, limit, maxAge
  );

  if (!oddsData || !oddsData.data) {
    return {
      success: false,
      message: `No odds available for ${sport}`,
      cached: false,
      data: [],
      pagination: {
        page: page,
        limit: limit,
        total: 0,
        pages: 0
      }
    };
  }

  // Filter by market if specified
  let filteredData = oddsData.data;
  if (market) {
    filteredData = filteredData.filter(odds => 
      odds.market_id === market || 
      (market === 'h2h' && odds.market_id === 'moneyline')
    );
  }

  // Format for consistent API response
  const formattedOdds = filteredData.map(odds => ({
    game_id: odds.game_id,
    market: odds.market_id,
    outcome: odds.outcome_name,
    sportsbook: odds.book_id,
    odds: {
      american: odds.odds_american,
      decimal: odds.odds_decimal,
      implied_probability: tokenEfficientLLM.impliedProbability(odds.odds_american)
    },
    last_update: odds.ts,
    rank: odds.rank || 1
  }));

  return {
    success: true,
    sport: sport,
    market: market || 'all',
    data: formattedOdds,
    pagination: {
      ...oddsData.pagination,
      showing: formattedOdds.length
    },
    cached: true,
    cache_age: oddsData.cached_at
  };
}

// =============================================================================
// SPECIALIZED ENDPOINTS FOR COMMON USE CASES
// =============================================================================

// Get best odds for a specific outcome (most efficient)
async function getBestOdds(gameId, market, outcome) {
  const cacheKey = cacheLayer.generateCacheKey('best_odds', { gameId, market, outcome });
  
  let cached = await cacheLayer.get(cacheKey);
  if (cached) return cached;
  
  try {
    const { data: bestOdds } = await supabase
      .from('mv_current_best_odds')
      .select('*')
      .eq('game_id', gameId)
      .eq('market_id', market)
      .eq('outcome_name', outcome)
      .eq('rank', 1) // Only best odds
      .single();
      
    if (bestOdds) {
      const result = {
        game_id: gameId,
        market: market,
        outcome: outcome,
        best_odds: {
          sportsbook: bestOdds.book_id,
          odds_american: bestOdds.odds_american,
          odds_decimal: bestOdds.odds_decimal,
          implied_probability: tokenEfficientLLM.impliedProbability(bestOdds.odds_american),
          last_update: bestOdds.ts
        },
        alternatives_available: true // Indicate more options exist
      };
      
      await cacheLayer.set(cacheKey, result, 60); // 1 minute cache
      return result;
    }
  } catch (error) {
    console.error('❌ [ProOdds] Failed to get best odds:', error.message);
  }
  
  return null;
}

// Get line movement summary (pre-computed in materialized view)
async function getLineMovement(gameId, market, outcome) {
  const cacheKey = cacheLayer.generateCacheKey('movement', { gameId, market, outcome });
  
  let cached = await cacheLayer.get(cacheKey);
  if (cached) return cached;
  
  try {
    const { data: movement } = await supabase
      .from('mv_line_movement')
      .select('*')
      .eq('game_id', gameId)
      .eq('market_id', market)
      .eq('outcome_name', outcome)
      .single();
      
    if (movement) {
      const result = {
        game_id: gameId,
        market: market,
        outcome: outcome,
        movement: {
          opening_odds: movement.opening_odds,
          current_odds: movement.current_odds,
          min_odds: movement.min_odds,
          max_odds: movement.max_odds,
          movement_count: movement.movement_count,
          last_update: movement.last_update,
          trend: movement.current_odds > movement.opening_odds ? 'lengthening' : 'shortening'
        }
      };
      
      await cacheLayer.set(cacheKey, result, 300); // 5 minute cache
      return result;
    }
  } catch (error) {
    console.error('❌ [ProOdds] Failed to get movement:', error.message);
  }
  
  return null;
}

// Export helper functions for internal use
export { getGameOdds, getPaginatedOdds, getBestOdds, getLineMovement };