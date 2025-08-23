// OPTIMIZED CACHE LAYER - Minimize 250GB Egress Limit
// Multi-tier caching with aggressive deduplication and compression

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OptimizedCacheLayer {
  constructor() {
    this.inMemoryCache = new Map(); // L1 cache (fastest)
    this.maxMemoryCacheSize = 1000;  // Limit memory usage
    this.compressionThreshold = 1024; // Compress responses >1KB
    
    this.egressStats = {
      totalBytes: 0,
      cacheHits: 0,
      cacheMisses: 0,
      compressionSaved: 0
    };
    
    // Initialize cache cleanup
    this.startCacheCleanup();
  }

  // =============================================================================
  // 1. SMART CACHE KEY GENERATION (AVOID DUPLICATE REQUESTS)
  // =============================================================================

  generateCacheKey(endpoint, params, userId = null) {
    // Create deterministic cache key
    const baseKey = `${endpoint}_${JSON.stringify(params, Object.keys(params).sort())}`;
    const hash = createHash('md5').update(baseKey).digest('hex').substring(0, 16);
    
    // User-specific vs global caching
    return userId ? `user_${userId}_${hash}` : `global_${hash}`;
  }

  generateLLMCacheKey(prompt, model, temperature = 0.1) {
    const key = `${model}_${temperature}_${prompt}`;
    return createHash('sha256').update(key).digest('hex');
  }

  // =============================================================================
  // 2. TIERED CACHING SYSTEM (L1 -> L2 -> L3)
  // =============================================================================

  async get(cacheKey) {
    // L1: In-memory cache (fastest, no egress)
    if (this.inMemoryCache.has(cacheKey)) {
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached.expires > Date.now()) {
        this.egressStats.cacheHits++;
        console.log(`⚡ [Cache] L1 HIT: ${cacheKey}`);
        return this.decompress(cached.data);
      } else {
        this.inMemoryCache.delete(cacheKey);
      }
    }

    // L2: Supabase cache table (medium speed, counts toward egress)
    try {
      const { data: cached } = await supabase
        .from('response_cache')
        .select('response_data, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        // Promote to L1 cache
        this.setL1Cache(cacheKey, cached.response_data, new Date(cached.expires_at));
        
        this.egressStats.cacheHits++;
        console.log(`💾 [Cache] L2 HIT: ${cacheKey}`);
        return cached.response_data;
      }
    } catch (error) {
      // Cache miss, continue to generation
    }

    this.egressStats.cacheMisses++;
    console.log(`❌ [Cache] MISS: ${cacheKey}`);
    return null;
  }

  async set(cacheKey, data, ttlSeconds = 300) {
    const expires = new Date(Date.now() + ttlSeconds * 1000);
    
    // Always set L1 cache (no egress cost)
    this.setL1Cache(cacheKey, data, expires);
    
    // Set L2 cache in Supabase (for persistence across restarts)
    try {
      const compressed = this.compress(data);
      
      await supabase
        .from('response_cache')
        .upsert({
          cache_key: cacheKey,
          response_data: compressed,
          expires_at: expires.toISOString(),
          hit_count: 1
        }, { onConflict: 'cache_key' });
        
      console.log(`✅ [Cache] SET: ${cacheKey} (${ttlSeconds}s TTL)`);
    } catch (error) {
      console.error(`❌ [Cache] Failed to set L2 cache for ${cacheKey}:`, error.message);
    }
  }

  setL1Cache(cacheKey, data, expires) {
    // Manage memory cache size
    if (this.inMemoryCache.size >= this.maxMemoryCacheSize) {
      // Remove oldest entries (LRU-style)
      const firstKey = this.inMemoryCache.keys().next().value;
      this.inMemoryCache.delete(firstKey);
    }
    
    this.inMemoryCache.set(cacheKey, {
      data: this.compress(data),
      expires: expires.getTime()
    });
  }

  // =============================================================================
  // 3. COMPRESSION TO SAVE EGRESS (EVERY BYTE COUNTS)
  // =============================================================================

  compress(data) {
    if (typeof data === 'string' && data.length > this.compressionThreshold) {
      // Simple compression for JSON strings
      const compressed = JSON.stringify(JSON.parse(data));
      this.egressStats.compressionSaved += data.length - compressed.length;
      return compressed;
    }
    return data;
  }

  decompress(data) {
    return data; // For now, just return as-is
  }

  // =============================================================================
  // 4. SPECIALIZED CACHING FOR COMMON PATTERNS
  // =============================================================================

  async getCachedOdds(gameId, marketId, maxAgeSeconds = 30) {
    const cacheKey = this.generateCacheKey('odds', { gameId, marketId });
    
    let cached = await this.get(cacheKey);
    if (cached) return cached;
    
    // Generate fresh odds from materialized view (efficient)
    try {
      const { data: odds } = await supabase
        .from('mv_current_best_odds')
        .select('*')
        .eq('game_id', gameId)
        .eq('market_id', marketId);
        
      if (odds && odds.length > 0) {
        await this.set(cacheKey, odds, maxAgeSeconds);
        return odds;
      }
    } catch (error) {
      console.error('❌ [Cache] Failed to fetch odds:', error.message);
    }
    
    return null;
  }

  async getCachedGameSummary(gameId, maxAgeSeconds = 300) {
    const cacheKey = this.generateCacheKey('game_summary', { gameId });
    
    let cached = await this.get(cacheKey);
    if (cached) return cached;
    
    // Generate fresh game summary
    try {
      const { data: game } = await supabase
        .from('games_metadata')
        .select('*')
        .eq('game_id', gameId)
        .single();
        
      if (game) {
        // Add best odds for main markets
        const markets = ['h2h', 'spreads', 'totals'];
        const oddsPromises = markets.map(market => 
          this.getCachedOdds(gameId, market, 60)
        );
        
        const [h2h, spreads, totals] = await Promise.all(oddsPromises);
        
        const summary = {
          ...game,
          best_odds: { h2h, spreads, totals }
        };
        
        await this.set(cacheKey, summary, maxAgeSeconds);
        return summary;
      }
    } catch (error) {
      console.error('❌ [Cache] Failed to fetch game summary:', error.message);
    }
    
    return null;
  }

  // =============================================================================
  // 5. PAGINATED RESPONSES (MINIMIZE SINGLE REQUEST SIZE)
  // =============================================================================

  async getCachedPaginatedOdds(sport, page = 1, limit = 20, maxAgeSeconds = 60) {
    const cacheKey = this.generateCacheKey('paginated_odds', { sport, page, limit });
    
    let cached = await this.get(cacheKey);
    if (cached) return cached;
    
    try {
      // Use materialized view for efficiency
      const offset = (page - 1) * limit;
      
      const { data: odds, count } = await supabase
        .from('mv_current_best_odds')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);
        
      const result = {
        data: odds || [],
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit)
        },
        cached_at: new Date().toISOString()
      };
      
      await this.set(cacheKey, result, maxAgeSeconds);
      return result;
    } catch (error) {
      console.error('❌ [Cache] Failed to fetch paginated odds:', error.message);
      return {
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
        error: error.message
      };
    }
  }

  // =============================================================================
  // 6. LLM RESPONSE CACHING (MINIMIZE TOKEN USAGE)
  // =============================================================================

  async getCachedLLMResponse(prompt, model = 'gpt-4o-mini', temperature = 0.1, maxAgeHours = 24) {
    const cacheKey = this.generateLLMCacheKey(prompt, model, temperature);
    
    try {
      const { data: cached } = await supabase
        .from('llm_cache')
        .select('*')
        .eq('prompt_hash', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
        
      if (cached) {
        // Increment hit count
        await supabase
          .from('llm_cache')
          .update({ hit_count: cached.hit_count + 1 })
          .eq('prompt_hash', cacheKey);
          
        console.log(`🧠 [LLM Cache] HIT: ${cached.prompt_summary} (${cached.hit_count + 1} hits)`);
        return cached.response_json;
      }
    } catch (error) {
      console.log(`🧠 [LLM Cache] MISS: ${prompt.substring(0, 50)}...`);
    }
    
    return null;
  }

  async setCachedLLMResponse(prompt, model, temperature, response, tokenCount) {
    const cacheKey = this.generateLLMCacheKey(prompt, model, temperature);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    try {
      await supabase
        .from('llm_cache')
        .upsert({
          prompt_hash: cacheKey,
          model,
          prompt_summary: prompt.substring(0, 128),
          response_json: response,
          token_count: tokenCount,
          temperature,
          expires_at: expires.toISOString(),
          hit_count: 1
        }, { onConflict: 'prompt_hash' });
        
      console.log(`🧠 [LLM Cache] SET: ${tokenCount} tokens saved`);
    } catch (error) {
      console.error('❌ [LLM Cache] Failed to cache response:', error.message);
    }
  }

  // =============================================================================
  // 7. EGRESS TRACKING & OPTIMIZATION
  // =============================================================================

  trackEgressUsage(bytes, endpoint) {
    this.egressStats.totalBytes += bytes;
    
    // Log to database every hour
    const hour = new Date();
    hour.setMinutes(0, 0, 0);
    
    this.updateEgressStats(hour, bytes, endpoint);
  }

  async updateEgressStats(hour, bytes, endpoint) {
    try {
      await supabase
        .from('egress_tracking')
        .upsert({
          hour: hour.toISOString(),
          api_calls: 1,
          bytes_served: bytes,
          cache_hits: this.egressStats.cacheHits,
          cache_misses: this.egressStats.cacheMisses
        }, { 
          onConflict: 'hour',
          ignoreDuplicates: false 
        });
    } catch (error) {
      console.error('❌ [Cache] Failed to update egress stats:', error.message);
    }
  }

  // =============================================================================
  // 8. CACHE MAINTENANCE
  // =============================================================================

  startCacheCleanup() {
    // Clean expired entries every 10 minutes
    setInterval(async () => {
      await this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
    
    // Reset in-memory cache every hour to prevent memory leaks
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 60 * 60 * 1000);
  }

  async cleanupExpiredCache() {
    try {
      // Clean response cache
      const { error: responseError } = await supabase
        .from('response_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
        
      // Clean LLM cache
      const { error: llmError } = await supabase
        .from('llm_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
        
      if (!responseError && !llmError) {
        console.log('🧹 [Cache] Cleaned expired cache entries');
      }
    } catch (error) {
      console.error('❌ [Cache] Cleanup failed:', error.message);
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, value] of this.inMemoryCache.entries()) {
      if (value.expires < now) {
        this.inMemoryCache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 [Cache] Removed ${removed} expired memory cache entries`);
    }
  }

  // =============================================================================
  // 9. MONITORING & STATISTICS
  // =============================================================================

  getCacheStats() {
    return {
      memory_cache_size: this.inMemoryCache.size,
      max_memory_cache_size: this.maxMemoryCacheSize,
      egress_stats: this.egressStats,
      cache_hit_rate: (this.egressStats.cacheHits / (this.egressStats.cacheHits + this.egressStats.cacheMisses) * 100).toFixed(2) + '%',
      compression_saved_bytes: this.egressStats.compressionSaved,
      estimated_egress_saved: `${(this.egressStats.compressionSaved / 1024 / 1024).toFixed(2)}MB`
    };
  }

  async getDatabaseCacheStats() {
    try {
      const { data: responseStats } = await supabase
        .from('response_cache')
        .select('cache_key, hit_count, created_at')
        .order('hit_count', { ascending: false })
        .limit(10);
        
      const { data: llmStats } = await supabase
        .from('llm_cache')
        .select('prompt_summary, hit_count, token_count, created_at')
        .order('hit_count', { ascending: false })
        .limit(10);
        
      return {
        top_cached_responses: responseStats || [],
        top_cached_llm: llmStats || [],
        memory_stats: this.getCacheStats()
      };
    } catch (error) {
      console.error('❌ [Cache] Failed to get DB cache stats:', error.message);
      return { error: error.message };
    }
  }

  // =============================================================================
  // 10. EMERGENCY CACHE PURGE (IF APPROACHING EGRESS LIMITS)
  // =============================================================================

  async emergencyPurgeCache() {
    console.log('🚨 [Cache] EMERGENCY PURGE: Clearing all caches to save egress');
    
    try {
      // Clear memory cache
      this.inMemoryCache.clear();
      
      // Clear response cache (keep only last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await supabase
        .from('response_cache')
        .delete()
        .lt('created_at', oneHourAgo.toISOString());
        
      // Keep LLM cache (high value, low egress impact)
      
      console.log('🚨 [Cache] Emergency purge completed');
      return { success: true, message: 'Cache purged to save egress' };
    } catch (error) {
      console.error('❌ [Cache] Emergency purge failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
const cacheLayer = new OptimizedCacheLayer();
export default cacheLayer;