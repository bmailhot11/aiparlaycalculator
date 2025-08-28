// Premium Daily Picks Feed Page

import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown,
  TrendingUp,
  Clock,
  Target,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Trophy,
  Zap,
  BarChart3,
  Percent
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import GradientBG from '../../components/theme/GradientBG';
import { PremiumContext } from '../_app';

export default function PremiumTodayPage() {
  const { isPremium } = useContext(PremiumContext);
  const [dailyPicks, setDailyPicks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!isPremium) {
      setLoading(false);
      return;
    }
    
    fetchDailyPicks();
    
    // Set up countdown timer
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isPremium]);

  const fetchDailyPicks = async () => {
    try {
      const response = await fetch('/api/daily-picks/today', {
        headers: {
          'x-user-id': 'premium-user' // In real app, get from auth context
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDailyPicks(data);
      } else {
        setError(data.message || 'Failed to load picks');
      }
    } catch (err) {
      setError('Network error loading picks');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!dailyPicks?.metadata?.earliest_game_time) return;
    
    const now = new Date().getTime();
    const gameTime = new Date(dailyPicks.metadata.earliest_game_time).getTime();
    const distance = gameTime - now;
    
    if (distance > 0) {
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setCountdown('Games Started');
    }
  };

  if (!isPremium) {
    return (
      <div className="betchekr-premium">
        <GradientBG>
          <div className="premium-header sticky top-0 z-50">
            <Header />
          </div>
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card max-w-2xl mx-auto"
            >
              <Crown className="w-16 h-16 mx-auto mb-6 text-[#F4C430]" />
              <h1 className="text-3xl font-bold text-[#E5E7EB] mb-4">Premium Required</h1>
              <p className="text-[#9CA3AF] mb-8">
                Access to daily picks requires a Premium subscription. Get the best single bets and parlays 
                with full transparency on odds, edge percentages, and expected returns.
              </p>
              <button className="btn btn-primary">
                Upgrade to Premium
              </button>
            </motion.div>
          </div>
        </div>
          <Footer />
        </GradientBG>
      </div>
    );
  }

  return (
    <div className="betchekr-premium">
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
      
      {/* Hero Section */}
      <section className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-10 h-10 text-[#F4C430]" />
              <h1 className="text-4xl font-bold text-[#E5E7EB]">Today's Best Picks</h1>
              <Crown className="w-8 h-8 text-[#F4C430]" />
            </div>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
              Curated daily recommendations across all sports with transparent edge calculations
            </p>
          </motion.div>

          {/* Countdown Timer */}
          {countdown && dailyPicks && !dailyPicks.no_bet_reason && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-md mx-auto mb-8 text-center"
            >
              <Clock className="w-8 h-8 mx-auto mb-3 text-[#F4C430]" />
              <h3 className="text-[#E5E7EB] font-semibold mb-1">First Game Starts In</h3>
              <div className="text-2xl font-bold text-[#F4C430] font-mono">
                {countdown}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#9CA3AF]">Loading today's picks...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card max-w-2xl mx-auto text-center"
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">Error Loading Picks</h3>
              <p className="text-[#9CA3AF] mb-6">{error}</p>
              <button 
                onClick={fetchDailyPicks}
                className="btn btn-outline"
              >
                Try Again
              </button>
            </motion.div>
          ) : dailyPicks?.no_bet_reason ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card max-w-3xl mx-auto text-center"
            >
              <Target className="w-16 h-16 mx-auto mb-6 text-[#6B7280]" />
              <h3 className="text-2xl font-semibold text-[#E5E7EB] mb-4">No Bets Today</h3>
              <p className="text-[#9CA3AF] text-lg mb-6">
                {dailyPicks.no_bet_reason}
              </p>
              <div className="bg-[#1F2937] rounded-lg p-4 border border-[#374151]">
                <p className="text-[#9CA3AF] text-sm">
                  We only recommend bets when we find genuine edges. Quality over quantity keeps the long-term ROI positive.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Single Bet */}
              {dailyPicks?.bets?.single && (
                <BetCard 
                  title="Best Single Bet" 
                  bet={dailyPicks.bets.single}
                  icon={Target}
                  color="blue"
                />
              )}

              {/* 2-Leg Parlay */}
              {dailyPicks?.bets?.parlay2 && (
                <BetCard 
                  title="Best 2-Leg Parlay" 
                  bet={dailyPicks.bets.parlay2}
                  icon={TrendingUp}
                  color="green"
                />
              )}

              {/* 4-Leg Parlay */}
              {dailyPicks?.bets?.parlay4 && (
                <BetCard 
                  title="Best 4-Leg Parlay" 
                  bet={dailyPicks.bets.parlay4}
                  icon={Zap}
                  color="purple"
                />
              )}
            </div>
          )}

          {/* Publication Info */}
          {dailyPicks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center gap-2 text-[#6B7280] text-sm">
                <Calendar className="w-4 h-4" />
                <span>Published {formatPublishTime(dailyPicks.published_at)}</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

        <Footer />
      </GradientBG>
    </div>
  );
}

/**
 * Individual Bet Card Component
 */
function BetCard({ title, bet, icon: Icon, color }) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-500/10',
    green: 'border-green-500 bg-green-500/10', 
    purple: 'border-purple-500 bg-purple-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-[#F4C430]" />
          <h2 className="text-xl font-bold text-[#E5E7EB]">{title}</h2>
        </div>
        <div className={`px-3 py-1 rounded-full ${colorClasses[color]} border`}>
          <span className="text-sm font-semibold text-white">
            {bet.edge_percentage?.toFixed(1)}% Edge
          </span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#F4C430]">
            {bet.formatted_combined_odds}
          </div>
          <div className="text-sm text-[#6B7280]">Combined Odds</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            +${bet.estimated_payout?.toFixed(0)}
          </div>
          <div className="text-sm text-[#6B7280]">Payout ($100)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {bet.payout_multiple?.toFixed(2)}x
          </div>
          <div className="text-sm text-[#6B7280]">Multiplier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {bet.legs_count}
          </div>
          <div className="text-sm text-[#6B7280]">Legs</div>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-4">
        {bet.legs.map((leg, index) => (
          <div key={index} className="bg-[#1F2937] rounded-lg p-4 border border-[#374151]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-[#E5E7EB] mb-1">
                  {leg.game_display}
                </div>
                <div className="text-[#9CA3AF] text-sm">
                  {leg.sport} • {formatGameTime(leg.commence_time)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#F4C430]">
                  {leg.formatted_odds}
                </div>
                <div className="text-[#6B7280] text-sm">
                  {leg.best_sportsbook}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#E5E7EB] mb-1">
                  {leg.selection}
                </div>
                <div className="text-[#9CA3AF] text-sm capitalize">
                  {leg.market_type.replace('_', ' ')} Market
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">
                    {leg.edge_percentage?.toFixed(1)}% Edge
                  </span>
                </div>
                <div className="text-[#6B7280] text-sm">
                  Starts in {leg.time_until_start}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button className="btn btn-primary flex-1">
          <BarChart3 className="w-4 h-4 mr-2" />
          Track This Bet
        </button>
        <button className="btn btn-outline flex-1">
          <DollarSign className="w-4 h-4 mr-2" />
          Calculate Stakes  
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Format publish time for display
 */
function formatPublishTime(publishTime) {
  const date = new Date(publishTime);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Format game time for display
 */
function formatGameTime(commenceTime) {
  const date = new Date(commenceTime);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}