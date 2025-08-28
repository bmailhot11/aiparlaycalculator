import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { TrendingUp, Target, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import MobileCarousel from './MobileCarousel';

const PREVIEW_CARDS = [
  {
    id: 'ev-feed',
    title: 'Top +EV Today',
    subtitle: 'High value bets right now',
    icon: TrendingUp,
    content: (data) => (
      <div className="space-y-3">
        {data.evFeed && data.evFeed.length > 0 ? (
          data.evFeed.slice(0, 3).map((bet, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <div className="text-premium-text-primary font-medium">
                  {bet.home} vs {bet.away}
                </div>
                <div className="text-premium-text-muted text-xs">{bet.market}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-semibold">+{bet.evPct.toFixed(1)}%</div>
                <div className="text-premium-text-muted text-xs">{bet.odds}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-premium-text-muted mb-2">No +EV opportunities found</div>
            <div className="text-premium-text-muted text-xs">Check back later for new opportunities</div>
          </div>
        )}
      </div>
    )
  },
  {
    id: 'arbitrage',
    title: 'Best Arbitrage',
    subtitle: 'Guaranteed profit opportunities',
    icon: Target,
    content: (data) => (
      <div className="space-y-3">
        {data.arbitrage && data.arbitrage.length > 0 ? (
          data.arbitrage.slice(0, 2).map((arb, i) => (
            <div key={i} className="glass-panel p-3 rounded-premium-md">
              <div className="flex items-center justify-between mb-2">
                <div className="text-premium-text-primary font-medium text-sm">
                  {arb.market}
                </div>
                <div className="text-green-400 font-bold">
                  +{arb.returnPct.toFixed(1)}%
                </div>
              </div>
              <div className="flex justify-between text-xs text-premium-text-muted">
                <span>{arb.legA.sportsbook} {arb.legA.american_odds || arb.legA.odds}</span>
                <span>{arb.legB.sportsbook} {arb.legB.american_odds || arb.legB.odds}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-premium-text-muted mb-2">No arbitrage opportunities found</div>
            <div className="text-premium-text-muted text-xs">Scanning for risk-free profits...</div>
          </div>
        )}
      </div>
    )
  },
  {
    id: 'line-shop',
    title: 'Line Shop Winner',
    subtitle: 'Best prices across books',
    icon: Target,
    content: (data) => (
      <div className="space-y-3">
        {data.lineShop && data.lineShop.length > 0 ? (
          data.lineShop.slice(0, 3).map((line, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <div className="text-premium-text-primary font-medium">{line.market}</div>
                <div className="text-premium-text-muted text-xs">Best at {line.bestBook}</div>
              </div>
              <div className="text-right">
                <div className="text-premium-accent font-semibold">{line.bestOdds}</div>
                <div className="text-green-400 text-xs">+{line.deltaPct.toFixed(1)}%</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-premium-text-muted mb-2">No line shopping data available</div>
            <div className="text-premium-text-muted text-xs">Compare odds across books in real-time</div>
          </div>
        )}
      </div>
    )
  }
];

export default function Hero({ data }) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentCard, setCurrentCard] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % PREVIEW_CARDS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const handlePremiumClick = (e) => {
    e.preventDefault();
    if (!user) {
      localStorage.setItem('redirectAfterAuth', '/pricing');
      router.push('/auth/signin');
    } else {
      router.push('/pricing');
    }
  };

  const currentPreview = PREVIEW_CARDS[currentCard];
  const IconComponent = currentPreview.icon;

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <div className="max-w-1240 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h1 className="text-premium-text-primary font-semibold leading-tight">
                Find mispriced lines. Bet the true price.
              </h1>
              
              <p className="body-text max-w-lg">
                We strip the vig to reveal fair odds, highlight +EV bets, and size stakes 
                with Kelly—so you bet the true price.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handlePremiumClick} className="btn-primary px-8 py-3 text-base font-semibold inline-flex items-center gap-2 group">
                Go Premium
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <Link href="/arbitrage">
                <button className="btn-secondary px-8 py-3 text-base font-semibold">
                  See Live +EV Feed
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Right Preview Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            
            {/* Card Navigation Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {PREVIEW_CARDS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentCard(index);
                    setIsAutoRotating(false);
                    setTimeout(() => setIsAutoRotating(true), 10000); // Resume after 10s
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentCard 
                      ? 'bg-premium-accent w-6' 
                      : 'bg-premium-border hover:bg-premium-text-muted'
                  }`}
                  aria-label={`View ${PREVIEW_CARDS[index].title} preview`}
                />
              ))}
            </div>

            {/* Desktop: Rotating Card Container */}
            <div 
              className="relative h-96 w-full hidden md:block"
              style={{ perspective: '1000px' }}
              onMouseEnter={() => setIsAutoRotating(false)}
              onMouseLeave={() => setIsAutoRotating(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard}
                  initial={{ opacity: 0, rotateY: 45, z: -100 }}
                  animate={{ opacity: 1, rotateY: 0, z: 0 }}
                  exit={{ opacity: 0, rotateY: -45, z: -100 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 glass-panel p-6 rounded-premium-lg"
                  style={{
                    background: 'var(--panel-80)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-1)'
                  }}
                >
                  
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-premium-sm bg-premium-accent/10 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-premium-accent" />
                    </div>
                    <div>
                      <h3 className="text-premium-text-primary font-semibold text-lg">
                        {currentPreview.title}
                      </h3>
                      <p className="text-premium-text-muted text-sm">
                        {currentPreview.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="h-64 overflow-hidden">
                    {currentPreview.content(data)}
                  </div>

                  {/* Card Footer */}
                  <div className="absolute bottom-4 right-4">
                    <div className="premium-badge text-xs">
                      Live Data
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

            {/* Mobile: Swipeable Carousel */}
            <div className="md:hidden h-96">
              <MobileCarousel 
                currentIndex={currentCard}
                onIndexChange={(index) => {
                  setCurrentCard(index);
                  setIsAutoRotating(false);
                  setTimeout(() => setIsAutoRotating(true), 10000);
                }}
                autoRotate={isAutoRotating}
                autoRotateDelay={6000}
              >
                {PREVIEW_CARDS.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <div 
                      key={card.id}
                      className="glass-panel p-4 h-96 mx-2 rounded-premium-lg"
                      style={{
                        background: 'var(--panel-80)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-1)'
                      }}
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-premium-sm bg-premium-accent/10 flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-premium-accent" />
                        </div>
                        <div>
                          <h3 className="text-premium-text-primary font-semibold text-base">
                            {card.title}
                          </h3>
                          <p className="text-premium-text-muted text-xs">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="h-72 overflow-hidden">
                        {card.content(data)}
                      </div>

                      {/* Card Footer */}
                      <div className="absolute bottom-3 right-3">
                        <div className="premium-badge text-xs">
                          Live Data
                        </div>
                      </div>
                    </div>
                  );
                })}
              </MobileCarousel>
            </div>

              {/* Background Cards for Depth (Desktop only) */}
              <div 
                className="absolute inset-0 glass-panel rounded-premium-lg opacity-20 transform translate-x-2 translate-y-2 -z-10 hidden md:block"
                style={{
                  background: 'var(--panel-80)',
                  border: '1px solid var(--border)'
                }}
              />
              <div 
                className="absolute inset-0 glass-panel rounded-premium-lg opacity-10 transform translate-x-4 translate-y-4 -z-20 hidden md:block"
                style={{
                  background: 'var(--panel-80)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}