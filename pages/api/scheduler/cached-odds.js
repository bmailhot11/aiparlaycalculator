// Get cached odds from Supabase (serves fresh data during off-hours)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { sport, market = 'h2h', region = 'us' } = req.query;

  if (!sport) {
    return res.status(400).json({
      success: false,
      message: 'Sport parameter required'
    });
  }

  try {
    const sportKeyMap = {
      'NFL': 'americanfootball_nfl',
      'NHL': 'icehockey_nhl',
      'MLB': 'baseball_mlb',
      'MLS': 'soccer_usa_mls',
      'UFC': 'mma_mixed_martial_arts'
    };

    const sportKey = sportKeyMap[sport.toUpperCase()];
    if (!sportKey) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sport. Use: NFL, NHL, MLB, MLS, UFC'
      });
    }

    const cacheKey = `${sportKey}_${market}_${region}`;
    console.log(`📖 [CachedOdds] Retrieving ${cacheKey}`);

    // Get cached data from Supabase
    const { data, error } = await supabase
      .from('cache_data')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [CachedOdds] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve cached odds',
        error: error.message
      });
    }

    if (!data) {
      // Check if we have any recent data (even if expired)
      const { data: recentData, error: recentError } = await supabase
        .from('cache_data')
        .select('*')
        .eq('cache_key', cacheKey)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (recentData) {
        const age = Math.round((Date.now() - new Date(recentData.updated_at).getTime()) / 1000 / 60);
        console.log(`⚠️ [CachedOdds] Serving stale data (${age} minutes old)`);
        
        return res.status(200).json({
          success: true,
          odds: recentData.data,
          cache_info: {
            age_minutes: age,
            stale: true,
            last_updated: recentData.updated_at,
            message: 'Serving cached odds from outside active refresh window'
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: `No cached odds available for ${sport}/${market}/${region}`,
        suggestion: 'Try force-refresh via /api/scheduler/control'
      });
    }

    // Calculate age of cached data
    const age = Math.round((Date.now() - new Date(data.updated_at).getTime()) / 1000);
    
    console.log(`✅ [CachedOdds] Serving fresh cached data (${age}s old)`);

    return res.status(200).json({
      success: true,
      odds: data.data,
      cache_info: {
        age_seconds: age,
        stale: false,
        last_updated: data.updated_at,
        expires_at: data.expires_at,
        games_count: data.data?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [CachedOdds] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cached odds',
      error: error.message
    });
  }
}