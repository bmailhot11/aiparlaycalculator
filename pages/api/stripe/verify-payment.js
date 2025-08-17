// pages/api/stripe/verify-payment.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionId, userIdentifier } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('🔍 Verifying payment for session:', sessionId);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('💳 Session status:', session.payment_status);
    console.log('📧 Customer email:', session.customer_email);

    if (session.payment_status === 'paid') {
      // Payment was successful
      const customerEmail = session.customer_email || session.metadata?.customer_email;
      
      // Save premium status to database
      await updateUserPremiumStatus(customerEmail, {
        isPremium: true,
        subscriptionId: session.subscription,
        customerId: session.customer,
        sessionId: session.id,
        userIdentifier: userIdentifier || null,
        verifiedAt: new Date().toISOString()
      });
      
      console.log('✅ Payment verified and premium status saved for:', customerEmail);
      
      res.status(200).json({
        success: true,
        email: customerEmail,
        subscriptionId: session.subscription,
        customerId: session.customer,
      });
    } else {
      console.log('❌ Payment not completed:', session.payment_status);
      res.status(400).json({
        success: false,
        error: 'Payment not completed',
        status: session.payment_status,
      });
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
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
    throw error;
  }
}