import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Head from 'next/head';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51Rvn7PKm6nZD0l54X57miyvp3a4iMn6PJX5PMh76JDLtz1iK12GZPHresfMHfBgpoLKRaJuPXcHamU2wxmu0K9jM00AYYr47RF');

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'monthly', // or use actual price ID from Stripe
        }),
      });

      const { sessionId, url } = await response.json();
      
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        // Fallback to client-side redirect
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) {
          console.error('Stripe redirect error:', error);
          alert('Failed to redirect to checkout. Please try again.');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing - BetChekr</title>
        <meta name="description" content="Simple, affordable pricing at $9.99/month. Professional-grade betting analysis without the premium price tag. No tiers, no limits, just smart betting tools." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              Simple <span className="text-blue-400">Pricing</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade betting analysis for the price of a single bet. No tiers, no limits, no surprises.
            </p>
          </div>

          {/* Comparison Section */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-700 mb-12">
              <h2 className="text-2xl font-bold text-white mb-8 text-center">How We Compare</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-red-400 text-xl font-bold mb-4">Other Betting Tools</div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                    <div className="text-3xl font-bold text-red-400 mb-2">$200-500</div>
                    <div className="text-sm text-gray-400 mb-4">per month</div>
                    <ul className="text-sm text-gray-300 space-y-2 text-left">
                      <li>• Complex tier systems</li>
                      <li>• Limited features per plan</li>
                      <li>• Hidden fees and add-ons</li>
                      <li>• Annual commitments</li>
                      <li>• Enterprise-focused pricing</li>
                    </ul>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-blue-400 text-xl font-bold mb-4">BetChekr</div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-lg p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">BEST VALUE</span>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 mb-2">$9.99</div>
                    <div className="text-sm text-gray-300 mb-4">per month</div>
                    <ul className="text-sm text-gray-300 space-y-2 text-left">
                      <li>✓ All features included</li>
                      <li>✓ No usage limits</li>
                      <li>✓ No hidden fees</li>
                      <li>✓ Cancel anytime</li>
                      <li>✓ Fair, transparent pricing</li>
                    </ul>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-gray-400 text-xl font-bold mb-4">Free Tools</div>
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-6">
                    <div className="text-3xl font-bold text-gray-400 mb-2">$0</div>
                    <div className="text-sm text-gray-400 mb-4">per month</div>
                    <ul className="text-sm text-gray-300 space-y-2 text-left">
                      <li>• Basic odds conversion</li>
                      <li>• No real-time data</li>
                      <li>• Limited sportsbooks</li>
                      <li>• No AI analysis</li>
                      <li>• Ad-supported</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Pricing Card */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-3xl p-12 border border-blue-500/50 relative">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                  SIMPLE & AFFORDABLE
                </span>
              </div>

              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">All-Access Plan</h2>
                <div className="mb-8">
                  <span className="text-6xl font-bold text-white">$9.99</span>
                  <span className="text-xl text-gray-300">/month</span>
                </div>

                <p className="text-gray-300 text-lg mb-8">
                  Everything you need for mathematical betting success. No tiers, no limits, no nonsense.
                </p>

                {/* Features List */}
                <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Unlimited bet slip analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">AI-powered parlay generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Real-time odds from 10+ books</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Expected value calculations</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Kelly Criterion sizing</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Market inefficiency detection</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Bankroll management advice</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-xl">✓</span>
                      <span className="text-white">Priority customer support</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Get Started - $9.99/month'}
                </button>
                
                <p className="text-gray-400 text-sm">
                  Cancel anytime. No hidden fees. No long-term commitments.
                </p>
              </div>
            </div>
          </div>

          {/* Why This Price Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-12 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Why $9.99?</h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-6">Our Philosophy</h3>
                  <div className="space-y-4 text-gray-300">
                    <p>
                      We believe that sophisticated betting tools shouldn't cost more than your betting bankroll. 
                      At $9.99/month, our tool pays for itself with just one optimized bet.
                    </p>
                    <p>
                      While competitors charge $200-500+ for similar analysis, we keep costs low by focusing on 
                      what matters: mathematical accuracy and user value, not premium pricing.
                    </p>
                    <p>
                      This isn't a loss leader or introductory price - it's our commitment to making smart betting 
                      accessible to everyone, not just high-rollers.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl p-8 border border-green-500/30">
                  <h4 className="text-xl font-bold text-white mb-4">Value Breakdown</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Professional EV analysis</span>
                      <span className="text-green-400">$200+ elsewhere</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Real-time odds feeds</span>
                      <span className="text-green-400">$50+ elsewhere</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">AI-powered insights</span>
                      <span className="text-green-400">$100+ elsewhere</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Unlimited usage</span>
                      <span className="text-green-400">$50+ elsewhere</span>
                    </div>
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Total Value</span>
                        <span className="text-red-400 line-through">$400+</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span className="text-blue-400">Our Price</span>
                        <span className="text-blue-400">$9.99</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {[
                {
                  question: "Is there a free trial?",
                  answer: "Yes! You can analyze up to 3 bet slips for free before subscribing. No credit card required."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Absolutely. Cancel with one click from your account dashboard. No questions asked, no cancellation fees."
                },
                {
                  question: "Are there any hidden fees or usage limits?",
                  answer: "None. $9.99/month gets you unlimited access to all features. No per-analysis charges, no premium tiers."
                },
                {
                  question: "How does this compare to $200+ tools?",
                  answer: "We provide the same mathematical rigor and real-time data as expensive tools, just without the premium markup. Same accuracy, better price."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, PayPal, and Apple Pay through our secure Stripe integration."
                },
                {
                  question: "Do you offer student or volume discounts?",
                  answer: "At $9.99, we're already priced as low as possible while maintaining service quality. This is our everyday low price."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3">{faq.question}</h3>
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-2xl p-8 border border-green-500/30 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-white mb-4">30-Day Money-Back Guarantee</h3>
              <p className="text-gray-300 leading-relaxed">
                Not satisfied with your mathematical edge? Get a full refund within 30 days, no questions asked. 
                We're confident our analysis will improve your betting decisions.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Betting Smarter?</h2>
              <p className="text-gray-300 mb-6">Join thousands of mathematically-minded bettors for less than the cost of a single bet.</p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg mr-4">
                Start Your $9.99 Plan
              </button>
              <a 
                href="/how-it-works"
                className="inline-block bg-transparent text-white px-8 py-3 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}