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

    // Get user's subscription data directly from user_profiles table
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_profiles')
      .select('subscription_status, trial_start_date, trial_end_date, current_period_start, current_period_end, canceled_at, cancel_at_period_end')
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

    // Calculate if user has premium access
    const now = new Date();
    const trialEnd = subscriptionData.trial_end_date ? new Date(subscriptionData.trial_end_date) : null;
    const periodEnd = subscriptionData.current_period_end ? new Date(subscriptionData.current_period_end) : null;
    
    const hasPremiumAccess = 
      (subscriptionData.subscription_status === 'trialing' && trialEnd && trialEnd > now) ||
      (subscriptionData.subscription_status === 'active' && periodEnd && periodEnd > now);

    // Calculate days remaining
    let daysRemaining = 0;
    let secondsRemaining = 0;
    if (subscriptionData.subscription_status === 'trialing' && trialEnd && trialEnd > now) {
      secondsRemaining = Math.floor((trialEnd - now) / 1000);
      daysRemaining = Math.ceil(secondsRemaining / (24 * 60 * 60));
    } else if (subscriptionData.subscription_status === 'active' && periodEnd && periodEnd > now) {
      secondsRemaining = Math.floor((periodEnd - now) / 1000);
      daysRemaining = Math.ceil(secondsRemaining / (24 * 60 * 60));
    }

    // Determine status display
    let statusDisplay = 'No Access';
    if (subscriptionData.subscription_status === 'trialing') {
      statusDisplay = 'Free Trial';
    } else if (subscriptionData.subscription_status === 'active') {
      statusDisplay = 'Premium';
    } else if (subscriptionData.subscription_status === 'canceled' && periodEnd && periodEnd > now) {
      statusDisplay = 'Canceled (Active Until End)';
    } else if (subscriptionData.subscription_status === 'past_due') {
      statusDisplay = 'Payment Issue';
    }

    return res.status(200).json({
      success: true,
      subscription: {
        status: subscriptionData.subscription_status || 'none',
        has_premium_access: hasPremiumAccess,
        trial_start_date: subscriptionData.trial_start_date,
        trial_end_date: subscriptionData.trial_end_date,
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        canceled_at: subscriptionData.canceled_at,
        cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
        days_remaining: daysRemaining,
        status_display: statusDisplay,
        seconds_remaining: secondsRemaining
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