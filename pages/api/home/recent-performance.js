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

    // Generate CLV-like data from edge percentages over time
    const performanceData = (recentLegs || []).slice(0, 30).map((leg, index) => ({
      date: leg.created_at.split('T')[0],
      clv: leg.edge_percentage || 0,
      market: `${leg.home_team} vs ${leg.away_team} - ${leg.market_type}`,
      sport: leg.sport
    })).reverse(); // Reverse to show oldest first for timeline

    // Get recent highlights
    const highlights = (recentLegs || []).slice(0, 3).map(leg => ({
      market: `${leg.home_team} vs ${leg.away_team}`,
      placedPrice: leg.best_odds,
      closePrice: leg.best_odds, // We don't track closing odds yet
      delta: `${(leg.edge_percentage || 0).toFixed(1)}%`,
      positive: (leg.edge_percentage || 0) > 0,
      sport: leg.sport
    }));

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
          avgEdge: performanceData.length > 0 
            ? (performanceData.reduce((sum, d) => sum + d.clv, 0) / performanceData.length).toFixed(1) + '%'
            : 'N/A'
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