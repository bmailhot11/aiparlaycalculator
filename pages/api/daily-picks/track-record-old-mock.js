// API endpoint for daily picks track record - REAL DATA ONLY
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = '30d' } = req.query;

  try {
    // Get REAL track record data from database
    const trackRecord = await getRealTrackRecord(period);
    
    return res.status(200).json(trackRecord);
    
  } catch (error) {
    console.error('Track record error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch track record' 
    });
  }
}

// Function to get REAL track record data from Supabase
async function getRealTrackRecord(period) {
  try {
    console.log(`📊 Fetching REAL track record data for period: ${period}`);
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch(period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'all':
        startDate.setFullYear(2025, 0, 1); // Start from Jan 1, 2025
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get performance metrics from the database
    const { data: metrics, error: metricsError } = await supabase
      .from('performance_metrics')
      .select('*')
      .lte('metric_date', endDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })
      .limit(1);

    if (metricsError) {
      console.error('Error fetching performance metrics:', metricsError);
    }

    // Get detailed daily results for the period
    const { data: dailyResults, error: resultsError } = await supabase
      .from('daily_picks_results')
      .select('*')
      .gte('result_date', startDate.toISOString().split('T')[0])
      .lte('result_date', endDate.toISOString().split('T')[0])
      .order('result_date', { ascending: false });

    if (resultsError) {
      console.error('Error fetching daily results:', resultsError);
      return getEmptyTrackRecord(period);
    }

    if (!dailyResults || dailyResults.length === 0) {
      console.log('📭 No betting results found for period');
      return getEmptyTrackRecord(period);
    }

    // Calculate statistics from real data
    const stats = calculateRealStats(dailyResults, period);
    
    // Add latest overall metrics if available
    if (metrics && metrics.length > 0) {
      const latestMetrics = metrics[0];
      stats.overallROI = latestMetrics.overall_roi || 0;
      stats.totalDays = latestMetrics.total_days || 0;
      stats.bettingDays = latestMetrics.betting_days || 0;
      stats.longestWinStreak = latestMetrics.longest_win_streak || 0;
      stats.currentStreak = latestMetrics.current_streak || 0;
      stats.currentStreakType = latestMetrics.current_streak_type || 'none';
    }

    console.log(`✅ Calculated real track record: ${stats.totalPicks} picks, ${stats.roi.toFixed(2)}% ROI`);
    return stats;
    
  } catch (error) {
    console.error('Error in getRealTrackRecord:', error);
    return getEmptyTrackRecord(period);
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