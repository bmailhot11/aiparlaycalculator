import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BookOpen,
  TrendingUp,
  Calculator,
  DollarSign,
  Target,
  Brain,
  ChevronRight,
  Clock,
  User
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GradientBG from '../../components/theme/GradientBG';

export default function LearnSection() {
  const articles = [
    {
      slug: 'what-does-plus-150-mean',
      title: 'What Does +150 Mean in Sports Betting?',
      subtitle: "Beginner's Guide",
      description: 'Learn how to read American odds, calculate payouts, and understand implied probabilities.',
      readTime: '5 min read',
      category: 'Basics',
      icon: <Calculator className="w-5 h-5" />,
      featured: true
    },
    // Future articles placeholder
    {
      slug: 'what-is-arbitrage-betting',
      title: 'What Is Arbitrage Betting?',
      subtitle: 'How Some Made Millions',
      description: 'Learn how arbitrage betting works and real stories of people who made millions.',
      readTime: '8 min read',
      category: 'Strategy',
      icon: <Target className="w-5 h-5" />,
      featured: false
    },
    {
      slug: 'understanding-parlays',
      title: 'Understanding Parlay Bets',
      subtitle: 'Risk vs Reward',
      description: 'How parlays work, when they make sense, and common mistakes to avoid.',
      readTime: '7 min read',
      category: 'Strategy',
      icon: <TrendingUp className="w-5 h-5" />,
      comingSoon: true
    },
    {
      slug: 'what-is-expected-value',
      title: 'What Is EV (Expected Value)?',
      subtitle: 'Advanced Concepts',
      description: 'Why EV is the most important concept in profitable sports betting.',
      readTime: '6 min read',
      category: 'Advanced',
      icon: <Brain className="w-5 h-5" />,
      featured: false
    },
    {
      slug: 'how-ai-helps-bettors',
      title: 'How AI Can Help Bettors',
      subtitle: 'BetChekr AI Explained',
      description: 'How AI makes complex betting math simple and accessible for beginners.',
      readTime: '7 min read',
      category: 'Advanced',
      icon: <Brain className="w-5 h-5" />,
      featured: false
    },
    {
      slug: 'how-to-use-ai-for-sports-betting',
      title: 'How to Use AI for Sports Betting',
      subtitle: 'Complete Step-by-Step Guide',
      description: 'Master the 8-step workflow: from odds conversion to CLV tracking. Includes AI prompts, formulas, and responsible betting practices.',
      readTime: '15 min read',
      category: 'Advanced',
      icon: <Brain className="w-5 h-5" />,
      featured: true
    },
    {
      slug: 'bankroll-management',
      title: 'Bankroll Management 101',
      subtitle: 'Protect Your Money',
      description: 'Professional strategies for managing your betting bankroll long-term.',
      readTime: '6 min read',
      category: 'Strategy',
      icon: <DollarSign className="w-5 h-5" />,
      comingSoon: true
    }
  ];

  const categories = [
    { name: 'Basics', count: 1, color: 'bg-blue-500' },
    { name: 'Strategy', count: 1, color: 'bg-green-500' },
    { name: 'Advanced', count: 3, color: 'bg-purple-500' },
    { name: 'League Guides', count: 4, color: 'bg-[#F4C430]' }
  ];

  const leagueGuides = [
    {
      slug: 'mlb-betting-guide',
      league: 'MLB',
      title: 'MLB Betting Lines Explained',
      subtitle: 'How to Read and Beat the Numbers',
      description: 'Master baseball betting with 162 games of opportunity. Learn moneylines, run lines, totals, and advanced strategies.',
      readTime: '12 min read',
      icon: '⚾',
      featured: true
    },
    {
      slug: 'nfl-betting-guide',
      league: 'NFL',
      title: 'NFL Betting Strategy Guide',
      subtitle: 'Point Spreads & Totals Mastery',
      description: 'Navigate point spreads, totals, and props in America\'s most bet sport.',
      readTime: '10 min read',
      icon: '🏈',
      comingSoon: true
    },
    {
      slug: 'nba-betting-guide',
      league: 'NBA',
      title: 'NBA Betting Fundamentals',
      subtitle: 'High-Scoring Opportunities',
      description: 'Fast-paced action means more betting markets and live betting opportunities.',
      readTime: '9 min read',
      icon: '🏀',
      comingSoon: true
    },
    {
      slug: 'nhl-betting-guide',
      league: 'NHL',
      title: 'NHL Betting Insights',
      subtitle: 'Puck Lines & Goal Totals',
      description: 'Low-scoring games create unique betting opportunities and strategies.',
      readTime: '8 min read',
      icon: '🏒',
      comingSoon: true
    }
  ];

  return (
    <div className="betchekr-premium">
      <Head>
        <title>Learn Sports Betting - Educational Resources | BetChekr</title>
        <meta name="description" content="Free educational resources to help you understand sports betting odds, strategies, and make smarter betting decisions." />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4C430]/10 rounded-full text-[#F4C430] text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Learn Center</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#E5E7EB] mb-4">
              Master Sports Betting
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-3xl mx-auto">
              Educational guides to help you understand odds, calculate probabilities, and make smarter betting decisions. 
              No fluff, just practical knowledge.
            </p>
          </motion.div>

          {/* Why BetChekr Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-[#F4C430]/10 to-[#F4C430]/5 rounded-lg p-6 border border-[#F4C430]/20 mb-12"
          >
            <div className="flex items-start gap-4">
              <Target className="w-8 h-8 text-[#F4C430] mt-1" />
              <div>
                <h2 className="text-[#E5E7EB] font-semibold text-xl mb-2">
                  Why We Built This Learn Section
                </h2>
                <p className="text-[#9CA3AF] mb-3">
                  BetChekr is a tool that analyzes your bet slips and tells you if they're Trash or Cash. 
                  But to use any tool effectively, you need to understand the fundamentals.
                </p>
                <p className="text-[#9CA3AF]">
                  These guides explain betting concepts in plain English — so you can make informed decisions 
                  before and after using our analysis tools.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <div className="flex gap-4 mb-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#141C28] rounded-lg px-4 py-3 border border-[#1F2937]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${category.color}`} />
                  <span className="text-[#E5E7EB] font-medium">{category.name}</span>
                  <span className="text-[#6B7280] text-sm">({category.count})</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((article, index) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {article.comingSoon ? (
                  <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6 opacity-60">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0F172A] rounded-lg text-[#6B7280]">
                          {article.icon}
                        </div>
                        <div>
                          <span className="text-[#6B7280] text-xs font-medium">
                            {article.category}
                          </span>
                          <div className="text-[#6B7280] text-xs mt-1">
                            Coming Soon
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-[#9CA3AF] font-semibold text-lg mb-1">
                      {article.title}
                    </h3>
                    <p className="text-[#6B7280] text-sm mb-3">
                      {article.subtitle}
                    </p>
                    <p className="text-[#6B7280] text-sm">
                      {article.description}
                    </p>
                  </div>
                ) : (
                  <Link href={`/learn/${article.slug}`}>
                    <div className={`bg-[#141C28] rounded-lg border border-[#1F2937] p-6 hover:border-[#F4C430]/50 transition-all cursor-pointer ${
                      article.featured ? 'ring-2 ring-[#F4C430]/20' : ''
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#F4C430]/10 rounded-lg text-[#F4C430]">
                            {article.icon}
                          </div>
                          <div>
                            <span className="text-[#F4C430] text-xs font-medium">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-2 text-[#6B7280] text-xs mt-1">
                              <Clock className="w-3 h-3" />
                              {article.readTime}
                            </div>
                          </div>
                        </div>
                        {article.featured && (
                          <span className="px-2 py-1 bg-[#F4C430]/20 text-[#F4C430] text-xs rounded font-medium">
                            NEW
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-[#E5E7EB] font-semibold text-lg mb-1">
                        {article.title}
                      </h3>
                      <p className="text-[#9CA3AF] text-sm mb-3">
                        {article.subtitle}
                      </p>
                      <p className="text-[#6B7280] text-sm mb-4">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center text-[#F4C430] text-sm font-medium">
                        Read Article
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* League Guides Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4C430]/10 rounded-full text-[#F4C430] text-sm mb-4">
                <Target className="w-4 h-4" />
                <span>League-Specific Guides</span>
              </div>
              <h2 className="text-3xl font-bold text-[#E5E7EB] mb-3">
                Master Every Major League
              </h2>
              <p className="text-[#9CA3AF] max-w-2xl mx-auto">
                Each sport has unique betting markets, strategies, and opportunities. 
                Learn the nuances that separate profitable bettors from the crowd.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {leagueGuides.map((guide, index) => (
                <motion.div
                  key={guide.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {guide.comingSoon ? (
                    <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-4 sm:p-6 opacity-60">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <span className="text-[#F4C430] text-sm font-bold">
                              {guide.league}
                            </span>
                            <span className="text-[#6B7280] text-xs">
                              Coming Soon
                            </span>
                          </div>
                          <h3 className="text-[#9CA3AF] font-semibold text-lg mb-2">
                            {guide.title}
                          </h3>
                          <p className="text-[#6B7280] text-sm mb-2">
                            {guide.subtitle}
                          </p>
                          <p className="text-[#6B7280] text-sm">
                            {guide.description}
                          </p>
                        </div>
                        <div className="text-[#6B7280] text-xs ml-4">
                          {guide.readTime}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link href={`/learn/${guide.slug}`}>
                      <div className={`bg-[#141C28] rounded-lg border border-[#1F2937] p-4 sm:p-6 hover:border-[#F4C430]/50 transition-all cursor-pointer group ${
                        guide.featured ? 'ring-2 ring-[#F4C430]/20' : ''
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <span className="text-[#F4C430] text-sm font-bold">
                                {guide.league}
                              </span>
                              {guide.featured && (
                                <span className="px-2 py-0.5 bg-[#F4C430] text-[#0B0F14] text-xs font-medium rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <h3 className="text-[#E5E7EB] font-semibold text-lg group-hover:text-[#F4C430] transition-colors mb-2">
                              {guide.title}
                            </h3>
                            <p className="text-[#F4C430] text-sm mb-2 font-medium">
                              {guide.subtitle}
                            </p>
                            <p className="text-[#9CA3AF] text-sm mb-4">
                              {guide.description}
                            </p>
                            <div className="flex items-center text-[#F4C430] text-sm font-medium">
                              Read Guide
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                          <div className="text-[#6B7280] text-xs ml-4">
                            {guide.readTime}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-3">
              Ready to Analyze Your Bets?
            </h2>
            <p className="text-[#9CA3AF] mb-6 max-w-2xl mx-auto">
              Now that you understand the basics, use BetChekr to instantly analyze your bet slips 
              and see if they're Trash or Cash.
            </p>
            <Link href="/">
              <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors">
                Try BetChekr Free
              </button>
            </Link>
          </motion.div>
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}