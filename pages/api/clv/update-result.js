/**
 * CLV Tracking API - Update Game Result
 * Updates game outcome to measure model prediction accuracy
 */

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    tracking_id,
    bet_id,
    game_result, // 'win', 'loss', 'push', 'cancelled'
    actual_outcome_correct // boolean - did our prediction match?
  } = req.body;

  // Validate required fields
  if ((!tracking_id && !bet_id) || !game_result) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields (tracking_id or bet_id, game_result)'
    });
  }

  try {
    // Find the tracking record
    let query = supabase.from('clv_bet_tracking');
    
    if (tracking_id) {
      query = query.eq('id', tracking_id);
    } else {
      query = query.eq('bet_id', bet_id);
    }

    const { data: trackingRecord, error: fetchError } = await query
      .select('*')
      .single();

    if (fetchError || !trackingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Tracking record not found'
      });
    }

    // Update the tracking record with game result
    const { data: updatedRecord, error: updateError } = await supabase
      .from('clv_bet_tracking')
      .update({
        game_result,
        result_timestamp: new Date().toISOString(),
        actual_outcome_correct,
        updated_at: new Date().toISOString()
      })
      .eq('id', trackingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ CLV result update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update game result'
      });
    }

    console.log(`✅ Game result updated for bet: ${trackingRecord.bet_id}`);
    console.log(`   Selection: ${trackingRecord.selection}`);
    console.log(`   Result: ${game_result}`);
    console.log(`   Prediction correct: ${actual_outcome_correct}`);

    // If this is a completed bet, also update performance summary
    if (['win', 'loss', 'push'].includes(game_result)) {
      await updatePerformanceSummary(trackingRecord, game_result, actual_outcome_correct);
    }

    return res.status(200).json({
      success: true,
      tracking_id: updatedRecord.id,
      bet_id: updatedRecord.bet_id,
      game_result: updatedRecord.game_result,
      prediction_correct: updatedRecord.actual_outcome_correct,
      message: 'Game result updated successfully'
    });

  } catch (error) {
    console.error('❌ CLV result update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating game result'
    });
  }
}

/**
 * Update daily performance summary
 */
async function updatePerformanceSummary(trackingRecord, game_result, actual_outcome_correct) {
  try {
    const date = new Date(trackingRecord.opening_timestamp).toISOString().split('T')[0];
    
    // Check if daily summary exists
    const { data: existingSummary } = await supabase
      .from('clv_performance_summary')
      .select('*')
      .eq('period_type', 'daily')
      .eq('period_start', date)
      .eq('period_end', date)
      .single();

    if (existingSummary) {
      // Update existing summary
      const updates = {
        suggestions_settled: existingSummary.suggestions_settled + 1,
        correct_predictions: existingSummary.correct_predictions + (actual_outcome_correct ? 1 : 0),
        prediction_accuracy: ((existingSummary.correct_predictions + (actual_outcome_correct ? 1 : 0)) / 
          (existingSummary.suggestions_settled + 1) * 100).toFixed(2)
      };

      await supabase
        .from('clv_performance_summary')
        .update(updates)
        .eq('id', existingSummary.id);
    } else {
      // Create new daily summary
      await supabase
        .from('clv_performance_summary')
        .insert({
          period_type: 'daily',
          period_start: date,
          period_end: date,
          total_bets_tracked: 1,
          suggestions_settled: 1,
          correct_predictions: actual_outcome_correct ? 1 : 0,
          prediction_accuracy: actual_outcome_correct ? 100.0 : 0.0
        });
    }
  } catch (error) {
    console.error('❌ Error updating performance summary:', error);
  }
}