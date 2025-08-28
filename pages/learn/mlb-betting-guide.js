import { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ArrowLeft,
  TrendingUp,
  Calculator,
  Target,
  BarChart3,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LineMovementChart from '../../components/LineMovementChart';
import GradientBG from '../../components/theme/GradientBG';

export default function MLBBettingGuide() {
  const [showLineMovement, setShowLineMovement] = useState(false);

  const tableOfContents = [
    { id: 'core-markets', title: 'The Core Betting Markets', icon: <Target className="w-4 h-4" /> },
    { id: 'line-movement', title: 'Why MLB Lines Move So Much', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'line-shopping', title: 'The Power of Line Shopping', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'advanced-angles', title: 'Advanced Angles', icon: <Brain className="w-4 h-4" /> },
    { id: 'ai-tools', title: 'How AI Tools Can Help', icon: <Zap className="w-4 h-4" /> }
  ];

  const marketTypes = [
    {
      name: 'Moneyline',
      description: 'Bet on which team wins the game',
      example: 'Yankees -140 vs. Red Sox +120',
      explanation: 'Yankees are favored (risk $140 to win $100). Red Sox are underdogs (risk $100 to win $120).'
    },
    {
      name: 'Run Line',
      description: 'Baseball\'s point spread, almost always 1.5 runs',
      example: 'Dodgers -1.5 (+110) vs. Giants +1.5 (-130)',
      explanation: 'Dodgers must win by 2+ runs. Giants can win outright or lose by 1 run.'
    },
    {
      name: 'Totals (Over/Under)',
      description: 'Bet on combined runs scored by both teams',
      example: 'Over 8.5 (-105) / Under 8.5 (-115)',
      explanation: 'If 9+ runs are scored, over wins. If 8 or fewer runs, under wins.'
    }
  ];

  const movementFactors = [
    { factor: 'Pitching matchups', impact: 'A late scratch can swing lines by 50-80 cents' },
    { factor: 'Bullpen fatigue', impact: 'Teams with overused relievers see odds drift' },
    { factor: 'Weather conditions', impact: 'Wind at Wrigley can add a full run to totals' },
    { factor: 'Star player lineups', impact: 'Key players getting rest often shift lines' }
  ];

  const advancedStrategies = [
    {
      name: 'First Five Innings Bets',
      description: 'Focus only on starting pitchers, avoiding bullpen variance',
      benefit: 'Eliminates late-game uncertainty'
    },
    {
      name: 'Team Totals',
      description: 'Bet on one team\'s runs instead of the game total',
      benefit: 'Isolate favorable matchups'
    },
    {
      name: 'Alternate Run Lines',
      description: 'Use +2.5 or -2.5 spreads at different prices',
      benefit: 'Find better value than standard -1.5'
    }
  ];

  return (
    <div className="betchekr-premium">
      <Head>
        <title>MLB Betting Lines Explained: How to Read and Beat the Numbers | BetChekr</title>
        <meta name="description" content="Master MLB betting with this comprehensive guide. Learn moneylines, run lines, totals, and advanced strategies for baseball's 162-game season." />
        <meta name="keywords" content="MLB betting, baseball betting lines, run line, moneyline, totals, over under, baseball strategy" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb & Back */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link href="/learn" className="inline-flex items-center gap-2 text-[#F4C430] hover:text-[#e6b829] transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Learn Center
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-5xl">⚾</div>
              <div>
                <span className="inline-block px-3 py-1 bg-[#F4C430]/10 text-[#F4C430] text-sm font-medium rounded-full">
                  MLB Guide
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-[#E5E7EB] mt-2">
                  MLB Betting Lines Explained
                </h1>
                <p className="text-[#F4C430] text-xl font-medium mt-2">
                  How to Read and Beat the Numbers
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-[#9CA3AF] text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>12 min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>Comprehensive Guide</span>
              </div>
            </div>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-8"
          >
            <p className="text-[#E5E7EB] text-lg leading-relaxed">
              Baseball is a numbers game, not just on the field but at the sportsbook. With{' '}
              <strong className="text-[#F4C430]">162 games per team</strong> and thousands of lines every season, 
              MLB creates endless opportunities for bettors who understand how odds work. Because baseball has more 
              statistical variance than most sports, small differences in lines can create real value.
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6 mb-8"
          >
            <h2 className="text-[#E5E7EB] font-semibold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#F4C430]" />
              What You'll Learn
            </h2>
            <nav className="grid md:grid-cols-2 gap-3">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#0F172A] transition-colors text-[#9CA3AF] hover:text-[#F4C430]"
                >
                  <div className="text-[#F4C430]">{item.icon}</div>
                  <span>{item.title}</span>
                </a>
              ))}
            </nav>
          </motion.div>

          {/* Core Betting Markets */}
          <motion.section
            id="core-markets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-[#F4C430]" />
              The Core Betting Markets
            </h2>

            <div className="space-y-6">
              {marketTypes.map((market, index) => (
                <div key={market.name} className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                  <h3 className="text-[#F4C430] font-semibold text-xl mb-2">{market.name}</h3>
                  <p className="text-[#9CA3AF] mb-4">{market.description}</p>
                  
                  <div className="bg-[#0F172A] rounded-lg p-4 mb-3">
                    <div className="text-[#F4C430] font-mono text-lg mb-2">Example:</div>
                    <div className="text-[#E5E7EB] font-medium">{market.example}</div>
                  </div>
                  
                  <p className="text-[#E5E7EB]">{market.explanation}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Why Lines Move */}
          <motion.section
            id="line-movement"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#F4C430]" />
              Why MLB Lines Move So Much
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {movementFactors.map((factor, index) => (
                <div key={factor.factor} className="bg-[#141C28] rounded-lg border border-[#1F2937] p-5">
                  <h3 className="text-[#F4C430] font-semibold mb-2">{factor.factor}</h3>
                  <p className="text-[#9CA3AF]">{factor.impact}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-[#F4C430] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[#E5E7EB] font-medium mb-2">Sharp Bettor Insight:</p>
                  <p className="text-[#9CA3AF]">
                    Because MLB games are so sensitive to these factors, sharp bettors track news constantly 
                    and hit lines before they adjust. A single pitcher change can create instant value for 
                    those who act quickly.
                  </p>
                </div>
              </div>
            </div>

            {/* Line Movement Demo */}
            <div className="mt-8 bg-[#0B1220] rounded-xl p-6 border border-[#1F2937]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#F4C430] font-semibold text-lg">Real-Time Line Movement Tracker</h3>
                <button
                  onClick={() => setShowLineMovement(true)}
                  className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  See Live Example
                </button>
              </div>
              <p className="text-[#9CA3AF] mb-4">
                Track how MLB betting lines move in real-time. Our system monitors odds changes every hour 
                across all major sportsbooks, helping you identify the best time to place your bets.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-[#F4C430] text-2xl font-bold">24h</div>
                  <div className="text-[#9CA3AF] text-sm">Live Tracking</div>
                </div>
                <div className="text-center">
                  <div className="text-[#F4C430] text-2xl font-bold">8+</div>
                  <div className="text-[#9CA3AF] text-sm">Sportsbooks</div>
                </div>
                <div className="text-center">
                  <div className="text-[#F4C430] text-2xl font-bold">3</div>
                  <div className="text-[#9CA3AF] text-sm">Market Types</div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Line Shopping */}
          <motion.section
            id="line-shopping"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#F4C430]" />
              The Power of Line Shopping
            </h2>

            <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6 mb-6">
              <p className="text-[#E5E7EB] text-lg leading-relaxed mb-4">
                Unlike the NFL, where spreads are relatively stable, MLB lines differ significantly across sportsbooks. 
                One book may post the Blue Jays at <span className="text-[#F4C430] font-mono">+140</span> while 
                another lists them at <span className="text-[#F4C430] font-mono">+155</span>.
              </p>
              
              <div className="bg-[#0F172A] rounded-lg p-4">
                <p className="text-[#F4C430] font-medium">The Math:</p>
                <p className="text-[#9CA3AF] mt-2">
                  That 15-cent difference increases expected value immediately. Over a 162-game season, 
                  consistently grabbing the best line can turn a losing bettor into a profitable one.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Advanced Angles */}
          <motion.section
            id="advanced-angles"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
              <Brain className="w-6 h-6 text-[#F4C430]" />
              Advanced Angles
            </h2>

            <div className="space-y-4">
              {advancedStrategies.map((strategy, index) => (
                <div key={strategy.name} className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-[#F4C430] font-semibold text-lg mb-2">{strategy.name}</h3>
                      <p className="text-[#9CA3AF] mb-3">{strategy.description}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1 ml-4 flex-shrink-0" />
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3">
                    <span className="text-[#F4C430] text-sm font-medium">Benefit: </span>
                    <span className="text-[#E5E7EB]">{strategy.benefit}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* AI Tools Section */}
          <motion.section
            id="ai-tools"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#F4C430]" />
              How AI Tools Can Help
            </h2>

            <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6 mb-6">
              <p className="text-[#E5E7EB] text-lg mb-4">
                Modern tools can scan <strong className="text-[#F4C430]">thousands of MLB lines instantly</strong>. AI can:
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5 flex-shrink-0" />
                  <span className="text-[#9CA3AF]">Identify positive EV plays by comparing implied probability to real odds</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5 flex-shrink-0" />
                  <span className="text-[#9CA3AF]">Spot arbitrage between books when totals or moneylines diverge</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#F4C430] mt-0.5 flex-shrink-0" />
                  <span className="text-[#9CA3AF]">Track your performance against the closing line so you know if you're beating the market</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-4 border border-[#F4C430]/20">
                <p className="text-[#E5E7EB]">
                  BetChekr packages this into an interface that explains the math while showing you real examples. 
                  Instead of just guessing, you're betting with probability and expected value on your side.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Bottom Line */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-12"
          >
            <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-8">
              <h2 className="text-2xl font-bold text-[#F4C430] mb-4">Bottom Line</h2>
              <p className="text-[#E5E7EB] text-lg leading-relaxed mb-4">
                MLB is a grind. The season is long, variance is high, and sportsbooks are sharp. The bettors 
                who succeed are the ones who consistently find edges in the lines, shop prices, and use math 
                instead of hunches.
              </p>
              <p className="text-[#9CA3AF]">
                With the right approach and tools, every single cent of line value can add up over the course 
                of the season. In baseball's 162-game marathon, consistent small edges become significant profits.
              </p>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-8 border border-[#F4C430]/20"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-3">
              Ready to Apply These Concepts?
            </h2>
            <p className="text-[#9CA3AF] mb-6 max-w-2xl mx-auto">
              Use BetChekr to instantly analyze your MLB bet slips and see if they align with these profitable strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors">
                  Analyze MLB Bets
                </button>
              </Link>
              <Link href="/learn">
                <button className="px-6 py-3 border border-[#F4C430] text-[#F4C430] font-semibold rounded-lg hover:bg-[#F4C430]/10 transition-colors">
                  More Guides
                </button>
              </Link>
            </div>
          </motion.div>
        </main>

        <Footer />

        {/* Line Movement Chart Modal */}
        <LineMovementChart
          isOpen={showLineMovement}
          onClose={() => setShowLineMovement(false)}
          sport="MLB"
          gameId="example_game_yankees_redsox"
          gameInfo={{
            away_team: "New York Yankees",
            home_team: "Boston Red Sox"
          }}
          market="h2h"
          hours={24}
        />
      </GradientBG>
    </div>
  );
}