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
      slug: 'expected-value-explained',
      title: 'Expected Value (EV) Explained',
      subtitle: 'Advanced Concepts',
      description: 'Why EV is the most important concept in profitable sports betting.',
      readTime: '8 min read',
      category: 'Advanced',
      icon: <Brain className="w-5 h-5" />,
      comingSoon: true
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
    { name: 'Strategy', count: 0, color: 'bg-green-500' },
    { name: 'Advanced', count: 0, color: 'bg-purple-500' }
  ];

  return (
    <>
      <Head>
        <title>Learn Sports Betting - Educational Resources | BetChekr</title>
        <meta name="description" content="Free educational resources to help you understand sports betting odds, strategies, and make smarter betting decisions." />
      </Head>

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        
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
      </div>
    </>
  );
}