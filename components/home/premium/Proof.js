import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';

// Simple SVG sparkline component
function CLVSparkline({ data, className = "" }) {
  const maxValue = Math.max(...data.map(d => Math.abs(d.clv)));
  const normalizedData = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 280, // 280px width
    y: 40 - (d.clv / maxValue) * 30 // Center around 40, range ±30
  }));

  const pathD = normalizedData.reduce((path, point, i) => {
    const command = i === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Y-axis labels - properly separated from chart */}
        <div className="flex flex-col justify-between text-xs text-premium-text-muted pr-3 py-1 h-20">
          <span className="leading-none">+5%</span>
          <span className="opacity-60 leading-none">0%</span>
          <span className="leading-none">-5%</span>
        </div>
        
        {/* Main chart area */}
        <div className="flex-1">
          <svg width="100%" height="80" viewBox="0 0 280 80" className="w-full h-20 block">
            {/* Zero baseline */}
            <line 
              x1="0" y1="40" x2="280" y2="40" 
              stroke="var(--border)" 
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Grid lines */}
            <line x1="0" y1="20" x2="280" y2="20" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
            <line x1="0" y1="60" x2="280" y2="60" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
            
            {/* Gradient fill under line */}
            <defs>
              <linearGradient id="clvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${pathD} L 280 80 L 0 80 Z`}
              fill="url(#clvGradient)"
            />
            
            {/* CLV line */}
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            />
            
            {/* Data points */}
            {normalizedData.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="2"
                fill="var(--accent)"
                className="opacity-70"
              />
            ))}
          </svg>
          
          {/* X-axis labels - properly separated from chart */}
          <div className="flex justify-between text-xs text-premium-text-muted pt-2 px-1">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Proof({ data }) {
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
            Proof, not promises
          </h2>
          <p className="body-text max-w-2xl mx-auto">
            We judge ourselves by Closing Line Value (CLV). Did our picks beat the final market price? 
            Wins and losses fluctuate—CLV shows if the price was right.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* CLV Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-premium-lg"
            style={{
              background: 'var(--panel-80)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-1)'
            }}
          >
            {data.clv ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-premium-accent" />
                  <div>
                    <h3 className="text-lg font-semibold text-premium-text-primary">
                      30-Day CLV Performance
                    </h3>
                    <p className="text-premium-text-muted text-sm">
                      Average: {data.clv.avgCLV}
                    </p>
                  </div>
                </div>

                <CLVSparkline data={data.clv.sparkline} className="mb-6" />

                <div className="flex items-center justify-between text-sm">
                  <div className="text-premium-text-muted">
                    Positive CLV indicates beating closing prices
                  </div>
                  <div className="premium-badge">
                    Live tracking
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-premium-text-muted opacity-50" />
                <div className="text-premium-text-primary font-semibold mb-2">CLV Tracking</div>
                <div className="text-premium-text-muted text-sm mb-4">
                  Track your betting performance vs. closing lines
                </div>
                <div className="text-premium-text-muted text-xs">
                  Data will appear after placing tracked bets
                </div>
              </div>
            )}
          </motion.div>

          {/* Yesterday's Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-premium-text-primary mb-2">
                Yesterday's highlights
              </h3>
              <p className="body-text text-premium-text-muted">
                Recent bets vs. closing prices
              </p>
            </div>

            <div className="space-y-4">
              {data.clv && data.clv.highlights.length > 0 ? (
                data.clv.highlights.map((highlight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="glass-panel p-4 rounded-premium-md"
                    style={{
                      background: 'var(--panel-80)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-premium-text-primary font-medium text-sm">
                        {highlight.market}
                      </div>
                      <div className={`font-semibold ${
                        highlight.positive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {highlight.delta}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-premium-text-muted">
                      <span>
                        Placed: <span className="text-premium-accent font-mono">{highlight.placedPrice}</span>
                      </span>
                      <span>
                        Close: <span className="text-premium-accent font-mono">{highlight.closePrice}</span>
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-premium-text-muted text-sm">
                    Recent bet performance will appear here
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Link href="/learn/what-is-expected-value">
                <button className="inline-flex items-center gap-2 text-premium-accent font-medium hover:gap-3 transition-all duration-200">
                  See full results
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-4 rounded-premium-md bg-white/5 border border-premium-border text-center"
        >
          <p className="text-xs text-premium-text-muted">
            Past performance doesn't guarantee future results. CLV is a measure of bet quality, not profit.
            <Link href="/learn" className="text-premium-accent ml-1 hover:underline">
              Learn more about CLV
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}