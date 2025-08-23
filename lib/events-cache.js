// lib/events-cache.js
// Advanced caching system for upcoming events with odds movement tracking

class EventsCache {
  constructor() {
    this.eventsCache = new Map();
    this.oddsHistory = new Map();
    this.historicalData = new Map(); // NEW: Long-term historical storage
    this.trendAnalysis = new Map(); // NEW: Computed trend data
    this.EVENTS_CACHE_TTL = 60 * 60 * 1000; // 1 hour for events list
    this.ODDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for odds
    this.HISTORICAL_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7 days of historical data
  }

  // Cache upcoming events (game schedules) - these change rarely
  async cacheUpcomingEvents(sport) {
    const cacheKey = `events_${sport}`;
    const cached = this.getCachedData(cacheKey, this.EVENTS_CACHE_TTL);
    
    if (cached) {
      console.log(`⚡ [EventsCache] Using cached events for ${sport}`);
      return cached;
    }

    // Fetch just the game schedules (no odds) - much cheaper API call
    const API_KEY = process.env.ODDS_API_KEY;
    if (!API_KEY) {
      throw new Error('Odds API key not configured');
    }

    const sportKeyMap = {
      'NFL': ['americanfootball_nfl_preseason', 'americanfootball_nfl'],
      'NBA': ['basketball_nba', 'basketball_nba_preseason'],
      'NHL': ['icehockey_nhl', 'icehockey_nhl_preseason'],
      'MLB': ['baseball_mlb'],
      'NCAAF': ['americanfootball_ncaaf'],
      'NCAAB': ['basketball_ncaab']
    };

    const sportKeys = sportKeyMap[sport];
    
    if (!sportKeys) {
      console.log(`⚠️ [EventsCache] Unsupported sport: ${sport}`);
      return [];
    }
    let allEvents = [];

    for (const sportKey of sportKeys) {
      try {
        // Fetch ONLY event schedule (no odds) - very cheap API call
        const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/events/?apiKey=${API_KEY}&dateFormat=iso`;
        const response = await fetch(url);
        
        if (response.ok) {
          const events = await response.json();
          console.log(`📅 [EventsCache] Found ${events.length} upcoming events for ${sportKey}`);
          
          allEvents.push(...events.map(event => ({
            ...event,
            sport_key: sportKey,
            cached_at: new Date().toISOString()
          })));
          
          if (allEvents.length >= 10) break; // Enough events found
        }
      } catch (error) {
        console.log(`Error fetching events for ${sportKey}:`, error.message);
      }
    }

    // Apply smart date filtering
    const filteredEvents = this.applySmartDateFiltering(allEvents);
    
    this.setCachedData(cacheKey, filteredEvents, this.EVENTS_CACHE_TTL);
    console.log(`📊 [EventsCache] Cached ${filteredEvents.length} events for ${sport}`);
    
    return filteredEvents;
  }

  // Get odds for specific events we know exist - targeted API calls
  async getOddsForEvents(events, markets = 'h2h,spreads,totals', includePlayerProps = true) {
    const oddsResults = [];
    const API_KEY = process.env.ODDS_API_KEY;
    
    // Group events by sport_key for efficient API calls
    const eventsBySport = events.reduce((acc, event) => {
      const key = event.sport_key;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});

    for (const [sportKey, sportEvents] of Object.entries(eventsBySport)) {
      // Smart player props: try with props first, fallback to basic markets
      const smartMarkets = this.getSmartMarkets(sportKey, markets, includePlayerProps);
      const cacheKey = `odds_${sportKey}_${smartMarkets}`;
      let cachedOdds = this.getCachedData(cacheKey, this.ODDS_CACHE_TTL);
      
      if (!cachedOdds) {
        // Try with player props first
        cachedOdds = await this.fetchOddsWithFallback(sportKey, smartMarkets, API_KEY);
        
        if (cachedOdds) {
          // Add sport_key to each game in cached odds for proper filtering
          cachedOdds = cachedOdds.map(game => ({ ...game, sport_key: sportKey }));
          this.setCachedData(cacheKey, cachedOdds, this.ODDS_CACHE_TTL);
          // Track odds movements
          this.trackOddsMovements(sportKey, cachedOdds);
        }
      }

      if (cachedOdds) {
        // Match cached odds with our known events - verify sport_key matches
        const matchedGames = cachedOdds.filter(game => 
          game.sport_key === sportKey && // Ensure sport matches
          sportEvents.some(event => 
            event.sport_key === game.sport_key && // Double-check sport
            event.home_team === game.home_team && 
            event.away_team === game.away_team
          )
        );
        
        oddsResults.push(...matchedGames);
      }
    }

    console.log(`🎯 [EventsCache] Got odds for ${oddsResults.length} games using cached events`);
    return oddsResults;
  }

  // Enhanced odds tracking with historical data storage
  trackOddsMovements(sportKey, currentOdds) {
    const historyKey = `odds_history_${sportKey}`;
    const historicalKey = `historical_${sportKey}`;
    const now = new Date().toISOString();
    
    const previousOdds = this.oddsHistory.get(historyKey);
    
    // Store current odds in historical data
    this.storeHistoricalData(historicalKey, currentOdds, now);
    
    if (previousOdds) {
      // Compare odds and detect significant movements
      const movements = this.detectOddsMovements(previousOdds, currentOdds);
      if (movements.length > 0) {
        console.log(`📈 [EventsCache] Detected ${movements.length} odds movements for ${sportKey}`);
        
        // Store movements in historical data for trend analysis
        this.storeMovements(historicalKey, movements, now);
      }
      
      // Update trend analysis
      this.updateTrendAnalysis(sportKey, previousOdds, currentOdds, now);
    }
    
    // Update short-term history
    this.oddsHistory.set(historyKey, {
      odds: currentOdds,
      timestamp: now
    });
  }

  // Store historical odds data for trend analysis
  storeHistoricalData(key, oddsData, timestamp) {
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, {
        odds_snapshots: [],
        movements: [],
        created_at: timestamp
      });
    }
    
    const historical = this.historicalData.get(key);
    
    // Add current snapshot
    historical.odds_snapshots.push({
      timestamp: timestamp,
      data: oddsData,
      snapshot_id: `${key}_${Date.now()}`
    });
    
    // Clean old data (keep 7 days)
    const cutoffTime = new Date(Date.now() - this.HISTORICAL_RETENTION).toISOString();
    historical.odds_snapshots = historical.odds_snapshots.filter(
      snapshot => snapshot.timestamp > cutoffTime
    );
    
    console.log(`📊 [EventsCache] Historical: ${historical.odds_snapshots.length} snapshots stored for ${key.split('_')[1]}`);
  }

  // Store movement data for analysis
  storeMovements(key, movements, timestamp) {
    const historical = this.historicalData.get(key);
    if (historical) {
      historical.movements.push({
        timestamp: timestamp,
        movements: movements,
        total_movements: movements.length
      });
      
      // Clean old movements
      const cutoffTime = new Date(Date.now() - this.HISTORICAL_RETENTION).toISOString();
      historical.movements = historical.movements.filter(
        movement => movement.timestamp > cutoffTime
      );
    }
  }

  // Update trend analysis with current data
  updateTrendAnalysis(sportKey, previousOdds, currentOdds, timestamp) {
    const trendKey = `trends_${sportKey}`;
    
    if (!this.trendAnalysis.has(trendKey)) {
      this.trendAnalysis.set(trendKey, {
        sportsbook_trends: new Map(),
        market_trends: new Map(),
        value_opportunities: [],
        best_timing_patterns: [],
        created_at: timestamp
      });
    }
    
    const trends = this.trendAnalysis.get(trendKey);
    
    // Analyze sportsbook performance trends
    currentOdds.forEach(currentGame => {
      const previousGame = previousOdds.odds.find(g => 
        g.home_team === currentGame.home_team && 
        g.away_team === currentGame.away_team
      );
      
      if (previousGame && currentGame.bookmakers) {
        currentGame.bookmakers.forEach(currentBook => {
          const bookTrend = trends.sportsbook_trends.get(currentBook.key) || {
            total_comparisons: 0,
            better_odds_count: 0,
            average_edge: 0,
            market_leadership: new Map(),
            last_updated: timestamp
          };
          
          // Compare this sportsbook vs market average
          const marketAverage = this.calculateMarketAverage(currentOdds, currentBook.key);
          if (marketAverage) {
            bookTrend.total_comparisons += 1;
            
            // Check if this book offers better value
            if (this.hasValueAdvantage(currentBook, marketAverage)) {
              bookTrend.better_odds_count += 1;
            }
            
            // Update average edge calculation
            const currentEdge = this.calculateBookmakerEdge(currentBook, marketAverage);
            bookTrend.average_edge = (bookTrend.average_edge * (bookTrend.total_comparisons - 1) + currentEdge) / bookTrend.total_comparisons;
          }
          
          trends.sportsbook_trends.set(currentBook.key, bookTrend);
        });
      }
    });
    
    // Clean old trend data (keep 24 hours of trends)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    trends.value_opportunities = trends.value_opportunities.filter(
      opp => opp.detected_at > cutoffTime
    );
    
    console.log(`📈 [EventsCache] Updated trend analysis for ${sportKey}: ${trends.sportsbook_trends.size} sportsbooks tracked`);
  }

  // Detect significant odds movements
  detectOddsMovements(previousOdds, currentOdds) {
    const movements = [];
    const SIGNIFICANT_MOVEMENT = 10; // 10 points movement threshold
    
    currentOdds.forEach(currentGame => {
      const previousGame = previousOdds.odds.find(g => 
        g.home_team === currentGame.home_team && 
        g.away_team === currentGame.away_team
      );
      
      if (previousGame && previousGame.bookmakers && currentGame.bookmakers) {
        // Compare odds movements across bookmakers
        currentGame.bookmakers.forEach(currentBook => {
          const previousBook = previousGame.bookmakers.find(b => b.key === currentBook.key);
          if (previousBook) {
            // Check for movements in each market
            currentBook.markets.forEach(currentMarket => {
              const previousMarket = previousBook.markets.find(m => m.key === currentMarket.key);
              if (previousMarket) {
                // Compare outcome odds
                currentMarket.outcomes.forEach(currentOutcome => {
                  const previousOutcome = previousMarket.outcomes.find(o => o.name === currentOutcome.name);
                  if (previousOutcome) {
                    const oddsChange = Math.abs(currentOutcome.price - previousOutcome.price);
                    if (oddsChange >= SIGNIFICANT_MOVEMENT) {
                      movements.push({
                        game: `${currentGame.away_team} @ ${currentGame.home_team}`,
                        sportsbook: currentBook.title,
                        market: currentMarket.key,
                        outcome: currentOutcome.name,
                        previous_odds: previousOutcome.price,
                        current_odds: currentOutcome.price,
                        movement: currentOutcome.price - previousOutcome.price,
                        movement_percentage: ((currentOutcome.price - previousOutcome.price) / Math.abs(previousOutcome.price)) * 100,
                        detected_at: new Date().toISOString()
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
    
    return movements;
  }

  // Smart markets: include player props when available
  getSmartMarkets(sportKey, baseMarkets, includePlayerProps) {
    if (!includePlayerProps) return baseMarkets;
    
    const playerPropsMap = {
      'americanfootball_nfl': 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_anytime_td',
      'americanfootball_nfl_preseason': 'player_pass_yds,player_rush_yds,player_anytime_td',
      'americanfootball_ncaaf': 'player_pass_yds,player_rush_yds,player_reception_yds,player_anytime_td',
      'basketball_nba': 'player_points,player_rebounds,player_assists,player_threes',
      'basketball_nba_preseason': 'player_points,player_rebounds,player_assists',
      'basketball_ncaab': 'player_points,player_rebounds,player_assists',
      'icehockey_nhl': 'player_goals,player_assists,player_points',
      'icehockey_nhl_preseason': 'player_goals,player_assists',
      'baseball_mlb': 'player_hits,player_home_runs,player_rbis,pitcher_strikeouts'
    };
    
    const playerProps = playerPropsMap[sportKey];
    return playerProps ? `${baseMarkets},${playerProps}` : baseMarkets;
  }

  // Fetch odds with automatic fallback if player props fail
  async fetchOddsWithFallback(sportKey, fullMarkets, API_KEY) {
    const regions = sportKey.startsWith('soccer_') ? 'us,uk,eu' : 'us';
    
    // First attempt: try with player props (but with timeout)
    try {
      console.log(`🎯 [EventsCache] Trying ${sportKey} with player props`);
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${fullMarkets}&oddsFormat=american&dateFormat=iso`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const odds = await response.json();
        console.log(`✅ [EventsCache] Got ${odds.length} games with player props for ${sportKey}`);
        return odds;
      } else if (response.status === 422) {
        // Player props not available, try basic markets
        throw new Error('Player props not available');
      }
    } catch (error) {
      console.log(`⚠️ [EventsCache] Player props failed for ${sportKey}, trying basic markets`);
    }
    
    // Fallback: basic markets only
    try {
      const basicMarkets = sportKey.startsWith('soccer_') ? 'h2h' : 'h2h,spreads,totals';
      const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${basicMarkets}&oddsFormat=american&dateFormat=iso`;
      
      const response = await fetch(url);
      if (response.ok) {
        const odds = await response.json();
        console.log(`✅ [EventsCache] Got ${odds.length} games with basic markets for ${sportKey}`);
        return odds;
      }
    } catch (error) {
      console.log(`❌ [EventsCache] Failed to fetch any odds for ${sportKey}:`, error.message);
    }
    
    return null;
  }

  // Smart date filtering (same as implemented in optimized-ev-fetcher)
  applySmartDateFiltering(events) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // First, try events in next 7 days
    const eventsNext7Days = events.filter(event => {
      if (!event.commence_time) return true;
      const eventTime = new Date(event.commence_time);
      return eventTime >= now && eventTime <= sevenDaysFromNow;
    });

    let filteredEvents = eventsNext7Days;

    // If fewer than 7 events, extend to 30 days
    if (eventsNext7Days.length < 7) {
      const eventsNext30Days = events.filter(event => {
        if (!event.commence_time) return true;
        const eventTime = new Date(event.commence_time);
        return eventTime >= now && eventTime <= thirtyDaysFromNow;
      });
      
      filteredEvents = eventsNext30Days;
      console.log(`📅 [EventsCache] Extended to 30-day window: ${eventsNext7Days.length} → ${eventsNext30Days.length} events`);
    }

    // If still no events, use all available
    if (filteredEvents.length === 0) {
      filteredEvents = events;
      console.log(`📅 [EventsCache] Using all ${events.length} events regardless of date`);
    }

    return filteredEvents;
  }

  // Cache management
  getCachedData(key, ttl) {
    const cached = this.eventsCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > ttl) {
      this.eventsCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCachedData(key, data, ttl) {
    this.eventsCache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  // Helper methods for trend analysis
  calculateMarketAverage(allOdds, excludeBookmaker) {
    // Calculate market average odds excluding specified bookmaker
    const marketData = new Map();
    
    allOdds.forEach(game => {
      if (game.bookmakers) {
        game.bookmakers.forEach(book => {
          if (book.key !== excludeBookmaker && book.markets) {
            book.markets.forEach(market => {
              market.outcomes.forEach(outcome => {
                const key = `${game.id}_${market.key}_${outcome.name}`;
                if (!marketData.has(key)) {
                  marketData.set(key, { prices: [], count: 0 });
                }
                marketData.get(key).prices.push(outcome.price);
                marketData.get(key).count += 1;
              });
            });
          }
        });
      }
    });
    
    // Convert to averages
    const averages = new Map();
    for (const [key, data] of marketData) {
      if (data.count >= 2) { // Need at least 2 books for comparison
        const average = data.prices.reduce((sum, price) => sum + price, 0) / data.count;
        averages.set(key, average);
      }
    }
    
    return averages;
  }

  hasValueAdvantage(bookmaker, marketAverages) {
    if (!bookmaker.markets) return false;
    
    let advantageCount = 0;
    let totalComparisons = 0;
    
    bookmaker.markets.forEach(market => {
      market.outcomes.forEach(outcome => {
        const key = `${bookmaker.game_id || 'unknown'}_${market.key}_${outcome.name}`;
        const marketAvg = marketAverages.get(key);
        
        if (marketAvg) {
          totalComparisons += 1;
          // For positive odds, higher is better; for negative odds, closer to 0 is better
          if ((outcome.price > 0 && outcome.price > marketAvg) || 
              (outcome.price < 0 && outcome.price > marketAvg)) {
            advantageCount += 1;
          }
        }
      });
    });
    
    return totalComparisons > 0 && (advantageCount / totalComparisons) > 0.5;
  }

  calculateBookmakerEdge(bookmaker, marketAverages) {
    if (!bookmaker.markets) return 0;
    
    let totalEdge = 0;
    let comparisons = 0;
    
    bookmaker.markets.forEach(market => {
      market.outcomes.forEach(outcome => {
        const key = `${bookmaker.game_id || 'unknown'}_${market.key}_${outcome.name}`;
        const marketAvg = marketAverages.get(key);
        
        if (marketAvg) {
          const edge = ((outcome.price - marketAvg) / Math.abs(marketAvg)) * 100;
          totalEdge += edge;
          comparisons += 1;
        }
      });
    });
    
    return comparisons > 0 ? totalEdge / comparisons : 0;
  }

  // Get historical data for analysis
  getHistoricalData(sportKey, hours = 24) {
    const historicalKey = `historical_${sportKey}`;
    const historical = this.historicalData.get(historicalKey);
    
    if (!historical) return null;
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    return {
      snapshots: historical.odds_snapshots.filter(snapshot => snapshot.timestamp > cutoffTime),
      movements: historical.movements.filter(movement => movement.timestamp > cutoffTime),
      total_snapshots: historical.odds_snapshots.length,
      total_movements: historical.movements.length
    };
  }

  // Get trend analysis for a sport
  getTrendAnalysis(sportKey) {
    const trendKey = `trends_${sportKey}`;
    const trends = this.trendAnalysis.get(trendKey);
    
    if (!trends) return null;
    
    // Convert Maps to objects for easier consumption
    const sportsbookTrends = {};
    for (const [bookKey, trend] of trends.sportsbook_trends) {
      sportsbookTrends[bookKey] = {
        ...trend,
        value_percentage: trend.total_comparisons > 0 ? 
          (trend.better_odds_count / trend.total_comparisons * 100).toFixed(1) : '0.0'
      };
    }
    
    return {
      sportsbook_trends: sportsbookTrends,
      value_opportunities: trends.value_opportunities,
      best_timing_patterns: trends.best_timing_patterns,
      created_at: trends.created_at
    };
  }

  // Get cache statistics
  getCacheStats() {
    return {
      events_cached: this.eventsCache.size,
      odds_history_tracked: this.oddsHistory.size,
      historical_sports: this.historicalData.size,
      trend_analysis_active: this.trendAnalysis.size,
      memory_usage: `${Math.round(JSON.stringify([...this.eventsCache.values()]).length / 1024)}KB`
    };
  }
}

// Singleton instance
const eventsCache = new EventsCache();

module.exports = eventsCache;
module.exports.default = eventsCache;