// Line Movement API - Get historical odds data for specific games
const eventsCache = require('../../../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sport, gameId } = req.query;
  const { hours = 24, market = 'all' } = req.query;

  try {
    console.log(`📈 [Line Movement] Fetching data for ${sport} game ${gameId}`);

    // Get historical data for the sport
    const historicalData = eventsCache.getHistoricalData(sport, parseInt(hours));
    
    if (!historicalData) {
      return res.status(404).json({
        success: false,
        message: `No historical data available for ${sport}`,
        data: []
      });
    }

    // Filter for specific game
    const gameMovements = filterGameMovements(historicalData, gameId, market);
    
    if (gameMovements.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No line movement data found for game ${gameId}`,
        data: []
      });
    }

    // Process data for chart visualization
    const chartData = processMovementDataForChart(gameMovements, market);

    return res.status(200).json({
      success: true,
      game_id: gameId,
      sport: sport,
      market: market,
      hours_tracked: hours,
      total_snapshots: historicalData.snapshots.length,
      data_points: chartData.length,
      data: chartData,
      summary: {
        earliest_timestamp: chartData[0]?.timestamp,
        latest_timestamp: chartData[chartData.length - 1]?.timestamp,
        sportsbooks_tracked: [...new Set(chartData.flatMap(d => d.odds.map(o => o.sportsbook)))],
        markets_available: getAvailableMarkets(gameMovements)
      }
    });

  } catch (error) {
    console.error('❌ [Line Movement] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch line movement data',
      error: error.message,
      data: []
    });
  }
}

function filterGameMovements(historicalData, gameId, marketFilter) {
  const gameMovements = [];
  
  // Process snapshots to find movements for specific game
  historicalData.snapshots.forEach(snapshot => {
    if (!snapshot.data || !Array.isArray(snapshot.data)) return;
    
    // Find the specific game in this snapshot
    const gameData = snapshot.data.find(game => 
      game.id === gameId || 
      (game.away_team && game.home_team && 
       `${game.away_team}_${game.home_team}`.includes(gameId))
    );
    
    if (gameData) {
      // Extract relevant market data
      const marketData = extractMarketData(gameData, marketFilter);
      if (marketData.length > 0) {
        gameMovements.push({
          timestamp: snapshot.timestamp,
          game: gameData,
          markets: marketData
        });
      }
    }
  });
  
  return gameMovements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function extractMarketData(gameData, marketFilter) {
  const marketData = [];
  
  if (!gameData.bookmakers || !Array.isArray(gameData.bookmakers)) {
    return marketData;
  }
  
  gameData.bookmakers.forEach(book => {
    if (!book.markets || !Array.isArray(book.markets)) return;
    
    book.markets.forEach(market => {
      // Filter by market type if specified
      if (marketFilter !== 'all' && market.key !== marketFilter) return;
      
      if (market.outcomes && Array.isArray(market.outcomes)) {
        market.outcomes.forEach(outcome => {
          marketData.push({
            sportsbook: book.title,
            market_type: market.key,
            selection: outcome.name,
            price: outcome.price,
            point: outcome.point || null,
            decimal_odds: convertToDecimal(outcome.price),
            implied_prob: (1 / convertToDecimal(outcome.price) * 100).toFixed(2)
          });
        });
      }
    });
  });
  
  return marketData;
}

function processMovementDataForChart(gameMovements, marketFilter) {
  return gameMovements.map(movement => ({
    timestamp: movement.timestamp,
    readable_time: new Date(movement.timestamp).toLocaleString(),
    game_info: {
      matchup: `${movement.game.away_team} @ ${movement.game.home_team}`,
      commence_time: movement.game.commence_time,
      sport: movement.game.sport || movement.game.sport_key
    },
    odds: movement.markets.map(market => ({
      sportsbook: market.sportsbook,
      market: market.market_type,
      selection: market.selection,
      american_odds: market.price,
      decimal_odds: market.decimal_odds,
      implied_prob: parseFloat(market.implied_prob),
      point: market.point
    }))
  }));
}

function getAvailableMarkets(gameMovements) {
  const markets = new Set();
  gameMovements.forEach(movement => {
    movement.markets.forEach(market => {
      markets.add(market.market_type);
    });
  });
  return Array.from(markets);
}

function convertToDecimal(americanOdds) {
  return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
}