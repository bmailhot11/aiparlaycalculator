import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Hero from '../components/home/premium/Hero';
import ValueStrip from '../components/home/premium/ValueStrip';
import FeatureTabs from '../components/home/premium/FeatureTabs';
import Proof from '../components/home/premium/Proof';
import Pricing from '../components/home/premium/Pricing';
import FAQ from '../components/home/premium/FAQ';
import { fetchLivePreviewData } from '../lib/adapters/premium-data-adapters';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, ArrowUp } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [stickyCtaVisible, setStickyCtaVisible] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading preview data...');
        const previewData = await fetchLivePreviewData();
        console.log('Loaded preview data:', previewData);
        setData(previewData);
      } catch (error) {
        console.error('Failed to load preview data:', error);
        // Set empty data structure for graceful handling
        setData({
          evFeed: [],
          arbitrage: [],
          lineShop: [],
          parlay: null,
          clv: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Scroll event listeners
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowScrollTop(scrollY > 400);
      setStickyCtaVisible(scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePremiumClick = (e) => {
    e.preventDefault();
    if (!user) {
      localStorage.setItem('redirectAfterAuth', '/pricing');
      router.push('/auth/signin');
    } else {
      router.push('/pricing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="betchekr-premium">
      <Head>
        <title>BetChekr — Find mispriced odds (+EV bets made simple)</title>
        <meta name="description" content="Beginner-friendly tools to spot +EV bets, remove the vig, compare prices, and size stakes with confidence. Clear math. No hype." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://betchekr.com" />
        
        {/* JSON-LD Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["WebSite", "SoftwareApplication"],
            "name": "BetChekr",
            "url": "https://betchekr.com",
            "description": "Find mispriced odds and bet with an edge using AI-powered sports betting tools",
            "applicationCategory": "Sports Betting Tools",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "9.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31"
            }
          })
        }} />
        
        {/* FAQ Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What does +EV mean?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A bet with positive expected value based on fair odds."
                }
              },
              {
                "@type": "Question", 
                "name": "What does removing the vig do?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It takes out the book's cut to estimate fair odds."
                }
              },
              {
                "@type": "Question",
                "name": "Is this betting advice?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No. We show math and prices so you can decide."
                }
              }
            ]
          })
        }} />
      </Head>

      <GradientBG>
        {/* Header with Premium styling */}
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>

        {/* Page Content */}
        <main>
          <Hero data={data} />
          <ValueStrip />
          <FeatureTabs data={data} />
          <Proof data={data} />
          <Pricing />
          <FAQ />

          {/* Responsible Gaming Notice */}
          <section className="py-12 px-6 border-t border-premium-border">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span className="text-premium-text-primary font-medium">Responsible Betting</span>
              </div>
              <p className="text-premium-text-muted">
                Bet responsibly. Set limits. If betting stops being fun, take a break.
                <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-premium-accent ml-1 hover:underline">
                  Get help if needed
                </a>
              </p>
            </div>
          </section>
        </main>

        <Footer />

        {/* Sticky Bottom CTA (Mobile) */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ 
            y: stickyCtaVisible ? 0 : 100, 
            opacity: stickyCtaVisible ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-premium-panel border-t border-premium-border backdrop-blur-md lg:hidden"
        >
          <div className="flex gap-3">
            <button onClick={handlePremiumClick} className="flex-1 btn-primary py-3 text-center font-semibold">
              Go Premium
            </button>
            <a href="/arbitrage" className="flex-1 btn-secondary py-3 text-center font-semibold">
              Try Free
            </a>
          </div>
        </motion.div>

        {/* Scroll to Top Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: showScrollTop ? 1 : 0, 
            opacity: showScrollTop ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-premium-accent text-black rounded-full shadow-lg hover:bg-premium-accent-hover transition-colors z-30 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      </GradientBG>
    </div>
  );
}