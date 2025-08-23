import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Brain,
  TrendingUp,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Zap,
  Calculator,
  LineChart,
  Shield
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AIParlayGuide() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "What is AI sports betting?",
      answer: "AI sports betting uses algorithms to analyze games, odds, and markets. Tools like Betchekr make it easy to spot value and manage risk by processing vast amounts of data in real-time."
    },
    {
      question: "Can AI predict sports betting results?",
      answer: "Not perfectly. But Betchekr's AI shows when odds don't line up with reality, giving you an edge by identifying positive expected value opportunities."
    },
    {
      question: "How do you use AI for sports betting?",
      answer: "Use it for line shopping, positive EV bets, bankroll checks, and parlay math. Betchekr combines all of these in one tool for comprehensive betting analysis."
    },
    {
      question: "What's the best AI for parlays?",
      answer: "Betchekr. It calculates win probabilities, checks boosts, runs EV math, and simulates bankroll swings automatically."
    }
  ];

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <Head>
        <title>How to Win Parlays with AI Sports Betting | Betchekr Guide</title>
        <meta name="description" content="Parlays are fun but hard to win. Learn how sportsbooks profit, what math really says, and how Betchekr's AI helps you build smarter, more profitable parlays." />
        <meta name="keywords" content="AI sports betting, parlay strategy, sports betting AI, positive EV betting, parlay calculator, sports betting tips" />
        <meta property="og:title" content="How to Win Parlays with AI Sports Betting | Betchekr Guide" />
        <meta property="og:description" content="Learn how to use AI for smarter parlay betting. Discover the math behind parlays and how Betchekr's AI helps you find profitable opportunities." />
        <meta property="og:type" content="article" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F4C430]/5 to-transparent" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            <Brain className="w-16 h-16 mx-auto mb-6 text-[#F4C430]" />
            <h1 className="text-4xl md:text-5xl font-bold text-[#E5E7EB] mb-6">
              How to Win Parlays <br />
              <span className="text-[#F4C430]">(and How AI Like Betchekr Can Help)</span>
            </h1>
            <p className="text-[#9CA3AF] text-xl max-w-3xl mx-auto mb-8">
              Parlays are fun but hard to win. Learn how sportsbooks profit, what math really says, and how Betchekr's AI helps you build smarter, more profitable parlays.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ai-parlay" className="btn btn-primary">
                <Brain className="w-5 h-5 mr-2" />
                Try AI Parlay Generator
              </Link>
              <Link href="/positive-ev" className="btn btn-outline">
                <TrendingUp className="w-5 h-5 mr-2" />
                Find +EV Opportunities
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Main Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            
            {/* What Is a Parlay Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-[#F4C430]" />
                What Is a Parlay in Sports Betting?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-4">
                  A parlay combines multiple bets into one ticket. You only win if <strong className="text-[#E5E7EB]">every leg hits</strong>.
                </p>
                <ul className="text-[#9CA3AF] space-y-2 mb-6">
                  <li>2 legs = both must win</li>
                  <li>3 legs = all three must win</li>
                  <li>6+ legs = more like a lottery than a strategy</li>
                </ul>
                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4 mb-6">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Zap className="w-4 h-4 inline mr-2" />
                    Betchekr Advantage
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    Betchekr shows the real win probability of your ticket so you know what you're actually betting into.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Do Parlays Win Often Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-[#F4C430]" />
                Do Parlays Win Often?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-4">Not really.</p>
                <p className="text-[#9CA3AF] text-lg mb-6">
                  Even if you're good enough to win <strong className="text-green-400">55% of single bets</strong>, a <strong className="text-red-400">4-leg parlay only hits ~9% of the time</strong>.
                </p>
                
                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6 mb-6">
                  <h3 className="text-[#E5E7EB] font-semibold mb-4">Parlay Hit Probability Visualization</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">2-Leg Parlay (55% skill)</span>
                      <span className="text-green-400 font-medium">30.3%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">3-Leg Parlay (55% skill)</span>
                      <span className="text-yellow-400 font-medium">16.6%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">4-Leg Parlay (55% skill)</span>
                      <span className="text-red-400 font-medium">9.1%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[#9CA3AF] text-lg mb-4">
                  That's why sportsbooks love parlays — their profit margin is 2–3x higher than on singles.
                </p>
                
                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Brain className="w-4 h-4 inline mr-2" />
                    How Betchekr Helps
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    Betchekr highlights this math in real time, so you see exactly what you're risking before placing your bet.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Why Parlays Are Profitable for Sportsbooks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[#F4C430]" />
                Why Are Parlays So Profitable for Sportsbooks?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-6">Because margins compound.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Straight Bets</h3>
                    <p className="text-green-400 text-2xl font-bold">~4–5%</p>
                    <p className="text-[#9CA3AF] text-sm">margin for the book</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Parlays</h3>
                    <p className="text-red-400 text-2xl font-bold">18–24%</p>
                    <p className="text-[#9CA3AF] text-sm">margin for the book</p>
                  </div>
                </div>

                <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-lg p-4 mb-6">
                  <h3 className="text-[#E5E7EB] font-semibold mb-3">Sportsbook Revenue Growth (2010–2025)</h3>
                  <p className="text-[#9CA3AF] mb-2">
                    Since 2018, sportsbook revenue has exploded — and parlays are the engine.
                  </p>
                  <p className="text-[#F4C430] text-sm font-medium">
                    📊 Revenue increased 400%+ with parlay popularity surge
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Can Parlays Be Profitable Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-[#F4C430]" />
                Can Parlays Ever Be Profitable for Bettors?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-6">Yes, but only when you stack the math in your favor:</p>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-4 bg-[#0B1220] border border-[#1F2937] rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold mb-1">Each leg has value</h3>
                      <p className="text-[#9CA3AF] text-sm">(better odds than true chance)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-[#0B1220] border border-[#1F2937] rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold mb-1">Boosts or promos</h3>
                      <p className="text-[#9CA3AF] text-sm">improve payouts meaningfully</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-[#0B1220] border border-[#1F2937] rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold mb-1">Keep parlays short</h3>
                      <p className="text-[#9CA3AF] text-sm">(2–3 legs maximum)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6 mb-6">
                  <h3 className="text-[#E5E7EB] font-semibold mb-4">Expected Value per $100 bet (55% Skill)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">Single Bets</span>
                      <span className="text-green-400 font-medium">+$10.00</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">2-Leg Parlay</span>
                      <span className="text-green-400 font-medium">+$6.50</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">3-Leg Parlay</span>
                      <span className="text-yellow-400 font-medium">+$1.20</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0F172A] rounded">
                      <span className="text-[#9CA3AF]">4+ Leg Parlay</span>
                      <span className="text-red-400 font-medium">-$3.40</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Brain className="w-4 h-4 inline mr-2" />
                    Betchekr's Edge
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    You don't need to do this math by hand. Betchekr checks instantly if your parlay is +EV, and whether a boost actually makes it worth betting.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Rollercoaster Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <LineChart className="w-8 h-8 text-[#F4C430]" />
                The Rollercoaster Effect
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-6">
                  Parlays swing your bankroll much harder than singles.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                    <h3 className="text-green-400 font-semibold mb-2">3-Leg Parlays</h3>
                    <p className="text-[#9CA3AF] text-sm">Manageable swings</p>
                    <div className="mt-3 h-2 bg-[#0F172A] rounded-full overflow-hidden">
                      <div className="h-full w-3/5 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-red-400 font-semibold mb-2">6-Leg Parlays</h3>
                    <p className="text-[#9CA3AF] text-sm">Wild rides — double up or crash</p>
                    <div className="mt-3 h-2 bg-[#0F172A] rounded-full overflow-hidden">
                      <div className="h-full w-full bg-red-400 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Betchekr Risk Management
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    Betchekr simulates your risk over dozens of bets so you know if your bankroll can handle the ride.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Smart Rules for Parlays */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-[#F4C430]" />
                Smart Rules for Parlays
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-1">Stick to 2–3 legs</h3>
                    <p className="text-[#9CA3AF] text-sm">Maximize win probability while maintaining upside</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-1">Shop for best odds</h3>
                    <p className="text-[#9CA3AF] text-sm">Every decimal point matters in parlays</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-1">Use boosts wisely</h3>
                    <p className="text-[#9CA3AF] text-sm">Only on bets you'd make anyway</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-1">Bet smaller stakes</h3>
                    <p className="text-[#9CA3AF] text-sm">Than you would on single bets</p>
                  </div>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 inline mr-2 mb-1" />
                  <strong className="text-[#E5E7EB]">Avoid "storytelling" parlays</strong>
                  <p className="text-[#9CA3AF] text-sm mt-1">
                    That sound fun but pay badly (like "same game parlays" with correlated outcomes)
                  </p>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Brain className="w-4 h-4 inline mr-2" />
                    How Betchekr Automates These Rules
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    Betchekr's AI automates line shopping, checks boosts, and runs parlay math so you can follow these rules with one tool. 
                    <Link href="/ai-parlay" className="text-[#F4C430] hover:underline ml-1">
                      Try the AI parlay generator →
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* AI Sports Betting Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 text-[#F4C430]" />
                What Is AI Sports Betting?
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-[#9CA3AF] text-lg mb-6">
                  AI in sports betting means using algorithms to analyze stats, odds, and markets in real-time.
                </p>
                
                <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-4">
                  <p className="text-[#F4C430] font-medium mb-2">
                    <Zap className="w-4 h-4 inline mr-2" />
                    Betchekr's AI in Action
                  </p>
                  <p className="text-[#9CA3AF] text-sm">
                    From parlay math to line shopping, Betchekr is built to handle the number crunching for you. 
                    <Link href="/positive-ev" className="text-[#F4C430] hover:underline ml-1">
                      See live +EV opportunities →
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* How AI Helps With Parlays */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 text-[#F4C430]" />
                How Can AI Help With Parlays?
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <Calculator className="w-8 h-8 text-[#F4C430] mb-3" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Crunches the odds</h3>
                    <p className="text-[#9CA3AF] text-sm">Shows real chance vs sportsbook payout</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <CheckCircle className="w-8 h-8 text-[#F4C430] mb-3" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Checks boosts</h3>
                    <p className="text-[#9CA3AF] text-sm">Are they actually in your favor?</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <LineChart className="w-8 h-8 text-[#F4C430] mb-3" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Stress-tests streaks</h3>
                    <p className="text-[#9CA3AF] text-sm">Shows long-term bankroll impact</p>
                  </div>
                  <div className="bg-[#0B1220] border border-[#1F2937] rounded-lg p-6">
                    <Brain className="w-8 h-8 text-[#F4C430] mb-3" />
                    <h3 className="text-[#E5E7EB] font-semibold mb-2">Keeps it fun</h3>
                    <p className="text-[#9CA3AF] text-sm">Explains picks in plain English</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 border border-[#F4C430]/30 rounded-lg p-6">
                  <h3 className="text-[#F4C430] font-bold text-xl mb-3">Bottom Line</h3>
                  <p className="text-[#E5E7EB] text-lg mb-3">
                    Parlays made sportsbooks rich. Betchekr uses AI to give that math back to you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/ai-parlay" className="btn btn-primary">
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Smart Parlay
                    </Link>
                    <Link href="/arbitrage" className="btn btn-outline">
                      <Target className="w-4 h-4 mr-2" />
                      Find Arbitrage Opportunities
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqData.map((faq, index) => (
                  <div key={index} className="border border-[#1F2937] rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-6 text-left bg-[#0B1220] hover:bg-[#0F172A] transition-colors flex items-center justify-between"
                    >
                      <h3 className="text-[#E5E7EB] font-semibold text-lg pr-4">{faq.question}</h3>
                      <ArrowRight 
                        className={`w-5 h-5 text-[#F4C430] flex-shrink-0 transition-transform ${
                          expandedFaq === index ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-6 bg-[#0F172A]"
                      >
                        <p className="text-[#9CA3AF] leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center bg-gradient-to-r from-[#F4C430]/5 to-transparent border border-[#F4C430]/20 rounded-2xl p-8"
            >
              <Brain className="w-12 h-12 mx-auto mb-4 text-[#F4C430]" />
              <h2 className="text-2xl font-bold text-[#E5E7EB] mb-4">
                Ready to Build Smarter Parlays?
              </h2>
              <p className="text-[#9CA3AF] mb-6 max-w-2xl mx-auto">
                Stop guessing and start using AI to find real value in your parlay bets. Betchekr's tools make it easy to spot profitable opportunities and manage your risk.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/ai-parlay" className="btn btn-primary">
                  <Brain className="w-5 h-5 mr-2" />
                  Try AI Parlay Generator
                </Link>
                <Link href="/" className="btn btn-outline">
                  Upload Your Bet Slip
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
}