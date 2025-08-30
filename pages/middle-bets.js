import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Target,
  TrendingUp,
  AlertCircle,
  Check,
  RefreshCw,
  Filter,
  Crown,
  Zap,
  Activity
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import { apiFetch } from '../utils/api';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { useAuth } from '../contexts/AuthContext';

export default function MiddleBetsPage() {
  const { isPremium } = useContext(PremiumContext);
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [middleData, setMiddleData] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [notification, setNotification] = useState(null);
  const [middleUsesLeft, setMiddleUsesLeft] = useState(null);

  // Filter states
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);

  // Sport options
  const sportsOptions = [
    { key: 'NFL', label: 'NFL' },
    { key: 'NBA', label: 'NBA' },
    { key: 'NHL', label: 'NHL' },
    { key: 'MLB', label: 'MLB' },
    { key: 'NCAAF', label: 'College Football' },
    { key: 'NCAAB', label: 'College Basketball' }
  ];

  // Time filters
  const timeFilters = [
    { value: '1d', label: 'Next 24 Hours' },
    { value: '3d', label: 'Next 3 Days' },
    { value: '7d', label: 'Next Week' },
    { value: 'all', label: 'All Games' }
  ];

  // Check middle bet usage on component mount
  useEffect(() => {
    if (user && !isPremium) {
      checkMiddleUsage();
    } else if (isPremium) {
      setMiddleUsesLeft('unlimited');
    }
  }, [user, isPremium]);

  const checkMiddleUsage = () => {
    try {
      const usageKey = `middle_usage_${user.id}`;
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      // Reset daily if it's a new day
      const today = new Date().toDateString();
      if (usageData.lastReset !== today) {
        usageData.count = 0;
        usageData.lastReset = today;
        localStorage.setItem(usageKey, JSON.stringify(usageData));
      }
      
      const remaining = Math.max(0, 1 - usageData.count);
      setMiddleUsesLeft(remaining);
    } catch (error) {
      console.error('Error checking middle usage:', error);
      setMiddleUsesLeft(0);
    }
  };

  const incrementMiddleUsage = () => {
    try {
      const usageKey = `middle_usage_${user.id}`;
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      usageData.count += 1;
      localStorage.setItem(usageKey, JSON.stringify(usageData));
      
      const remaining = Math.max(0, 1 - usageData.count);
      setMiddleUsesLeft(remaining);
    } catch (error) {
      console.error('Error incrementing middle usage:', error);
    }
  };

  // Hero background images (sports-related)
  const backgroundImages = [
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150',
    '/api/placeholder/200/150'
  ];

  const findMiddleBets = async (includeAllSports = true) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!isPremium && middleUsesLeft <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/middle-bets/find-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          includeAllSports: includeAllSports 
        }),
      });

      const data = await response.json();
      setMiddleData(data.opportunities || []);

      if (data.opportunities?.length > 0) {
        setNotification({
          type: 'success',
          message: `🔥 Found ${data.opportunities.length} high-quality middle bet opportunities!`
        });
      } else {
        setNotification({
          type: 'info', 
          message: '🔍 No middle bet opportunities found at the moment. Try again later!'
        });
      }

      // Increment usage for non-premium users
      if (!isPremium) {
        incrementMiddleUsage();
      }
    } catch (error) {
      console.error('Error finding middle bets:', error);
      setNotification({
        type: 'error',
        message: 'Failed to find middle bets. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const renderMiddleOpportunity = (middle, index) => (
    <motion.div
      key={middle.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all duration-300 shadow-lg"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{middle.matchup}</h3>
          <div className="flex items-center gap-2">
            <span className="text-blue-300 text-sm capitalize">{middle.market_type}</span>
            <span className="text-2xl">{middle.ev_classification}</span>
          </div>
        </div>
        <div className="flex sm:flex-col gap-4 sm:gap-1 sm:text-right">
          <div className="flex-1 sm:flex-none">
            <p className="text-green-400 font-bold text-lg sm:text-xl">{middle.hit_probability}</p>
            <p className="text-green-300 text-xs sm:text-sm">Hit Rate</p>
          </div>
          <div className="flex-1 sm:flex-none">
            <p className="text-yellow-400 font-bold text-lg sm:text-xl">+{(middle.expected_value * 100).toFixed(1)}%</p>
            <p className="text-yellow-300 text-xs sm:text-sm">Expected Value</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        {middle.legs.map((leg, legIndex) => (
          <div key={legIndex} className="bg-white/8 rounded-xl p-3 sm:p-4 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-purple-300 font-medium text-sm">{leg.sportsbook}</span>
              <span className="text-white font-bold text-lg">{leg.odds > 0 ? '+' : ''}{leg.odds}</span>
            </div>
            <p className="text-white font-semibold mb-1">{leg.selection}</p>
            <p className="text-blue-200 text-xs">Decimal: {leg.decimal_odds}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-3 sm:p-4 border border-green-400/20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-green-300 text-xs font-medium mb-1">Middle Window</p>
            <p className="text-white font-bold text-sm">{middle.middle_range}</p>
          </div>
          <div>
            <p className="text-blue-300 text-xs font-medium mb-1">Gap Size</p>
            <p className="text-white font-bold text-sm">{middle.gap_size} pts</p>
          </div>
          <div>
            <p className="text-yellow-300 text-xs font-medium mb-1">Hit Numbers</p>
            <p className="text-white font-bold text-sm">
              {middle.middle_window.slice(0, window.innerWidth < 640 ? 2 : 3).join(', ')}{middle.middle_window.length > 2 ? '...' : ''}
            </p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-purple-300 text-xs font-medium mb-1">Game Time</p>
            <p className="text-white font-bold text-sm">
              {new Date(middle.commence_time).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (showPaywall) {
    return <Paywall onClose={() => setShowPaywall(false)} />;
  }

  return (
    <div className="min-h-screen text-white relative">
      <GradientBG />
      
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {backgroundImages.map((src, index) => (
          <motion.img
            key={index}
            src={src}
            alt=""
            className="absolute w-24 h-24 opacity-5 rounded-lg"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <Header />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Middle Bets Finder
              </h1>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
            <p className="text-base sm:text-xl text-blue-200 mb-6 max-w-3xl mx-auto px-4">
              Discover high-probability middle bet opportunities with guaranteed profit windows. 
              Our advanced algorithm finds the best spreads and totals middles with key number coverage.
            </p>
            
            {/* Usage indicator */}
            {user && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-6">
                {isPremium ? (
                  <>
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Premium - Unlimited Searches</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-white">
                      {middleUsesLeft === null ? 'Loading...' : `${middleUsesLeft} search${middleUsesLeft !== 1 ? 'es' : ''} remaining today`}
                    </span>
                  </>
                )}
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => findMiddleBets(true)}
              disabled={isLoading || (!isPremium && middleUsesLeft <= 0)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Target className="w-5 h-5" />
              )}
              {isLoading ? 'Finding Middle Bets...' : 'Find Middle Opportunities'}
            </motion.button>
          </motion.div>
        </div>

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success' ? 'bg-green-500/20 border-green-400 text-green-200' :
              notification.type === 'error' ? 'bg-red-500/20 border-red-400 text-red-200' :
              'bg-blue-500/20 border-blue-400 text-blue-200'
            } border`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <Check className="w-5 h-5" /> :
               notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <AlertCircle className="w-5 h-5" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={closeNotification}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Results Section */}
        {middleData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Middle Bet Opportunities ({middleData.length})
              </h2>
              <div className="text-sm text-blue-200">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="grid gap-6">
              {middleData.map((middle, index) => renderMiddleOpportunity(middle, index))}
            </div>
          </motion.div>
        )}

        {/* Educational Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            How Middle Bets Work
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-blue-200">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">📊 What Are Middle Bets?</h4>
              <p className="mb-4">
                Middle bets occur when you find different spreads or totals on the same game across different sportsbooks, 
                creating a "window" where both bets can win if the final result lands in the middle.
              </p>
              <h4 className="text-lg font-semibold text-white mb-2">🎯 Key Numbers</h4>
              <p>
                Our algorithm prioritizes middle opportunities that include key numbers like 3, 7, 10, and 14 for NFL, 
                which have higher hit probabilities based on historical data.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">💰 Profit Calculation</h4>
              <p className="mb-4">
                We calculate expected value based on historical hit probabilities for each middle window. 
                Only opportunities with positive EV and realistic profit potential are shown.
              </p>
              <h4 className="text-lg font-semibold text-white mb-2">⚡ Quality Filters</h4>
              <p>
                All opportunities require minimum 5% hit probability, odds better than -115, and at least 1-point gaps 
                to ensure only high-quality middle bets are displayed.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}