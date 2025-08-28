import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Crown, ArrowRight } from 'lucide-react';

const PRICING_FEATURES = {
  free: [
    '1 arbitrage scan per day',
    'Basic line shopping', 
    '1 bet slip analysis per day',
    'Kelly calculator access',
    'Educational content'
  ],
  premium: [
    'Unlimited arbitrage scanning',
    'Real-time line shopping across 15+ books',
    'Unlimited AI parlay generation',
    'Unlimited bet slip analysis',
    'Advanced Kelly sizing with risk management',
    'CLV tracking dashboard',
    'Custom alerts & notifications',
    'Priority support',
    'Early access to new features'
  ]
};

export default function Pricing() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-1240 mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-premium-text-primary font-semibold mb-4">
            Simple pricing, powerful tools
          </h2>
          <p className="body-text max-w-2xl mx-auto">
            Start free, upgrade when you're ready to unlock the full potential of smart betting.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-premium-lg relative"
            style={{
              background: 'var(--panel-80)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-1)'
            }}
          >
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-premium-text-primary mb-2">
                Free
              </h3>
              <div className="text-3xl font-bold text-premium-text-primary mb-1">
                $0
              </div>
              <div className="text-premium-text-muted text-sm">
                Always free
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_FEATURES.free.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-premium-text-muted">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/arbitrage">
              <button className="w-full btn-secondary py-3 text-base font-semibold">
                Get Started Free
              </button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 rounded-premium-lg relative transform scale-105"
            style={{
              background: 'var(--panel-80)',
              backdropFilter: 'blur(16px)',
              border: '2px solid var(--accent)',
              boxShadow: 'var(--shadow-2)'
            }}
          >
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-premium-accent text-black px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-premium-accent" />
                <h3 className="text-xl font-semibold text-premium-text-primary">
                  Premium
                </h3>
              </div>
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <div className="text-3xl font-bold text-premium-text-primary">
                  $9.99
                </div>
                <div className="text-premium-text-muted text-sm">
                  /month
                </div>
              </div>
              <div className="text-premium-text-muted text-sm">
                Cancel anytime
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_FEATURES.premium.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-premium-accent flex-shrink-0" />
                  <span className="text-premium-text-primary">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/pricing">
              <button className="w-full btn-primary py-3 text-base font-semibold inline-flex items-center justify-center gap-2 group">
                Go Premium
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom Trust Signals */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-premium-text-muted">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>7-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span>Secure payment via Stripe</span>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-premium-md bg-white/5 border border-premium-border max-w-2xl mx-auto">
            <p className="text-xs text-premium-text-muted">
              Need more convincing? Start with our free tier and upgrade when you see the value. 
              <Link href="/learn/how-to-use-ai-for-sports-betting" className="text-premium-accent ml-1 hover:underline">
                Read our guide
              </Link> to learn how professionals use these tools.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}