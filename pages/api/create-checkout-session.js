// pages/api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user fingerprint for tracking
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = `${ip}_${userAgent.slice(0, 50)}`;
    
    // Determine base URL for redirects
    const baseUrl = req.headers.origin || 
                   (req.headers.host ? `http://${req.headers.host}` : null) || 
                   'http://localhost:3001';
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'betchekr Premium',
              description: 'Unlimited access to all betting analysis tools',
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
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        fingerprint: fingerprint,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: req.body.email || undefined,
    });

    return res.status(200).json({ 
      success: true,
      sessionId: session.id,
      url: session.url 
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