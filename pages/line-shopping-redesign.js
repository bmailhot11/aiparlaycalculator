import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { 
  Search,
  TrendingUp,
  Target,
  Crown,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Star,
  Flame,
  Gem,
  Bell,
  Bookmark,
  BarChart3,
  Info,
  Clock,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';

export default function LineShoppingRedesign() {
  const { isPremium } = useContext(PremiumContext);
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [viewMode, setViewMode] = useState('all'); // all, ev, arbitrage
  const [timeFilter, setTimeFilter] = useState('today');
  const [edgeFilter, setEdgeFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showPaywall, setShowPaywall] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [savedBets, setSavedBets] = useState(new Set());
  const [showTooltip, setShowTooltip] = useState(null);
  const refreshInterval = useRef(null);

  const sports = [
    { value: 'NFL', label: 'NFL', icon: '🏈' },
    { value: 'NBA', label: 'NBA', icon: '🏀' },
    { value: 'NHL', label: 'NHL', icon: '🏒' },
    { value: 'MLB', label: 'MLB', icon: '⚾' },
    { value: 'NCAAF', label: 'NCAAF', icon: '🏫' },
    { value: 'NCAAB', label: 'NCAAB', icon: '🎓' },
  ];

  const viewModes = [
    { value: 'all', label: 'All Lines', icon: Target },
    { value: 'ev', label: '+EV Only', icon: Star },
    { value: 'arbitrage', label: 'Arbitrage', icon: Zap },
    { value: 'edge5', label: '5%+ Edge', icon: Gem }
  ];

  const timeFilters = [
    { value: 'today', label: 'Today' },
    { value: '3days', label: 'Next 3 Days' },
    { value: 'week', label: 'This Week' },
    { value: 'all', label: 'All Games' }
  ];

  // Sample data for demonstration (replace with real API data)
  const sampleLines = [
    {
      id: 1,
      game: 'Lakers @ Warriors',
      gameTime: '4:30 PM PST',
      sport: 'NBA',
      markets: {
        moneyline: {
          selection: 'Lakers',
          bestOdds: '+125',
          bestBook: 'DraftKings',
          value: 3.2,
          isEV: true,
          allBooks: [
            { name: 'DraftKings', odds: '+125', value: 3.2 },
            { name: 'FanDuel', odds: '+120', value: 2.8 },
            { name: 'MGM', odds: '+115', value: 1.9 }
          ]
        },
        spread: {
          selection: 'Lakers +2.5',
          bestOdds: '-105',
          bestBook: 'FanDuel',
          value: 1.8,
          isEV: true,
          allBooks: [
            { name: 'FanDuel', odds: '-105', value: 1.8 },
            { name: 'DraftKings', odds: '-110', value: 0.9 },
            { name: 'MGM', odds: '-115', value: 0.2 }
          ]
        },
        total: {
          selection: 'Over 215.5',
          bestOdds: '+105',
          bestBook: 'MGM',
          value: 2.1,
          isEV: true,
          allBooks: [
            { name: 'MGM', odds: '+105', value: 2.1 },
            { name: 'DraftKings', odds: '+100', value: 1.5 },
            { name: 'FanDuel', odds: '-105', value: 0.8 }
          ]
        }
      },
      maxEV: 3.2,
      hasArbitrage: false,
      priority: 'high'
    },
    {
      id: 2,
      game: 'Chiefs @ Bills',
      gameTime: '8:15 PM EST',
      sport: 'NFL',
      markets: {
        moneyline: {
          selection: 'Chiefs',
          bestOdds: '+165',
          bestBook: 'MGM',
          value: 8.5,
          isEV: true,
          allBooks: [
            { name: 'MGM', odds: '+165', value: 8.5 },
            { name: 'DraftKings', odds: '+160', value: 7.8 },
            { name: 'FanDuel', odds: '+155', value: 6.9 }
          ]
        }
      },
      maxEV: 8.5,
      hasArbitrage: false,
      priority: 'high'
    },
    {
      id: 3,
      game: 'Celtics vs Heat',
      gameTime: '7:00 PM EST',
      sport: 'NBA',
      markets: {
        moneyline: {
          selection: 'Celtics',
          bestOdds: '-110',
          bestBook: 'DraftKings',
          value: 0.5,
          isEV: false,
          allBooks: [
            { name: 'DraftKings', odds: '-110', value: 0.5 },
            { name: 'FanDuel', odds: '-115', value: -0.2 },
            { name: 'MGM', odds: '-120', value: -0.8 }
          ]
        }
      },
      maxEV: 0.5,
      hasArbitrage: false,
      priority: 'low'
    }
  ];

  // Filter lines based on current settings
  const filteredLines = sampleLines.filter(line => {
    if (viewMode === 'ev' && line.maxEV <= 0) return false;
    if (viewMode === 'arbitrage' && !line.hasArbitrage) return false;
    if (viewMode === 'edge5' && line.maxEV < 5) return false;
    if (edgeFilter > 0 && line.maxEV < edgeFilter) return false;
    return true;
  });

  const fetchLines = async () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching lines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSport) {
      fetchLines();
    }
  }, [selectedSport, viewMode, timeFilter]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchLines, 30000); // 30 seconds
      return () => clearInterval(refreshInterval.current);
    }
  }, [autoRefresh]);

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSavedBet = (id) => {
    const newSaved = new Set(savedBets);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedBets(newSaved);
  };

  const formatOdds = (odds) => {
    if (typeof odds === 'string' && odds.includes('+')) return odds;
    return odds > 0 ? `+${odds}` : odds;
  };

  const getValueIcon = (value) => {
    if (value >= 8) return <Gem className="w-4 h-4 text-purple-400" />;
    if (value >= 5) return <Flame className="w-4 h-4 text-orange-400" />;
    if (value >= 2) return <Star className="w-4 h-4 text-yellow-400" />;
    return null;
  };

  const getValueColor = (value) => {
    if (value >= 5) return 'text-green-400';
    if (value >= 2) return 'text-yellow-400';
    if (value > 0) return 'text-blue-400';
    return 'text-gray-400';
  };

  const Tooltip = ({ content, children }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#141C28] to-[#0B0F14] text-white">
      <Head>
        <title>Line Shopping - Find Best Odds | BetChekr</title>
        <meta name="description" content="Compare betting odds across all sportsbooks instantly. Find +EV opportunities and arbitrage plays." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Line Shopping <Crown className="w-8 h-8 text-[#F4C430]" />
          </h1>
          <p className="text-gray-400 text-lg">
            Find the best odds, instantly.
          </p>
        </motion.div>

        {/* Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Sports & View Mode */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Sports */}
            <div className="flex flex-wrap gap-2">
              {sports.map(sport => (
                <button
                  key={sport.value}
                  onClick={() => setSelectedSport(sport.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedSport === sport.value
                      ? 'bg-[#F4C430] text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <span>{sport.icon}</span>
                  {sport.label}
                </button>
              ))}
            </div>

            {/* Time Filter & Auto-refresh */}
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#F4C430]/50"
              >
                {timeFilters.map(filter => (
                  <option key={filter.value} value={filter.value} className="bg-gray-800">
                    {filter.label}
                  </option>
                ))}
              </select>
              
              <Tooltip content="Auto-refresh every 30 seconds">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-all ${
                    autoRefresh 
                      ? 'bg-[#F4C430] text-black' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* View Modes */}
          <div className="flex flex-wrap gap-2">
            {viewModes.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === mode.value
                      ? 'bg-[#F4C430]/20 text-[#F4C430] border border-[#F4C430]'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-gray-500 text-sm mb-4">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Main Odds Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-sm font-medium text-gray-300">
            <div className="col-span-4">Event</div>
            <div className="col-span-2">Market</div>
            <div className="col-span-2">Best Odds</div>
            <div className="col-span-2">Book</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredLines.map((line, index) => {
                const primaryMarket = Object.values(line.markets)[0];
                const isExpanded = expandedRows.has(line.id);
                const isSaved = savedBets.has(line.id);
                
                return (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Main Row */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                      {/* Event */}
                      <div className="col-span-4 flex items-center gap-3">
                        <button
                          onClick={() => toggleRowExpansion(line.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            {getValueIcon(line.maxEV)}
                            <h3 className="font-semibold text-white">{line.game}</h3>
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {line.gameTime}
                          </div>
                        </div>
                      </div>

                      {/* Market */}
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="text-white font-medium">
                            {primaryMarket.selection.split(' ')[0]} {/* Show team/side */}
                          </div>
                          <div className="text-sm text-gray-400">
                            {primaryMarket.selection.includes('+') || primaryMarket.selection.includes('-') ? 'Spread' : 'Moneyline'}
                          </div>
                        </div>
                      </div>

                      {/* Best Odds */}
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="text-lg font-bold text-[#F4C430]">
                            {primaryMarket.bestOdds}
                          </div>
                          {primaryMarket.isEV && (
                            <div className={`text-sm flex items-center gap-1 ${getValueColor(primaryMarket.value)}`}>
                              <TrendingUp className="w-3 h-3" />
                              +{primaryMarket.value.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Book */}
                      <div className="col-span-2 flex items-center">
                        <div className="px-3 py-1 bg-[#F4C430]/20 text-[#F4C430] rounded-full text-sm font-medium">
                          {primaryMarket.bestBook}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center gap-2">
                        <Tooltip content="Save to watchlist">
                          <button
                            onClick={() => toggleSavedBet(line.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isSaved 
                                ? 'bg-[#F4C430] text-black' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Track in dashboard">
                          <button className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Expanded Row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 py-6 bg-white/5 border-t border-white/5">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              All Markets & Books
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {Object.entries(line.markets).map(([marketType, market]) => (
                                <div key={marketType} className="space-y-3">
                                  <h5 className="font-medium text-gray-300 uppercase text-sm">
                                    {marketType === 'moneyline' ? 'Moneyline' : marketType}
                                  </h5>
                                  <div className="space-y-2">
                                    {market.allBooks.map((book, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          {idx === 0 && <div className="w-2 h-2 bg-[#F4C430] rounded-full"></div>}
                                          <span className={idx === 0 ? 'text-[#F4C430] font-medium' : 'text-gray-300'}>
                                            {book.name}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <div className={`font-mono ${idx === 0 ? 'text-[#F4C430] font-bold' : 'text-white'}`}>
                                            {formatOdds(book.odds)}
                                          </div>
                                          {book.value > 0 && (
                                            <div className={`text-xs ${getValueColor(book.value)}`}>
                                              +{book.value.toFixed(1)}%
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredLines.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No lines found</h3>
            <p className="text-gray-500">
              {viewMode === 'ev' ? 'No +EV opportunities available right now.' :
               viewMode === 'arbitrage' ? 'No arbitrage opportunities found.' :
               'Try adjusting your filters.'}
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-[#F4C430] animate-spin" />
          </div>
        )}
      </main>

      <Footer />
      
      {/* Paywall Modal */}
      {showPaywall && (
        <Paywall 
          feature="Line Shopping"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}