// pages/api/stripe/webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);
        
        // Handle successful subscription
        if (session.mode === 'subscription') {
          await handleSuccessfulSubscription(session);
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);
        await handleSubscriptionCreated(subscription);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('Subscription updated:', updatedSubscription.id);
        await handleSubscriptionUpdated(updatedSubscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription cancelled:', deletedSubscription.id);
        await handleSubscriptionCancelled(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice.id);
        await handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('Payment failed:', failedInvoice.id);
        await handlePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSuccessfulSubscription(session) {
  try {
    // Get customer info from session
    const customerEmail = session.customer_email || session.customer_details?.email;
    const userIdentifier = session.metadata?.user_identifier; // NEW: Get userIdentifier from metadata
    
    if (!customerEmail) {
      console.error('No customer email found in session');
      return;
    }

    if (!userIdentifier) {
      console.error('No user identifier found in session metadata');
      return;
    }

    console.log('Processing successful subscription for:', customerEmail, 'UserID:', userIdentifier);

    // Send access code email immediately after successful payment
    await sendAccessCodeEmail(customerEmail);

    // Store subscription by userIdentifier (KEY CHANGE)
    await updateUserPremiumStatus(userIdentifier, {
      isPremium: true,
      email: customerEmail,
      subscriptionId: session.subscription,
      customerId: session.customer,
      sessionId: session.id,
      plan: session.metadata?.plan,
      activatedAt: new Date().toISOString()
    });

    console.log('Successfully processed subscription for UserID:', userIdentifier);
  } catch (error) {
    console.error('Error handling successful subscription:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    // Retrieve customer to get email
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (customer.email) {
      // Get userIdentifier from customer metadata or subscription metadata
      const userIdentifier = customer.metadata?.user_identifier || subscription.metadata?.user_identifier;
      
      if (!userIdentifier) {
        console.error('No user identifier found for subscription:', subscription.id);
        return;
      }

      // Send access code for new subscriptions
      await sendAccessCodeEmail(customer.email);
      
      await updateUserPremiumStatus(userIdentifier, {
        isPremium: true,
        email: customer.email,
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (customer.email) {
      const userIdentifier = customer.metadata?.user_identifier || subscription.metadata?.user_identifier;
      
      if (!userIdentifier) {
        console.error('No user identifier found for subscription update:', subscription.id);
        return;
      }

      const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
      
      await updateUserPremiumStatus(userIdentifier, {
        isPremium,
        email: customer.email,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    if (customer.email) {
      const userIdentifier = customer.metadata?.user_identifier || subscription.metadata?.user_identifier;
      
      if (!userIdentifier) {
        console.error('No user identifier found for subscription cancellation:', subscription.id);
        return;
      }

      await updateUserPremiumStatus(userIdentifier, {
        isPremium: false,
        email: customer.email,
        subscriptionId: subscription.id,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      if (customer.email) {
        const userIdentifier = customer.metadata?.user_identifier || subscription.metadata?.user_identifier;
        
        if (!userIdentifier) {
          console.error('No user identifier found for payment success:', invoice.id);
          return;
        }

        await updateUserPremiumStatus(userIdentifier, {
          isPremium: true,
          email: customer.email,
          lastPaymentAt: new Date().toISOString(),
          status: 'active'
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      if (customer.email) {
        const userIdentifier = customer.metadata?.user_identifier || subscription.metadata?.user_identifier;
        
        if (!userIdentifier) {
          console.error('No user identifier found for payment failure:', invoice.id);
          return;
        }

        // Don't immediately cancel, Stripe will retry
        await updateUserPremiumStatus(userIdentifier, {
          email: customer.email,
          paymentFailedAt: new Date().toISOString(),
          status: 'past_due'
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Send access code email
async function sendAccessCodeEmail(email) {
  try {
    console.log('🔐 Sending access code to:', email);
    
    // Use your actual domain directly
    const baseUrl = 'https://www.betchekr.com';
    
    const response = await fetch(`${baseUrl}/api/send-access-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        reason: 'purchase'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Access code sent successfully to:', email);
      console.log('📧 Debug access code:', result.debug?.accessCode); // Remove in production
    } else {
      const error = await response.text();
      console.error('❌ Failed to send access code:', error);
    }
  } catch (error) {
    console.error('❌ Error sending access code email:', error);
  }
}

// Store users by userIdentifier instead of email (KEY CHANGE)
async function updateUserPremiumStatus(userIdentifier, updateData) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(process.cwd(), 'data', 'premium-users.json');
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    
    let users = {};
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty object
      console.log('Creating new premium users file');
    }
    
    // Update or create user record BY USER IDENTIFIER (not email)
    users[userIdentifier] = {
      ...users[userIdentifier],
      ...updateData,
      userIdentifier,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(dataFile, JSON.stringify(users, null, 2));
    console.log('Updated premium status for userIdentifier:', userIdentifier);
  } catch (error) {
    console.error('Error updating user premium status:', error);
  }
}