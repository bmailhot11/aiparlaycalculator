// Get user subscription status
import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's subscription status using the view
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscription_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError) {
      console.error('Subscription status error:', subscriptionError);
      return res.status(200).json({
        subscription: {
          status: 'none',
          has_premium_access: false,
          trial_end_date: null,
          current_period_end: null,
          cancel_at_period_end: false,
          days_remaining: 0,
          status_display: 'No Access'
        }
      });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    if (subscriptionData.seconds_remaining > 0) {
      daysRemaining = Math.ceil(subscriptionData.seconds_remaining / (24 * 60 * 60));
    }

    return res.status(200).json({
      success: true,
      subscription: {
        status: subscriptionData.subscription_status,
        has_premium_access: subscriptionData.has_premium_access,
        trial_start_date: subscriptionData.trial_start_date,
        trial_end_date: subscriptionData.trial_end_date,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        canceled_at: subscriptionData.canceled_at,
        cancel_at_period_end: subscriptionData.cancel_at_period_end,
        days_remaining: daysRemaining,
        status_display: subscriptionData.status_display,
        seconds_remaining: subscriptionData.seconds_remaining
      }
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
}