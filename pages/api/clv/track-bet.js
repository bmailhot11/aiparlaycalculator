/**
 * CLV Tracking API - Track Bet Suggestion
 * Records opening line data when we suggest a bet to track CLV performance
 */

import { supabase } from '../../../utils/supabaseClient';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    sport,
    home_team,
    away_team,
    market_type,
    selection,
    game_id,
    commence_time,
    opening_odds_decimal,
    opening_odds_american,
    opening_sportsbook,
    suggested_probability,
    ev_at_suggestion,
    kelly_size_suggested,
    suggestion_source = 'ai_model',
    confidence_score,
    model_version = 'v2.1',
    notes
  } = req.body;

  // Validate required fields
  if (!sport || !home_team || !away_team || !market_type || !selection || 
      !game_id || !commence_time || !opening_odds_decimal || !opening_sportsbook) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    // Generate unique bet ID
    const bet_id = crypto
      .createHash('sha256')
      .update(`${game_id}-${market_type}-${selection}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    // Calculate opening implied probability
    const opening_implied_prob = 1 / opening_odds_decimal;

    // Insert CLV tracking record
    const { data, error } = await supabase
      .from('clv_bet_tracking')
      .insert({
        bet_id,
        sport,
        home_team,
        away_team,
        market_type,
        selection,
        game_id,
        commence_time,
        opening_odds_decimal,
        opening_odds_american,
        opening_sportsbook,
        opening_implied_prob: opening_implied_prob.toFixed(4),
        suggested_probability: suggested_probability?.toFixed(4),
        ev_at_suggestion,
        kelly_size_suggested,
        suggestion_source,
        confidence_score,
        model_version,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ CLV tracking insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to track bet suggestion'
      });
    }

    console.log(`✅ CLV tracking started for bet: ${bet_id} (${selection})`);

    return res.status(200).json({
      success: true,
      tracking_id: data.id,
      bet_id: data.bet_id,
      message: 'Bet suggestion tracked successfully'
    });

  } catch (error) {
    console.error('❌ CLV tracking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error tracking bet suggestion'
    });
  }
}