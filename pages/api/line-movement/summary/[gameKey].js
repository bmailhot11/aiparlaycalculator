/**
 * Line Movement API - Game Summary (Simplified)
 * Returns basic line movement data from cache_data
 */

const { supabase } = require('../../../../utils/supabaseClient');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { gameKey } = req.query;
  const { market = 'moneyline' } = req.query;

  if (!gameKey) {
    return res.status(400).json({
      success: false,
      message: 'Game key parameter required'
    });
  }

  try {
    console.log(`📊 Fetching line movement summary for: ${gameKey} ${market}`);
    
    // Look for cached game data
    const { data: cacheData, error } = await supabase
      .from('cache_data')
      .select('*')
      .ilike('cache_key', `%${gameKey}%`)
      .or(`cache_type.eq.h2h,cache_type.eq.spreads,cache_type.eq.totals`)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }
    
    if (!cacheData || cacheData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No line movement data found for this game',
        searched_key: gameKey
      });
    }

    // Basic summary from cached data
    const processedSummary = {
      success: true,
      game_key: gameKey,
      market,
      cache_entries: cacheData.length,
      data_sources: cacheData.map(entry => ({
        cache_key: entry.cache_key,
        sport: entry.sport,
        cache_type: entry.cache_type,
        updated_at: entry.updated_at,
        games_count: Array.isArray(entry.data) ? entry.data.length : 0
      })),
      note: 'Simplified line movement data from cache. Full historical tracking requires more data collection.'
    };

    return res.status(200).json(processedSummary);

  } catch (error) {
    console.error('❌ Line movement summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch line movement summary',
      error: error.message
    });
  }
}