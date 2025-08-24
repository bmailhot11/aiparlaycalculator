/**
 * CLV Performance API - Get CLV tracking performance data
 * Returns CLV metrics and model performance analytics
 */

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    period = '30d', // '7d', '30d', '90d', 'all'
    sport,
    suggestion_source 
  } = req.query;

  try {
    // Calculate date filter
    let dateFilter = '';
    switch (period) {
      case '7d':
        dateFilter = "opening_timestamp >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "opening_timestamp >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        dateFilter = "opening_timestamp >= NOW() - INTERVAL '90 days'";
        break;
      default:
        dateFilter = "TRUE"; // No date filter for 'all'
    }

    // Build base query
    let query = supabase
      .from('clv_bet_tracking')
      .select('*');

    // Apply filters
    if (sport) {
      query = query.eq('sport', sport);
    }
    if (suggestion_source) {
      query = query.eq('suggestion_source', suggestion_source);
    }

    // Apply date filter with raw SQL
    if (dateFilter !== "TRUE") {
      // Use a raw query for date filtering
      const { data: filteredData, error } = await supabase.rpc('get_clv_data_filtered', {
        period_days: period === '7d' ? 7 : period === '30d' ? 30 : 90,
        sport_filter: sport,
        source_filter: suggestion_source
      });

      if (error) {
        // Fallback to regular query if RPC doesn't exist
        const { data: allData, error: queryError } = await query;
        
        if (queryError) {
          throw queryError;
        }

        // Filter client-side
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));
        
        var trackingData = allData.filter(row => new Date(row.opening_timestamp) >= cutoffDate);
      } else {
        var trackingData = filteredData;
      }
    } else {
      const { data: allData, error: queryError } = await query;
      if (queryError) {
        throw queryError;
      }
      var trackingData = allData;
    }

    // Calculate performance metrics
    const totalTracked = trackingData.length;
    const withClosingLines = trackingData.filter(bet => bet.clv_decimal !== null).length;
    const settledBets = trackingData.filter(bet => 
      ['win', 'loss', 'push'].includes(bet.game_result)).length;
    const correctPredictions = trackingData.filter(bet => 
      bet.actual_outcome_correct === true).length;

    // CLV metrics
    const clvData = trackingData.filter(bet => bet.clv_percent !== null);
    const avgCLV = clvData.length > 0 ? 
      clvData.reduce((sum, bet) => sum + parseFloat(bet.clv_percent), 0) / clvData.length : 0;
    
    const positiveCLVCount = clvData.filter(bet => parseFloat(bet.clv_percent) > 0).length;
    const positiveCLVRate = clvData.length > 0 ? (positiveCLVCount / clvData.length) * 100 : 0;

    // CLV distribution
    const clvAbove5 = clvData.filter(bet => parseFloat(bet.clv_percent) > 5).length;
    const clv2to5 = clvData.filter(bet => 
      parseFloat(bet.clv_percent) >= 2 && parseFloat(bet.clv_percent) <= 5).length;
    const clv0to2 = clvData.filter(bet => 
      parseFloat(bet.clv_percent) >= 0 && parseFloat(bet.clv_percent) < 2).length;
    const clvNegative = clvData.filter(bet => parseFloat(bet.clv_percent) < 0).length;

    // Sport breakdown
    const sportBreakdown = trackingData.reduce((acc, bet) => {
      if (!acc[bet.sport]) {
        acc[bet.sport] = { count: 0, avg_clv: 0, positive_clv: 0, total_clv: 0 };
      }
      acc[bet.sport].count++;
      if (bet.clv_percent !== null) {
        acc[bet.sport].total_clv += parseFloat(bet.clv_percent);
        if (parseFloat(bet.clv_percent) > 0) {
          acc[bet.sport].positive_clv++;
        }
      }
      return acc;
    }, {});

    // Calculate averages for sport breakdown
    Object.keys(sportBreakdown).forEach(sport => {
      const data = sportBreakdown[sport];
      data.avg_clv = data.count > 0 ? data.total_clv / data.count : 0;
      data.positive_clv_rate = data.count > 0 ? (data.positive_clv / data.count) * 100 : 0;
      delete data.total_clv; // Remove internal calculation field
    });

    // Recent performance trend (last 10 days)
    const recentTrend = [];
    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = trackingData.filter(bet => 
        bet.opening_timestamp.startsWith(dateStr));
      
      const dayCLV = dayData.filter(bet => bet.clv_percent !== null);
      const avgDayClv = dayCLV.length > 0 ? 
        dayCLV.reduce((sum, bet) => sum + parseFloat(bet.clv_percent), 0) / dayCLV.length : 0;
      
      recentTrend.push({
        date: dateStr,
        bets_tracked: dayData.length,
        avg_clv: avgDayClv.toFixed(2),
        positive_clv_count: dayCLV.filter(bet => parseFloat(bet.clv_percent) > 0).length
      });
    }

    const response = {
      success: true,
      period,
      filters: { sport, suggestion_source },
      summary: {
        total_bets_tracked: totalTracked,
        bets_with_closing_lines: withClosingLines,
        closing_line_coverage: totalTracked > 0 ? 
          ((withClosingLines / totalTracked) * 100).toFixed(1) : '0.0',
        avg_clv_percent: avgCLV.toFixed(2),
        positive_clv_rate: positiveCLVRate.toFixed(1),
        settled_bets: settledBets,
        correct_predictions: correctPredictions,
        prediction_accuracy: settledBets > 0 ? 
          ((correctPredictions / settledBets) * 100).toFixed(1) : '0.0'
      },
      clv_distribution: {
        above_5_percent: clvAbove5,
        two_to_5_percent: clv2to5,
        zero_to_2_percent: clv0to2,
        negative: clvNegative
      },
      sport_breakdown: sportBreakdown,
      recent_trend: recentTrend,
      top_performers: clvData
        .sort((a, b) => parseFloat(b.clv_percent) - parseFloat(a.clv_percent))
        .slice(0, 10)
        .map(bet => ({
          selection: bet.selection,
          sport: bet.sport,
          clv_percent: parseFloat(bet.clv_percent),
          opening_odds: bet.opening_odds_american,
          closing_odds: bet.closing_odds_american,
          date: bet.opening_timestamp.split('T')[0]
        })),
      worst_performers: clvData
        .sort((a, b) => parseFloat(a.clv_percent) - parseFloat(b.clv_percent))
        .slice(0, 5)
        .map(bet => ({
          selection: bet.selection,
          sport: bet.sport,
          clv_percent: parseFloat(bet.clv_percent),
          opening_odds: bet.opening_odds_american,
          closing_odds: bet.closing_odds_american,
          date: bet.opening_timestamp.split('T')[0]
        }))
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ CLV performance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve CLV performance data'
    });
  }
}