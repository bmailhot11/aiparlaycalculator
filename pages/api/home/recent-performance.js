// API endpoint to fetch recent betting performance data for home page
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏠 Fetching recent performance data for home page...');
    
    // Get recent daily recommendations with their bets
    const { data: recentRecos, error: recosError } = await supabase
      .from('daily_recos')
      .select(`
        id,
        reco_date,
        published_at,
        status,
        single_bet_id,
        parlay_2_id,
        parlay_4_id
      `)
      .eq('status', 'published')
      .order('reco_date', { ascending: false })
      .limit(30);

    if (recosError) {
      console.error('Error fetching daily recommendations:', recosError);
      return res.status(200).json({ success: true, data: [] });
    }

    // Get recent bet legs for performance tracking
    const { data: recentLegs, error: legsError } = await supabase
      .from('reco_bet_legs')
      .select(`
        id,
        sport,
        home_team,
        away_team,
        market_type,
        selection,
        best_odds,
        edge_percentage,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (legsError) {
      console.error('Error fetching bet legs:', legsError);
    }

    // Get recent bets for performance stats
    const { data: recentBets, error: betsError } = await supabase
      .from('reco_bets')
      .select(`
        id,
        sport,
        market,
        odds_american,
        result,
        payout,
        settled_at,
        edge_percentage,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (betsError) {
      console.error('Error fetching recent bets:', betsError);
    }

    // Calculate performance metrics
    const settledBets = (recentBets || []).filter(bet => bet.result);
    const winRate = settledBets.length > 0 
      ? (settledBets.filter(bet => bet.result === 'win').length / settledBets.length * 100).toFixed(1)
      : null;

    const totalProfit = settledBets.reduce((sum, bet) => {
      if (bet.result === 'win' && bet.payout) {
        return sum + (bet.payout - 100); // Assuming $100 base stake
      } else if (bet.result === 'loss') {
        return sum - 100;
      }
      return sum;
    }, 0);

    // Don't generate fake CLV data - return empty array since we don't track closing lines yet
    const performanceData = [];

    // Get recent highlights - only show if we actually have different closing prices
    // Since we don't track closing odds yet, return empty array to avoid mock data
    const highlights = [];

    console.log(`✅ Found ${recentRecos?.length || 0} recent recommendations`);
    console.log(`✅ Found ${recentLegs?.length || 0} recent bet legs`);
    console.log(`✅ Calculated performance: ${winRate}% win rate, $${totalProfit} profit`);

    return res.status(200).json({
      success: true,
      data: {
        performanceData,
        highlights,
        stats: {
          totalBets: settledBets.length,
          winRate: winRate ? `${winRate}%` : 'N/A',
          totalProfit: totalProfit,
          avgCLV: 'N/A' // No real CLV data available yet
        },
        recentActivity: recentRecos?.slice(0, 5).map(reco => ({
          date: reco.reco_date,
          status: reco.status,
          hasData: !!(reco.single_bet_id || reco.parlay_2_id || reco.parlay_4_id)
        })) || []
      }
    });

  } catch (error) {
    console.error('Error fetching recent performance:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}