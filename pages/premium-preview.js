import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Calculator,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Shield,
  Star,
  Crown,
  ExternalLink
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import { PremiumContext } from './_app';

const mockArbitrageCards = [
  {
    id: 1,
    matchup: "Lakers vs Warriors",
    sport: "NBA",
    profit: "4.2%",
    amount: "$142",
    book1: "DraftKings",
    book2: "FanDuel",
    odds1: "+240",
    odds2: "-185"
  },
  {
    id: 2,
    matchup: "Dodgers vs Padres",
    sport: "MLB", 
    profit: "3.8%",
    amount: "$98",
    book1: "BetMGM",
    book2: "Caesars",
    odds1: "+155",
    odds2: "-140"
  },
  {
    id: 3,
    matchup: "Chiefs vs Bills",
    sport: "NFL",
    profit: "5.1%",
    amount: "$203",
    book1: "FanDuel",
    book2: "DraftKings",
    odds1: "+165",
    odds2: "-150"
  }
];

const clvData = [
  { day: 'Mon', value: 2.1 },
  { day: 'Tue', value: -0.8 },
  { day: 'Wed', value: 3.4 },
  { day: 'Thu', value: 1.2 },
  { day: 'Fri', value: 4.7 },
  { day: 'Sat', value: -1.1 },
  { day: 'Sun', value: 2.9 }
];

const highlights = [
  { bet: "Lakers ML", book: "FanDuel", clv: "+2.4%", result: "W" },
  { bet: "Under 225.5", book: "DraftKings", clv: "+1.8%", result: "W" },
  { bet: "Chiefs -3.5", book: "BetMGM", clv: "+3.1%", result: "L" }
];

const faqItems = [
  {
    q: "What makes the premium skin different?",
    a: "The premium design features a glassmorphism aesthetic with refined typography, improved spacing, and enhanced visual hierarchy while maintaining all existing functionality."
  },
  {
    q: "Will this replace the current design?",
    a: "No, this is a preview-only demonstration. The current site remains unchanged and this theme can be toggled on/off during development."
  },
  {
    q: "How do I enable the premium theme?",
    a: "Add the 'betchekr-premium' class to the body element or use the SiteTheme wrapper component to conditionally apply the theme."
  }
];

