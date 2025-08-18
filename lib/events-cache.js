// lib/events-cache.js
// Advanced caching system for upcoming events with odds movement tracking

class EventsCache {
  constructor() {
    this.eventsCache = new Map();
    this.oddsHistory = new Map();
    this.EVENTS_CACHE_TTL = 60 * 60 * 1000; // 1 hour for events list
    this.ODDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for odds
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
      'NCAAB': ['basketball_ncaab'],
      'UFC': ['mma_mixed_martial_arts'],
      'Soccer': ['soccer_epl', 'soccer_usa_mls'],
      'Tennis': ['tennis_atp', 'tennis_wta'],
    };

    const sportKeys = sportKeyMap[sport] || ['americanfootball_nfl'];
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
  async getOddsForEvents(events, markets = 'h2h,spreads,totals') {
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
      const cacheKey = `odds_${sportKey}_${markets}`;
      let cachedOdds = this.getCachedData(cacheKey, this.ODDS_CACHE_TTL);
      
      if (!cachedOdds) {
        try {
          // Fetch odds for this sport
          const regions = sportKey.startsWith('soccer_') ? 'us,uk,eu' : 'us';
          const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=american&dateFormat=iso`;
          
          const response = await fetch(url);
          if (response.ok) {
            cachedOdds = await response.json();
            this.setCachedData(cacheKey, cachedOdds, this.ODDS_CACHE_TTL);
            
            // Track odds movements
            this.trackOddsMovements(sportKey, cachedOdds);
          }
        } catch (error) {
          console.log(`Error fetching odds for ${sportKey}:`, error.message);
          continue;
        }
      }

      if (cachedOdds) {
        // Match cached odds with our known events
        const matchedGames = cachedOdds.filter(game => 
          sportEvents.some(event => 
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

  // Track odds movements for value detection
  trackOddsMovements(sportKey, currentOdds) {
    const historyKey = `odds_history_${sportKey}`;
    const previousOdds = this.oddsHistory.get(historyKey);
    
    if (previousOdds) {
      // Compare odds and detect significant movements
      const movements = this.detectOddsMovements(previousOdds, currentOdds);
      if (movements.length > 0) {
        console.log(`📈 [EventsCache] Detected ${movements.length} odds movements for ${sportKey}`);
        // Could emit events here for real-time notifications
      }
    }
    
    this.oddsHistory.set(historyKey, {
      odds: currentOdds,
      timestamp: new Date().toISOString()
    });
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

  // Get cache statistics
  getCacheStats() {
    return {
      events_cached: this.eventsCache.size,
      odds_history_tracked: this.oddsHistory.size,
      memory_usage: `${Math.round(JSON.stringify([...this.eventsCache.values()]).length / 1024)}KB`
    };
  }
}

// Singleton instance
const eventsCache = new EventsCache();

export default eventsCache;