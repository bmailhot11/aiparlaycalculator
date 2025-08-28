import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GradientBG from '../../components/theme/GradientBG';

export default function NFLBettingGuide() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="betchekr-premium">
      <Head>
        <title>NFL Betting Guide - Point Spreads & Totals Strategy | BetChekr</title>
        <meta name="description" content="Master NFL betting with our comprehensive guide. Learn point spreads, totals, player props, and advanced football betting strategies." />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        <div className="container mx-auto px-6 py-20">
          {/* Back to Learning */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href="/learn" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
              <span>←</span> Back to Learning Hub
            </Link>
          </motion.div>

          {/* Hero Section */}
          <motion.div {...fadeIn} className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
              <span className="text-4xl">🏈</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              NFL Betting Lines Explained
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Master NFL betting with comprehensive insights into point spreads, totals, moneylines, and advanced strategies
            </p>
          </motion.div>

          {/* Coming Soon Section */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚀</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Coming Soon</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                We're crafting a comprehensive NFL betting guide that will cover everything from basic concepts to advanced strategies. 
                This guide will include point spread analysis, over/under betting, prop bets, and much more.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-2">Point Spreads</h3>
                  <p className="text-gray-400 text-sm">Understanding how NFL spreads work and finding value</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-2">Player Props</h3>
                  <p className="text-gray-400 text-sm">Diving deep into NFL player prop betting strategies</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-2">Live Betting</h3>
                  <p className="text-gray-400 text-sm">In-game betting tactics for NFL games</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Explore Other Leagues */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-8">Explore Other League Guides</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link href="/learn/mlb-betting-guide" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
                <div className="text-3xl mb-3">⚾</div>
                <h4 className="text-white font-semibold mb-2">MLB Betting</h4>
                <p className="text-gray-400 text-sm">Complete guide available now</p>
              </Link>
              <Link href="/learn/nba-betting-guide" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
                <div className="text-3xl mb-3">🏀</div>
                <h4 className="text-white font-semibold mb-2">NBA Betting</h4>
                <p className="text-gray-400 text-sm">Coming soon</p>
              </Link>
              <Link href="/learn/nhl-betting-guide" className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
                <div className="text-3xl mb-3">🏒</div>
                <h4 className="text-white font-semibold mb-2">NHL Betting</h4>
                <p className="text-gray-400 text-sm">Coming soon</p>
              </Link>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </GradientBG>
    </div>
  );
}