import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Upload, 
  TrendingUp, 
  Target, 
  Brain, 
  Calculator,
  DollarSign,
  RotateCcw,
  ChevronRight,
  HelpCircle,
  Clock,
  BookOpen,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { PremiumContext } from './_app';
import { apiFetch } from '../utils/api';

export default function Home() {
  const { isPremium } = useContext(PremiumContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [liveStats, setLiveStats] = useState({
    edgesToday: null,
    avgEdge: null,
    booksScanned: null
  });
  const [currentEdge, setCurrentEdge] = useState(null);

  // Load user data and fetch live stats
  useEffect(() => {
    const savedUser = localStorage.getItem('betchekr_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('betchekr_user');
      }
    }
    

    // Fetch live stats (with graceful fallbacks)
    fetchLiveStats();
    fetchCurrentEdge();
  }, [isPremium]);

  const fetchLiveStats = async () => {
    try {
      // Try to fetch from existing endpoints
      const response = await fetch('/api/daily-picks/track-record?period=1d');
      if (response.ok) {
        const data = await response.json();
        setLiveStats({
          edgesToday: data.totalPicks || 0,
          avgEdge: data.avgEdge || 0,
          booksScanned: 15 // Static for now
        });
      }
    } catch (error) {
      // Keep default null values for graceful fallback
    }
  };

  const fetchCurrentEdge = async () => {
    try {
      // Try to get a recent edge from line shopping or arbitrage
      const response = await fetch('/api/arbitrage/find-opportunities?limit=1');
      if (response.ok) {
        const data = await response.json();
        if (data.opportunities && data.opportunities.length > 0) {
          const edge = data.opportunities[0];
          setCurrentEdge({
            league: edge.sport || 'MLB',
            market: edge.market || 'Moneyline',
            price: edge.bestOdds || '+150',
            edge: edge.profit ? (edge.profit * 100).toFixed(1) : '3.2',
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }
    } catch (error) {
      // Keep null for graceful fallback
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setUploadedFile(file);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyzeBetSlip = async () => {
    if (!uploadedFile) {
      alert('Please upload a bet slip image first');
      return;
    }

    if (!isPremium && usageData.uploads >= 1) {
      setShowPaywall(true);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      const processImage = () => new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });
      
      const base64Result = await processImage();
      const base64String = base64Result.split(',')[1];
      
      const response = await apiFetch('/api/analyze-slip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64String,
          userId: currentUser?.id || '',
          username: currentUser?.username || ''
        }),
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
      } else {
        throw new Error(result.message || 'Failed to analyze bet slip');
      }
    } catch (error) {
      console.error('Error analyzing bet slip:', error);
      alert(error.message || 'Failed to analyze bet slip. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Tooltip component for inline glossary
  const Tooltip = ({ children, content }) => (
    <span className="group relative cursor-help border-b border-dotted border-[#F4C430]">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-[#1F2937] text-[#E5E7EB] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
        {content}
      </div>
    </span>
  );

  return (
    <>
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

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        

        {/* 1) Hero Section */}
        <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto mb-8 sm:mb-12"
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#E5E7EB] mb-4 sm:mb-6 leading-tight">
                Use our AI for sports betting to increase your odds and find the best opportunities for you
              </h1>
              
              <p className="text-[#9CA3AF] text-base sm:text-lg md:text-xl leading-relaxed mb-6 sm:mb-8 max-w-3xl mx-auto px-2 sm:px-0">
                We compare sportsbook prices, remove the house edge (<Tooltip content="The bookmaker's built-in profit margin">vig</Tooltip>), 
                and show where the value is so you bet smarter and win bigger.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center mb-6 sm:mb-8 px-4 sm:px-0">
                <Link href="/analyze-slip" className="w-full sm:w-auto">
                  <button 
                    className="w-full sm:w-auto bg-[#F4C430] text-[#0B0F14] px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#e6b829] transition-colors touch-manipulation"
                    data-event="cta_analyze_slip_click"
                  >
                    Analyze my bet slip
                  </button>
                </Link>
              </div>

              {/* Secondary CTA */}
              <div className="mb-8 sm:mb-12">
                <Link href="/learn/how-to-use-ai-for-sports-betting">
                  <span 
                    className="inline-flex items-center text-[#F4C430] hover:text-[#e6b829] transition-colors text-sm sm:text-base"
                    data-event="cta_ai_article_click"
                  >
                    How AI helps (2-minute read)
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </span>
                </Link>
              </div>

              {/* Trust Bar */}
              <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:justify-center sm:gap-8 md:gap-12 text-center">
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#F4C430]">
                    {liveStats.edgesToday !== null ? liveStats.edgesToday : '—'}
                  </span>
                  <span className="text-xs sm:text-sm text-[#6B7280] leading-tight" aria-label={liveStats.edgesToday === null ? "stat unavailable" : undefined}>
                    Live edges today
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#F4C430]">
                    {liveStats.avgEdge !== null ? `${liveStats.avgEdge}%` : '—'}
                  </span>
                  <span className="text-xs sm:text-sm text-[#6B7280] leading-tight" aria-label={liveStats.avgEdge === null ? "stat unavailable" : undefined}>
                    Avg edge on bets
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#F4C430]">
                    {liveStats.booksScanned !== null ? liveStats.booksScanned : '—'}
                  </span>
                  <span className="text-xs sm:text-sm text-[#6B7280] leading-tight" aria-label={liveStats.booksScanned === null ? "stat unavailable" : undefined}>
                    Books scanned
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Answer-box Summary */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-[#1F2937]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#141C28] rounded-lg p-6 border border-[#1F2937]">
              <p className="text-[#9CA3AF] mb-4">
                BetChekr helps you find value in betting lines. We compare sportsbook prices to fair odds (vig removed) 
                and highlight <Tooltip content="Bets with positive expected value">+EV</Tooltip> opportunities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#E5E7EB]">Find better prices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#E5E7EB]">Understand fair odds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-[#E5E7EB]">Size your bets sensibly</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2) Edge of the Moment (Optional Ticker) */}
        {currentEdge && (
          <section className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-r from-green-500/10 to-[#F4C430]/10 border border-green-500/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-medium text-sm">Live Edge</span>
                  </div>
                  <span className="text-[#6B7280] text-xs">{currentEdge.timestamp}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[#E5E7EB] font-medium">
                    {currentEdge.league} {currentEdge.market} at {currentEdge.price}
                  </span>
                  <span className="ml-2 text-green-400 font-bold">
                    +{currentEdge.edge}% edge
                  </span>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* 3) How it works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-6">
                How BetChekr helps
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  1
                </div>
                <h3 className="text-xl font-semibold text-[#E5E7EB] mb-3">Prices</h3>
                <p className="text-[#9CA3AF]">
                  We pull the latest odds from multiple sportsbooks.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  2
                </div>
                <h3 className="text-xl font-semibold text-[#E5E7EB] mb-3">True value</h3>
                <p className="text-[#9CA3AF]">
                  We remove the <Tooltip content="The bookmaker's built-in profit margin">vig</Tooltip> (the book's cut) to estimate fair odds.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                  3
                </div>
                <h3 className="text-xl font-semibold text-[#E5E7EB] mb-3">Your decision</h3>
                <p className="text-[#9CA3AF]">
                  We highlight better-value bets (<Tooltip content="Bets with positive expected value">+EV</Tooltip>) and suggest smart staking rules like <Tooltip content="A bet sizing strategy that maximizes long-term growth">Kelly</Tooltip>.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4) Tools grid */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E13]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4 sm:mb-6">
                Tools you can use today
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Arbitrage Finder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-[#F4C430] mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">Arbitrage Finder</h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Find guaranteed profit opportunities across books.
                </p>
                <Link href="/arbitrage">
                  <button className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded font-medium text-sm hover:bg-[#e6b829] transition-colors touch-manipulation w-full sm:w-auto">
                    Open
                  </button>
                </Link>
              </motion.div>

              {/* Line Shopping */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[#F4C430] mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">Line Shopping</h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Find the best price across books before you bet.
                </p>
                <Link href="/line-shopping">
                  <button className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded font-medium text-sm hover:bg-[#e6b829] transition-colors touch-manipulation w-full sm:w-auto">
                    Open
                  </button>
                </Link>
              </motion.div>

              {/* Kelly Calculator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-[#F4C430] mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">Kelly Calculator</h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Size your bet sensibly to manage risk.
                </p>
                <Link href="/kelly-calculator">
                  <button className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded font-medium text-sm hover:bg-[#e6b829] transition-colors touch-manipulation w-full sm:w-auto">
                    Open
                  </button>
                </Link>
              </motion.div>

              {/* Analyze Parlay / Bet Slip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-[#F4C430] mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">Analyze Parlay / Bet Slip</h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Upload your slip; we check if the price is fair.
                </p>
                <Link href="/analyze-slip">
                  <button className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded font-medium text-sm hover:bg-[#e6b829] transition-colors touch-manipulation w-full sm:w-auto">
                    Open
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>


        {/* 5) Proof section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4 sm:mb-6">
                Proof, not promises
              </h2>
              <p className="text-[#9CA3AF] text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-3xl mx-auto">
                We judge ourselves by <Tooltip content="How much better your bet was compared to the final market price">Closing Line Value (CLV)</Tooltip>—did our picks beat the final market price? 
                Wins and losses swing day to day; CLV shows whether the price you took was good.
              </p>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center">
                <Link href="/learn/how-to-use-ai-for-sports-betting" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-[#F4C430] text-[#0B0F14] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors touch-manipulation">
                    Our Math & Method
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 6) Learn panel */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0E13]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 sm:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-4 sm:mb-6">
                Learn the basics (quick reads)
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* AI Article */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-xs sm:text-sm font-medium">15 min read</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">
                  How to use AI for sports betting
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Step-by-step guide with formulas, prompts, and responsible practices.
                </p>
                <Link href="/learn/how-to-use-ai-for-sports-betting">
                  <span className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all touch-manipulation">
                    Read guide
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>

              {/* EV Article */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-xs sm:text-sm font-medium">6 min read</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">
                  What is +EV (expected value)?
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Why EV is the most important concept in profitable sports betting.
                </p>
                <Link href="/learn/what-is-expected-value">
                  <span className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all touch-manipulation">
                    Read guide
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>

              {/* Odds Article */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-xs sm:text-sm font-medium">5 min read</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">
                  Odds made simple
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  American, Decimal, Fractional formats explained.
                </p>
                <Link href="/learn/what-does-plus-150-mean">
                  <span className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all touch-manipulation">
                    Read guide
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>

              {/* CLV Article */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-[#141C28] border border-[#1F2937] rounded-lg p-4 sm:p-6 hover:border-[#F4C430]/50 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#F4C430]" />
                  <span className="text-[#F4C430] text-xs sm:text-sm font-medium">4 min read</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#E5E7EB] mb-2">
                  What is CLV and why it matters
                </h3>
                <p className="text-[#9CA3AF] text-sm mb-3 sm:mb-4">
                  Understanding Closing Line Value and long-term success.
                </p>
                <Link href="/learn">
                  <span className="inline-flex items-center text-[#F4C430] text-sm font-medium hover:gap-2 transition-all touch-manipulation">
                    Read guide
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 7) Pricing ribbon */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-[#1F2937] to-[#374151] rounded-2xl p-6 sm:p-8 border border-[#374151]"
            >
              <p className="text-[#E5E7EB] text-base sm:text-lg mb-4 sm:mb-6">
                Ready to try BetChekr?
              </p>
              <Link href="/pricing" className="block sm:inline-block">
                <button 
                  className="w-full sm:w-auto bg-[#F4C430] text-[#0B0F14] px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-[#e6b829] transition-colors touch-manipulation"
                  data-event="cta_pricing_click"
                >
                  See pricing
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#1F2937]">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-6">
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">What does +EV mean?</h3>
                <p className="text-[#9CA3AF]">A bet with positive expected value based on fair odds.</p>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">What does removing the vig do?</h3>
                <p className="text-[#9CA3AF]">It takes out the book's cut to estimate fair odds.</p>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">Is this betting advice?</h3>
                <p className="text-[#9CA3AF]">No. We show math and prices so you can decide.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8) Responsible betting footer note */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0E13]">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-[#E5E7EB] font-medium">Responsible Betting</span>
            </div>
            <p className="text-[#9CA3AF]">
              Bet responsibly. Set limits. If betting stops being fun, take a break.
            </p>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
}