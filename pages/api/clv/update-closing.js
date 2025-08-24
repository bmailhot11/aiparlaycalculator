/**
 * CLV Tracking API - Update Closing Line
 * Updates closing line data and calculates CLV when games are about to start
 */

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    tracking_id,
    bet_id,
    closing_odds_decimal,
    closing_odds_american,
    closing_sportsbook
  } = req.body;

  // Validate required fields
  if ((!tracking_id && !bet_id) || !closing_odds_decimal || !closing_sportsbook) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (tracking_id or bet_id, closing odds, sportsbook)'
    });
  }

  try {
    // Find the tracking record
    let query = supabase.from('clv_bet_tracking').select('*');
    
    if (tracking_id) {
      query = query.eq('id', tracking_id);
    } else {
      query = query.eq('bet_id', bet_id);
    }

    const { data: trackingRecord, error: fetchError } = await query.single();

    if (fetchError || !trackingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }

    // Calculate CLV metrics
    const opening_decimal = trackingRecord.opening_odds_decimal;
    const clv_decimal = (closing_odds_decimal - opening_decimal) / opening_decimal;
    const clv_percent = clv_decimal * 100;
    const closing_implied_prob = 1 / closing_odds_decimal;

    // Calculate cents CLV (American odds difference)
    let cents_clv = 0;
    const opening_american = parseFloat(trackingRecord.opening_odds_american.replace('+', ''));
    const closing_american = parseFloat(closing_odds_american.replace('+', ''));
    
    if (opening_american > 0 && closing_american > 0) {
      // Both positive
      cents_clv = closing_american - opening_american;
    } else if (opening_american < 0 && closing_american < 0) {
      // Both negative - closer to 0 is better
      cents_clv = opening_american - closing_american;
    } else {
      // Mixed - convert both to decimal and calculate
      const opening_dec = opening_american > 0 ? 
        (opening_american / 100) + 1 : 
        (100 / Math.abs(opening_american)) + 1;
      const closing_dec = closing_american > 0 ? 
        (closing_american / 100) + 1 : 
        (100 / Math.abs(closing_american)) + 1;
      cents_clv = Math.round((closing_dec - opening_dec) * 100);
    }

    // Update the tracking record with closing line data
    const { data: updatedRecord, error: updateError } = await supabase
      .from('clv_bet_tracking')
      .update({
        closing_odds_decimal,
        closing_odds_american,
        closing_sportsbook,
        closing_timestamp: new Date().toISOString(),
        clv_decimal: clv_decimal.toFixed(4),
        clv_percent: clv_percent.toFixed(3),
        cents_clv,
        closing_implied_prob: closing_implied_prob.toFixed(4),
        updated_at: new Date().toISOString()
      })
      .eq('id', trackingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ CLV update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update closing line'
      });
    }

    console.log(`✅ CLV updated for bet: ${trackingRecord.bet_id}`);
    console.log(`   Opening: ${trackingRecord.opening_odds_american} (${trackingRecord.opening_sportsbook})`);
    console.log(`   Closing: ${closing_odds_american} (${closing_sportsbook})`);
    console.log(`   CLV: ${clv_percent.toFixed(1)}% (${cents_clv > 0 ? '+' : ''}${cents_clv} cents)`);

    return res.status(200).json({
      success: true,
      tracking_id: updatedRecord.id,
      bet_id: updatedRecord.bet_id,
      clv_metrics: {
        clv_decimal: parseFloat(updatedRecord.clv_decimal),
        clv_percent: parseFloat(updatedRecord.clv_percent),
        cents_clv: updatedRecord.cents_clv
      },
      opening_line: {
        odds: trackingRecord.opening_odds_american,
        sportsbook: trackingRecord.opening_sportsbook
      },
      closing_line: {
        odds: closing_odds_american,
        sportsbook: closing_sportsbook
      },
      message: 'Closing line updated and CLV calculated'
    });

  } catch (error) {
    console.error('❌ CLV closing line update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating closing line'
    });
  }
}