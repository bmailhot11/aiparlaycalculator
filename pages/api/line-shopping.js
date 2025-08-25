// API endpoint for line shopping - compare odds across sportsbooks
const eventsCache = require('../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, team, game, market, minEdge, timeFilter, getTeams } = req.query;

  if (!sport) {
    return res.status(400).json({
      success: false,
      message: 'Sport parameter is required'
    });
  }

  try {
    console.log(`🛒 [LineShopping] Fetching data for ${sport}`, { team, game, market, minEdge, timeFilter, getTeams });
    
    // If just requesting teams/games list
    if (getTeams === 'true') {
      const teamsData = await fetchAvailableTeamsAndGames(sport);
      return res.status(200).json(teamsData);
    }
    
    // Get line shopping data
    const lineShoppingData = await fetchLineShoppingData(sport, { team, game, market, minEdge, timeFilter });
    
    return res.status(200).json(lineShoppingData);
    
  } catch (error) {
    console.error('Line shopping error:', error);
    
    // Handle specific API key error
    if (error.message === 'Odds API key not configured') {
      return res.status(200).json({
        success: true,
        message: 'API temporarily unavailable',
        teams: [],
        games: [],
        lines: []
      });
    }
    
    return res.status(200).json({
      success: true,
      message: error.message || 'Failed to fetch line shopping data',
      teams: [],
      games: [],
      lines: []
    });
  }
}

// Get available teams and games for a sport
async function fetchAvailableTeamsAndGames(sport) {
  try {
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log(`No upcoming events found for ${sport}, returning empty result`);
      return {
        success: true, // Changed to true to avoid errors in frontend
        message: `No upcoming events for ${sport}`,
        teams: [],
        games: []
      };
    }

    const teams = new Set();
    const games = [];
    
    // Ensure we have a valid array
    if (Array.isArray(upcomingEvents)) {
      upcomingEvents.forEach((event, index) => {
        try {
          if (event && typeof event === 'object' && event.home_team && event.away_team) {
            teams.add(event.home_team);
            teams.add(event.away_team);
            games.push({
              id: `${event.away_team} @ ${event.home_team}`,
              label: `${event.away_team} @ ${event.home_team}`,
              date: event.commence_time
            });
          } else {
            console.warn(`Invalid event at index ${index}:`, event);
          }
        } catch (eventError) {
          console.warn('Error processing event at index', index, ':', event, eventError);
        }
      });
    } else {
      console.error('upcomingEvents is not an array:', typeof upcomingEvents, upcomingEvents);
    }

    return {
      success: true,
      teams: Array.from(teams).sort(),
      games: games.sort((a, b) => new Date(a.date) - new Date(b.date))
    };
    
  } catch (error) {
    console.error('Error fetching teams for', sport, ':', error);
    return {
      success: true, // Return success with empty data to prevent frontend errors
      message: `Error fetching data for ${sport}: ${error.message}`,
      teams: [],
      games: []
    };
  }
}

async function fetchLineShoppingData(sport, filters = {}) {
  try {
    // Step 1: Get upcoming events for the sport
    const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return {
        success: false,
        message: `No upcoming events for ${sport}`,
        lines: []
      };
    }

    // Step 2: Get comprehensive odds data including player props
    const markets = getMarketsForLineShopping(sport, filters.market);
    const oddsData = await eventsCache.getOddsForEvents(
      upcomingEvents, 
      markets, 
      true // Include player props
    );

    // Step 3: Extract and process all betting lines
    const allLines = await extractAndProcessLines(oddsData, sport, filters);
    
    // Step 4: Add Pinnacle deviation calculations
    const linesWithDeviations = await calculatePinnacleDeviations(allLines);
    
    // Step 5: Filter by minimum edge if specified
    let filteredLines = linesWithDeviations;
    if (filters.minEdge && parseFloat(filters.minEdge) > 0) {
      const minEdgeThreshold = parseFloat(filters.minEdge);
      filteredLines = linesWithDeviations.filter(line => {
        const edge = line.pinnacle_deviation || line.edge_percent || 0;
        return Math.abs(edge) >= minEdgeThreshold;
      });
    }
    
    // Step 6: Extract teams and players for filters
    const teams = extractUniqueTeams(oddsData);
    const players = extractUniquePlayers(filteredLines, filters.team);

    console.log(`✅ [LineShopping] Processed ${linesWithDeviations.length} total lines, ${filteredLines.length} after filters for ${sport}`);

    return {
      success: true,
      lines: filteredLines,
      teams: teams.sort(),
      players: players.sort(),
      total_lines: filteredLines.length,
      total_available: linesWithDeviations.length,
      sportsbooks: [...new Set(filteredLines.map(line => line.sportsbook))],
      filters_applied: {
        team: filters.team,
        game: filters.game,
        market: filters.market,
        minEdge: filters.minEdge,
        timeFilter: filters.timeFilter
      },
      last_updated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in fetchLineShoppingData:', error);
    throw error;
  }
}

