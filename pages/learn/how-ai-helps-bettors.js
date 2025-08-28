import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BookOpen,
  Brain,
  DollarSign,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Zap,
  Lightbulb,
  Calculator,
  Target,
  Users,
  Award,
  Cpu
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GradientBG from '../../components/theme/GradientBG';

export default function HowAIHelpsBettors() {
  return (
    <div className="betchekr-premium">
      <Head>
        <title>How AI Can Help Bettors (BetChekr AI Explained) | BetChekr Learn</title>
        <meta name="description" content="Learn how AI makes complex betting math simple and accessible for beginners. See how BetChekr uses AI to analyze your bets." />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Link href="/learn">
            <div className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-[#F4C430] mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Learn</span>
            </div>
          </Link>

          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded font-medium">
                Advanced
              </span>
              <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                <Clock className="w-3 h-3" />
                <span>7 min read</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              📘 How AI Can Help Bettors
            </h1>
            <p className="text-xl text-[#9CA3AF]">
              (And How BetChekr Uses It to Do the Math for You)
            </p>
          </motion.div>

          {/* Article Content */}
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert max-w-none"
          >
            {/* Introduction */}
            <div className="bg-[#141C28] rounded-lg p-6 border border-[#1F2937] mb-8">
              <h2 className="text-xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#F4C430]" />
                Introduction
              </h2>
              <p className="text-[#9CA3AF] mb-3">
                Sports betting has always been about numbers. For decades, professional gamblers have built models 
                to calculate probabilities, compare lines, and find value. But now, with AI, beginners can access 
                the same kind of power without needing a math degree.
              </p>
              <p className="text-[#9CA3AF]">
                BetChekr is built to take the complicated math behind betting and put it in plain English. 
                Here's how AI helps bettors, and how BetChekr specifically uses AI and math to guide your bets.
              </p>
            </div>

            {/* AI Turns Odds Into Percentages */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#F4C430]" />
                1. AI Turns Odds Into Win Percentages
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Odds like +150 or -200 confuse beginners. Every set of odds actually means a probability of winning.
              </p>

              <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937] mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-blue-400" />
                    <p className="text-[#E5E7EB] font-medium">
                      AI instantly converts odds into win percentages so you can see what the sportsbook thinks your chances are
                    </p>
                  </div>
                  
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-[#6B7280] text-sm mb-1">Traditional Display</p>
                        <p className="text-[#F4C430] font-bold text-2xl">+150</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#6B7280] text-sm mb-1">BetChekr AI Shows</p>
                        <p className="text-green-400 font-bold text-2xl">40% chance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-[#9CA3AF]">
                  <strong className="text-blue-400">This is the first step</strong> in making betting understandable for new players.
                </p>
              </div>
            </div>

            {/* AI Finds +EV Bets */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#F4C430]" />
                2. AI Finds Positive Expected Value (EV) Bets
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                The real secret of winning bettors is Expected Value, often shortened to EV.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#141C28] rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="text-[#E5E7EB] font-medium">Positive EV bets</h3>
                  </div>
                  <p className="text-[#9CA3AF] text-sm">
                    You are betting when your chances are better than the odds suggest
                  </p>
                </div>
                
                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <h3 className="text-[#E5E7EB] font-medium">Negative EV bets</h3>
                  </div>
                  <p className="text-[#9CA3AF] text-sm">
                    You are taking a losing deal long-term
                  </p>
                </div>
              </div>

              <div className="bg-[#0F172A] rounded-lg p-5 mb-4">
                <h3 className="text-[#E5E7EB] font-medium mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#F4C430]" />
                  BetChekr's AI runs the EV math automatically:
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-[#0B0F14] font-bold text-xs">1</span>
                    </div>
                    <p className="text-[#9CA3AF]">It strips out sportsbook vig</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-[#0B0F14] font-bold text-xs">2</span>
                    </div>
                    <p className="text-[#9CA3AF]">It compares implied probability to reality using historical data and sharp lines</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-[#0B0F14] font-bold text-xs">3</span>
                    </div>
                    <p className="text-[#9CA3AF]">It tells you clearly: <span className="text-green-400">"This is a +EV bet"</span> or <span className="text-red-400">"This is a bad value bet"</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Scans for Arbitrage */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#F4C430]" />
                3. AI Scans for Arbitrage Opportunities
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                When two sportsbooks disagree, AI is much faster at catching it than humans.
              </p>

              <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937] mb-4">
                <h3 className="text-[#E5E7EB] font-medium mb-3">Example:</h3>
                <div className="space-y-2 text-[#9CA3AF] text-sm">
                  <p>• One book has Lakers at <span className="text-[#F4C430] font-bold">+110</span></p>
                  <p>• Another has Warriors at <span className="text-[#F4C430] font-bold">+110</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">BetChekr's AI flags it instantly</strong> as an arbitrage opportunity
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-blue-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">It even tells you how much to stake</strong> on each side to lock in profit
                  </p>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mt-6">
                <p className="text-[#9CA3AF]">
                  In the past, professional bettors needed multiple screens and spreadsheets to find these. 
                  <strong className="text-purple-400"> Today, AI does it instantly.</strong>
                </p>
              </div>
            </div>

            {/* AI Helps You Learn */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#F4C430]" />
                4. AI Helps You Learn as You Bet
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                BetChekr is not just a tool. It is a coach. Each time you upload a slip or generate a parlay:
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937]">
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-blue-400 mt-1" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Plain English Explanations</h3>
                      <p className="text-[#9CA3AF] text-sm">AI explains why it is good or bad in one or two plain English sentences</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937]">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-green-400 mt-1" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Pattern Recognition</h3>
                      <p className="text-[#9CA3AF] text-sm">Over time, you start to see patterns. You learn bankroll discipline, recognize traps, and begin spotting value</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  This makes BetChekr both a calculator and a learning platform for new bettors.
                </p>
              </div>
            </div>

            {/* Example AI in Action */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-[#F4C430]" />
                Example: AI in Action (BetChekr Slip)
              </h2>
              
              {/* Mock Bet Slip */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="bg-[#0B0F14] text-white rounded-t-lg p-4 -m-6 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[#F4C430] font-bold text-2xl">BETCHEKR</h3>
                      <p className="text-gray-300 text-sm">BET SLIP (AI Analysis)</p>
                    </div>
                    <div className="text-right text-gray-400 text-sm">
                      Dec 15, 2024
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Bet ID:</span>
                    <span className="font-mono">BC20250906</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stake:</span>
                    <span className="text-[#F4C430] font-bold">$25</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="bg-gray-50 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-[#F4C430] rounded-full flex items-center justify-center">
                        <span className="font-bold text-[#0B0F14]">1</span>
                      </div>
                      <span className="font-bold">Celtics @ Heat</span>
                    </div>
                    <div className="ml-10 space-y-1 text-sm">
                      <p>Pick: Celtics +3.5 Spread</p>
                      <p className="text-gray-600">Odds: <span className="font-bold text-lg">-110</span></p>
                      <p className="text-gray-500">Sportsbook: DraftKings</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded p-4 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Odds:</span>
                        <span className="text-[#F4C430] font-bold text-lg">-110</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Implied Probability:</span>
                        <span className="text-gray-700 font-bold">52.4%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-bold text-green-800 mb-2">BetChekr AI Verdict:</h4>
                      <p className="text-sm text-green-700">
                        "Based on recent line movement and historical matchups, Celtics cover spreads like this 55% of the time. 
                        That makes this a +EV bet with a 2.6% edge."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why This Matters */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#F4C430]" />
                Why This Matters for Beginners
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-[#E5E7EB] font-medium flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Without AI, beginners face:
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-[#141C28] rounded p-3 border border-red-500/20">
                      <p className="text-red-400 text-sm">Confusing odds</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-red-500/20">
                      <p className="text-red-400 text-sm">Hidden vig</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-red-500/20">
                      <p className="text-red-400 text-sm">No way to spot value or arbitrage</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-red-500/20">
                      <p className="text-red-400 text-sm">No guidance on bet sizing</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[#E5E7EB] font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    With AI and BetChekr:
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-[#141C28] rounded p-3 border border-green-500/20">
                      <p className="text-green-400 text-sm">Math-based analysis instantly</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-green-500/20">
                      <p className="text-green-400 text-sm">Avoid beginner mistakes like overbetting favorites</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-green-500/20">
                      <p className="text-green-400 text-sm">Actually learn as you go</p>
                    </div>
                    <div className="bg-[#141C28] rounded p-3 border border-green-500/20">
                      <p className="text-green-400 text-sm">Get clear guidance on every bet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[#F4C430]" />
                Conclusion: AI as Your Betting Sidekick
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                AI does not guarantee you will win every bet. Nothing does. But it guarantees you will understand every bet.
              </p>
              
              <p className="text-[#9CA3AF] mb-4">
                <strong className="text-[#E5E7EB]">And that is exactly BetChekr's mission:</strong>
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">Take the advanced math pros use</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">Put it into beginner-friendly tools</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">Help you build confidence, discipline, and smarter betting habits</p>
                </div>
              </div>

              <div className="bg-[#0B0F14] rounded-lg p-4">
                <p className="text-[#E5E7EB] font-medium">
                  💡 BetChekr is like having an AI-powered analyst in your pocket, crunching numbers while you focus on the fun.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]">
              <h3 className="text-2xl font-bold text-[#E5E7EB] mb-3">
                Try AI-Powered Bet Analysis
              </h3>
              <p className="text-[#9CA3AF] mb-6">
                Upload any bet slip and watch BetChekr's AI break down the math in plain English.
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors mr-3">
                  Try BetChekr AI
                </button>
              </Link>
              <Link href="/ai-parlay">
                <button className="px-6 py-3 bg-[#141C28] border border-[#1F2937] text-[#E5E7EB] font-semibold rounded-lg hover:border-[#F4C430]/50 transition-colors">
                  Generate AI Parlay
                </button>
              </Link>
            </div>
          </motion.article>

          {/* Related Articles */}
          <div className="mt-12 pt-8 border-t border-[#1F2937]">
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-4">
              Related Articles
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/learn/what-is-expected-value">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">What Is Expected Value?</h4>
                  <p className="text-[#6B7280] text-sm">The math behind smart betting</p>
                </div>
              </Link>
              <Link href="/learn/what-is-arbitrage-betting">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">What Is Arbitrage Betting?</h4>
                  <p className="text-[#6B7280] text-sm">How some made millions</p>
                </div>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}