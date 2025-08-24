import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { 
  Download, 
  TrendingUp, 
  Target, 
  Calendar, 
  Star,
  BarChart3,
  Trophy,
  Activity
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { generateImprovedSlipImage, downloadImprovedSlip } from '../utils/generateImprovedSlipImage';

export default function DailyPicks() {
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackRecord, setTrackRecord] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchDailyPicks();
    fetchTrackRecord();
  }, []);

  const fetchDailyPicks = async () => {
    try {
      // Try real database API first
      console.log('Fetching daily picks from database...');
      let response = await fetch('/api/daily-picks/today');
      
      // If no database data, fallback to static
      if (!response.ok) {
        console.log('Database API failed, falling back to static picks');
        response = await fetch('/api/daily-picks/today-static');
      }
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      // Validate the data structure
      if (!data.success) {
        throw new Error(data.message || 'API returned unsuccessful response');
      }
      
      if (!data.single && !data.parlay2 && !data.parlay4) {
        throw new Error('No pick data received from API');
      }
      
      setPicks(data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching daily picks:', error);
      setError(`Failed to load picks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackRecord = async () => {
    try {
      const response = await fetch(`/api/daily-picks/track-record?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setTrackRecord(data);
      }
    } catch (error) {
      console.error('Error fetching track record:', error);
    }
  };


  const handleDownloadSlip = async (bet, betType) => {
    try {
      const improvedBets = bet.legs.map((leg, index) => ({
        league: leg.sport || 'Sports',
        matchup: `${leg.awayTeam} @ ${leg.homeTeam}`,
        game: `${leg.awayTeam} @ ${leg.homeTeam}`,
        market: leg.marketType || 'Moneyline',
        selection: leg.selection,
        odds: leg.bestOdds,
        decimal_odds: convertAmericanToDecimal(leg.bestOdds),
        sportsbook: leg.bestSportsbook || 'Best Line',
        improved: true,
        improvement_percentage: leg.edgePercentage || 0,
      }));

      const slipData = {
        originalSlip: {
          total_stake: '$100',
        },
        improvedBets,
        explanation: `${betType.toUpperCase()} Pick: ${bet.edgePercentage}% edge with ${bet.impliedProbability}% win probability. Professional analysis shows positive expected value.`,
        analysis: {
          edge_percentage: bet.edgePercentage,
          confidence_level: 'High',
          method: 'mathematical_analysis'
        }
      };

      const imageData = await generateImprovedSlipImage(slipData);
      
      if (imageData) {
        downloadImprovedSlip(imageData, `betchekr-${betType}-pick-${new Date().toISOString().split('T')[0]}.png`);
      } else {
        console.error('Failed to generate slip image');
      }
    } catch (error) {
      console.error('Error downloading slip:', error);
    }
  };

  // Convert American odds to decimal
  function convertAmericanToDecimal(americanOdds) {
    const odds = typeof americanOdds === 'string' ? 
      parseInt(americanOdds.replace('+', '')) : americanOdds;
    
    if (odds > 0) {
      return ((odds / 100) + 1).toFixed(2);
    } else {
      return ((100 / Math.abs(odds)) + 1).toFixed(2);
    }
  }

  // Debug logging
  console.log('Daily picks state:', { loading, error, picks });

  if (loading) {
    return (
      <>
        <Head>
          <title>Daily Picks - BetChekr</title>
          <meta name="description" content="Expert daily betting picks with mathematical analysis and edge calculations." />
          <link rel="icon" href="/betchekr_owl_logo.ico" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <Header />
          <main className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading today's picks...</p>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Daily Picks - Professional Betting Analysis | BetChekr</title>
        <meta name="description" content="Expert daily betting picks with mathematical edge analysis. Track our proven performance with documented results." />
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Daily <span className="text-blue-400">Picks</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Mathematically-driven betting recommendations with documented performance tracking
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
              <Calendar className="w-5 h-5" />
              <span>{picks?.date || new Date().toLocaleDateString()}</span>
            </div>
          </motion.div>

          {/* Track Record Section */}
          {trackRecord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Trophy className="text-yellow-400" />
                    Track Record
                  </h2>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => {
                      setSelectedPeriod(e.target.value);
                      fetchTrackRecord();
                    }}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {trackRecord.roi >= 0 ? '+' : ''}{trackRecord.roi}%
                    </div>
                    <div className="text-sm text-gray-400">ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {trackRecord.winRate}%
                    </div>
                    <div className="text-sm text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {trackRecord.totalPicks}
                    </div>
                    <div className="text-sm text-gray-400">Total Picks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                      {trackRecord.avgEdge}%
                    </div>
                    <div className="text-sm text-gray-400">Avg Edge</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Today's Picks */}
          {picks && picks.success && (
            <div className="space-y-8">
              {/* Single Bet */}
              {picks.single && (
                <DailyPickCard
                  title="Single Bet"
                  subtitle="Low risk, solid edge"
                  pick={picks.single}
                  onDownload={() => handleDownloadSlip(picks.single, 'single')}
                  cardColor="from-green-500/20 to-blue-500/20"
                  borderColor="border-green-500/50"
                />
              )}

              {/* 2-Leg Parlay */}
              {picks.parlay2 && (
                <DailyPickCard
                  title="2-Leg Parlay"
                  subtitle="Medium risk, higher payout"
                  pick={picks.parlay2}
                  onDownload={() => handleDownloadSlip(picks.parlay2, 'parlay2')}
                  cardColor="from-blue-500/20 to-purple-500/20"
                  borderColor="border-blue-500/50"
                />
              )}

              {/* 4-Leg Parlay */}
              {picks.parlay4 && (
                <DailyPickCard
                  title="4-Leg Parlay"
                  subtitle="High risk, maximum payout"
                  pick={picks.parlay4}
                  onDownload={() => handleDownloadSlip(picks.parlay4, 'parlay4')}
                  cardColor="from-purple-500/20 to-pink-500/20"
                  borderColor="border-purple-500/50"
                />
              )}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">⚠️ {error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
              {/* Debug info */}
              <div className="mt-4 text-xs text-gray-500">
                <details>
                  <summary>Debug Info</summary>
                  <pre className="text-left mt-2 p-2 bg-gray-800 rounded">
                    {JSON.stringify({ loading, error, picks }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}

          {/* Raw data fallback for debugging */}
          {!loading && !error && picks && !picks.success && (
            <div className="text-center py-12">
              <div className="text-yellow-400 mb-4">⚠️ Data received but format unexpected</div>
              <pre className="text-left text-xs bg-gray-800 p-4 rounded">
                {JSON.stringify(picks, null, 2)}
              </pre>
            </div>
          )}

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-yellow-400 mb-4">⚠️ Important Disclaimer</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                These picks are based on mathematical analysis and historical data. Past performance does not guarantee future results.
              </p>
              <p>
                Always bet responsibly and only with money you can afford to lose. Consider these picks as educational content, not financial advice.
              </p>
              <p>
                Track record data is updated daily and reflects actual documented performance over the specified time periods.
              </p>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}

// Daily Pick Card Component
function DailyPickCard({ title, subtitle, pick, onDownload, cardColor, borderColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${cardColor} backdrop-blur-lg rounded-2xl p-6 border ${borderColor}`}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Header */}
        <div className="lg:w-1/4">
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 mb-4">{subtitle}</p>
          
          {/* Key Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Edge:</span>
              <span className="text-green-400 font-bold">+{pick.edgePercentage || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Odds:</span>
              <span className="text-white font-bold">{pick.combinedOdds || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Payout (per $100):</span>
              <div className="font-bold text-green-400">+${(pick.estimatedPayout || 0) - 100}</div>
            </div>
          </div>
        </div>

        {/* Bet Legs */}
        <div className="lg:w-2/4">
          <h4 className="text-lg font-semibold text-white mb-4">Bet Legs</h4>
          <div className="space-y-3">
            {(pick.legs || []).map((leg, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-white">
                      {leg.awayTeam || 'Away'} @ {leg.homeTeam || 'Home'}
                    </div>
                    <div className="text-sm text-gray-300">{leg.sport || 'Sport'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-400">{leg.bestOdds || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{leg.bestSportsbook || 'Sportsbook'}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-400">{leg.marketType || 'Market'}:</span>
                    <span className="text-white ml-2">{leg.selection || 'Selection'}</span>
                  </div>
                  <div className="text-xs text-green-400">+{leg.edgePercentage || 0}% edge</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:w-1/4 flex flex-col justify-center">
          <button
            onClick={onDownload}
            className="w-full bg-white text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <Download className="w-4 h-4" />
            Download Slip
          </button>
          
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-2">Recommended Bet Size</div>
            <div className="text-sm text-yellow-400 font-semibold">
              2-5% of bankroll
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}