// Get appropriate markets for line shopping based on sport and filter
function getMarketsForLineShopping(sport, marketFilter) {
  const baseMarkets = 'h2h,spreads,totals';
  
  // Add player props for supported sports
  const playerPropMarkets = {
    'NFL': 'player_pass_tds,player_pass_yds,player_rush_yds,player_receptions,player_reception_yds,player_anytime_td',
    'NBA': 'player_points,player_rebounds,player_assists,player_threes',
    'NHL': 'player_goals,player_assists,player_points', 
    'MLB': 'player_hits,player_home_runs,player_rbis,pitcher_strikeouts',
    'NCAAF': 'player_pass_yds,player_rush_yds,player_reception_yds',
    'NCAAB': 'player_points,player_rebounds,player_assists'
  };

  let markets = baseMarkets;
  
  // Add player props if not filtered to specific basic market
  if (marketFilter === 'player_props') {
    markets = playerPropMarkets[sport] || '';
  } else if (!marketFilter || marketFilter === 'all') {
    const playerProps = playerPropMarkets[sport];
    if (playerProps) {
      markets = `${baseMarkets},${playerProps}`;
    }
  } else if (marketFilter !== 'all') {
    markets = marketFilter; // Use specific market filter
  }

  return markets;
}

// Extract and process all betting lines from odds data
async function extractAndProcessLines(oddsData, sport, filters) {
  const lines = [];
  
  for (const game of oddsData) {
    if (!game.bookmakers) continue;
    
    // Filter by specific game if specified
    if (filters.game) {
      const gameId = `${game.away_team} @ ${game.home_team}`;
      if (gameId !== filters.game) {
        continue;
      }
    }
    
    // Filter by team if specified
    if (filters.team) {
      if (!game.home_team.includes(filters.team) && !game.away_team.includes(filters.team)) {
        continue;
      }
    }

    // Filter by time if specified
    if (filters.timeFilter && filters.timeFilter !== 'all') {
      const gameTime = new Date(game.commence_time);
      const now = new Date();
      const hoursFromNow = Math.abs(gameTime - now) / 36e5; // Convert to hours
      
      let maxHours;
      switch (filters.timeFilter) {
        case '1d': maxHours = 24; break;
        case '3d': maxHours = 72; break;
        case '7d': maxHours = 168; break;
        default: maxHours = Infinity;
      }
      
      if (hoursFromNow > maxHours) {
        continue;
      }
    }
    
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes || []) {
          // Extract player name for props
          let playerName = null;
          if (market.key.includes('player_') || market.key.includes('pitcher_')) {
            playerName = extractPlayerName(outcome.name, outcome.description);
          }
          
          // Filter by player if specified
          if (filters.player && (!playerName || !playerName.includes(filters.player))) {
            continue;
          }
          
          lines.push({
            game: `${game.away_team} @ ${game.home_team}`,
            home_team: game.home_team,
            away_team: game.away_team,
            sport: sport,
            commence_time: game.commence_time,
            sportsbook: bookmaker.title,
            sportsbook_key: bookmaker.key,
            market_type: market.key,
            market_display: getMarketDisplayName(market.key),
            selection: outcome.name,
            point: outcome.point || null,
            american_odds: outcome.price,
            decimal_odds: americanToDecimal(outcome.price),
            implied_probability: 1 / americanToDecimal(outcome.price),
            player: playerName,
            last_update: outcome.last_update || new Date().toISOString()
          });
        }
      }
    }
  }
  
  return lines;
}

