import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, X, Clock, Target } from 'lucide-react';

export default function LineMovementChart({ 
  isOpen, 
  onClose, 
  sport, 
  gameId, 
  gameInfo = null,
  market = 'h2h',
  hours = 24 
}) {
  const [movementData, setMovementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(market);

  useEffect(() => {
    if (isOpen && sport && gameId) {
      fetchMovementData();
    }
  }, [isOpen, sport, gameId, selectedMarket, hours]);

  const fetchMovementData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/line-movement/${sport}/${gameId}?market=${selectedMarket}&hours=${hours}`
      );
      const data = await response.json();
      
      if (data.success) {
        setMovementData(data);
      } else {
        setError(data.message || 'Failed to load line movement data');
      }
    } catch (error) {
      console.error('Error fetching line movement:', error);
      setError('Failed to load line movement data');
    } finally {
      setLoading(false);
    }
  };

  // Process data for chart visualization
  const chartData = useMemo(() => {
    if (!movementData?.data?.length) return { timestamps: [], lines: {} };
    
    const timestamps = movementData.data.map(d => d.timestamp);
    const lines = {};
    
    // Group by sportsbook and selection
    movementData.data.forEach((dataPoint, index) => {
      dataPoint.odds.forEach(odd => {
        const key = `${odd.sportsbook}_${odd.selection}`;
        if (!lines[key]) {
          lines[key] = {
            sportsbook: odd.sportsbook,
            selection: odd.selection,
            market: odd.market,
            data: [],
            color: getLineColor(odd.sportsbook),
            latest_odds: null,
            movement: 'flat'
          };
        }
        
        lines[key].data.push({
          timestamp: dataPoint.timestamp,
          american_odds: odd.american_odds,
          decimal_odds: odd.decimal_odds,
          implied_prob: odd.implied_prob,
          point: odd.point,
          index
        });
        
        // Track latest for movement calculation
        if (index === movementData.data.length - 1) {
          lines[key].latest_odds = odd.american_odds;
        }
      });
    });
    
    // Calculate movement trends
    Object.values(lines).forEach(line => {
      if (line.data.length >= 2) {
        const first = line.data[0];
        const last = line.data[line.data.length - 1];
        
        if (last.american_odds > first.american_odds) {
          line.movement = 'up';
        } else if (last.american_odds < first.american_odds) {
          line.movement = 'down';
        } else {
          line.movement = 'flat';
        }
      }
    });
    
    return { timestamps, lines };
  }, [movementData]);

  const getLineColor = (sportsbook) => {
    const colors = {
      'DraftKings': '#53A318',
      'FanDuel': '#1E3A8A',
      'BetMGM': '#D97706',
      'Caesars': '#7C2D12',
      'BetRivers': '#0F766E',
      'PointsBet': '#C2410C',
      'WynnBET': '#BE185D',
      'Barstool': '#1D4ED8'
    };
    return colors[sportsbook] || '#6B7280';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900/95 backdrop-blur-sm rounded-2xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-white font-semibold text-lg">Line Movement Tracker</h3>
                <p className="text-gray-400 text-sm">
                  {gameInfo ? `${gameInfo.away_team} @ ${gameInfo.home_team}` : `${sport} Game ${gameId}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Market Selection */}
          {movementData?.summary?.markets_available?.length > 1 && (
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 text-sm">Market Type</span>
              </div>
              <div className="flex gap-2">
                {movementData.summary.markets_available.map(marketType => (
                  <button
                    key={marketType}
                    onClick={() => setSelectedMarket(marketType)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMarket === marketType
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {marketType === 'h2h' ? 'Moneyline' : 
                     marketType === 'spreads' ? 'Point Spread' : 
                     marketType === 'totals' ? 'Over/Under' : marketType.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-gray-300">Loading movement data...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-white font-medium mb-2">No Movement Data</h4>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            )}

            {movementData && !loading && Object.keys(chartData.lines).length > 0 && (
              <div>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Data Points</div>
                    <div className="text-white text-2xl font-bold">{movementData.data_points}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Sportsbooks</div>
                    <div className="text-white text-2xl font-bold">
                      {movementData.summary.sportsbooks_tracked.length}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Time Span</div>
                    <div className="text-white text-2xl font-bold">{hours}h</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Last Update</div>
                    <div className="text-white text-lg font-bold">
                      {formatTime(movementData.summary.latest_timestamp)}
                    </div>
                  </div>
                </div>

                {/* Simple Visual Chart */}
                <div className="bg-gray-800/30 rounded-xl p-6">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Line Movement Visualization
                  </h4>
                  
                  {/* Lines List */}
                  <div className="space-y-4">
                    {Object.entries(chartData.lines).map(([key, line]) => (
                      <div key={key} className="border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: line.color }}
                            />
                            <div>
                              <span className="text-white font-medium">{line.sportsbook}</span>
                              <span className="text-gray-400 ml-2">{line.selection}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {line.movement === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                            {line.movement === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                            <span className={`font-bold ${
                              line.latest_odds > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {line.latest_odds > 0 ? '+' : ''}{line.latest_odds}
                            </span>
                          </div>
                        </div>
                        
                        {/* Simple Movement Indicator */}
                        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="flex h-full">
                            {line.data.map((point, index) => (
                              <div
                                key={index}
                                className="flex-1"
                                style={{
                                  backgroundColor: line.color,
                                  opacity: 0.3 + (index / line.data.length) * 0.7
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>{formatTime(line.data[0]?.timestamp)}</span>
                          <span className="text-center">{line.data.length} updates</span>
                          <span>{formatTime(line.data[line.data.length - 1]?.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}