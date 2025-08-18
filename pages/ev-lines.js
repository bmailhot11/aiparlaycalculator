import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TrendingUp, RefreshCw, Filter, Calculator, Shield, Target, Zap, Crown, AlertTriangle, Check, Plus, X, Home } from 'lucide-react';
import { PremiumContext } from './_app';

export default function EVLines() {
  const router = useRouter();
  const { isPremium } = useContext(PremiumContext);
  
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [evLines, setEvLines] = useState([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const [evGenerationsToday, setEvGenerationsToday] = useState(0);
  const maxEvGenerations = 1; // 1 per day for free users
  const [filterChangesToday, setFilterChangesToday] = useState(0);
  const maxFilterChanges = 2; // 2 filter changes per day for free users
  const [userParlay, setUserParlay] = useState([]);
  const [showParlayAnalysis, setShowParlayAnalysis] = useState(false);
  const [parlayComparison, setParlayComparison] = useState(null);

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'MLS', 'UEFA', 'Tennis'];
  
  // Sportsbook URLs (informational links only)
  const getSportsbookUrl = (sportsbook) => {
    const urls = {
      'DraftKings': 'https://sportsbook.draftkings.com',
      'FanDuel': 'https://sportsbook.fanduel.com',
      'BetMGM': 'https://sports.betmgm.com',
      'Caesars': 'https://sportsbook.caesars.com',
      'PointsBet': 'https://sportsbook.pointsbet.com',
      'BetRivers': 'https://betrivers.com',
      'WynnBET': 'https://wynnbet.com',
      'Unibet': 'https://unibet.com',
      'ESPN BET': 'https://espnbet.com',
      'Hard Rock Bet': 'https://hardrockbet.com'
    };
    return urls[sportsbook] || '#';
  };

  // Load usage data on component mount
  useEffect(() => {
    loadUsageData();
  }, []);

  // Fetch EV lines when component mounts or sport changes
  useEffect(() => {
    // Clear previous sport's data when switching
    setEvLines([]);
    setArbitrageOpportunities([]);
    setError(null);
    
    // Auto-refresh logic with usage tracking
    const handleSportChange = async () => {
      if (evGenerationsToday === 0) {
        // First load - always fetch
        fetchEVLines();
      } else if (isPremium) {
        // Premium users - always auto-refresh
        fetchEVLines();
      } else if (filterChangesToday < maxFilterChanges) {
        // Free users - auto-refresh if under limit
        await trackFilterChange();
        fetchEVLines();
      } else {
        // Free users over limit - show message
        setError(`Daily filter limit reached (${maxFilterChanges}). Upgrade to Premium for unlimited filter changes or manually refresh.`);
      }
    };
    
    handleSportChange();
  }, [selectedSport, evGenerationsToday, filterChangesToday, isPremium]);

  const trackFilterChange = async () => {
    if (isPremium) return; // Premium users don't have limits
    
    try {
      const identifier = localStorage.getItem('userIdentifier');
      const response = await fetch('/api/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'filter_change', userIdentifier: identifier })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFilterChangesToday(data.usage.filter_changes);
      }
    } catch (error) {
      console.error('Failed to track filter change:', error);
    }
  };

  const loadUsageData = async () => {
    try {
      let identifier = localStorage.getItem('userIdentifier');
      if (!identifier) {
        identifier = 'user_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('userIdentifier', identifier);
      }

      const response = await fetch('/api/get-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      if (response.ok) {
        const data = await response.json();
        setEvGenerationsToday(data.usage?.ev_generations || 0);
        setFilterChangesToday(data.usage?.filter_changes || 0);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  };

  const fetchEVLines = async () => {
    // Check usage limits for non-premium users
    if (!isPremium && evGenerationsToday >= maxEvGenerations) {
      setError('Daily EV line limit reached. Upgrade to Premium for unlimited access.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/get-ev-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSport,
          isPremium: isPremium
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setEvLines(data.lines || []);
        setArbitrageOpportunities(data.arbitrage || []);
        setLastRefresh(new Date());

        // Track usage for non-premium users
        if (!isPremium) {
          try {
            const identifier = localStorage.getItem('userIdentifier');
            await fetch('/api/track-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'ev_generation', userIdentifier: identifier })
            }).then(async (trackResponse) => {
              if (trackResponse.ok) {
                const trackData = await trackResponse.json();
                setEvGenerationsToday(trackData.usage.ev_generations);
              }
            });
          } catch (err) {
            console.error('Failed to track EV generation usage:', err);
          }
        }
      } else {
        setError(data.message || 'Failed to fetch EV lines');
        setEvLines([]);
        setArbitrageOpportunities([]);
      }
    } catch (error) {
      console.error('Error fetching EV lines:', error);
      setError('Network error. Please try again.');
      setEvLines([]);
      setArbitrageOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const addToParlay = (line) => {
    if (userParlay.find(l => l.game === line.game && l.selection === line.selection)) {
      // Remove if already in parlay
      setUserParlay(userParlay.filter(l => !(l.game === line.game && l.selection === line.selection)));
    } else {
      // Add to parlay
      setUserParlay([...userParlay, line]);
    }
  };

  const analyzeParlayOdds = async () => {
    if (userParlay.length === 0) return;
    
    setShowParlayAnalysis(true);
    
    try {
      const response = await fetch('/api/compare-parlay-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parlay: userParlay
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setParlayComparison(data.comparison);
      } else {
        // Show message about feature being in development
        setParlayComparison({
          message: data.message || 'Parlay comparison feature is in development',
          sportsbooks: []
        });
      }
    } catch (error) {
      console.error('Error analyzing parlay:', error);
    }
  };

  const calculateParlayOdds = () => {
    if (userParlay.length === 0) return { american: '+100', decimal: 2.0, probability: '50%' };
    
    const totalDecimal = userParlay.reduce((acc, line) => acc * line.decimal_odds, 1);
    const probability = (1 / totalDecimal * 100).toFixed(1);
    
    let american;
    if (totalDecimal >= 2) {
      american = `+${Math.round((totalDecimal - 1) * 100)}`;
    } else {
      american = `${Math.round(-100 / (totalDecimal - 1))}`;
    }
    
    return { american, decimal: totalDecimal.toFixed(2), probability: probability + '%' };
  };

  const clearParlay = () => {
    setUserParlay([]);
    setShowParlayAnalysis(false);
    setParlayComparison(null);
  };

  const parlayOdds = calculateParlayOdds();

  return (
    <>
      <Head>
        <title>Positive EV Lines - Find Value Bets | AiParlayCalculator</title>
        <meta name="description" content="Find positive expected value (EV) betting lines across all major sports. Real-time odds analysis, mathematical edge calculations, and smart parlay building tools." />
        <meta name="keywords" content="positive EV, expected value betting, sports betting analysis, value bets, betting odds, parlay calculator, sports betting strategy" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aiparlaycalculator.com/ev-lines" />
        <meta property="og:title" content="Find Positive EV Betting Lines - AiParlayCalculator" />
        <meta property="og:description" content="Discover mathematically profitable betting opportunities with positive expected value analysis across all major sports." />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://aiparlaycalculator.com/ev-lines" />
        <meta property="twitter:title" content="Positive EV Lines - Smart Betting Analysis" />
        <meta property="twitter:description" content="Find value bets with mathematical edge. Real-time positive EV line detection." />
        
        {/* Canonical */}
        <link rel="canonical" href="https://aiparlaycalculator.com/ev-lines" />
      </Head>
      
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <nav className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                <span className="hidden sm:inline">Positive EV Lines</span>
                <span className="sm:hidden">EV Lines</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              {lastRefresh && (
                <span className="hidden lg:block text-sm text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              {!isPremium && (
                <div className="text-xs text-gray-400">
                  <div>Refreshes: {evGenerationsToday}/{maxEvGenerations} today</div>
                  <div>Filters: {filterChangesToday}/{maxFilterChanges} today</div>
                </div>
              )}
              <button
                onClick={() => router.push('/trends')}
                className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                title="View historical data and trends"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Trends</span>
              </button>
              <button
                onClick={fetchEVLines}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Odds</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Sport Filter */}
            <div className="bg-gray-800 rounded-xl p-2 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="hidden xs:inline">Select Sport</span>
                <span className="xs:hidden">Sport</span>
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                {sports.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`py-2 px-2 sm:px-4 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                      selectedSport === sport
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Arbitrage Opportunities - Always show section */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2">
                Arbitrage Opportunities - {selectedSport}
                <span className="text-sm bg-yellow-500 text-black px-2 py-1 rounded-full font-medium">
                  GUARANTEED PROFIT
                </span>
              </h2>
              
              {arbitrageOpportunities.length > 0 ? (
                <div className="grid gap-4">
                  {arbitrageOpportunities.slice(0, isPremium ? arbitrageOpportunities.length : 1).map((arb, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-yellow-500/20">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{arb.game}</h3>
                          <div className="flex items-center gap-2 text-sm text-yellow-400">
                            <span className="font-bold">{arb.profit_percentage}% Profit</span>
                            <span>•</span>
                            <span>${arb.guaranteed_profit} guaranteed on ${arb.total_stake} stake</span>
                          </div>
                        </div>
                        <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                          {arb.roi}% ROI
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 font-medium">{arb.side1.selection}</span>
                            <a 
                              href={getSportsbookUrl(arb.side1.sportsbook)}
                              target="_blank"
                              rel="nofollow"
                              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                            >
                              {arb.side1.sportsbook} ↗
                            </a>
                          </div>
                          <div className="text-sm text-gray-300">
                            <div>Odds: <span className="text-green-400 font-bold">{arb.side1.odds}</span></div>
                            <div>Bet: <span className="text-white font-medium">${arb.side1.bet_amount}</span></div>
                            <div>Returns: <span className="text-green-400">${arb.side1.potential_return}</span></div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 font-medium">{arb.side2.selection}</span>
                            <a 
                              href={getSportsbookUrl(arb.side2.sportsbook)}
                              target="_blank"
                              rel="nofollow"
                              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                            >
                              {arb.side2.sportsbook} ↗
                            </a>
                          </div>
                          <div className="text-sm text-gray-300">
                            <div>Odds: <span className="text-green-400 font-bold">{arb.side2.odds}</span></div>
                            <div>Bet: <span className="text-white font-medium">${arb.side2.bet_amount}</span></div>
                            <div>Returns: <span className="text-green-400">${arb.side2.potential_return}</span></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        Total implied probability: {arb.total_implied_prob}% (under 100% = arbitrage)
                      </div>
                    </div>
                  ))}
                  
                  {!isPremium && arbitrageOpportunities.length > 1 && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg text-center">
                      <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        {arbitrageOpportunities.length - 1} More Guaranteed Profit Opportunities
                      </h3>
                      <p className="text-yellow-400 font-medium mb-4">
                        Premium members are seeing <span className="text-white font-bold">${
                          arbitrageOpportunities.slice(1).reduce((sum, arb) => sum + parseFloat(arb.guaranteed_profit), 0).toFixed(2)
                        } in total guaranteed profit</span> from these {arbitrageOpportunities.length - 1} arbitrage opportunities.
                      </p>
                      
                      <div className="grid gap-2 mb-4 opacity-60">
                        {arbitrageOpportunities.slice(1, 4).map((arb, index) => (
                          <div key={index} className="bg-gray-800/50 rounded p-2 text-sm">
                            <span className="text-white font-medium">{arb.game}</span>
                            <span className="text-yellow-400 ml-2">{arb.profit_percentage}% profit</span>
                            <span className="text-green-400 ml-2">${arb.guaranteed_profit} guaranteed</span>
                          </div>
                        ))}
                        {arbitrageOpportunities.length > 4 && (
                          <div className="text-gray-400 text-sm">
                            + {arbitrageOpportunities.length - 4} more opportunities
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all"
                      >
                        Unlock All {arbitrageOpportunities.length} Arbitrage Opportunities
                      </button>
                      <p className="text-gray-400 text-xs mt-2">
                        These opportunities pay for premium in the first use
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-3">🔍</div>
                  <h3 className="text-lg font-semibold text-white mb-2">Scanning for Arbitrage...</h3>
                  <p className="text-gray-400 mb-4">
                    No arbitrage opportunities found for {selectedSport} at this moment.
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300">
                    <p className="mb-2"><strong>What is arbitrage?</strong></p>
                    <p>When different sportsbooks have odds that create guaranteed profit regardless of outcome.</p>
                    <p className="mt-2 text-yellow-400">
                      💡 Tip: Try refreshing or check different sports. Arbitrage opportunities appear and disappear quickly!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* EV Lines List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Positive EV Lines - {selectedSport}
                </span>
                {!isPremium && (
                  <span className="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                    Limited to 3 lines
                  </span>
                )}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                  <span className="ml-3 text-gray-400">Finding positive EV lines...</span>
                </div>
              ) : evLines.length > 0 ? (
                <div className="space-y-4">
                  {evLines.slice(0, isPremium ? evLines.length : 3).map((line, index) => {
                    const isInParlay = userParlay.find(l => l.game === line.game && l.selection === line.selection);
                    
                    return (
                      <div key={index} className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                +{(line.expected_value * 100).toFixed(1)}% EV
                              </span>
                              <a 
                                href={getSportsbookUrl(line.sportsbook)}
                                target="_blank"
                                rel="nofollow"
                                className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                                title={`View on ${line.sportsbook}`}
                              >
                                {line.sportsbook} ↗
                              </a>
                              {line.edge_type && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                  {line.edge_type}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-white mb-1">{line.game}</h3>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4">
                              <span className="text-green-400 font-medium">{line.selection}</span>
                              <span className="text-white font-bold">{line.odds}</span>
                              {line.market_type && (
                                <span className="text-gray-400 text-xs md:text-sm">{line.market_type}</span>
                              )}
                            </div>
                            
                            {/* Advanced Metrics Grid */}
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {line.vig_percentage && (
                                <div className="bg-gray-800 rounded px-2 py-1">
                                  <div className="text-gray-500">Vig</div>
                                  <div className="text-white font-medium">{line.vig_percentage}%</div>
                                </div>
                              )}
                              {line.no_vig_odds && (
                                <div className="bg-gray-800 rounded px-2 py-1">
                                  <div className="text-gray-500">Fair Odds</div>
                                  <div className="text-blue-400 font-medium">{line.no_vig_odds}</div>
                                </div>
                              )}
                              {line.true_probability && (
                                <div className="bg-gray-800 rounded px-2 py-1">
                                  <div className="text-gray-500">True Prob</div>
                                  <div className="text-green-400 font-medium">{line.true_probability}%</div>
                                </div>
                              )}
                              {line.market_efficiency !== undefined && (
                                <div className="bg-gray-800 rounded px-2 py-1">
                                  <div className="text-gray-500">Efficiency</div>
                                  <div className={`font-medium ${
                                    line.market_efficiency < 50 ? 'text-green-400' : 
                                    line.market_efficiency < 70 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>{line.market_efficiency}%</div>
                                </div>
                              )}
                            </div>
                            
                            {/* Probability Comparison */}
                            {line.implied_probability && line.no_vig_probability && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 md:gap-4 text-xs">
                                <span className="text-gray-500">
                                  Implied: <span className="text-gray-300">{line.implied_probability}%</span>
                                </span>
                                <span className="text-gray-500 hidden md:inline">→</span>
                                <span className="text-gray-500">
                                  No-Vig: <span className="text-blue-300">{line.no_vig_probability}%</span>
                                </span>
                                {line.probability_edge && (
                                  <>
                                    <span className="text-gray-500 hidden md:inline">→</span>
                                    <span className="text-gray-500">
                                      Edge: <span className={`font-medium ${
                                        parseFloat(line.probability_edge) > 0 ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {line.probability_edge > 0 ? '+' : ''}{line.probability_edge}%
                                      </span>
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {line.confidence_score && (
                              <div className="mt-2 text-sm text-gray-400">
                                Confidence: {(line.confidence_score * 100).toFixed(0)}%
                                {line.recommended_bet_size && (
                                  <span className="ml-2">
                                    • Kelly: {(line.recommended_bet_size * 100).toFixed(1)}% of bankroll
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addToParlay(line)}
                            className={`ml-4 p-2 rounded-lg transition-all ${
                              isInParlay
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            {isInParlay ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No positive EV lines found for {selectedSport}</p>
                  <p className="text-sm mt-2">Try refreshing or selecting a different sport</p>
                </div>
              )}

              {!isPremium && evLines.length > 3 && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                  <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                  <p className="text-yellow-400 font-medium">
                    {evLines.length - 3} more positive EV lines available with advanced metrics
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-2 bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Parlay Builder Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-purple-400" />
                  Your Parlay
                </span>
                {userParlay.length > 0 && (
                  <button
                    onClick={clearParlay}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </h2>

              {userParlay.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Plus className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>Click + to add lines to your parlay</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {userParlay.map((line, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-white font-medium">{line.selection}</div>
                            <div className="text-gray-400 text-xs">{line.game}</div>
                          </div>
                          <div className="text-green-400 font-bold ml-2">{line.odds}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Legs:</span>
                      <span className="text-white font-medium">{userParlay.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Parlay Odds:</span>
                      <span className="text-green-400 font-bold">{parlayOdds.american}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Implied Probability:</span>
                      <span className="text-white">{parlayOdds.probability}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total EV:</span>
                      <span className="text-green-400 font-medium">
                        +{(userParlay.reduce((acc, line) => acc + (line.expected_value || 0), 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={analyzeParlayOdds}
                    className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Find Best Sportsbook for This Parlay
                  </button>
                </>
              )}
            </div>

            {/* Parlay Comparison Results */}
            {showParlayAnalysis && parlayComparison && (
              <div className="mt-4 bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Parlay Comparison</h3>
                
                {parlayComparison.message ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-blue-400 text-sm">
                      {parlayComparison.message}
                    </div>
                    {parlayComparison.note && (
                      <div className="text-gray-400 text-xs mt-2">
                        {parlayComparison.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parlayComparison.sportsbooks.map((book, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        index === 0 ? 'bg-green-500/20 border border-green-500/30' : 'bg-gray-700'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">{book.name}</div>
                            <div className="text-sm text-gray-400">Total odds: {book.totalOdds}</div>
                          </div>
                          {index === 0 && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
                              BEST
                            </span>
                          )}
                        </div>
                        {book.payout && (
                          <div className="mt-2 text-sm text-green-400">
                            $100 bet wins: ${book.payout}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Disclaimer Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-400">
            <p className="mb-2">
              <strong>Disclaimer:</strong> Links to sportsbooks are for informational purposes only. 
              We are not affiliated with any sportsbook and do not receive compensation for clicks or signups.
            </p>
            <p>
              Must be 21+ to gamble. Please gamble responsibly. If you or someone you know has a gambling problem, 
              call 1-800-GAMBLER. Check your local laws before placing any bets.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}