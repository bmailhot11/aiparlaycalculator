import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp,
  AlertCircle,
  Check,
  RefreshCw,
  Filter,
  Target,
  Plus,
  Calculator,
  X
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiFetch } from '../utils/api';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';

export default function PositiveEVPage() {
  const { isPremium } = useContext(PremiumContext);
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [isLoading, setIsLoading] = useState(false);
  const [evLines, setEvLines] = useState([]);
  const [userParlay, setUserParlay] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

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

  const sports = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF', 'NCAAB', 'UFC', 'MLS', 'UEFA', 'Tennis'];

  const sampleEVData = [
    {
      game: 'Chiefs vs Bills',
      selection: 'Chiefs ML',
      odds: '+150',
      decimal_odds: 2.50,
      sportsbook: 'DraftKings',
      expected_value: 0.08,
      market_type: 'Moneyline',
      implied_probability: '40%',
      true_probability: '45%'
    },
    {
      game: 'Lakers vs Celtics',
      selection: 'Lakers +5.5',
      odds: '+110',
      decimal_odds: 2.10,
      sportsbook: 'FanDuel',
      expected_value: 0.06,
      market_type: 'Point Spread',
      implied_probability: '47.6%',
      true_probability: '52%'
    }
  ];

  const handleFindEVLines = async () => {
    // Show paywall for free users
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/get-ev-lines', {
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
        console.log('EV API Response:', data);
        setEvLines(data.lines || []);
        setLastRefresh(new Date());
        setError(null);
      } else {
        console.error('EV API Error:', data);
        setError(data.message || 'Failed to fetch EV lines');
        // Don't use sample data - show real error
        setEvLines([]);
      }
    } catch (error) {
      console.error('Error fetching EV lines:', error);
      setError('Network error: Unable to connect to server');
      // Don't use sample data - show real error
      setEvLines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToParlay = (line) => {
    if (userParlay.find(l => l.game === line.game && l.selection === line.selection)) {
      setUserParlay(userParlay.filter(l => !(l.game === line.game && l.selection === line.selection)));
    } else {
      setUserParlay([...userParlay, line]);
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

  const parlayOdds = calculateParlayOdds();

  const handleOptimizeParlay = async () => {
    if (userParlay.length === 0) return;
    
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
      
      if (data.success && data.comparison?.sportsbooks?.length > 0) {
        alert(`Parlay optimized! Best odds found at: ${data.comparison.sportsbooks[0].name}`);
      } else {
        alert('Your current parlay selection appears to have optimal odds already!');
      }
    } catch (error) {
      console.error('Error optimizing parlay:', error);
      alert('Unable to optimize parlay right now. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      {/* Paywall Overlay */}
      {showPaywall && (
        <Paywall 
          feature="positive EV line finder" 
        />
      )}
      
      {/* Hero Section with Background Collage */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Grid */}
        <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-5 gap-2 opacity-20">
          {backgroundImages.map((_, index) => (
            <div 
              key={index}
              className="relative w-full h-32 md:h-40 bg-[#1F2937] rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] to-transparent" />
            </div>
          ))}
        </div>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#0B0F14]/70" />
        
        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center mb-10">
            <h1 className="mb-6">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#F4C430]" />
              Positive EV Lines
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-[720px] mx-auto">
              Find bets with positive expected value across all major sportsbooks in real-time.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* EV Finder Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="card mb-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-[#F4C430]" />
                    <h3 className="text-[#E5E7EB] font-semibold">Select Sport & Find EV Lines</h3>
                  </div>
                  
                  {/* Sport Selection */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {sports.map(sport => (
                      <button
                        key={sport}
                        onClick={() => setSelectedSport(sport)}
                        className={`py-2 px-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                          selectedSport === sport
                            ? 'bg-[#F4C430] text-[#0B0F14]'
                            : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#253044]'
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                  
                  {/* CTA */}
                  <div className="flex gap-3">
                    <button 
                      onClick={handleFindEVLines}
                      disabled={isLoading}
                      className="btn btn-primary flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin mr-2" />
                          Finding EV Lines...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Find Positive EV Lines
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleFindEVLines}
                      className="btn btn-outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                  
                  {/* Premium Note */}
                  <p className="text-[#6B7280] text-xs text-center">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Real-time EV scanning requires Premium subscription.
                  </p>
                  
                  {/* Last Refresh */}
                  {/* Error Display */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    </div>
                  )}
                  
                  {lastRefresh && (
                    <p className="text-[#6B7280] text-xs text-center">
                      Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* EV Lines Results */}
              {evLines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="card"
                >
                  <h3 className="text-[#E5E7EB] font-semibold mb-4 flex items-center justify-between">
                    <span>Positive EV Lines - {selectedSport}</span>
                    {!isPremium && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                        Limited to 3 lines
                      </span>
                    )}
                  </h3>
                  
                  <div className="space-y-4">
                    {evLines.slice(0, isPremium ? evLines.length : 3).map((line, index) => {
                      const isInParlay = userParlay.find(l => l.game === line.game && l.selection === line.selection);
                      
                      return (
                        <div key={index} className="p-3 sm:p-4 bg-[#0B1220] rounded-lg border border-[#1F2937]">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                  +{(line.expected_value * 100).toFixed(1)}% EV
                                </span>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                                  {line.sportsbook}
                                </span>
                              </div>
                              <h4 className="text-[#E5E7EB] font-medium mb-1 text-sm sm:text-base break-words">{line.game}</h4>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                <span className="text-green-400 font-medium text-sm sm:text-base">{line.selection}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-[#F4C430] font-bold">{line.odds}</span>
                                  <span className="text-[#6B7280] text-xs sm:text-sm">{line.market_type}</span>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-[#6B7280]">
                                <span>Implied: {line.implied_probability}</span>
                                <span>True: {line.true_probability}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => addToParlay(line)}
                              className={`mt-3 sm:mt-0 sm:ml-4 p-2 rounded-lg transition-all self-end sm:self-auto ${
                                isInParlay
                                  ? 'bg-green-600 text-white'
                                  : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#253044]'
                              }`}
                            >
                              {isInParlay ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!isPremium && evLines.length > 3 && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
                      <p className="text-yellow-400 font-medium mb-2">
                        {evLines.length - 3} more positive EV lines available
                      </p>
                      <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600">
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Parlay Builder Sidebar */}
            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="card lg:sticky lg:top-24"
              >
                <h3 className="text-[#E5E7EB] font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#F4C430]" />
                    Your EV Parlay
                  </span>
                  {userParlay.length > 0 && (
                    <button
                      onClick={() => setUserParlay([])}
                      className="text-[#6B7280] hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </h3>

                {userParlay.length === 0 ? (
                  <div className="text-center py-8 text-[#6B7280]">
                    <Plus className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>Click + to add lines to your parlay</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {userParlay.map((line, index) => (
                        <div key={index} className="p-3 bg-[#0B1220] rounded-lg border border-[#1F2937]">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-[#E5E7EB] font-medium text-sm">{line.selection}</div>
                              <div className="text-[#6B7280] text-xs">{line.game}</div>
                            </div>
                            <div className="text-green-400 font-bold ml-2">{line.odds}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#1F2937] pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Total Legs:</span>
                        <span className="text-[#E5E7EB] font-medium">{userParlay.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Parlay Odds:</span>
                        <span className="text-[#F4C430] font-bold">{parlayOdds.american}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Implied Probability:</span>
                        <span className="text-[#E5E7EB]">{parlayOdds.probability}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B7280]">Total EV:</span>
                        <span className="text-green-400 font-medium">
                          +{(userParlay.reduce((acc, line) => acc + (line.expected_value || 0), 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={handleOptimizeParlay}
                      disabled={userParlay.length === 0}
                      className="w-full mt-4 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Optimize Parlay
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
      
      <Footer />
    </div>
  );
}