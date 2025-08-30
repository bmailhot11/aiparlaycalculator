/**
 * Historical Data Service
 * Connects historical betting performance data to real-time calculations
 */

const { supabase } = require('../utils/supabaseClient');

class HistoricalDataService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Get historical hit rate for a specific market/team/sport combination
   * @param {Object} params - Query parameters
   * @returns {Object} Historical performance data
   */
  async getHistoricalHitRate(params) {
    const { sport, market_type, team, selection, lookbackDays = 90 } = params;
    
    // Create cache key
    const cacheKey = `${sport}_${market_type}_${team}_${selection}_${lookbackDays}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Query historical performance from reco_bet_legs (actual table name)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      let query = supabase
        .from('reco_bet_legs')
        .select('result, market_type, selection, sport, home_team, away_team')
        .gte('commence_time', startDate.toISOString())
        .in('result', ['win', 'loss']); // Exclude pushes and voids

      // Apply filters
      if (sport) query = query.eq('sport', sport);
      if (market_type) query = query.eq('market_type', market_type);
      
      // Team filter (check both home and away)
      if (team) {
        query = query.or(`home_team.eq.${team},away_team.eq.${team}`);
      }

      const { data: results, error } = await query;

      if (error) {
        console.error('Error fetching historical data:', error);
        return null;
      }

      if (!results || results.length === 0) {
        return null;
      }

      // Calculate hit rate and other metrics
      const wins = results.filter(r => r.result === 'win').length;
      const losses = results.filter(r => r.result === 'loss').length;
      const total = wins + losses;
      
      const hitRate = total > 0 ? wins / total : null;
      
      // Calculate market-specific hit rates
      const marketStats = this.calculateMarketStats(results, market_type);
      
      const historicalData = {
        hit_rate: hitRate,
        sample_size: total,
        wins,
        losses,
        confidence: this.calculateConfidence(total),
        market_stats: marketStats,
        last_updated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: historicalData,
        timestamp: Date.now()
      });

      return historicalData;

    } catch (error) {
      console.error('Historical data service error:', error);
      return null;
    }
  }

  /**
   * Calculate market-specific statistics
   */
  calculateMarketStats(results, market_type) {
    const stats = {
      favorites: { wins: 0, total: 0 },
      underdogs: { wins: 0, total: 0 },
      overs: { wins: 0, total: 0 },
      unders: { wins: 0, total: 0 },
      home: { wins: 0, total: 0 },
      away: { wins: 0, total: 0 }
    };

    results.forEach(result => {
      const won = result.result === 'win';
      
      // Parse selection for categorization
      const selection = result.selection.toLowerCase();
      
      if (market_type === 'h2h') {
        // Moneyline specific stats
        if (selection.includes(result.home_team?.toLowerCase())) {
          stats.home.total++;
          if (won) stats.home.wins++;
        } else if (selection.includes(result.away_team?.toLowerCase())) {
          stats.away.total++;
          if (won) stats.away.wins++;
        }
      } else if (market_type === 'totals') {
        // Totals specific stats
        if (selection.includes('over')) {
          stats.overs.total++;
          if (won) stats.overs.wins++;
        } else if (selection.includes('under')) {
          stats.unders.total++;
          if (won) stats.unders.wins++;
        }
      }
    });

    // Calculate hit rates for each category
    Object.keys(stats).forEach(key => {
      if (stats[key].total > 0) {
        stats[key].hit_rate = stats[key].wins / stats[key].total;
      } else {
        stats[key].hit_rate = null;
      }
    });

    return stats;
  }

  /**
   * Calculate confidence level based on sample size
   */
  calculateConfidence(sampleSize) {
    if (sampleSize >= 100) return 'high';
    if (sampleSize >= 30) return 'medium';
    if (sampleSize >= 10) return 'low';
    return 'very_low';
  }

  /**
   * Get closing odds for CLV calculation
   */
  async getClosingOdds(gameId, marketType, selection, sportsbook = null) {
    try {
      // First check if we have stored closing odds in cache_data
      const { data: cachedOdds, error: cacheError } = await supabase
        .from('cache_data')
        .select('data')
        .eq('cache_key', `closing_${gameId}_${marketType}`)
        .single();

      if (cachedOdds && cachedOdds.data) {
        // Extract the specific selection's closing odds
        const closingData = cachedOdds.data;
        
        // Find the matching selection
        for (const bookmaker of closingData.bookmakers || []) {
          if (sportsbook && bookmaker.title !== sportsbook) continue;
          
          const market = bookmaker.markets?.find(m => m.key === marketType);
          const outcome = market?.outcomes?.find(o => 
            o.name === selection || o.description === selection
          );
          
          if (outcome) {
            return {
              odds: outcome.price,
              decimal_odds: this.americanToDecimal(outcome.price),
              sportsbook: bookmaker.title,
              timestamp: closingData.timestamp
            };
          }
        }
      }

      // Fallback: Query from odds_history if available
      const { data: historicalOdds, error: histError } = await supabase
        .from('odds_history')
        .select('odds_data')
        .eq('game_id', gameId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (historicalOdds && historicalOdds.odds_data) {
        // Process historical odds similar to cached odds
        const oddsData = historicalOdds.odds_data;
        
        for (const game of oddsData) {
          if (game.id !== gameId) continue;
          
          for (const bookmaker of game.bookmakers || []) {
            if (sportsbook && bookmaker.title !== sportsbook) continue;
            
            const market = bookmaker.markets?.find(m => m.key === marketType);
            const outcome = market?.outcomes?.find(o => 
              o.name === selection || o.description === selection
            );
            
            if (outcome) {
              return {
                odds: outcome.price,
                decimal_odds: this.americanToDecimal(outcome.price),
                sportsbook: bookmaker.title,
                timestamp: historicalOdds.timestamp
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching closing odds:', error);
      return null;
    }
  }

  /**
   * Convert American odds to decimal
   */
  americanToDecimal(american) {
    const odds = typeof american === 'string' ? 
      parseInt(american.replace('+', '')) : american;
    
    if (odds > 0) {
      return 1 + (odds / 100);
    } else {
      return 1 + (100 / Math.abs(odds));
    }
  }

  /**
   * Get performance metrics for a specific date range
   */
  async getPerformanceMetrics(startDate, endDate = new Date()) {
    try {
      const { data: metrics, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .gte('metric_date', startDate.toISOString())
        .lte('metric_date', endDate.toISOString())
        .order('metric_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching performance metrics:', error);
        return null;
      }

      return metrics?.[0] || null;
    } catch (error) {
      console.error('Performance metrics error:', error);
      return null;
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const historicalDataService = new HistoricalDataService();

module.exports = historicalDataService;