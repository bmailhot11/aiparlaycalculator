// pages/api/cancel-subscription.js
import Stripe from 'stripe';
import { supabase } from '../../utils/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, immediately = false } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's subscription info
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('stripe_subscription_id, stripe_customer_id, subscription_status, current_period_end')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'User not found or no subscription data' });
    }

    if (!userProfile.stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Check if subscription is already canceled
    if (userProfile.subscription_status === 'canceled') {
      return res.status(400).json({ error: 'Subscription is already canceled' });
    }

    let canceledSubscription;

    if (immediately) {
      // Cancel immediately - user loses access now
      canceledSubscription = await stripe.subscriptions.cancel(userProfile.stripe_subscription_id);
      
      // Update user profile immediately
      await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'canceled',
          is_premium: false,
          premium_expires_at: null,
          canceled_at: new Date().toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`✅ Immediately canceled subscription for user: ${userId}`);
    } else {
      // Cancel at end of billing period - user keeps access until then
      canceledSubscription = await stripe.subscriptions.update(userProfile.stripe_subscription_id, {
        cancel_at_period_end: true
      });

      // Update user profile to reflect cancellation at period end
      await supabase
        .from('user_profiles')
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`✅ Scheduled subscription cancellation at period end for user: ${userId}`);
    }

    // Log cancellation event
    await supabase.from('subscription_events').insert({
      user_id: userId,
      stripe_customer_id: userProfile.stripe_customer_id,
      stripe_subscription_id: userProfile.stripe_subscription_id,
      event_type: immediately ? 'subscription_canceled_immediately' : 'subscription_canceled_at_period_end',
      event_data: {
        canceled_at: canceledSubscription.canceled_at,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: canceledSubscription.current_period_end,
        source: 'user_dashboard'
      }
    });

    return res.status(200).json({
      success: true,
      message: immediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the current billing period',
      subscription: {
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: canceledSubscription.current_period_end,
        canceled_at: canceledSubscription.canceled_at
      }
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error.message 
    });
  }
}