// API Route for Fetching Public Results and KPIs

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { period = '30', page = 1, limit = 50 } = req.query;
    
    // Fetch current KPIs
    const kpis = await fetchCurrentKPIs(parseInt(period));
    
    // Fetch daily results history
    const dailyResults = await fetchDailyResults(parseInt(page), parseInt(limit));
    
    // Fetch bankroll progression for sparkline
    const bankrollData = await fetchBankrollProgression(30); // Last 30 days
    
    return res.status(200).json({
      success: true,
      kpis,
      daily_results: dailyResults.results,
      pagination: dailyResults.pagination,
      bankroll_progression: bankrollData,
      methodology: getMethodologyExplanation(),
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message
    });
  }
}

/**
 * Fetch current KPIs for specified period
 */
async function fetchCurrentKPIs(periodDays = 30) {
  try {
    // Calculate period start date
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    // Get performance data from your new schema views
    const { data: periodPerformance } = await supabase
      .from('v_daily_performance')
      .select('*')
      .gte('date', periodStartStr)
      .order('date', { ascending: true });

    // Get cumulative bankroll data
    const { data: bankrollData } = await supabase
      .from('v_cumulative_bankroll')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Calculate totals from performance data
    let totalBets = 0;
    let totalWins = 0;
    let totalStaked = 0;
    let totalProfit = 0;

    if (periodPerformance && periodPerformance.length > 0) {
      periodPerformance.forEach(day => {
        totalBets += day.bets_settled || 0;
        totalWins += Math.round((day.win_rate_pct || 0) / 100 * (day.bets_settled || 0));
        totalStaked += day.total_staked || 0;
        totalProfit += day.net_profit || 0;
      });
    }

    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    return {
      all_time: {
        total_bets: totalBets,
        win_rate: winRate,
        roi: roi,
        cumulative_pnl: bankrollData?.cumulative_pnl || 0,
        total_wins: totalWins,
        total_losses: totalBets - totalWins,
        total_pushes: 0
      },
      period: {
        days: periodDays,
        total_bets: totalBets,
        win_rate: winRate,
        roi: roi,
        pnl: totalProfit,
        wins: totalWins,
        losses: totalBets - totalWins
      }
    };

  } catch (error) {
    console.error('Error fetching KPIs:', error);
    throw error;
  }
}

/**
 * Fetch daily results history
 */
async function fetchDailyResults(page = 1, limit = 50) {
  try {
    const offset = (page - 1) * limit;

    // Get daily performance data from your new schema
    const { data: dailyResults, error, count } = await supabase
      .from('v_daily_performance')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Also get daily recommendations to see which days were "no bet"
    const { data: dailyRecos } = await supabase
      .from('daily_recos')
      .select('reco_date, notes, status')
      .order('reco_date', { ascending: false })
      .limit(limit);

    // Get bet type breakdown for each day
    const { data: betBreakdown } = await supabase
      .from('reco_bets')
      .select(`
        created_day_local,
        parlay_legs,
        result,
        stake,
        COALESCE(
          CASE result
            WHEN 'win' THEN COALESCE(payout, stake * odds_decimal) - stake
            WHEN 'loss' THEN -stake
            WHEN 'push' THEN 0
            WHEN 'void' THEN 0
            ELSE 0
          END, 0
        ) as profit
      `)
      .order('created_day_local', { ascending: false })
      .limit(limit * 10); // Get more to account for multiple bets per day

    // Group bet breakdown by day and parlay type
    const betMap = new Map();
    (betBreakdown || []).forEach(bet => {
      const date = bet.created_day_local;
      if (!betMap.has(date)) {
        betMap.set(date, { single_pnl: 0, parlay_2_pnl: 0, parlay_4_pnl: 0, bets_placed: { single: false, parlay2: false, parlay4: false } });
      }
      
      const dayData = betMap.get(date);
      if (bet.parlay_legs === 1) {
        dayData.single_pnl += bet.profit;
        dayData.bets_placed.single = true;
      } else if (bet.parlay_legs === 2) {
        dayData.parlay_2_pnl += bet.profit;
        dayData.bets_placed.parlay2 = true;
      } else if (bet.parlay_legs === 4) {
        dayData.parlay_4_pnl += bet.profit;
        dayData.bets_placed.parlay4 = true;
      }
    });

    // Merge the data
    const recoMap = new Map();
    (dailyRecos || []).forEach(reco => {
      recoMap.set(reco.reco_date, reco);
    });

    const enrichedResults = (dailyResults || []).map(day => {
      const reco = recoMap.get(day.date);
      const bets = betMap.get(day.date) || { single_pnl: 0, parlay_2_pnl: 0, parlay_4_pnl: 0, bets_placed: { single: false, parlay2: false, parlay4: false } };
      
      return {
        date: day.date,
        single_pnl: bets.single_pnl,
        parlay_2_pnl: bets.parlay_2_pnl,
        parlay_4_pnl: bets.parlay_4_pnl,
        total_pnl: day.net_profit || 0,
        is_no_bet: day.bets_settled === 0,
        no_bet_reason: day.bets_settled === 0 ? 'No qualifying edges found' : null,
        bets_placed: bets.bets_placed
      };
    });

    return {
      results: enrichedResults,
      pagination: {
        current_page: page,
        per_page: limit,
        total_records: count,
        total_pages: Math.ceil(count / limit)
      }
    };

  } catch (error) {
    console.error('Error fetching daily results:', error);
    throw error;
  }
}

