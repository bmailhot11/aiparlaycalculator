// pages/api/create-checkout-session.js
import Stripe from 'stripe';
import { supabase } from '../../utils/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, userId } = req.body;
    
    // Get user fingerprint for tracking
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = `${ip}_${userAgent.slice(0, 50)}`;
    
    // Determine base URL for redirects
    const baseUrl = req.headers.origin || 
                   (req.headers.host ? `https://${req.headers.host}` : null) || 
                   'https://localhost:3000';
    
    // Check if user already has a Stripe customer ID
    let customerId = null;
    if (userId) {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id, email')
        .eq('user_id', userId)
        .single();
      
      customerId = userProfile?.stripe_customer_id;
      
      // Create Stripe customer if doesn't exist
      if (!customerId && (email || userProfile?.email)) {
        const customer = await stripe.customers.create({
          email: email || userProfile.email,
          metadata: {
            user_id: userId,
            fingerprint: fingerprint
          }
        });
        customerId = customer.id;
        
        // Update user profile with Stripe customer ID
        await supabase
          .from('user_profiles')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId);
      }
    }
    
    // Create checkout session with one-month free trial
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BetChekr Premium',
              description: '1 month free, then $9.99/month - Cancel anytime',
              images: ['https://aiparlaycalculator.com/betchekr_owl_logo.png'],
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 30, // One month free trial
        metadata: {
          user_id: userId || 'anonymous',
          fingerprint: fingerprint,
          source: 'pricing_page'
        }
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        user_id: userId || 'anonymous',
        fingerprint: fingerprint,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: email || undefined,
      automatic_tax: {
        enabled: false, // Set to true if you want to handle taxes automatically
      },
    };

    // Add customer ID if we have one
    if (customerId) {
      sessionConfig.customer = customerId;
      delete sessionConfig.customer_email; // Remove email if using existing customer
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`✅ Created checkout session for ${email || userId || 'anonymous'} with 30-day trial`);

    return res.status(200).json({ 
      success: true,
      sessionId: session.id,
      url: session.url,
      trial_days: 30
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}