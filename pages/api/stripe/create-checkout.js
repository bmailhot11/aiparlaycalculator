// pages/api/stripe/create-checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log('🏪 Stripe checkout request received');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('Origin:', req.headers.origin);
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, plan = 'monthly', userIdentifier } = req.body; // ADD userIdentifier

    if (!email) {
      console.error('❌ No email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!userIdentifier) {
      console.error('❌ No userIdentifier provided');
      return res.status(400).json({ error: 'User identifier is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate plan
    if (!['monthly', 'yearly'].includes(plan)) {
      console.error('❌ Invalid plan:', plan);
      return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "yearly"' });
    }

    // Ensure we have a valid origin for redirect URLs
    const origin = req.headers.origin || req.headers.host 
      ? `https://${req.headers.host}` 
      : 'http://localhost:3000'; // Fallback for development

    console.log('✅ Creating checkout session for:', email, 'UserID:', userIdentifier, 'Plan:', plan);
    console.log('🔗 Using origin:', origin);

    // Define pricing based on plan
    const pricingConfig = {
      monthly: {
        amount: 699, // $6.99
        interval: 'month',
        description: 'Monthly subscription with advanced AI analysis'
      },
      yearly: {
        amount: 4999, // $49.99
        interval: 'year',
        description: 'Yearly subscription - Save 40%! Advanced AI analysis'
      }
    };

    const selectedPricing = pricingConfig[plan];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `AiParlayCalculator Premium (${plan.charAt(0).toUpperCase() + plan.slice(1)})`,
              description: selectedPricing.description,
              // Remove images if you don't have a valid URL
              // images: ['https://your-domain.com/logo.png'],
            },
            unit_amount: selectedPricing.amount,
            recurring: {
              interval: selectedPricing.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        customer_email: email,
        user_identifier: userIdentifier, // ADD THIS - KEY ADDITION
        plan: plan,
        pricing_tier: plan === 'yearly' ? 'premium_yearly' : 'premium_monthly'
      },
      // Add these for better UX
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      // Optional: Add tax collection if needed
      // automatic_tax: { enabled: true },
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);
    console.log('💰 Plan selected:', plan, `($${(selectedPricing.amount / 100).toFixed(2)})`);

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id,
      plan: plan,
      amount: selectedPricing.amount
    });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error);
    
    // Provide more specific error messages
    if (error.type === 'StripeCardError') {
      res.status(400).json({ error: 'Card error: ' + error.message });
    } else if (error.type === 'StripeRateLimitError') {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
    } else if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({ error: 'Invalid request: ' + error.message });
    } else if (error.type === 'StripeAPIError') {
      res.status(500).json({ error: 'Stripe API error. Please try again.' });
    } else if (error.type === 'StripeConnectionError') {
      res.status(500).json({ error: 'Network error. Please check your connection.' });
    } else if (error.type === 'StripeAuthenticationError') {
      res.status(500).json({ error: 'Stripe authentication failed. Please contact support.' });
    } else {
      res.status(500).json({ 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}