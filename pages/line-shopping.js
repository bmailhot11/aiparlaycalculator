import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { 
  Filter,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  BarChart3,
  Activity,
  Clock,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Search,
  Lock,
  Info,
  Replace,
  Check
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LineShopping() {
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [marketType, setMarketType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortBy, setSortBy] = useState('best'); // best, deviation, value, odds
  const [showOnlyValue, setShowOnlyValue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [oddsFormat, setOddsFormat] = useState('american'); // american or decimal
  const [isPremium, setIsPremium] = useState(false); // Would come from auth/user context
  const [hoveredLine, setHoveredLine] = useState(null);

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB'];
  const marketTypes = [
    { value: 'all', label: 'All Markets' },
    { value: 'h2h', label: 'Moneyline' },
    { value: 'spreads', label: 'Spreads' },
    { value: 'totals', label: 'Totals' },
    { value: 'player_props', label: 'Player Props' }
  ];

  // Fetch line shopping data
  const fetchLineShoppingData = async () => {
    if (!selectedSport) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport: selectedSport,
        ...(selectedTeam && { team: selectedTeam }),
        ...(selectedPlayer && { player: selectedPlayer }),
        ...(marketType !== 'all' && { market: marketType })
      });

      const response = await fetch(`/api/line-shopping?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLines(data.lines);
        setTeams(data.teams || []);
        setPlayers(data.players || []);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch line shopping data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching line shopping data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineShoppingData();
  }, [selectedSport, selectedTeam, selectedPlayer, marketType]);

  // Reset dependent filters when sport changes
  useEffect(() => {
    setSelectedTeam('');
    setSelectedPlayer('');
    setPlayers([]);
  }, [selectedSport]);

  // Reset player when team changes
  useEffect(() => {
    setSelectedPlayer('');
  }, [selectedTeam]);

  // Group lines by game and market for comparison
  const groupedLines = useMemo(() => {
    const groups = {};
    lines.forEach(line => {
      const key = `${line.game}_${line.market_type}_${line.selection}_${line.point || 'no_point'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(line);
    });
    return groups;
  }, [lines]);

  // Memoized filtered and sorted lines
  const processedLines = useMemo(() => {
    let filtered = Object.entries(groupedLines);
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(([key, lines]) => {
        const searchLower = searchQuery.toLowerCase();
        return lines.some(line => 
          line.game.toLowerCase().includes(searchLower) ||
          line.selection?.toLowerCase().includes(searchLower) ||
          line.player?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Filter by value bets only if enabled
    if (showOnlyValue) {
      filtered = filtered.filter(([key, lines]) => 
        lines.some(line => line.pinnacle_deviation > 0.05)
      );
    }
    
    // Sort groups
    switch (sortBy) {
      case 'best':
        filtered.sort(([keyA, linesA], [keyB, linesB]) => {
          const bestA = Math.max(...linesA.map(l => l.american_odds));
          const bestB = Math.max(...linesB.map(l => l.american_odds));
          return bestB - bestA;
        });
        break;
      case 'deviation':
        filtered.sort(([keyA, linesA], [keyB, linesB]) => {
          const maxDevA = Math.max(...linesA.map(l => Math.abs(l.pinnacle_deviation)));
          const maxDevB = Math.max(...linesB.map(l => Math.abs(l.pinnacle_deviation)));
          return maxDevB - maxDevA;
        });
        break;
      case 'value':
        filtered.sort(([keyA, linesA], [keyB, linesB]) => {
          const maxValueA = Math.max(...linesA.map(l => l.expected_value));
          const maxValueB = Math.max(...linesB.map(l => l.expected_value));
          return maxValueB - maxValueA;
        });
        break;
      default:
        break;
    }
    
    return filtered;
  }, [groupedLines, sortBy, showOnlyValue, searchQuery]);

  // Get deviation color
  const getDeviationColor = (deviation) => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation > 0.1) return 'text-red-400';
    if (absDeviation > 0.05) return 'text-yellow-400';
    if (absDeviation > 0.02) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <>
      <Head>
        <title>Line Shopping - Find Best Odds | BetChekr</title>
        <meta name="description" content="Compare betting lines across all major sportsbooks. Find value bets by analyzing deviations from Pinnacle odds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Line <span className="text-yellow-400">Shopping</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Compare odds across all major sportsbooks. Find the best lines and maximize your edge.
            </p>
            {lastUpdated && (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Filters</h2>
            </div>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for teams, players, or matchups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Sport Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team (Optional)</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Player Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Player (Optional)</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedTeam}
                >
                  <option value="">All Players</option>
                  {players.map(player => (
                    <option key={player} value={player}>{player}</option>
                  ))}
                </select>
              </div>

              {/* Market Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Market Type</label>
                <select
                  value={marketType}
                  onChange={(e) => setMarketType(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {marketTypes.map(market => (
                    <option key={market.value} value={market.value}>{market.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort and Filter Options */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white px-2 py-1 rounded text-sm"
                  >
                    <option value="best">Best Odds</option>
                    <option value="deviation">Pinnacle Deviation</option>
                    <option value="value">Expected Value</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">Odds:</label>
                  <button
                    onClick={() => setOddsFormat(oddsFormat === 'american' ? 'decimal' : 'american')}
                    className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    {oddsFormat === 'american' ? 'American' : 'Decimal'}
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyValue}
                    onChange={(e) => setShowOnlyValue(e.target.checked)}
                    className="rounded"
                  />
                  Show only value bets (5%+ deviation)
                </label>
              </div>

              <button
                onClick={fetchLineShoppingData}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                disabled={loading}
              >
                <Zap className="w-4 h-4" />
                Refresh Lines
              </button>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-blue-400">{processedLines.length}</div>
              <div className="text-sm text-gray-400">Available Lines</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-green-400">
                {processedLines.filter(line => line.pinnacle_deviation > 0.05).length}
              </div>
              <div className="text-sm text-gray-400">Value Opportunities</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {processedLines.length > 0 ? 
                  Math.max(...processedLines.map(l => Math.abs(l.pinnacle_deviation * 100))).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-400">Max Deviation</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 border border-gray-700 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {new Set(processedLines.map(line => line.sportsbook)).size}
              </div>
              <div className="text-sm text-gray-400">Sportsbooks</div>
            </div>
          </motion.div>

          {/* Lines Display */}
          <AnimatePresence>
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading line shopping data...</p>
              </motion.div>
            ) : processedLines.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Lines Found</h3>
                <p className="text-gray-300">Try adjusting your filters or selecting a different sport.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {processedLines.map(([groupKey, groupLines], index) => (
                  <LineComparisonTable
                    key={groupKey}
                    lines={groupLines}
                    index={index}
                    oddsFormat={oddsFormat}
                    isPremium={isPremium}
                    hoveredLine={hoveredLine}
                    setHoveredLine={setHoveredLine}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Educational Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="text-blue-400" />
              How to Use Line Shopping
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-4">Understanding Deviations</h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <p className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                    <span><strong>Red (10%+):</strong> Significant deviation from sharp lines</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    <span><strong>Yellow (5-10%):</strong> Notable value opportunity</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                    <span><strong>Blue (2-5%):</strong> Slight edge</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span><strong>Gray (&lt;2%):</strong> Efficient market pricing</span>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-4">Best Practices</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Compare multiple sportsbooks for the same bet</li>
                  <li>• Look for consistent deviations across similar markets</li>
                  <li>• Consider line movement timing and volume</li>
                  <li>• Use filters to reduce noise and focus on opportunities</li>
                  <li>• Always verify lines before placing bets</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}

// Line Comparison Table Component
function LineComparisonTable({ lines, index, oddsFormat, isPremium, hoveredLine, setHoveredLine }) {
  if (!lines || lines.length === 0) return null;
  
  // Sort lines by odds (best first)
  const sortedLines = [...lines].sort((a, b) => b.american_odds - a.american_odds);
  const bestLine = sortedLines[0];
  const worstLine = sortedLines[sortedLines.length - 1];
  const firstLine = lines[0];
  
  // Calculate savings
  const potentialSavings = bestLine.american_odds > 0 
    ? ((100 * (bestLine.american_odds / 100)) - (100 * (worstLine.american_odds / 100))).toFixed(2)
    : ((100 / Math.abs(worstLine.american_odds) * 100) - (100 / Math.abs(bestLine.american_odds) * 100)).toFixed(2);
  
  // Limit lines for free users
  const displayedLines = isPremium ? sortedLines : sortedLines.slice(0, 2);
  const hiddenCount = sortedLines.length - displayedLines.length;
  
  const formatOdds = (line) => {
    if (oddsFormat === 'decimal') {
      return line.decimal_odds.toFixed(2);
    }
    return line.american_odds > 0 ? `+${line.american_odds}` : line.american_odds;
  };
  
  const calculatePayout = (odds) => {
    if (typeof odds === 'string') odds = parseInt(odds);
    if (odds > 0) {
      return (100 + (100 * odds / 100)).toFixed(2);
    } else {
      return (100 + (100 * 100 / Math.abs(odds))).toFixed(2);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gray-900/50 p-4 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{firstLine.game}</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">{firstLine.sport}</span>
              <span className="text-yellow-400">{firstLine.market_display || firstLine.market_type}</span>
              <span className="text-white font-semibold">{firstLine.selection}</span>
              {firstLine.point && (
                <span className="text-blue-400">({firstLine.point > 0 ? '+' : ''}{firstLine.point})</span>
              )}
              {firstLine.player && (
                <span className="text-purple-400">• {firstLine.player}</span>
              )}
            </div>
          </div>
          {potentialSavings > 0 && (
            <div 
              className="relative"
              onMouseEnter={() => setHoveredLine(firstLine.game)}
              onMouseLeave={() => setHoveredLine(null)}
            >
              <div className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-1 rounded-lg text-sm font-semibold">
                Save ${potentialSavings} per $100
              </div>
              {hoveredLine === firstLine.game && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 w-64 z-10">
                  <Info className="w-3 h-3 inline mr-1 text-yellow-400" />
                  This line pays ${potentialSavings} more than the worst available option on a $100 bet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Odds Table */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-700">
                <th className="text-left pb-2">Sportsbook</th>
                <th className="text-center pb-2">Odds</th>
                <th className="text-center pb-2">Implied %</th>
                <th className="text-center pb-2">$100 Returns</th>
                <th className="text-right pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedLines.map((line, idx) => {
                const isBest = line === bestLine;
                return (
                  <tr 
                    key={`${line.sportsbook}_${idx}`} 
                    className={`border-b border-gray-700/50 ${isBest ? 'bg-green-500/10' : ''}`}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{line.sportsbook}</span>
                        {isBest && (
                          <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-400 font-bold">BEST</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold text-lg ${isBest ? 'text-green-400' : 'text-white'}`}>
                        {formatOdds(line)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-gray-300">
                        {(line.implied_probability * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-semibold ${isBest ? 'text-green-400' : 'text-white'}`}>
                        ${calculatePayout(line.american_odds)}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          // Handle replace in slip
                          console.log('Replace in slip:', line);
                          // This would integrate with your bet slip context/state
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ml-auto ${
                          isBest 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <Replace className="w-3 h-3" />
                        Replace
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* Premium upsell for hidden lines */}
              {hiddenCount > 0 && (
                <tr>
                  <td colSpan="5" className="py-4">
                    <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                      <Lock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-gray-300 mb-2">
                        {hiddenCount} more sportsbook{hiddenCount > 1 ? 's' : ''} available
                      </p>
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                        Upgrade to Premium
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* EV Analysis */}
        {bestLine.expected_value > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Expected Value:</span>
              </div>
              <span className="text-sm font-bold text-blue-400">
                +{(bestLine.expected_value * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}