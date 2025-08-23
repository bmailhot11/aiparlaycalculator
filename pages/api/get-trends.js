// pages/api/get-trends.js
// API endpoint to access historical data and trend analysis

const eventsCache = require('../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sport, type = 'trends', hours = 24 } = req.body;

    if (!sport) {
      return res.status(400).json({ 
        error: 'Sport parameter required',
        available_sports: ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'Soccer', 'Tennis']
      });
    }

    let data = null;

    switch (type) {
      case 'trends':
        // Get sportsbook performance trends
        data = eventsCache.getTrendAnalysis(sport);
        
        if (!data) {
          return res.status(200).json({
            success: true,
            message: `No trend data available for ${sport} yet. Trends will be available after multiple odds refreshes.`,
            sport: sport,
            type: type,
            data: null
          });
        }

        // Add summary statistics
        const trendSummary = {
          total_sportsbooks: Object.keys(data.sportsbook_trends).length,
          best_value_book: null,
          average_market_efficiency: 0,
          most_active_movements: data.value_opportunities.slice(0, 5)
        };

        // Find best value sportsbook
        let bestValuePercentage = 0;
        for (const [bookKey, trend] of Object.entries(data.sportsbook_trends)) {
          const valuePercentage = parseFloat(trend.value_percentage);
          if (valuePercentage > bestValuePercentage) {
            bestValuePercentage = valuePercentage;
            trendSummary.best_value_book = {
              name: bookKey,
              value_percentage: trend.value_percentage,
              total_comparisons: trend.total_comparisons
            };
          }
        }

        data.summary = trendSummary;
        break;

      case 'historical':
        // Get historical odds data
        data = eventsCache.getHistoricalData(sport, hours);
        
        if (!data) {
          return res.status(200).json({
            success: true,
            message: `No historical data available for ${sport} yet. Data will accumulate as odds are cached.`,
            sport: sport,
            type: type,
            data: null
          });
        }

        // Add analysis of historical data
        data.analysis = {
          total_snapshots: data.total_snapshots,
          snapshots_in_period: data.snapshots.length,
          total_movements_detected: data.total_movements,
          movements_in_period: data.movements.length,
          average_movements_per_hour: data.movements.length / Math.min(hours, 24),
          data_coverage_hours: hours
        };
        break;

      case 'movements':
        // Get recent odds movements
        const historical = eventsCache.getHistoricalData(sport, hours);
        
        if (!historical || historical.movements.length === 0) {
          return res.status(200).json({
            success: true,
            message: `No odds movements detected for ${sport} in the last ${hours} hours.`,
            sport: sport,
            type: type,
            data: []
          });
        }

        // Organize movements by significance
        data = {
          significant_movements: historical.movements.filter(m => Math.abs(m.movements[0]?.movement || 0) >= 20),
          moderate_movements: historical.movements.filter(m => {
            const movement = Math.abs(m.movements[0]?.movement || 0);
            return movement >= 10 && movement < 20;
          }),
          all_movements: historical.movements,
          summary: {
            total_movements: historical.movements.length,
            largest_movement: historical.movements.reduce((max, curr) => {
              const movement = Math.abs(curr.movements[0]?.movement || 0);
              return movement > max ? movement : max;
            }, 0),
            most_active_sportsbook: this.findMostActiveBook(historical.movements)
          }
        };
        break;

      case 'cache_stats':
        // Get cache performance statistics
        data = eventsCache.getCacheStats();
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid type parameter',
          available_types: ['trends', 'historical', 'movements', 'cache_stats']
        });
    }

    return res.status(200).json({
      success: true,
      sport: sport,
      type: type,
      timestamp: new Date().toISOString(),
      data: data
    });

  } catch (error) {
    console.error('Trends API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper function to find most active sportsbook in movements
function findMostActiveBook(movements) {
  const bookCounts = {};
  
  movements.forEach(movement => {
    movement.movements.forEach(m => {
      const book = m.sportsbook;
      bookCounts[book] = (bookCounts[book] || 0) + 1;
    });
  });

  let mostActive = { name: 'None', count: 0 };
  for (const [book, count] of Object.entries(bookCounts)) {
    if (count > mostActive.count) {
      mostActive = { name: book, count };
    }
  }

  return mostActive;
}