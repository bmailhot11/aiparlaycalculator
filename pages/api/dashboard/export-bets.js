// API to export user's betting data
import { supabaseAuth } from '../../../utils/supabaseAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, format = 'json', dateFrom, dateTo } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    // Get user's profile data which contains betting history
    const { data: profile, error } = await supabaseAuth
      .from('user_profiles')
      .select('betting_history, analytics_cache')
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    let bets = profile.betting_history || [];

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      bets = bets.filter(bet => {
        const betDate = new Date(bet.date);
        if (dateFrom && betDate < new Date(dateFrom)) return false;
        if (dateTo && betDate > new Date(dateTo)) return false;
        return true;
      });
    }

    // Calculate summary statistics
    const summary = calculateBettingSummary(bets);

    if (format === 'csv') {
      const csv = convertToCSV(bets);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="betting-data.csv"');
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      success: true,
      data: {
        bets,
        summary,
        totalBets: bets.length,
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
}

function calculateBettingSummary(bets) {
  const settled = bets.filter(bet => bet.result && bet.result !== 'pending');
  const won = settled.filter(bet => bet.result === 'won');
  const totalStaked = settled.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const totalProfit = settled.reduce((sum, bet) => sum + (bet.profit || 0), 0);

  // Group by sport
  const sportBreakdown = {};
  bets.forEach(bet => {
    if (!sportBreakdown[bet.sport]) {
      sportBreakdown[bet.sport] = { count: 0, profit: 0 };
    }
    sportBreakdown[bet.sport].count++;
    sportBreakdown[bet.sport].profit += bet.profit || 0;
  });

  // Group by source (manual vs slip_upload)
  const sourceBreakdown = {};
  bets.forEach(bet => {
    const source = bet.source || 'manual';
    if (!sourceBreakdown[source]) {
      sourceBreakdown[source] = { count: 0, profit: 0 };
    }
    sourceBreakdown[source].count++;
    sourceBreakdown[source].profit += bet.profit || 0;
  });

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    winRate: settled.length > 0 ? (won.length / settled.length * 100).toFixed(2) : 0,
    totalStaked,
    totalProfit,
    roi: totalStaked > 0 ? (totalProfit / totalStaked * 100).toFixed(2) : 0,
    sportBreakdown,
    sourceBreakdown,
    dateRange: {
      earliest: bets.length > 0 ? bets.reduce((min, bet) => bet.date < min ? bet.date : min, bets[0].date) : null,
      latest: bets.length > 0 ? bets.reduce((max, bet) => bet.date > max ? bet.date : max, bets[0].date) : null
    }
  };
}

function convertToCSV(bets) {
  const headers = ['Date', 'Sport', 'Market', 'Selection', 'Odds', 'Stake', 'Result', 'Profit', 'Sportsbook', 'Source'];
  const rows = bets.map(bet => [
    bet.date,
    bet.sport,
    bet.market,
    bet.selection,
    bet.odds,
    bet.stake,
    bet.result,
    bet.profit,
    bet.sportsbook,
    bet.source || 'manual'
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
}