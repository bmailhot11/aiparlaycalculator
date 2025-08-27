// Check tracking system status
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      database_status: {},
      recent_picks: {},
      tracking_ready: true
    };

    // Check daily_recos table
    const { data: recos, error: recosError } = await supabase
      .from('daily_recos')
      .select('*')
      .order('reco_date', { ascending: false })
      .limit(3);
    
    status.database_status.daily_recos = {
      exists: !recosError,
      error: recosError?.message,
      count: recos?.length || 0,
      recent: recos?.slice(0, 2) || []
    };

    // Check reco_bets table
    const { data: bets, error: betsError } = await supabase
      .from('reco_bets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    status.database_status.reco_bets = {
      exists: !betsError,
      error: betsError?.message,
      count: bets?.length || 0,
      recent: bets?.slice(0, 3) || []
    };

    // Check reco_bet_legs table
    const { data: legs, error: legsError } = await supabase
      .from('reco_bet_legs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    status.database_status.reco_bet_legs = {
      exists: !legsError,
      error: legsError?.message,
      count: legs?.length || 0,
      recent: legs?.slice(0, 3) || []
    };

    // Check for grading readiness
    if (legs && legs.length > 0) {
      const ungradedLegs = legs.filter(leg => !leg.result);
      status.recent_picks = {
        total_legs: legs.length,
        ungraded_legs: ungradedLegs.length,
        sample_leg: legs[0] || null
      };
    }

    // Overall tracking status
    status.tracking_ready = !recosError && !betsError && !legsError && 
                           recos && recos.length > 0 && 
                           bets && bets.length > 0 && 
                           legs && legs.length > 0;

    return res.status(200).json(status);

  } catch (error) {
    console.error('Error checking tracking status:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}