import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BookOpen,
  Brain,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Target,
  Lightbulb,
  Calculator,
  Zap
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function WhatIsExpectedValue() {
  return (
    <>
      <Head>
        <title>What Is EV (Expected Value) in Sports Betting? | BetChekr Learn</title>
        <meta name="description" content="Learn what Expected Value (EV) means in sports betting, how to identify +EV bets, and why it's essential for profitable betting." />
      </Head>

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        
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
                <span>6 min read</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              📘 What Is EV (Expected Value) in Sports Betting?
            </h1>
            <p className="text-xl text-[#9CA3AF]">
              The Math Behind Smart Betting
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
                When you hear experienced bettors talk about "EV" or "positive EV bets," it might sound complicated. 
                But EV — short for Expected Value — is simply a way to measure if a bet is worth making in the long run.
              </p>
              <p className="text-[#9CA3AF]">
                If you want to stop betting based on gut feeling and start betting smarter, understanding EV is essential. 
                And don't worry — we'll keep it beginner-friendly.
              </p>
            </div>

            {/* What Does EV Mean */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-[#F4C430]" />
                What Does EV Mean?
              </h2>
              
              <p className="text-[#9CA3AF] mb-6">
                Expected Value (EV) shows the average amount you can expect to win or lose on a bet if you made 
                the same bet many times.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#141C28] rounded-lg p-5 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Positive EV (+EV)</h3>
                      <p className="text-green-400 text-sm">Good bet</p>
                    </div>
                  </div>
                  <p className="text-[#9CA3AF] text-sm">
                    You're likely to profit long-term
                  </p>
                </div>
                
                <div className="bg-[#141C28] rounded-lg p-5 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Negative EV (-EV)</h3>
                      <p className="text-red-400 text-sm">Bad bet</p>
                    </div>
                  </div>
                  <p className="text-[#9CA3AF] text-sm">
                    The sportsbook has the edge, you'll lose long-term
                  </p>
                </div>
              </div>
            </div>

            {/* Coin Flip Example */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#F4C430]" />
                EV Example: A Coin Flip Game
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Imagine flipping a fair coin:
              </p>

              <div className="space-y-4 mb-6">
                {/* Fair Coin Flip */}
                <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937]">
                  <h3 className="text-[#E5E7EB] font-medium mb-3">Fair Coin Flip (0 EV)</h3>
                  <div className="space-y-2 text-[#9CA3AF]">
                    <p>• <strong className="text-[#E5E7EB]">Heads</strong> = you win $100</p>
                    <p>• <strong className="text-[#E5E7EB]">Tails</strong> = you lose $100</p>
                  </div>
                  <div className="bg-[#0F172A] rounded p-3 mt-3">
                    <p className="text-[#6B7280] text-sm">
                      This is a <strong className="text-yellow-400">0 EV</strong> bet — over many flips, you break even.
                    </p>
                  </div>
                </div>

                {/* +EV Coin Flip */}
                <div className="bg-[#141C28] rounded-lg p-5 border border-green-500/20">
                  <h3 className="text-[#E5E7EB] font-medium mb-3">Better Coin Flip (+EV)</h3>
                  <div className="space-y-2 text-[#9CA3AF]">
                    <p>• <strong className="text-[#E5E7EB]">Heads</strong> = win $110</p>
                    <p>• <strong className="text-[#E5E7EB]">Tails</strong> = lose $100</p>
                  </div>
                  <div className="bg-green-500/10 rounded p-3 mt-3">
                    <p className="text-green-400 text-sm">
                      That's a <strong>+EV bet</strong>, because the payouts are tilted in your favor.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How Sportsbooks Use EV */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-[#F4C430]" />
                How Sportsbooks Use EV
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Sportsbooks always add <strong className="text-[#E5E7EB]">vig (juice)</strong> to tilt EV in their favor. For example:
              </p>

              <div className="bg-[#0F172A] rounded-lg p-5 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-[#9CA3AF]">
                      <strong className="text-[#E5E7EB]">True 50/50 odds</strong> should be +100 each side
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-[#9CA3AF]">
                      <strong className="text-[#E5E7EB]">Sportsbook lists them at -110 each side</strong> → now the EV is negative for you, positive for them
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Example EV Bet Slip */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#F4C430]" />
                Example: EV Bet Slip
              </h2>
              
              {/* Mock Bet Slip */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="bg-[#0B0F14] text-white rounded-t-lg p-4 -m-6 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[#F4C430] font-bold text-2xl">BETCHEKR</h3>
                      <p className="text-gray-300 text-sm">BET SLIP</p>
                    </div>
                    <div className="text-right text-gray-400 text-sm">
                      Dec 15, 2024
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Bet ID:</span>
                    <span className="font-mono">BC20250904</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Stake:</span>
                    <span className="text-[#F4C430] font-bold">$50</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="bg-gray-50 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-[#F4C430] rounded-full flex items-center justify-center">
                        <span className="font-bold text-[#0B0F14]">1</span>
                      </div>
                      <span className="font-bold">Raptors @ Heat</span>
                    </div>
                    <div className="ml-10 space-y-1 text-sm">
                      <p>Pick: Raptors Moneyline</p>
                      <p className="text-gray-600">Odds: <span className="font-bold text-lg">+150</span></p>
                      <p className="text-gray-500">Sportsbook: Caesars</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded p-4 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Total Odds:</span>
                        <span className="text-[#F4C430] font-bold text-lg">+150</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Implied Win Probability:</span>
                        <span className="text-gray-700 font-bold">40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Your Edge:</span>
                        <span className="text-gray-700">You believe Raptors' true chance = 45%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-800">EV Result: +EV Bet</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your predicted probability (45%) is higher than the sportsbook's (40%).
                  </p>
                </div>
              </div>
            </div>

            {/* Why Beginners Should Care */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#F4C430]" />
                Why Beginners Should Care About EV
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">EV keeps you from betting blindly</strong> — 
                    no more random gut picks
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">You learn to compare</strong> what the sportsbook is 
                    implying vs what's realistic
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">Long-term winning bettors</strong> only chase +EV spots
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <p className="text-[#9CA3AF] text-sm">
                    <strong className="text-[#E5E7EB]">Pro Tip:</strong> Even if you lose a +EV bet, 
                    it was still the right decision. EV is about long-term profitability, not individual results.
                  </p>
                </div>
              </div>
            </div>

            {/* How BetChekr Helps */}
            <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#F4C430]" />
                How BetChekr Helps
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Here's the problem: doing EV math manually takes time. That's why most beginners never use it.
              </p>
              
              <p className="text-[#9CA3AF] mb-4">
                <strong className="text-[#E5E7EB]">BetChekr does it automatically:</strong>
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-[#0B0F14] font-bold text-xs">1</span>
                  </div>
                  <p className="text-[#E5E7EB]">
                    Upload your bet slip → BetChekr removes vig
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-[#0B0F14] font-bold text-xs">2</span>
                  </div>
                  <p className="text-[#E5E7EB]">
                    See instantly if your bet is +EV or -EV
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F4C430] rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-[#0B0F14] font-bold text-xs">3</span>
                  </div>
                  <p className="text-[#E5E7EB]">
                    Get a clear verdict: "Good Value" or "Bad Value"
                  </p>
                </div>
              </div>

              <div className="bg-[#0B0F14] rounded-lg p-4">
                <p className="text-[#E5E7EB] font-medium">
                  💡 In short: EV is the math behind smart betting, and BetChekr runs it for you in seconds.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]">
              <h3 className="text-2xl font-bold text-[#E5E7EB] mb-3">
                Start Finding +EV Bets Today
              </h3>
              <p className="text-[#9CA3AF] mb-6">
                Upload your bet slip and let BetChekr calculate the expected value for you automatically.
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors">
                  Analyze Your Bets
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
              <Link href="/learn/what-does-plus-150-mean">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">What Does +150 Mean?</h4>
                  <p className="text-[#6B7280] text-sm">Learn American odds basics</p>
                </div>
              </Link>
              <Link href="/learn">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">Bankroll Management</h4>
                  <p className="text-[#6B7280] text-sm">Coming Soon</p>
                </div>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}