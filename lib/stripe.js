import { loadStripe } from '@stripe/stripe-js';

// Client-side Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export const getStripe = () => {
  return stripePromise;
};