// Calculate deviations from Pinnacle (sharp) odds
async function calculatePinnacleDeviations(lines) {
  // Group lines by game and market and selection for comparison
  const lineGroups = new Map();
  
  lines.forEach(line => {
    const key = `${line.game}_${line.market_type}_${line.selection}_${line.point || 'no_point'}`;
    if (!lineGroups.has(key)) {
      lineGroups.set(key, []);
    }
    lineGroups.get(key).push(line);
  });
  
  const processedLines = [];
  
  for (const [groupKey, groupLines] of lineGroups) {
    // Find Pinnacle line as baseline (most sharp sportsbook)
    const pinnacleKey = 'pinnacle';
    let pinnackleLine = groupLines.find(line => 
      line.sportsbook_key?.toLowerCase().includes(pinnacleKey) ||
      line.sportsbook?.toLowerCase().includes('pinnacle')
    );
    
    // If no Pinnacle, use market average as baseline
    if (!pinnackleLine && groupLines.length > 2) {
      const avgOdds = groupLines.reduce((sum, line) => sum + line.decimal_odds, 0) / groupLines.length;
      pinnackleLine = {
        american_odds: decimalToAmerican(avgOdds),
        decimal_odds: avgOdds,
        implied_probability: 1 / avgOdds
      };
    }
    
    // Calculate deviations for each line in the group
    groupLines.forEach(line => {
      let pinnacleDeviation = 0;
      let expectedValue = 0;
      let pinnacleOdds = 'N/A';
      
      if (pinnackleLine) {
        pinnacleOdds = pinnackleLine.american_odds;
        const pinnacleImpliedProb = pinnackleLine.implied_probability;
        const lineImpliedProb = line.implied_probability;
        
        // Calculate deviation (positive = line is more favorable than Pinnacle)
        pinnacleDeviation = (pinnacleImpliedProb - lineImpliedProb) / lineImpliedProb;
        
        // Calculate expected value using Pinnacle as true probability
        const trueProbability = pinnacleImpliedProb;
        expectedValue = (trueProbability * (line.decimal_odds - 1)) - (1 - trueProbability);
      }
      
      processedLines.push({
        ...line,
        pinnacle_deviation: pinnacleDeviation,
        expected_value: expectedValue,
        pinnacle_odds: pinnacleOdds,
        has_pinnacle_baseline: !!pinnackleLine && pinnackleLine.sportsbook
      });
    });
  }
  
  return processedLines;
}

// Extract unique teams from odds data
function extractUniqueTeams(oddsData) {
  const teams = new Set();
  
  oddsData.forEach(game => {
    if (game.home_team) teams.add(game.home_team);
    if (game.away_team) teams.add(game.away_team);
  });
  
  return Array.from(teams);
}

// Extract unique players for a specific team
function extractUniquePlayers(lines, selectedTeam) {
  const players = new Set();
  
  lines.forEach(line => {
    if (line.player) {
      // Filter by team if selected
      if (!selectedTeam || line.game.includes(selectedTeam)) {
        players.add(line.player);
      }
    }
  });
  
  return Array.from(players);
}

// Extract player name from outcome name or description
function extractPlayerName(outcomeName, description) {
  // Common patterns for player props
  const patterns = [
    /^([A-Za-z\s]+)\s+(Over|Under|Yes|No|\d+\+)/i,
    /^([A-Za-z\s]+)\s+\(/i,
    /^([A-Za-z\s]+)\s+-\s/i
  ];
  
  for (const pattern of patterns) {
    const match = outcomeName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Get display name for market types
function getMarketDisplayName(marketKey) {
  const displayNames = {
    'h2h': 'Moneyline',
    'spreads': 'Point Spread',
    'totals': 'Over/Under',
    'player_pass_tds': 'Passing TDs',
    'player_pass_yds': 'Passing Yards',
    'player_rush_yds': 'Rushing Yards',
    'player_receptions': 'Receptions',
    'player_reception_yds': 'Receiving Yards',
    'player_anytime_td': 'Anytime TD',
    'player_points': 'Points',
    'player_rebounds': 'Rebounds',
    'player_assists': 'Assists',
    'player_threes': '3-Pointers Made',
    'player_goals': 'Goals',
    'player_hits': 'Hits',
    'player_home_runs': 'Home Runs',
    'player_rbis': 'RBIs',
    'pitcher_strikeouts': 'Strikeouts'
  };
  
  return displayNames[marketKey] || marketKey;
}

// Helper functions for odds conversion
function americanToDecimal(american) {
  const odds = typeof american === 'string' ? parseInt(american.replace('+', '')) : american;
  if (odds > 0) {
    return 1 + (odds / 100);
  } else {
    return 1 + (100 / Math.abs(odds));
  }
}

function decimalToAmerican(decimal) {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}