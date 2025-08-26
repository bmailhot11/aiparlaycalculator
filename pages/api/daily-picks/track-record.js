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

// Helper function to return empty track record
function getEmptyTrackRecord(period) {
  return {
    roi: 0,
    winRate: 0,
    totalPicks: 0,
    totalProfit: 0,
    totalStake: 0,
    avgEdge: 0,
    period,
    message: 'Track record will be available after settling first bets',
    startDate: new Date().toISOString().split('T')[0],
    breakdown: {
      single: { wins: 0, losses: 0, winRate: 0, roi: 0 },
      parlay2: { wins: 0, losses: 0, winRate: 0, roi: 0 },
      parlay4: { wins: 0, losses: 0, winRate: 0, roi: 0 }
    }
  };
}

// Calculate REAL statistics from database results
function calculateRealStats(dailyResults, period) {
  let totalStake = 0;
  let totalPayout = 0;
  let totalProfit = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalPicks = 0;
  let totalEdge = 0;

  // Track by bet type
  const breakdown = {
    single: { wins: 0, losses: 0, stake: 0, payout: 0, picks: 0, edge: 0 },
    parlay2: { wins: 0, losses: 0, stake: 0, payout: 0, picks: 0, edge: 0 },
    parlay4: { wins: 0, losses: 0, stake: 0, payout: 0, picks: 0, edge: 0 }
  };

  // Process each day's results
  dailyResults.forEach(day => {
    if (day.no_bet_day) return; // Skip no-bet days

    // Process single bet
    if (day.single_bet_result && !['pending', 'void'].includes(day.single_bet_result)) {
      const stake = parseFloat(day.single_bet_stake) || 0;
      const payout = parseFloat(day.single_bet_payout) || 0;
      const edge = parseFloat(day.single_bet_edge) || 0;

      breakdown.single.stake += stake;
      breakdown.single.payout += payout;
      breakdown.single.picks += 1;
      breakdown.single.edge += edge;
      
      if (day.single_bet_result === 'win') {
        breakdown.single.wins += 1;
        totalWins += 1;
      } else if (day.single_bet_result === 'loss') {
        breakdown.single.losses += 1;
        totalLosses += 1;
      }
      
      totalStake += stake;
      totalPayout += payout;
      totalPicks += 1;
      totalEdge += edge;
    }

    // Process 2-leg parlay
    if (day.parlay2_result && !['pending', 'void'].includes(day.parlay2_result)) {
      const stake = parseFloat(day.parlay2_stake) || 0;
      const payout = parseFloat(day.parlay2_payout) || 0;
      const edge = parseFloat(day.parlay2_edge) || 0;

      breakdown.parlay2.stake += stake;
      breakdown.parlay2.payout += payout;
      breakdown.parlay2.picks += 1;
      breakdown.parlay2.edge += edge;
      
      if (day.parlay2_result === 'win') {
        breakdown.parlay2.wins += 1;
        totalWins += 1;
      } else if (day.parlay2_result === 'loss') {
        breakdown.parlay2.losses += 1;
        totalLosses += 1;
      }
      
      totalStake += stake;
      totalPayout += payout;
      totalPicks += 1;
      totalEdge += edge;
    }

    // Process 4-leg parlay
    if (day.parlay4_result && !['pending', 'void'].includes(day.parlay4_result)) {
      const stake = parseFloat(day.parlay4_stake) || 0;
      const payout = parseFloat(day.parlay4_payout) || 0;
      const edge = parseFloat(day.parlay4_edge) || 0;

      breakdown.parlay4.stake += stake;
      breakdown.parlay4.payout += payout;
      breakdown.parlay4.picks += 1;
      breakdown.parlay4.edge += edge;
      
      if (day.parlay4_result === 'win') {
        breakdown.parlay4.wins += 1;
        totalWins += 1;
      } else if (day.parlay4_result === 'loss') {
        breakdown.parlay4.losses += 1;
        totalLosses += 1;
      }
      
      totalStake += stake;
      totalPayout += payout;
      totalPicks += 1;
      totalEdge += edge;
    }

    // Add daily profit
    totalProfit += parseFloat(day.total_profit) || 0;
  });

  // Calculate final metrics
  const roi = totalStake > 0 ? ((totalProfit / totalStake) * 100) : 0;
  const winRate = totalPicks > 0 ? ((totalWins / totalPicks) * 100) : 0;
  const avgEdge = totalPicks > 0 ? (totalEdge / totalPicks) : 0;

  // Calculate breakdown win rates and ROIs
  Object.keys(breakdown).forEach(betType => {
    const data = breakdown[betType];
    data.winRate = data.picks > 0 ? ((data.wins / data.picks) * 100) : 0;
    data.roi = data.stake > 0 ? (((data.payout - data.stake) / data.stake) * 100) : 0;
  });

  return {
    roi: Math.round(roi * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    totalPicks,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalStake: Math.round(totalStake * 100) / 100,
    totalPayout: Math.round(totalPayout * 100) / 100,
    avgEdge: Math.round(avgEdge * 100) / 100,
    period,
    message: totalPicks > 0 ? `${totalPicks} bets tracked` : 'No bets settled yet',
    startDate: dailyResults.length > 0 ? dailyResults[dailyResults.length - 1].result_date : new Date().toISOString().split('T')[0],
    breakdown
  };
}

// Function to update bet results (to be called by grading system)
export async function updateBetResult(date, betType, result, actualPayout = 0, actualOdds = null) {
  try {
    const { data: existingResult, error: fetchError } = await supabase
      .from('daily_picks_results')
      .select('*')
      .eq('result_date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing result:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Prepare update data based on bet type
    const updateData = {
      result_date: date,
      settled_bets: (existingResult?.settled_bets || 0) + 1,
      pending_bets: Math.max(0, (existingResult?.pending_bets || 1) - 1),
      graded_at: new Date().toISOString()
    };

    // Calculate profit based on result and payout
    const profit = result === 'win' ? actualPayout : 
                   result === 'push' ? 0 : 
                   -(existingResult?.[`${betType}_stake`] || 0);

    switch (betType) {
      case 'single':
        updateData.single_bet_result = result;
        updateData.single_bet_payout = result === 'win' ? actualPayout : 0;
        updateData.single_bet_profit = profit;
        if (actualOdds) updateData.single_bet_odds = actualOdds;
        break;
      case 'parlay2':
        updateData.parlay2_result = result;
        updateData.parlay2_payout = result === 'win' ? actualPayout : 0;
        updateData.parlay2_profit = profit;
        if (actualOdds) updateData.parlay2_odds = actualOdds;
        break;
      case 'parlay4':
        updateData.parlay4_result = result;
        updateData.parlay4_payout = result === 'win' ? actualPayout : 0;
        updateData.parlay4_profit = profit;
        if (actualOdds) updateData.parlay4_odds = actualOdds;
        break;
    }

    // Recalculate daily totals
    if (existingResult) {
      updateData.total_payout = (existingResult.total_payout || 0) + (updateData[`${betType}_payout`] || 0) - (existingResult[`${betType}_payout`] || 0);
      updateData.total_profit = (existingResult.total_profit || 0) + profit - (existingResult[`${betType}_profit`] || 0);
    }

    // Upsert the result
    const { error: upsertError } = await supabase
      .from('daily_picks_results')
      .upsert(updateData, {
        onConflict: 'result_date'
      });

    if (upsertError) {
      console.error('Error upserting bet result:', upsertError);
      return { success: false, error: upsertError.message };
    }

    // Trigger metrics recalculation
    await supabase.rpc('recalculate_performance_metrics', { target_date: date });

    console.log(`✅ Updated ${betType} result for ${date}: ${result}, payout: ${actualPayout}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error updating bet result:', error);
    return { success: false, error: error.message };
  }
}