const RotatingCards = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        setCurrentCard((prev) => (prev + 1) % mockArbitrageCards.length);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [isDragging]);

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % mockArbitrageCards.length);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + mockArbitrageCards.length) % mockArbitrageCards.length);
  };

  return (
    <>
      {/* Desktop Version - Rotating */}
      <div className="hidden lg:block relative w-full max-w-md mx-auto lg:mx-0 h-80">
        <AnimatePresence mode="wait">
          {mockArbitrageCards.map((card, index) => 
            index === currentCard && (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 glass-panel p-6"
              >
                <ArbitrageCard card={card} />
              </motion.div>
            )
          )}
        </AnimatePresence>
        
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          {mockArbitrageCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCard ? 'bg-premium-accent' : 'bg-premium-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Version - Swipeable */}
      <div className="lg:hidden w-full max-w-sm mx-auto">
        <motion.div
          className="relative overflow-hidden"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              
              if (swipe > 10000) {
                prevCard();
              } else if (swipe < -10000) {
                nextCard();
              }
            }}
            className="flex gap-4"
            animate={{
              x: -currentCard * 100 + '%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {mockArbitrageCards.map((card) => (
              <div key={card.id} className="min-w-full">
                <div className="glass-panel p-6 h-80">
                  <ArbitrageCard card={card} />
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        
        <div className="flex justify-center gap-2 mt-6">
          {mockArbitrageCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCard ? 'bg-premium-accent' : 'bg-premium-border'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

const ArbitrageCard = ({ card }) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium text-muted bg-premium-teal/20 px-2 py-1 rounded-premium-sm">
        {card.sport}
      </span>
      <span className="text-lg font-semibold text-premium-accent">
        +{card.profit}
      </span>
    </div>
    
    <h3 className="text-primary font-semibold mb-6">
      {card.matchup}
    </h3>
    
    <div className="space-y-3">
      <div className="flex justify-between items-center p-3 bg-premium-panel/40 rounded-premium-md">
        <span className="text-sm text-muted">{card.book1}</span>
        <span className="font-mono text-premium-accent">{card.odds1}</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-premium-panel/40 rounded-premium-md">
        <span className="text-sm text-muted">{card.book2}</span>
        <span className="font-mono text-premium-accent">{card.odds2}</span>
      </div>
    </div>
    
    <div className="mt-4 pt-4 border-t border-hairline">
      <div className="text-sm text-muted">Expected Return</div>
      <div className="text-xl font-bold text-primary">{card.amount}</div>
    </div>
  </>
);

const CLVSparkline = () => {
  const maxValue = Math.max(...clvData.map(d => Math.abs(d.value)));

  return (
    <div className="w-full h-16 flex items-end gap-1">
      {clvData.map((point, index) => {
        const height = Math.abs(point.value) / maxValue * 48;
        const isPositive = point.value > 0;
        
        return (
          <div key={index} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-full rounded-sm transition-all ${
                isPositive ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ height: `${Math.max(height, 2)}px` }}
            />
            <span className="text-xs text-muted">{point.day}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function PremiumPreview() {
  const { isPremium } = useContext(PremiumContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('arbitrage');
  const [openFaq, setOpenFaq] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [scrollCount, setScrollCount] = useState(0);

  useEffect(() => {
    let lastScrollY = 0;
    let scrollEvents = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Track scroll events for sticky bar
      if (Math.abs(currentScrollY - lastScrollY) > 100) {
        scrollEvents++;
        if (scrollEvents >= 2 && !showStickyBar) {
          setShowStickyBar(true);
        }
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showStickyBar]);

  const tabs = [
    { id: 'arbitrage', label: 'Arbitrage', icon: TrendingUp },
    { id: 'lineshop', label: 'Line Shop', icon: Target },
    { id: 'parlays', label: 'AI Parlays', icon: Brain },
    { id: 'analyze', label: 'Analyze Slip', icon: Calculator }
  ];

  return (
    <>
      <Head>
        <title>Premium Preview | BetChekr</title>
        <meta name="description" content="Preview the premium design for BetChekr" />
      </Head>

      <GradientBG>
        {/* Premium Header */}
        <header className={`premium-header fixed top-0 w-full z-40 ${isScrolled ? 'scrolled' : ''}`}>
          <Header />
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-1240 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h1 className="mb-6 text-primary">
                  Find profitable betting opportunities with AI-powered analysis
                </h1>
                
                <p className="body-text mb-8 max-w-xl">
                  Compare prices across sportsbooks, remove the vig, and discover 
                  positive expected value bets with our premium analytical tools.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="btn-primary">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button className="btn-secondary">
                    Watch Demo
                  </button>
                </div>
                
                <div className="flex items-center gap-6 mt-8 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>14-day free trial</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Rotating Cards */}
              <div className="flex justify-center lg:justify-end">
                <RotatingCards />
              </div>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-20 px-6">
          <div className="max-w-1240 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 text-center">
                <BarChart3 className="w-8 h-8 text-premium-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-3">Live Prices</h3>
                <p className="text-muted">Real-time odds from 15+ sportsbooks updated every minute</p>
              </div>
              
              <div className="glass-panel p-8 text-center">
                <Zap className="w-8 h-8 text-premium-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-3">True Value</h3>
                <p className="text-muted">Vig-adjusted fair odds to identify profitable opportunities</p>
              </div>
              
              <div className="glass-panel p-8 text-center">
                <Shield className="w-8 h-8 text-premium-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-3">Your Decision</h3>
                <p className="text-muted">Data-driven insights, not betting advice or tips</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabbed Features */}
        <section className="py-20 px-6">
          <div className="max-w-1240 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-primary mb-4">Professional Betting Tools</h2>
              <p className="text-muted max-w-2xl mx-auto">
                Everything you need to analyze lines, find value, and track your performance
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-1 mb-8 bg-premium-panel/50 p-2 rounded-premium-lg max-w-2xl mx-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-premium-md font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-premium-accent text-black'
                        : 'text-muted hover:text-primary hover:bg-premium-panel/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="glass-panel p-8 min-h-96">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activeTab === 'arbitrage' && (
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 text-premium-accent mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-primary mb-4">Arbitrage Opportunities</h3>
                      <p className="text-muted max-w-xl mx-auto">
                        Find guaranteed profit opportunities by betting both sides of a market across different books.
                        Our algorithm scans thousands of lines in real-time to identify mismatches.
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'lineshop' && (
                    <div className="text-center">
                      <Target className="w-16 h-16 text-premium-accent mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-primary mb-4">Line Shopping</h3>
                      <p className="text-muted max-w-xl mx-auto">
                        Compare odds across 15+ sportsbooks to always get the best price. Even small differences
                        compound significantly over time for profitable long-term betting.
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'parlays' && (
                    <div className="text-center">
                      <Brain className="w-16 h-16 text-premium-accent mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-primary mb-4">AI Parlay Builder</h3>
                      <p className="text-muted max-w-xl mx-auto">
                        Smart parlay construction using correlation analysis and value detection.
                        Build parlays that maximize expected value rather than just big payouts.
                      </p>
                    </div>
                  )}
                  
                  {activeTab === 'analyze' && (
                    <div className="text-center">
                      <Calculator className="w-16 h-16 text-premium-accent mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-primary mb-4">Analyze Bet Slips</h3>
                      <p className="text-muted max-w-xl mx-auto">
                        Upload screenshots of your bet slips for instant analysis. Get fair odds calculations,
                        expected value, and recommendations before placing your bets.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Proof Section - CLV Tracking */}
        <section className="py-20 px-6 bg-premium-panel/20">
          <div className="max-w-1240 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-primary mb-6">Track Your Closing Line Value</h2>
                <p className="text-muted mb-8">
                  Monitor how your bets perform against closing lines - the ultimate measure 
                  of betting skill. Positive CLV indicates you're finding value before the market adjusts.
                </p>
                
                <div className="glass-panel p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-primary font-semibold">7-Day CLV Performance</h4>
                    <span className="text-green-400 font-semibold">+2.1% avg</span>
                  </div>
                  <CLVSparkline />
                </div>

                <h4 className="text-primary font-semibold mb-4">Yesterday's Highlights</h4>
                <div className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-premium-panel/30 rounded-premium-md">
                      <div>
                        <div className="font-medium text-primary">{highlight.bet}</div>
                        <div className="text-sm text-muted">{highlight.book}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">{highlight.clv}</div>
                        <div className={`text-sm font-medium ${
                          highlight.result === 'W' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {highlight.result}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-400/20 rounded-full mb-6">
                    <TrendingUp className="w-10 h-10 text-green-400" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">+$2,847</div>
                  <div className="text-muted mb-6">Total CLV this month</div>
                  <div className="text-sm text-muted">
                    Based on $100 average bet size across 89 tracked wagers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-6">
          <div className="max-w-1240 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-primary mb-4">Simple, Transparent Pricing</h2>
              <p className="text-muted max-w-xl mx-auto">
                Choose the plan that fits your betting strategy
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="glass-panel p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-2">Free</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$0</div>
                  <div className="text-muted">Forever free</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">Basic line shopping</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">1 bet analysis per day</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">Kelly calculator</span>
                  </li>
                </ul>
                
                <button className="btn-secondary w-full">
                  Get Started Free
                </button>
              </div>

              {/* Premium Plan */}
              <div className="glass-panel p-8 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-premium-accent text-black px-4 py-2 rounded-premium-sm text-sm font-semibold">
                    Most Popular
                  </div>
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-primary mb-2">Premium</h3>
                  <div className="text-4xl font-bold text-primary mb-2">$9.99</div>
                  <div className="text-muted">per month</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">Unlimited arbitrage scanning</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">Real-time odds from 15+ books</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">AI parlay builder</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">CLV tracking & analytics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-muted">Unlimited bet analysis</span>
                  </li>
                </ul>
                
                <button className="btn-primary w-full">
                  <Crown className="w-5 h-5 mr-2" />
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-primary mb-4">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="glass-panel">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-premium-panel/30 transition-colors"
                  >
                    <span className="text-primary font-semibold pr-4">{item.q}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted flex-shrink-0" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <p className="text-muted">{item.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />

        {/* Mobile Sticky Bottom CTA */}
        <AnimatePresence>
          {showStickyBar && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-premium-ink/95 backdrop-blur-lg border-t border-premium-border"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-primary">Go Premium</div>
                  <div className="text-xs text-muted">14-day free trial</div>
                </div>
                <button
                  onClick={() => setShowStickyBar(false)}
                  className="btn-primary text-sm px-6 py-2"
                >
                  Try Free
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GradientBG>
    </>
  );
}