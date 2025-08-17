// pages/api/stripe/verify-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { session_id, userIdentifier } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    console.log('Retrieved session:', {
      id: session.id,
      payment_status: session.payment_status,
      subscription: session.subscription,
      customer_email: session.customer_email
    });

    // Check if payment was successful
    const paymentSuccessful = session.payment_status === 'paid';
    
    let subscriptionActive = false;
    if (session.subscription) {
      // Retrieve subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      subscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';
      
      console.log('Subscription status:', subscription.status);
    }

    // Update user premium status if everything is successful
    if (paymentSuccessful && subscriptionActive && session.customer_email) {
      await updateUserPremiumStatus(session.customer_email, {
        isPremium: true,
        subscriptionId: session.subscription,
        customerId: session.customer,
        sessionId: session.id,
        userIdentifier: userIdentifier || null,
        verifiedAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      session_id: session.id,
      payment_status: session.payment_status,
      subscription_active: subscriptionActive,
      customer_email: session.customer_email,
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
}

async function updateUserPremiumStatus(email, updateData) {
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
      console.log('Creating new premium users file');
    }
    
    users[email] = {
      ...users[email],
      ...updateData,
      email,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(dataFile, JSON.stringify(users, null, 2));
    console.log('Updated premium status for:', email);
  } catch (error) {
    console.error('Error updating user premium status:', error);
  }
}