/**
 * Fetch bankroll progression for sparkline chart
 */
async function fetchBankrollProgression(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Use your new cumulative bankroll view
    const { data: bankrollData } = await supabase
      .from('v_cumulative_bankroll')
      .select('*')
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    if (!bankrollData || bankrollData.length === 0) {
      return [];
    }

    // Calculate running bankroll with different base amounts per bet type
    const baseBankrollSingle = 1000;
    const baseBankrollParlay2 = 1000;
    const baseBankrollParlay4 = 1000;

    // Get daily performance breakdown
    const { data: dailyPerf } = await supabase
      .from('v_daily_performance')
      .select('*')
      .gte('date', startDateStr)
      .order('date', { ascending: true });

    return bankrollData.map((day, index) => {
      const dailyData = dailyPerf?.find(d => d.date === day.date) || {};
      
      return {
        date: day.date,
        bankroll: baseBankrollSingle + (day.cumulative_pnl || 0), // Using single bankroll as main
        daily_change: dailyData.net_profit || 0,
        cumulative_pnl: day.cumulative_pnl || 0
      };
    });

  } catch (error) {
    console.error('Error fetching bankroll progression:', error);
    return [];
  }
}

/**
 * Get methodology explanation
 */
function getMethodologyExplanation() {
  return {
    overview: "Our daily picks system analyzes odds across multiple sportsbooks to identify positive expected value opportunities.",
    
    sharp_anchor: {
      title: "Pinnacle as Sharp Anchor",
      description: "We use Pinnacle sportsbook as our 'sharp' anchor for fair odds calculation, as they consistently offer the most efficient lines with minimal vig."
    },
    
    no_vig_pricing: {
      title: "No-Vig Fair Odds",
      description: "When Pinnacle odds aren't available, we calculate fair odds by removing the bookmaker's vig (juice) from market prices across multiple books."
    },
    
    edge_thresholds: {
      title: "Edge Requirements",
      description: "Singles require minimum 2% edge, parlay legs require minimum 3.5% edge. Higher thresholds for parlays account for correlation risk."
    },
    
    grading_rules: {
      title: "Bet Grading",
      description: "Bets are graded automatically using official scores. Pushes return stakes, voided legs adjust payouts proportionally."
    },
    
    void_handling: {
      title: "Void/Cancelled Games",
      description: "If a game is postponed or cancelled: singles void and return stake, parlays recalculate odds with remaining legs."
    },
    
    clv_calculation: {
      title: "Closing Line Value (CLV)",
      description: "CLV measures how our opening odds compare to closing odds. Positive CLV indicates we got better odds than the closing market."
    },
    
    bet_sizing: {
      title: "Bet Sizing",
      description: "All calculations assume $100 unit size for consistency. ROI percentages can be scaled to any bankroll size."
    }
  };
}