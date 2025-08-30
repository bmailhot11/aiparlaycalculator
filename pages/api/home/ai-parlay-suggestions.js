// API endpoint to fetch real AI generated parlay suggestions for home page
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 Fetching recent parlay suggestions from daily picks...');
    
    // Get recent parlay bets directly from reco_bets (look for parlay bet types)
    const { data: multiLegBets, error: betsError } = await supabase
      .from('reco_bets')
      .select(`
        id,
        bet_type,
        combined_odds,
        edge_percentage,
        total_legs,
        created_at
      `)
      .in('bet_type', ['parlay2', 'parlay4'])  // Get parlay bets by type
      .order('created_at', { ascending: false })
      .limit(5);

    if (betsError) {
      console.error('Error fetching multi-leg bets:', betsError);
      return res.status(200).json({ success: true, parlay: null });
    }

    if (multiLegBets && multiLegBets.length > 0) {
      // Use the most recent multi-leg bet
      const bestParlay = multiLegBets[0];
      
      // Get the legs for this parlay
      const { data: parlayLegs, error: legsError } = await supabase
        .from('reco_bet_legs')
        .select(`
          home_team,
          away_team,
          selection,
          market_type,
          best_odds,
          sport,
          leg_index
        `)
        .eq('bet_id', bestParlay.id)
        .order('leg_index');

      if (!legsError && parlayLegs && parlayLegs.length > 0) {
        console.log(`✅ Found recent ${bestParlay.total_legs}-leg parlay with ${parlayLegs.length} legs`);
        
        const parlayData = {
          legs: parlayLegs.slice(0, 3).map(leg => ({
            team: leg.selection || leg.home_team,
            bet: leg.market_type || 'Moneyline',
            odds: leg.best_odds || '+100',
            sport: leg.sport
          })),
          totalOdds: bestParlay.combined_odds || '+1000',
          confidence: bestParlay.edge_percentage > 5 ? 'High' : 
                     bestParlay.edge_percentage > 2 ? 'Medium' : 'Low',
          type: 'Daily Pick',
          expectedValue: bestParlay.edge_percentage,
          reasoning: 'Generated from daily edge opportunities'
        };

        return res.status(200).json({
          success: true,
          parlay: parlayData,
          source: 'reco_bets',
          totalLegs: bestParlay.total_legs
        });
      }
    }

    console.log('No real parlay data available');
    return res.status(200).json({ 
      success: true, 
      parlay: null,
      message: 'No AI parlay suggestions available at this time'
    });

  } catch (error) {
    console.error('Error fetching AI parlay suggestions:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}