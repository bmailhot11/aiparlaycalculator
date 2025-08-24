// API endpoint for daily picks track record
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = '30d' } = req.query;

  try {
    // Get track record data
    const trackRecord = await getTrackRecord(period);
    
    return res.status(200).json(trackRecord);
    
  } catch (error) {
    console.error('Track record error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch track record' 
    });
  }
}

// Function to get track record data
async function getTrackRecord(period) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(process.cwd(), 'data', 'daily-picks-results.json');
    
    // Try to read existing results
    let results = {};
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      results = JSON.parse(data);
    } catch (fileError) {
      // File doesn't exist yet, no real data available
      console.log('📁 No track record data available yet');
      return {
        roi: 0,
        winRate: 0,
        totalPicks: 0,
        avgEdge: 0,
        period,
        message: 'Track record will be available after first day of picks',
        startDate: '2025-08-24'
      };
    }

    // Calculate stats for the requested period
    const stats = calculateStats(results, period);
    
    return stats;
    
  } catch (error) {
    console.error('Error in getTrackRecord:', error);
    
    // Return no data as fallback
    return {
      roi: 0,
      winRate: 0,
      totalPicks: 0,
      avgEdge: 0,
      period: period,
      message: 'Track record will be available after first day of picks'
    };
  }
}

// Create sample track record data for demonstration
async function createSampleTrackRecord() {
  const sampleResults = {};
  const today = new Date();
  
  // Generate 90 days of sample results
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    // Generate realistic sample results
    const winRate = 0.58 + (Math.random() * 0.15); // 58-73% win rate
    
    sampleResults[dateKey] = {
      single: {
        result: Math.random() < winRate ? 'win' : 'loss',
        odds: '+120',
        stake: 100,
        payout: Math.random() < winRate ? 220 : 0,
        edge: 4.2,
        sport: 'MLB'
      },
      parlay2: {
        result: Math.random() < (winRate * 0.7) ? 'win' : 'loss', // Lower win rate for parlays
        odds: '+275',
        stake: 50,
        payout: Math.random() < (winRate * 0.7) ? 187.5 : 0,
        edge: 5.9,
        sport: 'MLB'
      },
      parlay4: {
        result: Math.random() < (winRate * 0.4) ? 'win' : 'loss', // Much lower win rate for 4-leg parlays
        odds: '+850',
        stake: 25,
        payout: Math.random() < (winRate * 0.4) ? 237.5 : 0,
        edge: 10.2,
        sport: 'MLB'
      },
      published_at: date.toISOString(),
      settled_at: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString() // Settled next day
    };
  }
  
  return sampleResults;
}

// Calculate statistics for a given period
function calculateStats(results, period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  let totalStake = 0;
  let totalPayout = 0;
  let totalWins = 0;
  let totalPicks = 0;
  let totalEdge = 0;
  
  // Filter results by period and calculate stats
  Object.entries(results).forEach(([date, dayResults]) => {
    const resultDate = new Date(date);
    if (resultDate >= cutoffDate) {
      
      // Process each bet type
      ['single', 'parlay2', 'parlay4'].forEach(betType => {
        if (dayResults[betType]) {
          const bet = dayResults[betType];
          totalStake += bet.stake || 0;
          totalPayout += bet.payout || 0;
          totalPicks++;
          totalEdge += bet.edge || 0;
          
          if (bet.result === 'win') {
            totalWins++;
          }
        }
      });
    }
  });
  
  // Calculate final metrics
  const roi = totalStake > 0 ? ((totalPayout - totalStake) / totalStake) * 100 : 0;
  const winRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : 0;
  const avgEdge = totalPicks > 0 ? totalEdge / totalPicks : 0;
  
  return {
    roi: Math.round(roi * 10) / 10,
    winRate: Math.round(winRate * 10) / 10,
    totalPicks,
    avgEdge: Math.round(avgEdge * 10) / 10,
    period,
    totalStake,
    totalPayout: Math.round(totalPayout),
    profit: Math.round(totalPayout - totalStake)
  };
}

// Function to update results (to be called when games settle)
export async function updatePickResult(date, betType, result, actualPayout = 0) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(process.cwd(), 'data', 'daily-picks-results.json');
    
    // Read existing results
    let results = {};
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      results = JSON.parse(data);
    } catch (fileError) {
      console.log('📁 Creating new results file');
      results = {};
    }
    
    // Ensure date entry exists
    if (!results[date]) {
      results[date] = {};
    }
    
    // Update the specific bet result
    if (results[date][betType]) {
      results[date][betType].result = result;
      results[date][betType].actual_payout = actualPayout;
      results[date][betType].settled_at = new Date().toISOString();
    }
    
    // Save updated results
    await fs.writeFile(dataFile, JSON.stringify(results, null, 2), 'utf8');
    
    console.log(`✅ Updated ${betType} result for ${date}: ${result}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error updating pick result:', error);
    return { success: false, error: error.message };
  }
}