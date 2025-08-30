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
  Zap,
  Settings,
  Smartphone,
  Monitor
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import MobileLineCard from '../components/LineShopping/MobileLineCard';
import ValueTooltip, { EducationalHints } from '../components/LineShopping/ValueTooltip';

export default function LineShoppingV2() {
  const { isPremium } = useContext(PremiumContext);
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [viewMode, setViewMode] = useState('all'); // all, ev, arbitrage, edge5
  const [marketFilter, setMarketFilter] = useState('all'); // all, game, player
  const [timeFilter, setTimeFilter] = useState('today');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showPaywall, setShowPaywall] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [savedBets, setSavedBets] = useState(new Set());
  const [showEducationalHints, setShowEducationalHints] = useState(true);
  const [viewLayout, setViewLayout] = useState('auto'); // auto, desktop, mobile
  const refreshInterval = useRef(null);

  const sports = [
    { value: 'NFL', label: 'NFL', icon: '🏈' },
    { value: 'NBA', label: 'NBA', icon: '🏀' },
    { value: 'NHL', label: 'NHL', icon: '🏒' },
    { value: 'MLB', label: 'MLB', icon: '⚾' },
    { value: 'NCAAF', label: 'NCAAF', icon: '🏫' },
    { value: 'NCAAB', label: 'NCAAB', icon: '🎓' },
  ];

  const marketTypes = [
    { value: 'all', label: 'All Markets', icon: Target },
    { value: 'game', label: 'Game Lines', icon: BarChart3, description: 'Moneyline, Spread, Totals' },
    { value: 'player', label: 'Player Props', icon: Star, description: 'Player performance bets' }
  ];

  const viewModes = [
    { value: 'all', label: 'All Lines', icon: Target, description: 'View all available betting lines' },
    { value: 'ev', label: '+EV Only', icon: Star, description: 'Show only profitable opportunities' },
    { value: 'arbitrage', label: 'Arbitrage', icon: Zap, description: 'Risk-free profit opportunities' },
    { value: 'edge5', label: '5%+ Edge', icon: Gem, description: 'High-value betting opportunities' }
  ];

  const timeFilters = [
    { value: 'today', label: 'Today' },
    { value: '3days', label: 'Next 3 Days' },
    { value: 'week', label: 'This Week' },
    { value: 'all', label: 'All Games' }
  ];

  // Enhanced sample data with more realistic betting scenarios
  const sampleLines = [
    {
      id: 1,
      game: 'Lakers @ Warriors',
      gameTime: '4:30 PM PST',
      sport: 'NBA',
      markets: {
        moneyline: {
          selection: 'Lakers ML',
          bestOdds: '+125',
          bestBook: 'DraftKings',
          value: 3.2,
          isEV: true,
          allBooks: [
            { name: 'DraftKings', odds: '+125', value: 3.2 },
            { name: 'FanDuel', odds: '+120', value: 2.8 },
            { name: 'MGM', odds: '+115', value: 1.9 },
            { name: 'Caesars', odds: '+110', value: 1.2 },
            { name: 'PointsBet', odds: '+105', value: 0.8 }
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
      priority: 'high',
      tags: ['popular', 'primetime']
    },
    {
      id: 2,
      game: 'Chiefs @ Bills',
      gameTime: '8:15 PM EST',
      sport: 'NFL',
      markets: {
        moneyline: {
          selection: 'Chiefs ML',
          bestOdds: '+165',
          bestBook: 'MGM',
          value: 8.5,
          isEV: true,
          allBooks: [
            { name: 'MGM', odds: '+165', value: 8.5 },
            { name: 'DraftKings', odds: '+160', value: 7.8 },
            { name: 'FanDuel', odds: '+155', value: 6.9 },
            { name: 'Caesars', odds: '+150', value: 5.8 }
          ]
        },
        spread: {
          selection: 'Chiefs +3.5',
          bestOdds: '-108',
          bestBook: 'DraftKings',
          value: 2.3,
          isEV: true,
          allBooks: [
            { name: 'DraftKings', odds: '-108', value: 2.3 },
            { name: 'FanDuel', odds: '-110', value: 1.8 },
            { name: 'MGM', odds: '-115', value: 0.9 }
          ]
        }
      },
      maxEV: 8.5,
      hasArbitrage: false,
      priority: 'high',
      tags: ['playoff', 'primetime']
    },
    {
      id: 3,
      game: 'Celtics vs Heat',
      gameTime: '7:00 PM EST',
      sport: 'NBA',
      markets: {
        moneyline: {
          selection: 'Celtics ML',
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
      priority: 'low',
      tags: ['conference']
    },
    {
      id: 4,
      game: 'Rangers @ Bruins',
      gameTime: '7:30 PM EST',
      sport: 'NHL',
      markets: {
        moneyline: {
          selection: 'Rangers ML',
          bestOdds: '+140',
          bestBook: 'PointsBet',
          value: 6.2,
          isEV: true,
          allBooks: [
            { name: 'PointsBet', odds: '+140', value: 6.2 },
            { name: 'DraftKings', odds: '+135', value: 5.1 },
            { name: 'FanDuel', odds: '+130', value: 4.2 }
          ]
        }
      },
      maxEV: 6.2,
      hasArbitrage: true,
      priority: 'high',
      tags: ['arbitrage', 'hockey']
    },
    {
      id: 5,
      game: 'LeBron James Props',
      gameTime: '4:30 PM PST',
      sport: 'NBA',
      isPlayerProp: true,
      player: 'LeBron James',
      team: 'Lakers',
      markets: {
        points: {
          selection: 'Over 25.5 Points',
          bestOdds: '-105',
          bestBook: 'DraftKings',
          value: 4.2,
          isEV: true,
          allBooks: [
            { name: 'DraftKings', odds: '-105', value: 4.2 },
            { name: 'FanDuel', odds: '-110', value: 3.1 },
            { name: 'MGM', odds: '-115', value: 2.3 }
          ]
        },
        rebounds: {
          selection: 'Over 7.5 Rebounds',
          bestOdds: '+110',
          bestBook: 'FanDuel',
          value: 3.8,
          isEV: true,
          allBooks: [
            { name: 'FanDuel', odds: '+110', value: 3.8 },
            { name: 'DraftKings', odds: '+105', value: 2.9 },
            { name: 'MGM', odds: '+100', value: 1.8 }
          ]
        },
        assists: {
          selection: 'Over 6.5 Assists',
          bestOdds: '-120',
          bestBook: 'MGM',
          value: 2.1,
          isEV: true,
          allBooks: [
            { name: 'MGM', odds: '-120', value: 2.1 },
            { name: 'DraftKings', odds: '-125', value: 1.5 },
            { name: 'FanDuel', odds: '-130', value: 0.8 }
          ]
        }
      },
      maxEV: 4.2,
      hasArbitrage: false,
      priority: 'high',
      tags: ['player-prop', 'popular']
    },
    {
      id: 6,
      game: 'Jayson Tatum Props',
      gameTime: '7:00 PM EST',
      sport: 'NBA',
      isPlayerProp: true,
      player: 'Jayson Tatum',
      team: 'Celtics',
      markets: {
        points: {
          selection: 'Over 28.5 Points',
          bestOdds: '+115',
          bestBook: 'PointsBet',
          value: 6.8,
          isEV: true,
          allBooks: [
            { name: 'PointsBet', odds: '+115', value: 6.8 },
            { name: 'DraftKings', odds: '+110', value: 5.2 },
            { name: 'FanDuel', odds: '+105', value: 3.9 }
          ]
        },
        threes: {
          selection: 'Over 3.5 Three-Pointers',
          bestOdds: '+125',
          bestBook: 'MGM',
          value: 5.1,
          isEV: true,
          allBooks: [
            { name: 'MGM', odds: '+125', value: 5.1 },
            { name: 'DraftKings', odds: '+120', value: 4.2 },
            { name: 'FanDuel', odds: '+115', value: 3.1 }
          ]
        }
      },
      maxEV: 6.8,
      hasArbitrage: false,
      priority: 'high',
      tags: ['player-prop', 'high-value']
    }
  ];

  // Transform API data to our component format
  const transformApiData = (apiLines) => {
    const gamesMap = {};
    
    // Group lines by game
    apiLines.forEach(line => {
      const gameKey = line.game || `${line.home_team} vs ${line.away_team}`;
      const marketKey = line.market_type || 'moneyline';
      
      if (!gamesMap[gameKey]) {
        gamesMap[gameKey] = {
          id: line.game_id || Math.random(),
          game: gameKey,
          gameTime: line.commence_time ? new Date(line.commence_time).toLocaleTimeString() : 'TBD',
          sport: line.sport_key || selectedSport,
          markets: {},
          maxEV: 0,
          hasArbitrage: false,
          priority: 'medium',
          tags: []
        };
      }
      
      if (!gamesMap[gameKey].markets[marketKey]) {
        gamesMap[gameKey].markets[marketKey] = {
          selection: line.selection || line.name,
          bestOdds: formatOdds(line.american_odds || line.price),
          bestBook: line.sportsbook,
          value: line.expected_value || 0,
          isEV: (line.expected_value || 0) > 0,
          allBooks: []
        };
      }
      
      // Add to books list
      gamesMap[gameKey].markets[marketKey].allBooks.push({
        name: line.sportsbook,
        odds: formatOdds(line.american_odds || line.price),
        value: line.expected_value || 0
      });
      
      // Update max EV for the game
      if ((line.expected_value || 0) > gamesMap[gameKey].maxEV) {
        gamesMap[gameKey].maxEV = line.expected_value || 0;
      }
    });
    
    // Sort books by best odds and finalize
    Object.values(gamesMap).forEach(game => {
      Object.values(game.markets).forEach(market => {
        market.allBooks.sort((a, b) => {
          const aOdds = parseFloat(a.odds.replace('+', ''));
          const bOdds = parseFloat(b.odds.replace('+', ''));
          return bOdds - aOdds; // Sort descending for positive odds
        });
        
        if (market.allBooks.length > 0) {
          market.bestOdds = market.allBooks[0].odds;
          market.bestBook = market.allBooks[0].name;
          market.value = market.allBooks[0].value;
        }
      });
      
      // Set priority based on EV
      game.priority = game.maxEV >= 5 ? 'high' : game.maxEV >= 2 ? 'medium' : 'low';
    });
    
    return Object.values(gamesMap);
  };

  // Filter lines based on current settings
  const filteredLines = (lines.length > 0 ? lines : sampleLines).filter(line => {
    if (viewMode === 'ev' && line.maxEV <= 0) return false;
    if (viewMode === 'arbitrage' && !line.hasArbitrage) return false;
    if (viewMode === 'edge5' && line.maxEV < 5) return false;
    if (selectedSport !== 'ALL' && line.sport !== selectedSport) return false;
    
    // Market filter logic
    if (marketFilter === 'game' && line.isPlayerProp) return false;
    if (marketFilter === 'player' && !line.isPlayerProp) return false;
    
    return true;
  }).sort((a, b) => b.maxEV - a.maxEV); // Sort by value descending

  const fetchLines = async () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    if (!selectedSport || selectedSport === 'ALL') {
      // For 'ALL' sports, we'll use sample data since the API expects specific sports
      setLastUpdated(new Date());
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport: selectedSport,
        ...(timeFilter !== 'all' && { timeFilter }),
        ...(viewMode === 'ev' && { minEdge: '2' }),
        ...(viewMode === 'edge5' && { minEdge: '5' })
      });

      const response = await fetch(`/api/line-shopping?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.lines)) {
        // Transform API data to match our component structure
        const transformedLines = transformApiData(data.lines);
        setLines(transformedLines);
        setLastUpdated(new Date());
      } else {
        console.warn('API returned no lines or error:', data.message);
        // Keep using sample data as fallback
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
      // Fallback to sample data on error
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

  const trackBet = (id) => {
    // Integration with dashboard
    console.log('Track bet:', id);
  };

  const formatOdds = (odds) => {
    if (typeof odds === 'string' && odds.includes('+')) return odds;
    return odds > 0 ? `+${odds}` : odds;
  };

  const getValueIcon = (value, hasArbitrage = false) => {
    if (hasArbitrage) return <Zap className="w-4 h-4 text-blue-400" />;
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

  // Determine if we should show mobile layout
  const isMobileLayout = viewLayout === 'mobile' || (viewLayout === 'auto' && typeof window !== 'undefined' && window.innerWidth < 1024);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#141C28] to-[#0B0F14] text-white">
      <Head>
        <title>Line Shopping - Find Best Odds Instantly | BetChekr</title>
        <meta name="description" content="Compare betting odds across all major sportsbooks. Find +EV opportunities, arbitrage plays, and get the best value on every bet." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span>Line Shopping</span>
            <Crown className="w-8 h-8 text-[#F4C430]" />
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Find the best odds, instantly.
          </p>
          
          {/* Results Summary */}
          {filteredLines.length > 0 && (
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-gray-300">
                <span className="text-[#F4C430] font-bold">{filteredLines.length}</span> opportunities
              </div>
              <div className="text-gray-300">
                <span className="text-green-400 font-bold">
                  {filteredLines.filter(l => l.maxEV > 0).length}
                </span> +EV bets
              </div>
              <div className="text-gray-300">
                <span className="text-purple-400 font-bold">
                  {filteredLines.filter(l => l.isPlayerProp).length}
                </span> player props
              </div>
              <div className="text-gray-300">
                <span className="text-blue-400 font-bold">
                  {filteredLines.filter(l => l.hasArbitrage).length}
                </span> arbitrage
              </div>
            </div>
          )}
        </motion.div>

        {/* Educational Hints */}
        <EducationalHints showHints={showEducationalHints} />

        {/* Quick Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {/* Primary Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
            {/* Sports */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSport('ALL')}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                  selectedSport === 'ALL'
                    ? 'bg-[#F4C430] text-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                All Sports
              </button>
              {sports.map(sport => (
                <button
                  key={sport.value}
                  onClick={() => setSelectedSport(sport.value)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
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

            {/* Controls */}
            <div className="flex items-center gap-2 lg:ml-auto">
              {/* Layout Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewLayout('desktop')}
                  className={`p-2 rounded transition-colors ${
                    !isMobileLayout ? 'bg-[#F4C430] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('mobile')}
                  className={`p-2 rounded transition-colors ${
                    isMobileLayout ? 'bg-[#F4C430] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#F4C430]/50"
              >
                {timeFilters.map(filter => (
                  <option key={filter.value} value={filter.value} className="bg-gray-800">
                    {filter.label}
                  </option>
                ))}
              </select>
              
              {/* Auto Refresh */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-[#F4C430] text-black' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
                title="Auto-refresh every 30 seconds"
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowEducationalHints(!showEducationalHints)}
                className="p-2 bg-white/10 text-gray-300 hover:bg-white/20 rounded-lg transition-colors"
                title="Toggle educational hints"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* View Modes */}
          <div className="flex flex-wrap gap-2">
            {viewModes.map(mode => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.value;
              const count = mode.value === 'all' ? filteredLines.length :
                          mode.value === 'ev' ? filteredLines.filter(l => l.maxEV > 0).length :
                          mode.value === 'arbitrage' ? filteredLines.filter(l => l.hasArbitrage).length :
                          filteredLines.filter(l => l.maxEV >= 5).length;

              return (
                <ValueTooltip key={mode.value} type={mode.value === 'ev' ? 'ev' : mode.value === 'arbitrage' ? 'arbitrage' : mode.value === 'edge5' ? 'edge' : null}>
                  <button
                    onClick={() => setViewMode(mode.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#F4C430]/20 text-[#F4C430] border border-[#F4C430]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{mode.label}</span>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        isActive ? 'bg-[#F4C430] text-black' : 'bg-white/10 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                </ValueTooltip>
              );
            })}
          </div>
        </motion.div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-center text-gray-500 text-sm mb-6">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {autoRefresh && <span className="ml-2 text-green-400">• Auto-refreshing</span>}
          </div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Mobile Layout */}
          {isMobileLayout ? (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredLines.map((line, index) => (
                  <MobileLineCard
                    key={line.id}
                    line={line}
                    isSaved={savedBets.has(line.id)}
                    onToggleSaved={toggleSavedBet}
                    onTrackBet={trackBet}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Desktop Table Layout */
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-sm font-medium text-gray-300">
                <div className="col-span-4">Event</div>
                <div className="col-span-2">Best Market</div>
                <div className="col-span-2">Best Odds</div>
                <div className="col-span-2">Sportsbook</div>
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
                        transition={{ delay: index * 0.03 }}
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
                              <div className="flex items-center gap-2 mb-1">
                                {getValueIcon(line.maxEV, line.hasArbitrage)}
                                <h3 className="font-semibold text-white">{line.game}</h3>
                                {line.tags.includes('primetime') && (
                                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded font-medium">
                                    PRIME
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {line.gameTime}
                              </div>
                            </div>
                          </div>

                          {/* Best Market */}
                          <div className="col-span-2 flex items-center">
                            <div>
                              <div className="text-white font-medium">
                                {primaryMarket.selection.split(' ')[0]}
                              </div>
                              <div className="text-sm text-gray-400">
                                {primaryMarket.selection.includes('+') || primaryMarket.selection.includes('-') ? 'Spread' : 'Moneyline'}
                              </div>
                            </div>
                          </div>

                          {/* Best Odds */}
                          <div className="col-span-2 flex items-center">
                            <ValueTooltip type="ev">
                              <div className="cursor-help">
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
                            </ValueTooltip>
                          </div>

                          {/* Sportsbook */}
                          <div className="col-span-2 flex items-center">
                            <div className="px-3 py-1 bg-[#F4C430]/20 text-[#F4C430] rounded-full text-sm font-medium">
                              {primaryMarket.bestBook}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center gap-2">
                            <button
                              onClick={() => toggleSavedBet(line.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isSaved 
                                  ? 'bg-[#F4C430] text-black' 
                                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
                              }`}
                              title="Save to watchlist"
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => trackBet(line.id)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              title="Track in dashboard"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
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
                                  All Markets & Sportsbooks
                                </h4>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {Object.entries(line.markets).map(([marketType, market]) => (
                                    <div key={marketType} className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h5 className="font-medium text-gray-300 uppercase text-sm">
                                          {marketType === 'moneyline' ? 'Moneyline' : 
                                           marketType === 'spread' ? 'Point Spread' :
                                           marketType === 'total' ? 'Total Points' : marketType}
                                        </h5>
                                        <span className="text-xs text-gray-500">
                                          {market.selection}
                                        </span>
                                      </div>
                                      <div className="space-y-2">
                                        {market.allBooks.slice(0, 5).map((book, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div className="flex items-center gap-2">
                                              {idx === 0 && <div className="w-2 h-2 bg-[#F4C430] rounded-full"></div>}
                                              {idx === 1 && <div className="w-2 h-2 bg-gray-400 rounded-full"></div>}
                                              {idx === 2 && <div className="w-2 h-2 bg-orange-400 rounded-full"></div>}
                                              <span className={idx === 0 ? 'text-[#F4C430] font-medium' : 'text-gray-300'}>
                                                {book.name}
                                              </span>
                                              {idx === 0 && (
                                                <span className="px-2 py-0.5 bg-[#F4C430]/20 text-[#F4C430] text-xs rounded font-medium">
                                                  BEST
                                                </span>
                                              )}
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

                                {/* Additional Actions */}
                                <div className="mt-6 flex gap-3 pt-4 border-t border-white/10">
                                  <button className="px-4 py-2 bg-[#F4C430] text-black rounded-lg font-medium hover:bg-[#e6b829] transition-colors">
                                    Set Price Alert
                                  </button>
                                  <button className="px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors">
                                    View Line History
                                  </button>
                                  <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30 transition-colors">
                                    Compare Calculator
                                  </button>
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
            </div>
          )}
        </motion.div>

        {/* Empty State */}
        {filteredLines.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mb-4">
              {viewMode === 'ev' ? <Star className="w-16 h-16 text-gray-600 mx-auto" /> :
               viewMode === 'arbitrage' ? <Zap className="w-16 h-16 text-gray-600 mx-auto" /> :
               viewMode === 'edge5' ? <Gem className="w-16 h-16 text-gray-600 mx-auto" /> :
               <Target className="w-16 h-16 text-gray-600 mx-auto" />}
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {viewMode === 'ev' ? 'No +EV opportunities right now' :
               viewMode === 'arbitrage' ? 'No arbitrage opportunities found' :
               viewMode === 'edge5' ? 'No high-edge opportunities available' :
               'No lines found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {viewMode === 'ev' ? 'Check back soon or try different sports.' :
               viewMode === 'arbitrage' ? 'Arbitrage opportunities are rare but profitable.' :
               viewMode === 'edge5' ? 'High-edge bets (5%+) are uncommon but valuable.' :
               'Try selecting a different sport or adjusting your filters.'}
            </p>
            <button
              onClick={fetchLines}
              className="px-6 py-3 bg-[#F4C430] text-black rounded-lg font-medium hover:bg-[#e6b829] transition-colors"
            >
              Refresh Lines
            </button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-[#F4C430] animate-spin mb-4" />
            <p className="text-gray-400">Finding the best odds...</p>
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