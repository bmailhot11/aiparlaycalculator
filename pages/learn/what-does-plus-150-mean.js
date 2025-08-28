import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BookOpen,
  Calculator,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GradientBG from '../../components/theme/GradientBG';

export default function WhatDoesPlus150Mean() {
  return (
    <div className="betchekr-premium">
      <Head>
        <title>What Does +150 Mean in Sports Betting? | BetChekr Learn</title>
        <meta name="description" content="Learn how to read American odds like +150, calculate payouts, and understand implied probabilities. Beginner's guide to sports betting odds." />
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
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-medium">
                Basics
              </span>
              <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                <Clock className="w-3 h-3" />
                <span>5 min read</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              📘 What Does +150 Mean in Sports Betting?
            </h1>
            <p className="text-xl text-[#9CA3AF]">
              Beginner's Guide to Understanding American Odds
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
                If you're new to sports betting, you've probably seen odds listed as +150, -200, or something similar. 
                At first glance, it looks confusing — but once you understand how to read these numbers, betting becomes a lot clearer.
              </p>
              <p className="text-[#9CA3AF]">
                In this guide, we'll explain exactly what +150 odds mean, how much you could win with a $10 or $100 bet, 
                and why beginners often misunderstand them. At the end, we'll also show how BetChekr makes it simple by 
                converting odds into probabilities and payouts automatically.
              </p>
            </div>

            {/* Understanding American Odds */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#F4C430]" />
                Understanding American Odds (+/- System)
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Sportsbooks in North America usually use American odds:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#141C28] rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 font-bold">+</span>
                    </div>
                    <span className="text-[#E5E7EB] font-medium">Plus odds (+) = Underdog</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">
                    The team less likely to win
                  </p>
                </div>
                
                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <span className="text-red-400 font-bold">−</span>
                    </div>
                    <span className="text-[#E5E7EB] font-medium">Minus odds (−) = Favorite</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">
                    The team expected to win
                  </p>
                </div>
              </div>

              <p className="text-[#9CA3AF] mb-4">
                So when you see <span className="text-[#F4C430] font-bold">+150</span>, it means the team is the underdog.
              </p>

              <div className="bg-[#0F172A] rounded-lg p-6 mb-6">
                <h3 className="text-[#E5E7EB] font-medium mb-4">Quick Examples:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <span className="text-[#E5E7EB] font-medium">+150</span>
                      <span className="text-[#9CA3AF]"> = Bet $100 to win $150 profit (get $250 total back)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <span className="text-[#E5E7EB] font-medium">−150</span>
                      <span className="text-[#9CA3AF]"> = Bet $150 to win $100 profit (get $250 total back)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg p-4 border border-[#F4C430]/20">
                <p className="text-[#9CA3AF] text-sm">
                  💡 <strong className="text-[#E5E7EB]">This system tells you two things instantly:</strong> 
                  How much risk is needed and which side is expected to win more often.
                </p>
              </div>
            </div>

            {/* Converting Odds to Probability */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#F4C430]" />
                Converting Odds to Probability
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Odds aren't just about money — they also represent the implied chance of winning.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937]">
                  <h3 className="text-[#F4C430] font-medium mb-3">For +150:</h3>
                  <div className="bg-[#0F172A] rounded p-3 mb-3 font-mono text-sm">
                    <span className="text-[#9CA3AF]">100 ÷ (150 + 100) = </span>
                    <span className="text-[#F4C430] font-bold">40%</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">
                    40% chance to win
                  </p>
                </div>

                <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937]">
                  <h3 className="text-[#F4C430] font-medium mb-3">For −150:</h3>
                  <div className="bg-[#0F172A] rounded p-3 mb-3 font-mono text-sm">
                    <span className="text-[#9CA3AF]">150 ÷ (150 + 100) = </span>
                    <span className="text-[#F4C430] font-bold">60%</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">
                    60% chance to win
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-[#9CA3AF]">
                  So when you see <span className="text-[#F4C430] font-bold">+150</span>, 
                  the sportsbook is saying, <em>"This team has about a 40% chance of winning."</em>
                </p>
              </div>
            </div>

            {/* Example Bet Slip */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-[#F4C430]" />
                Example: A +150 Bet Slip
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Here's what a BetChekr slip looks like when analyzing +150 odds:
              </p>

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
                    <span className="font-mono">BC99881234</span>
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
                      <span className="font-bold">Toronto Raptors @ Miami Heat</span>
                    </div>
                    <div className="ml-10 space-y-1 text-sm">
                      <p>Pick: Raptors Moneyline</p>
                      <p className="text-gray-600">Odds: <span className="font-bold text-lg">+150</span> (Underdog)</p>
                      <p className="text-gray-500">Sportsbook: Caesars</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded p-4 mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Total Odds:</span>
                      <span className="text-[#F4C430] font-bold text-xl">+150</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Potential Payout:</span>
                      <span className="text-green-600 font-bold text-xl">$125</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">($50 stake + $75 profit)</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>BetChekr Analysis:</strong> 40% implied win chance. 
                    Good risk/reward if you believe Raptors have a higher chance than 40%.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Beginners Misinterpret */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-[#F4C430]" />
                Why Beginners Misinterpret +150
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Most new bettors assume underdogs are "bad bets" just because the odds are higher. The truth:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">Betting underdogs at the right price</strong> can be 
                    profitable long-term.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-1" />
                  <p className="text-[#9CA3AF]">
                    <strong className="text-[#E5E7EB]">Favorites (−200, −300)</strong> often look safe but 
                    carry hidden risk.
                  </p>
                </div>
              </div>
            </div>

            {/* How BetChekr Helps */}
            <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[#F4C430]" />
                How BetChekr Makes This Easy
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Instead of you doing all the math, BetChekr instantly converts odds like +150 into win % and payouts.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">
                    Upload your bet slip → see if it's Trash or Cash
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">
                    BetChekr auto-calculates implied probability
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430]" />
                  <p className="text-[#E5E7EB]">
                    You'll know if your bet has real value or if the sportsbook is overpricing it
                  </p>
                </div>
              </div>

              <div className="bg-[#0B0F14] rounded-lg p-4 mt-6">
                <p className="text-[#E5E7EB] font-medium">
                  💡 In short: with BetChekr, you don't just guess — you bet smarter.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]">
              <h3 className="text-2xl font-bold text-[#E5E7EB] mb-3">
                Ready to Analyze Your First Bet?
              </h3>
              <p className="text-[#9CA3AF] mb-6">
                Upload any bet slip and get instant analysis on odds, probabilities, and expected value.
              </p>
              <Link href="/">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors">
                  Try BetChekr Free
                </button>
              </Link>
            </div>
          </motion.article>

          {/* Related Articles */}
          <div className="mt-12 pt-8 border-t border-[#1F2937]">
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-4">
              Keep Learning
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/learn">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">Understanding Parlays</h4>
                  <p className="text-[#6B7280] text-sm">Coming Soon</p>
                </div>
              </Link>
              <Link href="/learn">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">Expected Value Explained</h4>
                  <p className="text-[#6B7280] text-sm">Coming Soon</p>
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