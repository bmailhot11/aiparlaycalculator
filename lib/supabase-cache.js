// Supabase caching system optimized for 5-minute Odds API refresh cycle
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Missing Supabase environment variables - cache disabled');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

class SupabaseCache {
  constructor() {
    this.isConnected = false;
    this.testConnection();
  }

  async testConnection() {
    if (!supabase) {
      console.log('⚠️ [SupabaseCache] No client - cache disabled');
      this.isConnected = false;
      return;
    }
    
    try {
      const { error } = await supabase.from('cache_data').select('id').limit(1);
      if (error && !error.message.includes('relation "cache_data" does not exist')) {
        console.error('❌ [SupabaseCache] Connection test failed:', error.message);
        this.isConnected = false;
      } else {
        console.log('✅ [SupabaseCache] Connected successfully');
        this.isConnected = true;
      }
    } catch (error) {
      console.error('❌ [SupabaseCache] Connection failed:', error.message);
      this.isConnected = false;
    }
  }

  // OPTIMIZED: 5-minute TTL for odds to match Odds API refresh cycle
  async cacheOdds(sport, data) {
    if (!supabase || !this.isConnected) return false;
    
    const cacheKey = `odds_${sport}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    try {
      const { error } = await supabase
        .from('cache_data')
        .upsert({
          cache_key: cacheKey,
          data: data,
          sport: sport,
          cache_type: 'odds',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to cache odds:', error.message);
        return false;
      }
      
      console.log(`✅ [SupabaseCache] Cached odds for ${sport} (expires in 5 mins)`);
      return true;
    } catch (error) {
      console.error('❌ [SupabaseCache] Cache error:', error.message);
      return false;
    }
  }

  async getOdds(sport) {
    if (!this.isConnected) return null;
    
    const cacheKey = `odds_${sport}`;
    
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [SupabaseCache] Failed to get cached odds:', error.message);
        return null;
      }
      
      if (data) {
        const age = Math.round((Date.now() - new Date(data.updated_at).getTime()) / 1000);
        console.log(`🎯 [SupabaseCache] Cache HIT for ${sport} (age: ${age}s)`);
        return data.data;
      }
      
      console.log(`❌ [SupabaseCache] Cache MISS for ${sport}`);
      return null;
    } catch (error) {
      console.error('❌ [SupabaseCache] Cache retrieval error:', error.message);
      return null;
    }
  }

  // 10-minute TTL for processed EV data (more stable)
  async cacheEVData(sport, data) {
    if (!this.isConnected) return false;
    
    const cacheKey = `ev_${sport}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    try {
      const { error } = await supabase
        .from('cache_data')
        .upsert({
          cache_key: cacheKey,
          data: data,
          sport: sport,
          cache_type: 'ev',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to cache EV data:', error.message);
        return false;
      }
      
      console.log(`✅ [SupabaseCache] Cached EV data for ${sport} (expires in 10 mins)`);
      return true;
    } catch (error) {
      console.error('❌ [SupabaseCache] EV cache error:', error.message);
      return false;
    }
  }

  async getEVData(sport) {
    if (!this.isConnected) return null;
    
    const cacheKey = `ev_${sport}`;
    
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [SupabaseCache] Failed to get cached EV data:', error.message);
        return null;
      }
      
      if (data) {
        const age = Math.round((Date.now() - new Date(data.updated_at).getTime()) / 1000);
        console.log(`🎯 [SupabaseCache] EV Cache HIT for ${sport} (age: ${age}s)`);
        return data.data;
      }
      
      console.log(`❌ [SupabaseCache] EV Cache MISS for ${sport}`);
      return null;
    } catch (error) {
      console.error('❌ [SupabaseCache] EV cache retrieval error:', error.message);
      return null;
    }
  }

  // 15-minute TTL for arbitrage data (less time-sensitive)
  async cacheArbitrageData(sport, data) {
    if (!this.isConnected) return false;
    
    const cacheKey = `arbitrage_${sport}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    try {
      const { error } = await supabase
        .from('cache_data')
        .upsert({
          cache_key: cacheKey,
          data: data,
          sport: sport,
          cache_type: 'arbitrage',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to cache arbitrage data:', error.message);
        return false;
      }
      
      console.log(`✅ [SupabaseCache] Cached arbitrage data for ${sport} (expires in 15 mins)`);
      return true;
    } catch (error) {
      console.error('❌ [SupabaseCache] Arbitrage cache error:', error.message);
      return false;
    }
  }

  async getArbitrageData(sport) {
    if (!this.isConnected) return null;
    
    const cacheKey = `arbitrage_${sport}`;
    
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [SupabaseCache] Failed to get cached arbitrage data:', error.message);
        return null;
      }
      
      if (data) {
        const age = Math.round((Date.now() - new Date(data.updated_at).getTime()) / 1000);
        console.log(`🎯 [SupabaseCache] Arbitrage Cache HIT for ${sport} (age: ${age}s)`);
        return data.data;
      }
      
      console.log(`❌ [SupabaseCache] Arbitrage Cache MISS for ${sport}`);
      return null;
    } catch (error) {
      console.error('❌ [SupabaseCache] Arbitrage cache retrieval error:', error.message);
      return null;
    }
  }

  // Store historical odds for line movement analysis (permanent storage)
  async storeHistoricalOdds(sport, gameId, oddsData) {
    if (!this.isConnected) return false;
    
    try {
      const { error } = await supabase
        .from('odds_history')
        .insert({
          sport: sport,
          game_id: gameId,
          odds_data: oddsData,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to store historical odds:', error.message);
        return false;
      }
      
      console.log(`📊 [SupabaseCache] Stored historical odds for ${sport} game ${gameId}`);
      return true;
    } catch (error) {
      console.error('❌ [SupabaseCache] Historical storage error:', error.message);
      return false;
    }
  }

  // Clean up expired cache entries (run periodically)
  async cleanupExpiredCache() {
    if (!this.isConnected) return;
    
    try {
      const { error } = await supabase
        .from('cache_data')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to cleanup expired cache:', error.message);
      } else {
        console.log('🧹 [SupabaseCache] Cleaned up expired cache entries');
      }
    } catch (error) {
      console.error('❌ [SupabaseCache] Cleanup error:', error.message);
    }
  }

  // Get cache statistics
  async getCacheStats() {
    if (!this.isConnected) return null;
    
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('cache_type, sport, expires_at, updated_at')
        .gt('expires_at', new Date().toISOString());
      
      if (error) {
        console.error('❌ [SupabaseCache] Failed to get cache stats:', error.message);
        return null;
      }
      
      const stats = {
        total_active: data.length,
        by_type: {},
        by_sport: {},
        oldest_entry: null,
        newest_entry: null
      };
      
      data.forEach(entry => {
        stats.by_type[entry.cache_type] = (stats.by_type[entry.cache_type] || 0) + 1;
        stats.by_sport[entry.sport] = (stats.by_sport[entry.sport] || 0) + 1;
        
        const updated = new Date(entry.updated_at);
        if (!stats.oldest_entry || updated < new Date(stats.oldest_entry)) {
          stats.oldest_entry = entry.updated_at;
        }
        if (!stats.newest_entry || updated > new Date(stats.newest_entry)) {
          stats.newest_entry = entry.updated_at;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('❌ [SupabaseCache] Stats error:', error.message);
      return null;
    }
  }
}

// Export singleton instance
const supabaseCache = new SupabaseCache();
module.exports = supabaseCache;
module.exports.default = supabaseCache;