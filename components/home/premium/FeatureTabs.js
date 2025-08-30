import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Target, Brain, Upload, ArrowRight, ExternalLink } from 'lucide-react';

const FEATURE_TABS = [
  {
    id: 'arbitrage',
    label: 'Arbitrage',
    icon: TrendingUp,
    title: 'Guaranteed profit opportunities',
    description: 'Find risk-free bets across multiple sportsbooks. Lock in guaranteed returns regardless of outcome.',
    ctaText: 'Open Arbitrage Scanner',
    ctaLink: '/arbitrage',
    demo: (data) => (
      <div className="space-y-3">
        {data.arbitrage && data.arbitrage.length > 0 ? (
          data.arbitrage.map((arb, i) => (
            <div key={i} className="glass-panel p-4 rounded-premium-md">
              <div className="flex items-center justify-between mb-2">
                <div className="text-premium-text-primary font-medium">
                  {arb.market}
                </div>
                <div className="text-green-400 font-bold text-lg">
                  +{arb.returnPct.toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-premium-text-muted">{arb.legA.sportsbook}</span>
                  <span className="text-premium-accent font-mono">{arb.legA.american_odds || arb.legA.odds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-premium-text-muted">{arb.legB.sportsbook}</span>
                  <span className="text-premium-accent font-mono">{arb.legB.american_odds || arb.legB.odds}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-premium-text-muted mb-3">No arbitrage opportunities available</div>
            <div className="text-premium-text-muted text-sm">
              We scan continuously for guaranteed profit opportunities.<br/>
              <a href="/arbitrage" className="text-premium-accent hover:underline">Try the full scanner →</a>
            </div>
          </div>
        )}
      </div>
    )
  },
  {
    id: 'line-shop',
    label: 'Line Shop',
    icon: Target,
    title: 'Best odds across all books',
    description: 'Compare prices instantly. Never settle for bad odds when better ones exist.',
    ctaText: 'Open Line Shopping',
    ctaLink: '/line-shopping',
    demo: (data) => (
      <div className="premium-table">
        {data.lineShop && data.lineShop.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-premium-border text-sm font-semibold text-premium-text-primary">
              <span>Market</span>
              <span>Best Book</span>
              <span>Edge</span>
            </div>
            {data.lineShop.map((line, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 p-4 border-b border-premium-border/50 text-sm hover:bg-white/5 transition-colors">
                <div>
                  <div className="text-premium-text-primary font-medium">{line.market}</div>
                </div>
                <div>
                  <div className="text-premium-text-muted">{line.bestBook}</div>
                  <div className="text-premium-accent font-mono text-xs">{line.bestOdds}</div>
                </div>
                <div>
                  <div className="text-green-400 font-semibold">+{line.deltaPct.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-premium-text-muted mb-3">No line shopping data available</div>
            <div className="text-premium-text-muted text-sm">
              Compare prices across sportsbooks to find the best odds.<br/>
              <a href="/line-shopping" className="text-premium-accent hover:underline">Try line shopping →</a>
            </div>
          </div>
        )}
      </div>
    )
  },
  {
    id: 'ai-parlays',
    label: 'AI Parlays',
    icon: Brain,
    title: 'Smart parlay suggestions',
    description: 'AI-generated parlays optimized for +EV or fan enjoyment. Two modes to match your style.',
    ctaText: 'Generate AI Parlay',
    ctaLink: '/ai-parlay',
    demo: (data) => (
      <div className="space-y-4">
        {data.parlay ? (
          <>
            <div className="glass-panel p-4 rounded-premium-md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-premium-text-primary font-semibold">
                    {data.parlay.type}
                  </div>
                  <div className="text-premium-text-muted text-sm">
                    {data.parlay.confidence} • {data.parlay.legs.length} legs
                  </div>
                </div>
                <div className="text-premium-accent font-bold text-xl">
                  {data.parlay.totalOdds}
                </div>
              </div>
              
              <div className="space-y-2">
                {data.parlay.legs.map((leg, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-premium-border/30 last:border-b-0">
                    <div>
                      <span className="text-premium-text-primary font-medium">{leg.team}</span>
                      <span className="text-premium-text-muted ml-2">{leg.bet}</span>
                    </div>
                    <span className="text-premium-accent font-mono">{leg.odds}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 btn-secondary py-2 text-sm">+EV Mode</button>
              <button className="flex-1 bg-white/5 text-premium-text-muted py-2 rounded-premium-sm text-sm border border-premium-border">Fan Mode</button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-premium-text-muted mb-3">No AI parlays available</div>
            <div className="text-premium-text-muted text-sm">
              Generate optimized parlays with AI analysis.<br/>
              <a href="/ai-parlay" className="text-premium-accent hover:underline">Try AI parlay generator →</a>
            </div>
          </div>
        )}
      </div>
    )
  },
  {
    id: 'analyze-slip',
    label: 'Analyze Slip',
    icon: Upload,
    title: 'Upload & analyze your bets',
    description: 'Take a photo of your bet slip. We\'ll tell you if the price was fair and suggest improvements.',
    ctaText: 'Analyze Bet Slip',
    ctaLink: '/dashboard',
    demo: () => (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-premium-lg bg-premium-accent/10 flex items-center justify-center">
          <Upload className="w-10 h-10 text-premium-accent" />
        </div>
        <div className="space-y-2">
          <div className="text-premium-text-primary font-medium">
            Upload Bet Slip
          </div>
          <div className="text-premium-text-muted text-sm">
            Take a photo or screenshot
          </div>
        </div>
        
        <div className="mt-6 p-4 rounded-premium-md bg-white/5 border border-premium-border">
          <div className="text-xs text-premium-text-muted">
            ✓ Fair odds analysis<br/>
            ✓ Kelly bet sizing<br/>
            ✓ Alternative suggestions
          </div>
        </div>
      </div>
    )
  }
];

export default function FeatureTabs({ data }) {
  const [activeTab, setActiveTab] = useState(FEATURE_TABS[0].id);
  
  const currentTab = FEATURE_TABS.find(tab => tab.id === activeTab);
  const IconComponent = currentTab.icon;

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
            All your betting tools in one place
          </h2>
          <p className="body-text max-w-2xl mx-auto">
            From finding arbitrage to analyzing your slips, we've got every angle covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left: Tab Content */}
          <div className="space-y-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-premium-sm bg-premium-accent/10 flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-premium-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-premium-text-primary">
                    {currentTab.title}
                  </h3>
                </div>
              </div>
              
              <p className="body-text text-lg">
                {currentTab.description}
              </p>

              <Link href={currentTab.ctaLink}>
                <button className="btn-primary px-6 py-3 text-base font-semibold inline-flex items-center gap-2 group">
                  {currentTab.ctaText}
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right: Tabs + Demo */}
          <div className="space-y-6">
            
            {/* Tab Navigation */}
            <div className="relative">
              <div className="flex flex-wrap gap-2 p-2 rounded-premium-md bg-white/5 border border-premium-border">
                {FEATURE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 py-2 rounded-premium-sm text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-premium-accent text-black'
                        : 'text-premium-text-muted hover:text-premium-text-primary hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Demo Content */}
            <div 
              className="glass-panel p-6 rounded-premium-lg min-h-[400px]"
              style={{
                background: 'var(--panel-80)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-1)'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {currentTab.demo(data)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}