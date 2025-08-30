import { motion } from 'framer-motion';
import Link from 'next/link';
import { DollarSign, Target, Brain, ArrowRight } from 'lucide-react';

const VALUE_PROPS = [
  {
    id: 'ai-analysis',
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our AI scans thousands of lines across sports to find mispriced opportunities',
    learnMore: '/learn/what-does-plus-150-mean',
    detail: 'Advanced algorithms identify profitable patterns'
  },
  {
    id: 'ev-identification', 
    icon: Target,
    title: '+EV Detection',
    description: 'We pinpoint bets with positive expected value for long-term profit',
    learnMore: '/learn/what-is-expected-value',
    detail: 'Mathematical edge calculation & vig removal'
  },
  {
    id: 'smart-guidance',
    icon: DollarSign,
    title: 'Smart Guidance', 
    description: 'Get optimal stake sizing and profit-maximizing bet recommendations',
    learnMore: '/kelly-calculator',
    detail: 'Kelly criterion & bankroll management'
  }
];

export default function ValueStrip() {
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
            Your AI betting assistant in action
          </h2>
          <p className="body-text max-w-2xl mx-auto">
            BetChekr works 24/7 analyzing odds, identifying profitable opportunities, and guiding your betting decisions for consistent long-term growth.
          </p>
        </motion.div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUE_PROPS.map((prop, index) => {
            const IconComponent = prop.icon;
            
            return (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-panel p-8 rounded-premium-lg text-center group hover:transform hover:-translate-y-1 transition-all duration-300"
                style={{
                  background: 'var(--panel-80)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-1)'
                }}
              >
                
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-premium-accent text-black font-bold text-xl mb-6">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-premium-md bg-premium-accent/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-premium-accent" />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-premium-text-primary">
                    {prop.title}
                  </h3>
                  
                  <p className="body-text">
                    {prop.description}
                  </p>

                  <div className="text-sm text-premium-text-muted">
                    {prop.detail}
                  </div>

                  {/* Learn More Link */}
                  <Link href={prop.learnMore}>
                    <button className="inline-flex items-center gap-2 text-premium-accent font-medium text-sm hover:gap-3 transition-all duration-200 mt-4 group-hover:text-premium-accent-hover">
                      Learn the math
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="text-center">
            <Link href="/learn/how-to-use-ai-for-sports-betting">
              <button className="btn-secondary px-8 py-3 text-base font-semibold">
                Read Our Guide
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}