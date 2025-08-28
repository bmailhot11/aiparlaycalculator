import { useState, useEffect, useContext } from 'react';
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
  Activity,
  Crown,
  Check,
  X,
  Clock,
  DollarSign
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { generateImprovedSlipImage, downloadImprovedSlip } from '../utils/generateImprovedSlipImage';

export default function DailyPicks() {
  const { isPremium } = useContext(PremiumContext);
  const [picks, setPicks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackRecord, setTrackRecord] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [showPaywall, setShowPaywall] = useState(false);
  const [yesterdaysPicks, setYesterdaysPicks] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setShowPaywall(true);
      setLoading(false);
      return;
    }
    
    fetchDailyPicks();
    fetchTrackRecord();
    fetchYesterdaysPicks();
  }, [isPremium, selectedPeriod]);

  const fetchDailyPicks = async () => {
    try {
      const response = await fetch('/api/daily-picks/today');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        // Check if it's because no picks are published
        if (data.error === 'NO_DATA' || data.message?.includes('No picks published')) {
          setError('No picks published for today yet. Daily picks are typically published at 11 AM CT.');
        } else {
          throw new Error(data.message || 'API returned unsuccessful response');
        }
      } else {
        setPicks(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching daily picks:', error);
      setError(`Failed to load picks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const publishTodaysPicks = async () => {
    setPublishing(true);
    try {
      // Try the real generator first (uses actual Supabase odds data)
      let response = await fetch('/api/daily-picks/generate-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      let result = await response.json();
      
      // If real generator fails, fall back to simple generator
      if (!result.success) {
        console.log('Real generator failed, trying simple generator...');
        response = await fetch('/api/daily-picks/generate-simple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        result = await response.json();
      }
      
      if (result.success) {
        alert('Daily picks generated and saved successfully!');
        // Now fetch the saved picks from database
        await fetchDailyPicks();
      } else {
        alert(`Failed to generate: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('Error generating picks:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const fetchYesterdaysPicks = async () => {
    try {
      const response = await fetch('/api/daily-picks/yesterday');
      if (response.ok) {
        const data = await response.json();
        setYesterdaysPicks(data);
      }
    } catch (error) {
      console.error('Error fetching yesterday\'s picks:', error);
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
      const improvedBets = bet.legs.map((leg) => ({
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
        explanation: `${betType.toUpperCase()} Pick: ${bet.edgePercentage}% edge with ${bet.impliedProbability}% win probability.`,
        analysis: {
          edge_percentage: bet.edgePercentage,
          confidence_level: 'High',
          method: 'mathematical_analysis'
        }
      };

      const imageData = await generateImprovedSlipImage(slipData);
      
      if (imageData) {
        downloadImprovedSlip(imageData, `betchekr-${betType}-pick-${new Date().toISOString().split('T')[0]}.png`);
      }
    } catch (error) {
      console.error('Error downloading slip:', error);
    }
  };

  function convertAmericanToDecimal(americanOdds) {
    const odds = typeof americanOdds === 'string' ? 
      parseInt(americanOdds.replace('+', '')) : americanOdds;
    
    if (odds > 0) {
      return ((odds / 100) + 1).toFixed(2);
    } else {
      return ((100 / Math.abs(odds)) + 1).toFixed(2);
    }
  }

  const formatOdds = (odds) => {
    return typeof odds === 'number' ? (odds > 0 ? `+${odds}` : odds) : odds;
  };

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  if (!isPremium || showPaywall) {
    return (
      <div className="betchekr-premium">
        <Head>
          <title>Daily Picks - Premium Feature | BetChekr</title>
        </Head>
        <GradientBG>
          <div className="premium-header sticky top-0 z-50">
            <Header />
          </div>
          <Paywall 
            feature="Daily Picks"
            onClose={() => setShowPaywall(false)}
          />
          <Footer />
        </GradientBG>
      </div>
    );
  }

  return (
    <div className="betchekr-premium">
      <Head>
        <title>Daily Picks - Expert Betting Analysis | BetChekr</title>
        <meta name="description" content="Expert daily betting picks with mathematical analysis and edge calculations." />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E7EB] mb-3">
              Daily Picks <Crown className="inline w-6 h-6 text-[#F4C430] ml-2" />
            </h1>
            <p className="text-[#9CA3AF] text-sm md:text-base max-w-2xl mx-auto">
              Mathematically analyzed picks with positive expected value
            </p>
          </motion.div>

          {/* Track Record Stats */}
          {trackRecord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="bg-[#141C28] rounded-lg p-4 md:p-6 border border-[#1F2937]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#E5E7EB] font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#F4C430]" />
                    Track Record
                  </h2>
                  <div className="flex gap-1">
                    {periods.map(period => (
                      <button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        className={`px-3 py-1 text-xs rounded transition-all ${
                          selectedPeriod === period.value
                            ? 'bg-[#F4C430] text-[#0B0F14] font-medium'
                            : 'bg-[#0F172A] text-[#9CA3AF] hover:text-[#F4C430]'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0F172A] rounded-lg p-3">
                    <p className="text-[#6B7280] text-xs mb-1">Win Rate</p>
                    <p className="text-[#F4C430] text-xl font-bold">
                      {trackRecord.winRate || '0'}%
                    </p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3">
                    <p className="text-[#6B7280] text-xs mb-1">Total Picks</p>
                    <p className="text-[#E5E7EB] text-xl font-bold">
                      {trackRecord.totalPicks || 0}
                    </p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3">
                    <p className="text-[#6B7280] text-xs mb-1">ROI</p>
                    <p className="text-green-400 text-xl font-bold">
                      +{trackRecord.roi || '0'}%
                    </p>
                  </div>
                  <div className="bg-[#0F172A] rounded-lg p-3">
                    <p className="text-[#6B7280] text-xs mb-1">Avg Edge</p>
                    <p className="text-[#E5E7EB] text-xl font-bold">
                      {trackRecord.avgEdge || '0'}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'today'
                  ? 'bg-[#F4C430] text-[#0B0F14]'
                  : 'bg-[#141C28] text-[#9CA3AF] hover:text-[#F4C430]'
              }`}
            >
              Today's Picks
            </button>
            <button
              onClick={() => setActiveTab('yesterday')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'yesterday'
                  ? 'bg-[#F4C430] text-[#0B0F14]'
                  : 'bg-[#141C28] text-[#9CA3AF] hover:text-[#F4C430]'
              }`}
            >
              Yesterday's Results
            </button>
          </div>

          {/* Today's Picks */}
          {activeTab === 'today' && picks && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Single Pick */}
              {picks.single && (
                <PickCard
                  title="Single Pick"
                  subtitle="Best straight bet"
                  bet={picks.single}
                  onDownload={() => handleDownloadSlip(picks.single, 'single')}
                  icon={<Target className="w-5 h-5" />}
                  accentColor="#F4C430"
                />
              )}

              {/* 2-Leg Parlay */}
              {picks.parlay2 && (
                <PickCard
                  title="2-Leg Parlay"
                  subtitle="Optimal risk/reward"
                  bet={picks.parlay2}
                  onDownload={() => handleDownloadSlip(picks.parlay2, 'parlay2')}
                  icon={<TrendingUp className="w-5 h-5" />}
                  accentColor="#10B981"
                />
              )}

              {/* 4-Leg Parlay */}
              {picks.parlay4 && (
                <PickCard
                  title="4-Leg Parlay"
                  subtitle="High value opportunity"
                  bet={picks.parlay4}
                  onDownload={() => handleDownloadSlip(picks.parlay4, 'parlay4')}
                  icon={<Star className="w-5 h-5" />}
                  accentColor="#8B5CF6"
                />
              )}

              {/* Publication Time */}
              {picks.publishedAt && (
                <div className="text-center text-[#6B7280] text-xs mt-4">
                  <Clock className="inline w-3 h-3 mr-1" />
                  Published at {new Date(picks.publishedAt).toLocaleTimeString()}
                </div>
              )}
            </motion.div>
          )}

          {/* Yesterday's Results */}
          {activeTab === 'yesterday' && yesterdaysPicks && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {yesterdaysPicks.picks?.map((pick, index) => (
                <div
                  key={index}
                  className="bg-[#141C28] rounded-lg border border-[#1F2937] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[#E5E7EB] font-medium">{pick.type}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pick.result === 'won' 
                        ? 'bg-green-500/20 text-green-400'
                        : pick.result === 'lost'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-[#6B7280]/20 text-[#6B7280]'
                    }`}>
                      {pick.result === 'won' ? <Check className="inline w-3 h-3 mr-1" /> : 
                       pick.result === 'lost' ? <X className="inline w-3 h-3 mr-1" /> : null}
                      {pick.result.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {pick.legs?.map((leg, legIndex) => (
                      <div key={legIndex} className="text-[#9CA3AF] text-sm">
                        {leg.selection} • {formatOdds(leg.odds)}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-[#1F2937] text-[#6B7280] text-xs">
                    Edge: {pick.edge}% • Payout: {pick.payout}
                  </div>
                </div>
              ))}
              
              {yesterdaysPicks.summary && (
                <div className="bg-[#0F172A] rounded-lg p-4 text-center">
                  <p className="text-[#9CA3AF] text-sm">
                    Yesterday: {yesterdaysPicks.summary.wins}W - {yesterdaysPicks.summary.losses}L
                    {yesterdaysPicks.summary.profit > 0 ? (
                      <span className="text-green-400 ml-2">+{yesterdaysPicks.summary.profit} units</span>
                    ) : (
                      <span className="text-red-400 ml-2">{yesterdaysPicks.summary.profit} units</span>
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-[#6B7280] mx-auto mb-4 animate-pulse" />
              <p className="text-[#9CA3AF]">Loading picks...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error}</p>
              
              {/* Admin publish button - temporary for testing */}
              {error.includes('No picks published') && (
                <button
                  onClick={publishTodaysPicks}
                  disabled={publishing}
                  className="mt-4 px-6 py-2 bg-[#F4C430] text-[#0B0F14] rounded-lg font-semibold hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? 'Generating...' : 'Generate Today\'s Picks'}
                </button>
              )}
            </div>
          )}
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}

// Pick Card Component
function PickCard({ title, subtitle, bet, onDownload, icon, accentColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#141C28] rounded-lg border border-[#1F2937] overflow-hidden"
    >
      <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1F2937]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ color: accentColor }}>{icon}</div>
            <div>
              <h3 className="text-[#E5E7EB] font-semibold">{title}</h3>
              <p className="text-[#6B7280] text-xs">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#F4C430] font-bold text-lg">
              {formatOdds(bet.totalOdds)}
            </div>
            <div className="text-[#6B7280] text-xs">
              {bet.edgePercentage}% edge
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Bet Legs */}
        <div className="space-y-3 mb-4">
          {bet.legs.map((leg, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[#E5E7EB] text-sm font-medium">
                  {leg.awayTeam} @ {leg.homeTeam}
                </p>
                <p className="text-[#6B7280] text-xs mt-1">
                  {leg.selection} • {leg.marketType}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#E5E7EB] font-mono text-sm">
                  {formatOdds(leg.bestOdds)}
                </p>
                <p className="text-[#6B7280] text-xs">
                  {leg.bestSportsbook}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between py-3 border-t border-[#1F2937]">
          <div className="flex gap-4 text-xs">
            <span className="text-[#6B7280]">
              Win Prob: <span className="text-[#E5E7EB] font-medium">{bet.impliedProbability}%</span>
            </span>
            <span className="text-[#6B7280]">
              Payout: <span className="text-[#E5E7EB] font-medium">{bet.potentialPayout}</span>
            </span>
          </div>
          <button
            onClick={onDownload}
            className="px-3 py-1.5 bg-[#F4C430] text-[#0B0F14] text-xs font-medium rounded hover:bg-[#e6b829] transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function formatOdds(odds) {
  if (typeof odds === 'string') return odds;
  return odds > 0 ? `+${odds}` : odds.toString();
}