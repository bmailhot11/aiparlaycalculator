// pages/api/stripe-webhook.js
import Stripe from 'stripe';
import { supabase } from '../../utils/supabaseClient';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Disable the default body parser to handle raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;

  try {
    // Get the raw body as a buffer
    const rawBody = await buffer(req);
    const sig = req.headers['stripe-signature'];

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`🎯 Processing Stripe webhook: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log the event for audit trail
    await logWebhookEvent(event);

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('🛒 Checkout session completed:', session.id);
  
  try {
    if (session.mode === 'subscription') {
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const customer = await stripe.customers.retrieve(session.customer);
      
      // Find user by email or customer metadata
      const userId = session.metadata?.user_id || 
                    subscription.metadata?.user_id || 
                    customer.metadata?.user_id;
      
      if (userId && userId !== 'anonymous') {
        await updateUserSubscription(userId, subscription, customer.id);
      } else {
        console.warn('No user ID found for checkout session:', session.id);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
    
    if (userId && userId !== 'anonymous') {
      await updateUserSubscription(userId, subscription, customer.id);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
    
    if (userId && userId !== 'anonymous') {
      await updateUserSubscription(userId, subscription, customer.id);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
    
    if (userId && userId !== 'anonymous') {
      await updateUserSubscription(userId, subscription, customer.id);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  console.log('💳 Payment succeeded for invoice:', invoice.id);
  
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customer = await stripe.customers.retrieve(invoice.customer);
      const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
      
      if (userId && userId !== 'anonymous') {
        await updateUserSubscription(userId, subscription, customer.id);
        
        // Log successful payment event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          event_type: 'payment_succeeded',
          event_data: {
            invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency
          },
          stripe_event_id: `invoice_${invoice.id}`
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  console.log('❌ Payment failed for invoice:', invoice.id);
  
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customer = await stripe.customers.retrieve(invoice.customer);
      const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
      
      if (userId && userId !== 'anonymous') {
        // Update subscription status
        await updateUserSubscription(userId, subscription, customer.id);
        
        // Log failed payment event
        await supabase.from('subscription_events').insert({
          user_id: userId,
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          event_type: 'payment_failed',
          event_data: {
            invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            attempt_count: invoice.attempt_count
          },
          stripe_event_id: `invoice_${invoice.id}_failed`
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription) {
  console.log('⏰ Trial will end for subscription:', subscription.id);
  
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = subscription.metadata?.user_id || customer.metadata?.user_id;
    
    if (userId && userId !== 'anonymous') {
      // Log trial ending event
      await supabase.from('subscription_events').insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        event_type: 'trial_will_end',
        event_data: {
          trial_end: subscription.trial_end,
          days_remaining: Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
        }
      });
      
      // Could send email notification here
      console.log(`Trial ending in ~${Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))} days for user: ${userId}`);
    }
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

// Update user subscription in database
async function updateUserSubscription(userId, subscription, customerId) {
  try {
    const subscriptionData = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    };

    // Handle trial data
    if (subscription.trial_start && subscription.trial_end) {
      subscriptionData.trial_start_date = new Date(subscription.trial_start * 1000).toISOString();
      subscriptionData.trial_end_date = new Date(subscription.trial_end * 1000).toISOString();
    }

    // Determine premium status
    const isPremium = ['trialing', 'active'].includes(subscription.status);
    subscriptionData.is_premium = isPremium;
    
    // Set premium expiration
    if (subscription.status === 'trialing' && subscription.trial_end) {
      subscriptionData.premium_expires_at = new Date(subscription.trial_end * 1000).toISOString();
    } else if (subscription.status === 'active') {
      subscriptionData.premium_expires_at = new Date(subscription.current_period_end * 1000).toISOString();
    } else {
      subscriptionData.premium_expires_at = null;
    }

    // Update user profile
    const { error } = await supabase
      .from('user_profiles')
      .update(subscriptionData)
      .eq('user_id', userId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log(`✅ Updated subscription for user ${userId}: ${subscription.status}`);
    
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Log webhook events for audit trail
async function logWebhookEvent(event) {
  try {
    await supabase.from('subscription_events').insert({
      user_id: 'system',
      event_type: `webhook_${event.type}`,
      event_data: {
        event_id: event.id,
        object_id: event.data.object.id,
        created: event.created
      },
      stripe_event_id: event.id
    });
  } catch (error) {
    // Don't throw here, logging shouldn't break the webhook
    console.error('Error logging webhook event:', error);
  }
}