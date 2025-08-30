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
  Activity,
  ChevronRight,
  DollarSign,
  Trophy,
  Info
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
  const [middleUsesLeft, setMiddleUsesLeft] = useState(1);
  const [allowAnonymous, setAllowAnonymous] = useState(true);

  // Filter states
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [filteredMiddleData, setFilteredMiddleData] = useState([]);

  // League options
  const leagueOptions = [
    { key: 'all', label: 'All Leagues' },
    { key: 'NFL', label: 'NFL' },
    { key: 'NBA', label: 'NBA' },
    { key: 'NHL', label: 'NHL' },
    { key: 'MLB', label: 'MLB' },
    { key: 'UFC', label: 'UFC/MMA' },
    { key: 'NCAAF', label: 'College Football' },
    { key: 'NCAAB', label: 'College Basketball' },
    { key: 'soccer', label: 'Soccer' },
    { key: 'tennis', label: 'Tennis' }
  ];

  // Filter function
  const filterMiddleData = (league) => {
    if (league === 'all') {
      setFilteredMiddleData(middleData);
    } else {
      const filtered = middleData.filter(middle => {
        // Extract sport/league from matchup or other fields
        const matchupLower = middle.matchup?.toLowerCase() || '';
        const sportLower = middle.sport?.toLowerCase() || '';
        const leagueLower = league.toLowerCase();
        
        // Check if the matchup or sport contains the selected league
        return matchupLower.includes(leagueLower) || 
               sportLower.includes(leagueLower) ||
               (league === 'UFC' && (matchupLower.includes('ufc') || matchupLower.includes('mma'))) ||
               (league === 'NCAAF' && (matchupLower.includes('college') && matchupLower.includes('football'))) ||
               (league === 'NCAAB' && (matchupLower.includes('college') && matchupLower.includes('basketball')));
      });
      setFilteredMiddleData(filtered);
    }
  };

  // Check middle bet usage on component mount
  useEffect(() => {
    console.log('Middle Bets Auth State:', { user, isPremium, middleUsesLeft });
    
    // Allow anonymous usage with limited tries
    if (!user && !isPremium) {
      const anonymousUsage = localStorage.getItem('anonymous_middle_usage');
      const usageData = anonymousUsage ? JSON.parse(anonymousUsage) : { count: 0, lastReset: new Date().toDateString() };
      
      // Reset daily
      const today = new Date().toDateString();
      if (usageData.lastReset !== today) {
        usageData.count = 0;
        usageData.lastReset = today;
        localStorage.setItem('anonymous_middle_usage', JSON.stringify(usageData));
      }
      
      setMiddleUsesLeft(Math.max(0, 2 - usageData.count)); // Allow 2 free tries
    } else if (user && !isPremium) {
      checkMiddleUsage();
    } else if (isPremium) {
      setMiddleUsesLeft('unlimited');
    }
  }, [user, isPremium]);

  const checkMiddleUsage = () => {
    try {
      const usageKey = user ? `middle_usage_${user.id}` : 'anonymous_middle_usage';
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      // Reset daily if it's a new day
      const today = new Date().toDateString();
      if (usageData.lastReset !== today) {
        usageData.count = 0;
        usageData.lastReset = today;
        localStorage.setItem(usageKey, JSON.stringify(usageData));
      }
      
      const maxUses = user ? 3 : 2; // Logged in users get 3, anonymous get 2
      const remaining = Math.max(0, maxUses - usageData.count);
      setMiddleUsesLeft(remaining);
    } catch (error) {
      console.error('Error checking middle usage:', error);
      setMiddleUsesLeft(1);
    }
  };

  const incrementMiddleUsage = () => {
    try {
      const usageKey = user ? `middle_usage_${user.id}` : 'anonymous_middle_usage';
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      usageData.count += 1;
      localStorage.setItem(usageKey, JSON.stringify(usageData));
      
      const maxUses = user ? 3 : 2;
      const remaining = Math.max(0, maxUses - usageData.count);
      setMiddleUsesLeft(remaining);
    } catch (error) {
      console.error('Error incrementing middle usage:', error);
    }
  };

  const findMiddleBets = async (includeAllSports = true) => {
    // Allow anonymous users with tries left
    if (!user && !allowAnonymous) {
      router.push('/auth/signin?redirect=/middle-bets');
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
      setFilteredMiddleData(data.opportunities || []);

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
      className="bg-[#0B0F12] border border-white/8 rounded-2xl p-6 hover:border-[#FACC15]/20 transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(11,15,18,0.95) 0%, rgba(11,15,18,0.98) 100%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#E6EDF3] mb-2">{middle.matchup}</h3>
          <div className="flex items-center gap-3">
            <span className="text-[#0EE6B7] text-sm font-medium capitalize">{middle.market_type}</span>
            <span className="text-2xl">{middle.ev_classification}</span>
          </div>
        </div>
        <div className="flex flex-row md:flex-col gap-4 md:gap-2 md:text-right">
          <div>
            <p className="text-[#0EE6B7] font-bold text-xl">{middle.hit_probability}</p>
            <p className="text-[#92A2AD] text-sm">Hit Rate</p>
          </div>
          <div>
            <p className="text-[#FACC15] font-bold text-xl">+{(middle.expected_value * 100).toFixed(1)}%</p>
            <p className="text-[#92A2AD] text-sm">Expected Value</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {middle.legs.map((leg, legIndex) => (
          <div key={legIndex} className="bg-black/40 rounded-xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#FACC15] font-medium text-sm">{leg.sportsbook}</span>
              <span className="text-[#E6EDF3] font-bold text-lg">{leg.odds > 0 ? '+' : ''}{leg.odds}</span>
            </div>
            <p className="text-[#E6EDF3] font-semibold mb-1">{leg.selection}</p>
            <p className="text-[#92A2AD] text-xs">Decimal: {leg.decimal_odds}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[#0EE6B7]/10 to-[#FACC15]/10 rounded-xl p-4 border border-[#0EE6B7]/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[#0EE6B7] text-xs font-medium mb-1">Middle Window</p>
            <p className="text-[#E6EDF3] font-bold text-sm">{middle.middle_range}</p>
          </div>
          <div>
            <p className="text-[#FACC15] text-xs font-medium mb-1">Gap Size</p>
            <p className="text-[#E6EDF3] font-bold text-sm">{middle.gap_size} pts</p>
          </div>
          <div>
            <p className="text-[#0EE6B7] text-xs font-medium mb-1">Hit Numbers</p>
            <p className="text-[#E6EDF3] font-bold text-sm">
              {middle.middle_window.slice(0, 3).join(', ')}{middle.middle_window.length > 3 ? '...' : ''}
            </p>
          </div>
          <div>
            <p className="text-[#92A2AD] text-xs font-medium mb-1">Game Time</p>
            <p className="text-[#E6EDF3] font-bold text-sm">
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
    <div className="min-h-screen bg-[#080B0C] text-[#E6EDF3] relative">
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top right, rgba(14, 230, 183, 0.08) 0%, transparent 50%),
            conic-gradient(from 230deg at 0% 100%, rgba(250, 204, 21, 0.04), transparent 50%),
            transparent
          `
        }}
      />
      
      <Header />
      
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FACC15]/10 rounded-full mb-6">
              <Zap className="w-4 h-4 text-[#FACC15]" />
              <span className="text-[#FACC15] text-sm font-semibold">Advanced Arbitrage Scanner</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#0EE6B7] to-[#FACC15] bg-clip-text text-transparent">
                Middle Bet Finder
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#92A2AD] max-w-3xl mx-auto mb-8">
              Discover guaranteed profit windows with our AI-powered middle bet scanner. 
              Find the best spreads and totals middles with key number coverage.
            </p>
            
            {/* Usage indicator */}
            <div className="inline-flex items-center gap-2 bg-[#0B0F12] border border-white/8 rounded-full px-6 py-3">
              {isPremium ? (
                <>
                  <Crown className="w-5 h-5 text-[#FACC15]" />
                  <span className="text-[#FACC15] font-semibold">Premium - Unlimited Searches</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 text-[#0EE6B7]" />
                  <span className="text-[#E6EDF3]">
                    {middleUsesLeft === 'unlimited' ? 'Unlimited searches' :
                     middleUsesLeft === null ? 'Loading...' : 
                     middleUsesLeft === 1 ? '1 search remaining today' : 
                     `${middleUsesLeft} searches remaining today`}
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <button
              onClick={() => findMiddleBets(true)}
              disabled={isLoading || (!isPremium && middleUsesLeft !== null && middleUsesLeft <= 0)}
              className={`
                inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg
                transition-all duration-300 transform hover:scale-105
                ${isLoading || (!isPremium && middleUsesLeft !== null && middleUsesLeft <= 0)
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-black hover:shadow-lg hover:shadow-[#FACC15]/30'
                }
              `}
              style={{
                boxShadow: isLoading || (!isPremium && middleUsesLeft !== null && middleUsesLeft <= 0) 
                  ? 'none' 
                  : '0 8px 24px rgba(250,204,21,0.25)'
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Finding Middle Bets...</span>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5" />
                  <span>Find Middle Opportunities</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>

          {/* Filter Section */}
          {middleData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8 bg-[#0B0F12] border border-white/8 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-[#FACC15]" />
                <h3 className="text-lg font-semibold text-[#E6EDF3]">Filter by League</h3>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={selectedLeague}
                  onChange={(e) => {
                    setSelectedLeague(e.target.value);
                    filterMiddleData(e.target.value);
                  }}
                  className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-[#E6EDF3] focus:border-[#0EE6B7] focus:outline-none transition-colors"
                >
                  {leagueOptions.map(option => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
                <div className="text-sm text-[#92A2AD] flex items-center gap-2">
                  <span>Showing:</span>
                  <span className="text-[#0EE6B7] font-semibold">
                    {filteredMiddleData.length} of {middleData.length} opportunities
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center justify-between border ${
              notification.type === 'success' 
                ? 'bg-[#0EE6B7]/10 border-[#0EE6B7]/30 text-[#0EE6B7]' 
                : notification.type === 'error' 
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[#FACC15]/10 border-[#FACC15]/30 text-[#FACC15]'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <Check className="w-5 h-5" /> :
               notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Info className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={closeNotification}
              className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Results Section */}
        {filteredMiddleData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#E6EDF3] flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#FACC15]" />
                {selectedLeague !== 'all' ? `${selectedLeague} - ` : ''}Found {filteredMiddleData.length} Opportunities
              </h2>
              <div className="text-sm text-[#92A2AD]">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="grid gap-6">
              {filteredMiddleData.map((middle, index) => renderMiddleOpportunity(middle, index))}
            </div>
          </motion.div>
        )}

        {/* Educational Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 bg-[#0B0F12] border border-white/8 rounded-2xl p-8"
          style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}
        >
          <h3 className="text-2xl font-bold text-[#E6EDF3] mb-6 flex items-center gap-2">
            <Info className="w-6 h-6 text-[#FACC15]" />
            How Middle Bets Work
          </h3>
          <div className="grid md:grid-cols-2 gap-8 text-[#92A2AD]">
            <div>
              <h4 className="text-lg font-semibold text-[#E6EDF3] mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0EE6B7]" />
                What Are Middle Bets?
              </h4>
              <p className="mb-4 leading-relaxed">
                Middle bets occur when you find different spreads or totals on the same game across different sportsbooks, 
                creating a "window" where both bets can win if the final result lands in the middle.
              </p>
              <h4 className="text-lg font-semibold text-[#E6EDF3] mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#0EE6B7]" />
                Key Numbers
              </h4>
              <p className="leading-relaxed">
                Our algorithm prioritizes middle opportunities that include key numbers like 3, 7, 10, and 14 for NFL, 
                which have higher hit probabilities based on historical data.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#E6EDF3] mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FACC15]" />
                Profit Calculation
              </h4>
              <p className="mb-4 leading-relaxed">
                We calculate expected value based on historical hit probabilities for each middle window. 
                Only opportunities with positive EV and realistic profit potential are shown.
              </p>
              <h4 className="text-lg font-semibold text-[#E6EDF3] mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FACC15]" />
                Quality Filters
              </h4>
              <p className="leading-relaxed">
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