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
    // Get latest KPI record for overall stats
    const { data: latestKPI } = await supabase
      .from('reco_daily_kpis')
      .select('*')
      .order('kpi_date', { ascending: false })
      .limit(1)
      .single();

    // Calculate period-specific metrics
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    const { data: periodKPIs } = await supabase
      .from('reco_daily_kpis')
      .select('*')
      .gte('kpi_date', periodStartStr)
      .order('kpi_date', { ascending: true });

    // Calculate period metrics
    let periodPnL = 0;
    let periodBetsWon = 0;
    let periodBetsLost = 0;
    let periodCLVBeats = 0;
    let periodTotalBets = 0;

    if (periodKPIs && periodKPIs.length > 0) {
      const firstKPI = periodKPIs[0];
      const lastKPI = periodKPIs[periodKPIs.length - 1];

      periodPnL = lastKPI.cumulative_pnl - (firstKPI.cumulative_pnl - firstKPI.total_daily_pnl);
      periodBetsWon = lastKPI.total_bets_won - firstKPI.total_bets_won;
      periodBetsLost = lastKPI.total_bets_lost - firstKPI.total_bets_lost;
      periodTotalBets = periodBetsWon + periodBetsLost;

      // Calculate CLV for period (simplified)
      periodCLVBeats = Math.round((lastKPI.clv_beat_percentage / 100) * periodTotalBets);
    }

    const periodROI = periodTotalBets > 0 ? (periodPnL / (periodTotalBets * 100)) * 100 : 0;
    const periodHitRate = periodTotalBets > 0 ? (periodBetsWon / periodTotalBets) * 100 : 0;
    const periodCLVRate = periodTotalBets > 0 ? (periodCLVBeats / periodTotalBets) * 100 : 0;

    return {
      all_time: {
        total_bets: latestKPI?.total_bets_placed || 0,
        win_rate: latestKPI?.hit_rate_percentage || 0,
        roi: latestKPI?.total_roi_percentage || 0,
        cumulative_pnl: latestKPI?.cumulative_pnl || 0,
        clv_beat_rate: latestKPI?.clv_beat_percentage || 0,
        total_wins: latestKPI?.total_bets_won || 0,
        total_losses: latestKPI?.total_bets_lost || 0,
        total_pushes: latestKPI?.total_bets_pushed || 0,
        no_bet_days: latestKPI?.no_bet_days_count || 0
      },
      period: {
        days: periodDays,
        total_bets: periodTotalBets,
        win_rate: periodHitRate,
        roi: periodROI,
        pnl: periodPnL,
        clv_beat_rate: periodCLVRate,
        wins: periodBetsWon,
        losses: periodBetsLost
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

    const { data: dailyResults, error, count } = await supabase
      .from('reco_daily_kpis')
      .select(`
        kpi_date,
        single_pnl,
        parlay_2_pnl,
        parlay_4_pnl,
        total_daily_pnl,
        total_bets_placed,
        total_bets_won,
        total_bets_lost
      `, { count: 'exact' })
      .order('kpi_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Also get daily recommendations to see which days were "no bet"
    const { data: dailyRecos } = await supabase
      .from('daily_recos')
      .select('reco_date, no_bet_reason, single_bet_id, parlay_2_id, parlay_4_id')
      .order('reco_date', { ascending: false })
      .limit(limit);

    // Merge the data
    const recoMap = new Map();
    (dailyRecos || []).forEach(reco => {
      recoMap.set(reco.reco_date, reco);
    });

    const enrichedResults = (dailyResults || []).map(kpi => {
      const reco = recoMap.get(kpi.kpi_date);
      
      return {
        date: kpi.kpi_date,
        single_pnl: kpi.single_pnl || 0,
        parlay_2_pnl: kpi.parlay_2_pnl || 0,
        parlay_4_pnl: kpi.parlay_4_pnl || 0,
        total_pnl: kpi.total_daily_pnl || 0,
        is_no_bet: !!reco?.no_bet_reason,
        no_bet_reason: reco?.no_bet_reason || null,
        bets_placed: {
          single: !!reco?.single_bet_id,
          parlay2: !!reco?.parlay_2_id,
          parlay4: !!reco?.parlay_4_id
        }
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

    const { data: kpis } = await supabase
      .from('reco_daily_kpis')
      .select('kpi_date, cumulative_pnl, total_daily_pnl')
      .gte('kpi_date', startDateStr)
      .order('kpi_date', { ascending: true });

    if (!kpis || kpis.length === 0) {
      return [];
    }

    // Calculate running bankroll (starting from base bankroll)
    const baseBankroll = 10000; // $10,000 base bankroll assumption
    let runningBankroll = baseBankroll;

    return kpis.map(kpi => {
      runningBankroll += kpi.total_daily_pnl || 0;
      
      return {
        date: kpi.kpi_date,
        bankroll: runningBankroll,
        daily_change: kpi.total_daily_pnl || 0,
        cumulative_pnl: kpi.cumulative_pnl || 0
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