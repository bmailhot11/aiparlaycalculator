import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TrendingUp, BarChart3, Activity, Database, Home, RefreshCw } from 'lucide-react';

export default function TrendsPage() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedType, setSelectedType] = useState('trends');
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'Soccer', 'Tennis'];
  const dataTypes = [
    { key: 'trends', label: 'Sportsbook Trends', icon: TrendingUp },
    { key: 'movements', label: 'Odds Movements', icon: Activity },
    { key: 'historical', label: 'Historical Data', icon: BarChart3 },
    { key: 'cache_stats', label: 'Cache Stats', icon: Database }
  ];

  useEffect(() => {
    fetchTrendsData();
  }, [selectedSport, selectedType]);

  const fetchTrendsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          type: selectedType,
          hours: 24
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setTrendsData(data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch trends data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendsData = () => {
    if (!trendsData?.data) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-400">{trendsData?.message || 'No data available yet'}</p>
        </div>
      );
    }

    switch (selectedType) {
      case 'trends':
        return (
          <div className="space-y-4">
            {trendsData.data.summary && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Sportsbooks Tracked</div>
                    <div className="text-white font-bold">{trendsData.data.summary.total_sportsbooks}</div>
                  </div>
                  {trendsData.data.summary.best_value_book && (
                    <div>
                      <div className="text-gray-400">Best Value Book</div>
                      <div className="text-green-400 font-bold">
                        {trendsData.data.summary.best_value_book.name} ({trendsData.data.summary.best_value_book.value_percentage}%)
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-400">Recent Movements</div>
                    <div className="text-white font-bold">{trendsData.data.summary.most_active_movements.length}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Sportsbook Performance</h3>
              {Object.entries(trendsData.data.sportsbook_trends).map(([book, trend]) => (
                <div key={book} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{book}</h4>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      parseFloat(trend.value_percentage) > 60 ? 'bg-green-500/20 text-green-400' :
                      parseFloat(trend.value_percentage) > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {trend.value_percentage}% value rate
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Comparisons</div>
                      <div className="text-white">{trend.total_comparisons}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Average Edge</div>
                      <div className="text-white">{trend.average_edge.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'movements':
        return (
          <div className="space-y-4">
            {trendsData.data.summary && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Movement Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Movements</div>
                    <div className="text-white font-bold">{trendsData.data.summary.total_movements}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Largest Movement</div>
                    <div className="text-yellow-400 font-bold">{trendsData.data.summary.largest_movement} points</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Most Active Book</div>
                    <div className="text-blue-400 font-bold">{trendsData.data.summary.most_active_sportsbook.name}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Significant Movements (20+ points)</h3>
              {trendsData.data.significant_movements.length > 0 ? (
                trendsData.data.significant_movements.map((movement, index) => (
                  <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="text-white font-medium">Movement detected at {new Date(movement.timestamp).toLocaleTimeString()}</div>
                    <div className="text-sm text-gray-300 mt-2">
                      {movement.total_movements} significant changes detected
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-4">No significant movements detected</div>
              )}
            </div>
          </div>
        );

      case 'historical':
        return (
          <div className="space-y-4">
            {trendsData.data.analysis && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Data Analysis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Snapshots</div>
                    <div className="text-white font-bold">{trendsData.data.analysis.total_snapshots}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Recent Snapshots</div>
                    <div className="text-blue-400 font-bold">{trendsData.data.analysis.snapshots_in_period}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Movements/Hour</div>
                    <div className="text-green-400 font-bold">{trendsData.data.analysis.average_movements_per_hour.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Coverage</div>
                    <div className="text-white font-bold">{trendsData.data.analysis.data_coverage_hours}h</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Snapshots</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {trendsData.data.snapshots.map((snapshot, index) => (
                  <div key={index} className="bg-gray-800 rounded p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{new Date(snapshot.timestamp).toLocaleString()}</span>
                      <span className="text-blue-400">{snapshot.data.length} games</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cache_stats':
        return (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Cache Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Events Cached</div>
                <div className="text-white font-bold">{trendsData.data.events_cached}</div>
              </div>
              <div>
                <div className="text-gray-400">Odds History</div>
                <div className="text-white font-bold">{trendsData.data.odds_history_tracked}</div>
              </div>
              <div>
                <div className="text-gray-400">Historical Sports</div>
                <div className="text-white font-bold">{trendsData.data.historical_sports}</div>
              </div>
              <div>
                <div className="text-gray-400">Trend Analysis</div>
                <div className="text-white font-bold">{trendsData.data.trend_analysis_active}</div>
              </div>
              <div>
                <div className="text-gray-400">Memory Usage</div>
                <div className="text-white font-bold">{trendsData.data.memory_usage}</div>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-400">Unknown data type</div>;
    }
  };

  return (
    <>
      <Head>
        <title>Odds Trends & Historical Data - AiParlayCalculator</title>
        <meta name="description" content="View historical odds data, movement trends, and sportsbook performance analysis." />
      </Head>

      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Home className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-white">Trends & Historical Data</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {lastUpdate && (
                  <span className="text-sm text-gray-400">
                    Updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={fetchTrendsData}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Controls */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sport</label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      {sports.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data Type</label>
                    <div className="space-y-2">
                      {dataTypes.map(type => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={type.key}
                            onClick={() => setSelectedType(type.key)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              selectedType === type.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Display */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {dataTypes.find(t => t.key === selectedType)?.label} - {selectedSport}
                  </h2>
                  {loading && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                    <div className="text-red-400">{error}</div>
                  </div>
                )}

                {renderTrendsData()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}