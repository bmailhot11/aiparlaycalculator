import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BookOpen,
  Target,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Zap,
  Lightbulb,
  Calculator,
  Award,
  Users,
  AlertTriangle
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function WhatIsArbitrageBetting() {
  return (
    <>
      <Head>
        <title>What Is Arbitrage Betting? (How Some Made Millions) | BetChekr Learn</title>
        <meta name="description" content="Learn how arbitrage betting works and real stories of people who made millions exploiting sportsbook inefficiencies." />
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
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded font-medium">
                Strategy
              </span>
              <div className="flex items-center gap-1 text-[#6B7280] text-sm">
                <Clock className="w-3 h-3" />
                <span>8 min read</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              📘 What Is Arbitrage Betting?
            </h1>
            <p className="text-xl text-[#9CA3AF]">
              (And How Some People Made Millions Doing It)
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
                Imagine being able to place a bet where you can't lose. That's the idea behind arbitrage betting (often called "arbing").
              </p>
              <p className="text-[#9CA3AF] mb-3">
                An arbitrage bet happens when two or more sportsbooks disagree on the odds for the same event. 
                By placing bets on all possible outcomes across different sportsbooks, you can lock in a guaranteed profit — no matter who wins.
              </p>
              <p className="text-[#9CA3AF]">
                It sounds like magic, but it's really just math. And yes, people have made millions exploiting it.
              </p>
            </div>

            {/* How Arbitrage Works */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#F4C430]" />
                How Arbitrage Works (Simple Example)
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">Let's say:</p>
              
              <div className="bg-[#141C28] rounded-lg p-5 border border-[#1F2937] mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">A</span>
                    </div>
                    <p className="text-[#E5E7EB]">
                      <strong>Sportsbook A:</strong> Lakers to win = <span className="text-[#F4C430]">+110</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">B</span>
                    </div>
                    <p className="text-[#E5E7EB]">
                      <strong>Sportsbook B:</strong> Warriors to win = <span className="text-[#F4C430]">+110</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[#9CA3AF] mb-4">
                If you bet $100 on the Lakers at A, and $100 on the Warriors at B:
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0F172A] rounded-lg p-4 border border-green-500/20">
                  <h3 className="text-green-400 font-medium mb-2">If Lakers Win:</h3>
                  <p className="text-[#9CA3AF] text-sm">$100 → <span className="text-[#F4C430] font-bold">$210</span> payout at A</p>
                </div>
                <div className="bg-[#0F172A] rounded-lg p-4 border border-green-500/20">
                  <h3 className="text-green-400 font-medium mb-2">If Warriors Win:</h3>
                  <p className="text-[#9CA3AF] text-sm">$100 → <span className="text-[#F4C430] font-bold">$210</span> payout at B</p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-green-400 font-bold text-lg mb-2">Either way:</h3>
                  <p className="text-[#E5E7EB] mb-2">
                    You get back <span className="text-[#F4C430] font-bold">$210</span> while only risking <span className="text-red-400">$200</span> total
                  </p>
                  <p className="text-green-400 font-bold text-xl">
                    That's a $10 profit guaranteed. 🎯
                  </p>
                  <p className="text-[#6B7280] text-sm mt-2">
                    It doesn't matter who wins — you've locked in free money.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-Life Examples */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#F4C430]" />
                Real-Life Examples of Arbers Who Struck Gold
              </h2>
              
              {/* The Syndicate */}
              <div className="mb-6">
                <div className="bg-[#141C28] rounded-lg p-6 border border-[#1F2937]">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 bg-[#F4C430]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#F4C430] font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold text-lg">
                        The "Syndicate" in the UK (1990s)
                      </h3>
                    </div>
                  </div>
                  
                  <div className="ml-12 space-y-3">
                    <p className="text-[#9CA3AF]">
                      In the early days of online sportsbooks, odds would be posted manually. A small group of bettors 
                      in London formed a syndicate to scan lines across dozens of books.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">They used fax machines (seriously) to alert each other when lines diverged</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">Over the course of a decade, it's estimated they made <span className="text-[#F4C430] font-bold">£10–15 million</span> purely on arbing</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">They never cared about sports — only the math</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Computer Wizards */}
              <div className="mb-6">
                <div className="bg-[#141C28] rounded-lg p-6 border border-[#1F2937]">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 bg-[#F4C430]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#F4C430] font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold text-lg">
                        The Eastern European Computer Wizards (2000s)
                      </h3>
                    </div>
                  </div>
                  
                  <div className="ml-12 space-y-3">
                    <p className="text-[#9CA3AF]">
                      As betting went digital, some groups in Eastern Europe built scraper bots to scan thousands of lines per second.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">They'd find 1–2% arbitrage gaps and hammer them with huge volume</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">Because they could automate faster than sportsbooks adjusted, some groups reportedly made <span className="text-[#F4C430] font-bold">$5–10 million annually</span></p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-1" />
                        <p className="text-[#9CA3AF] text-sm">Eventually, sportsbooks caught on and started banning accounts flagged for "sharp play"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Success */}
              <div className="mb-6">
                <div className="bg-[#141C28] rounded-lg p-6 border border-[#1F2937]">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 bg-[#F4C430]/20 rounded-full flex items-center justify-center">
                      <span className="text-[#F4C430] font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="text-[#E5E7EB] font-semibold text-lg">
                        Individual Success Stories
                      </h3>
                    </div>
                  </div>
                  
                  <div className="ml-12">
                    <p className="text-[#9CA3AF] mb-3">Even solo bettors have pulled it off:</p>
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-blue-500/20">
                      <p className="text-[#9CA3AF] text-sm">
                        <strong className="text-blue-400">Example:</strong> A bettor in New Jersey in 2019 found consistent arbitrage 
                        in tennis matches across FanDuel and DraftKings, sometimes locking in 3–4% per match.
                      </p>
                      <p className="text-[#9CA3AF] text-sm mt-2">
                        By cycling a <span className="text-[#F4C430] font-bold">$20,000</span> bankroll, he was reportedly making 
                        <span className="text-green-400 font-bold"> $500–$1,000 a day</span> before the books limited him.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Doesn't Everyone Do It */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-[#F4C430]" />
                Why Doesn't Everyone Do It?
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Sounds like a money printer, right? The catch is:
              </p>

              <div className="space-y-4">
                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Limited Opportunities</h3>
                      <p className="text-[#9CA3AF] text-sm">Sportsbooks are faster today, odds update in seconds</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Account Restrictions</h3>
                      <p className="text-[#9CA3AF] text-sm">If a sportsbook suspects you're arbing, they limit your stakes or ban you</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Capital Requirements</h3>
                      <p className="text-[#9CA3AF] text-sm">To make real money, you need tens of thousands across multiple accounts</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141C28] rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <h3 className="text-[#E5E7EB] font-medium">Precision Needed</h3>
                      <p className="text-[#9CA3AF] text-sm">If you mistime a bet (line moves before you get both sides), you can lose instead of profit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Bet Slip */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-[#F4C430]" />
                Example: Arbitrage Bet Slip
              </h2>
              
              {/* Mock Bet Slip */}
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="bg-[#0B0F14] text-white rounded-t-lg p-4 -m-6 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-[#F4C430] font-bold text-2xl">BETCHEKR</h3>
                      <p className="text-gray-300 text-sm">BET SLIP (Arb Example)</p>
                    </div>
                    <div className="text-right text-gray-400 text-sm">
                      Dec 15, 2024
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-gray-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Bet ID:</span>
                    <span className="font-mono">BC20250905</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Stake:</span>
                    <span className="text-[#F4C430] font-bold">$500 split across books</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <h4 className="font-bold text-center mb-3">Real Madrid vs Barcelona</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">A</span>
                        </div>
                        <span className="font-bold">Sportsbook A</span>
                      </div>
                      <div className="ml-8 space-y-1 text-sm">
                        <p>Real Madrid to win @ <span className="font-bold">+120</span></p>
                        <p className="text-gray-600">Stake: <span className="font-bold text-[#F4C430]">$250</span></p>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xs">B</span>
                        </div>
                        <span className="font-bold">Sportsbook B</span>
                      </div>
                      <div className="ml-8 space-y-1 text-sm">
                        <p>Barcelona to win @ <span className="font-bold">+120</span></p>
                        <p className="text-gray-600">Stake: <span className="font-bold text-[#F4C430]">$250</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-100 rounded p-4 mt-4 border border-green-300">
                    <div className="text-center">
                      <p className="font-bold text-green-800 text-lg mb-1">
                        Guaranteed Payout: $550
                      </p>
                      <p className="text-green-700 font-bold">
                        Profit: $50 (no matter who wins)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How BetChekr Helps */}
            <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-8">
              <h2 className="text-2xl font-semibold text-[#E5E7EB] mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-[#F4C430]" />
                How BetChekr Helps Beginners
              </h2>
              
              <p className="text-[#9CA3AF] mb-4">
                Here's the truth: manually hunting arbs across dozens of books is almost impossible today. 
                But BetChekr can scan odds and highlight positive arbitrage opportunities automatically.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5" />
                  <div>
                    <p className="text-[#E5E7EB] font-medium">See "Arb Alerts"</p>
                    <p className="text-[#9CA3AF] text-sm">BetChekr flags when lines diverge enough for profit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5" />
                  <div>
                    <p className="text-[#E5E7EB] font-medium">No advanced math needed</p>
                    <p className="text-[#9CA3AF] text-sm">We show you exactly how much to stake on each side</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5" />
                  <div>
                    <p className="text-[#E5E7EB] font-medium">Beginner friendly</p>
                    <p className="text-[#9CA3AF] text-sm">Even if you don't chase every arb, BetChekr teaches you the concept and shows where books disagree</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F14] rounded-lg p-4">
                <p className="text-[#E5E7EB] font-medium">
                  💡 In short: professional arbers made millions by exploiting inefficiencies. 
                  You may not quit your job doing it — but with BetChekr, you'll always know when free money is on the table.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]">
              <h3 className="text-2xl font-bold text-[#E5E7EB] mb-3">
                Start Spotting Arbitrage Opportunities
              </h3>
              <p className="text-[#9CA3AF] mb-6">
                Let BetChekr scan the odds and alert you when sportsbooks disagree enough to guarantee profit.
              </p>
              <Link href="/arbitrage">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors mr-3">
                  Find Arbitrage Bets
                </button>
              </Link>
              <Link href="/">
                <button className="px-6 py-3 bg-[#141C28] border border-[#1F2937] text-[#E5E7EB] font-semibold rounded-lg hover:border-[#F4C430]/50 transition-colors">
                  Analyze Your Slip
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
              <Link href="/learn/what-does-plus-150-mean">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937] hover:border-[#F4C430]/50 transition-colors">
                  <h4 className="text-[#E5E7EB] font-medium mb-1">What Does +150 Mean?</h4>
                  <p className="text-[#6B7280] text-sm">Learn American odds basics</p>
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