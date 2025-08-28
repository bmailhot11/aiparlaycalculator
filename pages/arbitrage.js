import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target,
  TrendingUp,
  AlertCircle,
  Check,
  RefreshCw,
  Filter
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import { apiFetch } from '../utils/api';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';
import { useAuth } from '../contexts/AuthContext';

export default function ArbitragePage() {
  const { isPremium } = useContext(PremiumContext);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [arbitrageData, setArbitrageData] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [notification, setNotification] = useState(null);
  const [arbitrageUsesLeft, setArbitrageUsesLeft] = useState(null);

  // Check arbitrage usage on component mount
  useEffect(() => {
    if (user && !isPremium) {
      checkArbitrageUsage();
    } else if (isPremium) {
      setArbitrageUsesLeft('unlimited');
    }
  }, [user, isPremium]);

  const checkArbitrageUsage = () => {
    try {
      const usageKey = `arbitrage_usage_${user.id}`;
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      // Reset daily if it's a new day
      const today = new Date().toDateString();
      if (usageData.lastReset !== today) {
        usageData.count = 0;
        usageData.lastReset = today;
        localStorage.setItem(usageKey, JSON.stringify(usageData));
      }
      
      const remaining = Math.max(0, 1 - usageData.count);
      setArbitrageUsesLeft(remaining);
    } catch (error) {
      console.error('Error checking arbitrage usage:', error);
      setArbitrageUsesLeft(0);
    }
  };

  const incrementArbitrageUsage = () => {
    try {
      const usageKey = `arbitrage_usage_${user.id}`;
      const usage = localStorage.getItem(usageKey);
      const usageData = usage ? JSON.parse(usage) : { count: 0, lastReset: new Date().toDateString() };
      
      usageData.count += 1;
      localStorage.setItem(usageKey, JSON.stringify(usageData));
      
      const remaining = Math.max(0, 1 - usageData.count);
      setArbitrageUsesLeft(remaining);
    } catch (error) {
      console.error('Error incrementing arbitrage usage:', error);
    }
  };

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


  const calculateArbitrageOpportunities = (oddsData) => {
    const arbitrages = [];
    
    if (!Array.isArray(oddsData)) {
      console.log('Invalid odds data format:', oddsData);
      return arbitrages;
    }
    
    for (const game of oddsData) {
      // Enhanced validation
      if (!game || !game.bookmakers || !Array.isArray(game.bookmakers) || game.bookmakers.length < 2) {
        console.log('Skipping game - insufficient bookmakers:', game?.away_team, game?.home_team);
        continue;
      }

      if (!game.away_team || !game.home_team) {
        console.log('Skipping game - missing team information');
        continue;
      }
      
      // Find H2H markets with validation
      const h2hBooks = game.bookmakers.filter(book => 
        book && book.markets && Array.isArray(book.markets) && 
        book.markets.some(market => market && market.key === 'h2h')
      );
      
      if (h2hBooks.length < 2) continue;
      
      // Get all H2H odds for this game
      const allOdds = [];
      h2hBooks.forEach(book => {
        const h2hMarket = book.markets.find(m => m && m.key === 'h2h');
        if (h2hMarket?.outcomes && Array.isArray(h2hMarket.outcomes)) {
          h2hMarket.outcomes.forEach(outcome => {
            if (!outcome || typeof outcome.price !== 'number' || !outcome.name) {
              return; // Skip invalid outcomes
            }
            
            const decimal = convertAmericanToDecimal(outcome.price);
            if (decimal <= 1) {
              console.log(`Invalid decimal odds: ${decimal} for ${outcome.name}`);
              return;
            }
            
            allOdds.push({
              book: book.title,
              team: outcome.name,
              odds: outcome.price,
              decimal: decimal
            });
            console.log(`Added odds: ${outcome.name} @ ${book.title} = ${outcome.price} (${decimal.toFixed(2)})`);
          });
        }
      });
      
      // Find arbitrage opportunities with enhanced validation
      const teams = [...new Set(allOdds.map(o => o.team).filter(team => team))];
      if (teams.length >= 2) {
        // Get best odds for each team
        const bestOdds = teams.map(team => {
          const teamOdds = allOdds.filter(o => o.team === team && o.decimal > 1);
          if (teamOdds.length === 0) return null;
          
          return teamOdds.reduce((best, current) => 
            current.decimal > best.decimal ? current : best
          );
        }).filter(odds => odds !== null);
        
        if (bestOdds.length >= 2) {
          // Calculate if arbitrage exists
          const totalImplied = bestOdds.reduce((sum, odd) => sum + (1/odd.decimal), 0);
          
          if (totalImplied < 1 && totalImplied > 0) {
            // Arbitrage opportunity found!
            const profit = (1 - totalImplied) * 100;
            const totalStake = 100;
            
            // Additional validation - ensure profit is reasonable
            if (profit > 0 && profit < 50) { // Cap at 50% to avoid unrealistic opportunities
              arbitrages.push({
                id: `arb_${game.id || Date.now()}_${arbitrages.length}`,
                sport: game.sport || 'Unknown',
                game: `${game.away_team} vs ${game.home_team}`,
                market: 'Moneyline',
                commence_time: game.commence_time,
                book1: { 
                  name: bestOdds[0].book, 
                  odds: bestOdds[0].odds > 0 ? `+${bestOdds[0].odds}` : `${bestOdds[0].odds}`, 
                  bet: bestOdds[0].team,
                  decimal: bestOdds[0].decimal
                },
                book2: { 
                  name: bestOdds[1].book, 
                  odds: bestOdds[1].odds > 0 ? `+${bestOdds[1].odds}` : `${bestOdds[1].odds}`, 
                  bet: bestOdds[1].team,
                  decimal: bestOdds[1].decimal
                },
                profit: profit.toFixed(2),
                profit_percentage: profit.toFixed(2),
                total_implied_prob: (totalImplied * 100).toFixed(2),
                stake: totalStake,
                last_updated: new Date().toISOString()
              });
            }
          }
        }
      }
    }
    
    return arbitrages;
  };

  const convertAmericanToDecimal = (americanOdds) => {
    const odds = parseInt(americanOdds.toString().replace('+', ''));
    return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
  };

  const handleCalculateStakes = (arbitrage) => {
    const totalStake = parseFloat(arbitrage.stake) || 100;
    
    if (!arbitrage.book1?.odds || !arbitrage.book2?.odds) {
      setNotification({ type: 'error', message: 'Invalid odds data. Please refresh and try again.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const book1Decimal = convertAmericanToDecimal(arbitrage.book1.odds);
    const book2Decimal = convertAmericanToDecimal(arbitrage.book2.odds);
    
    // Correct arbitrage stake calculation formula
    const totalImplied = (1 / book1Decimal) + (1 / book2Decimal);
    
    if (totalImplied >= 1) {
      setNotification({ type: 'error', message: 'No arbitrage opportunity exists with these odds.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const book1Stake = totalStake * (1 / book1Decimal) / totalImplied;
    const book2Stake = totalStake * (1 / book2Decimal) / totalImplied;
    
    // Calculate expected return
    const profit1 = (book1Stake * book1Decimal) - totalStake;
    const profit2 = (book2Stake * book2Decimal) - totalStake;
    const expectedReturn = Math.min(profit1, profit2);
    
    setNotification({ 
      type: 'success', 
      message: `Optimal Stakes - ${arbitrage.book1.name}: $${book1Stake.toFixed(2)}, ${arbitrage.book2.name}: $${book2Stake.toFixed(2)}. Expected Return: $${expectedReturn.toFixed(2)} (${((expectedReturn/totalStake)*100).toFixed(2)}%)` 
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePlaceBets = (arbitrage) => {
    setNotification({ 
      type: 'info', 
      message: `Place bets manually: 1. ${arbitrage.book1.name} - ${arbitrage.book1.bet}, 2. ${arbitrage.book2.name} - ${arbitrage.book2.bet}` 
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFindArbitrages = async () => {
    // Check if user is authenticated first
    if (!user) {
      setShowPaywall(true);
      return;
    }
    
    // Check usage limits for non-premium users
    if (!isPremium) {
      if (arbitrageUsesLeft === null) {
        // Still loading usage data
        setNotification({ 
          type: 'info', 
          message: 'Loading usage data...' 
        });
        setTimeout(() => setNotification(null), 2000);
        return;
      }
      
      if (arbitrageUsesLeft <= 0) {
        setShowPaywall(true);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Set a longer timeout for scanning all sports
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await apiFetch('/api/arbitrage/find-opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: null,
          includeAllSports: true
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      console.log('Arbitrage response:', data);
      
      if (response.ok && data.success) {
        console.log(`Found ${data.opportunities.length} arbitrage opportunities from ${data.total_games_checked} games`);
        // Use real API data with proper structure, fallback to mock data if needed
        const opportunities = data.opportunities || [];
        
        // Transform API data to match frontend expectations
        const transformedData = opportunities.map(opp => {
          try {
            return {
              id: opp.id || `arb_${Date.now()}`,
              sport: opp.sport || 'Unknown',
              game: opp.matchup || opp.game || 'Unknown Match',
              matchup: opp.matchup || opp.game || 'Unknown Match', // For render compatibility
              market: opp.market_display || opp.market_type || 'Unknown Market',
              market_display: opp.market_display || opp.market_type || 'Unknown Market', // For render compatibility
              commence_time: opp.commence_time,
              legs: opp.legs || [], // Include all legs for display
              expected_return: parseFloat(opp.guaranteed_profit) || 0, // For render compatibility
              investment_needed: opp.investment_needed || 100, // For render compatibility
              book1: {
                name: opp.legs?.[0]?.sportsbook || 'Unknown Book',
                odds: opp.legs?.[0]?.american_odds || 100,
                bet: opp.legs?.[0]?.selection || 'Unknown Selection',
                decimal: opp.legs?.[0]?.decimal_odds || '2.00'
              },
              book2: {
                name: opp.legs?.[1]?.sportsbook || 'Unknown Book',
                odds: opp.legs?.[1]?.american_odds || 100,
                bet: opp.legs?.[1]?.selection || 'Unknown Selection',  
                decimal: opp.legs?.[1]?.decimal_odds || '2.00'
              },
              profit: parseFloat(opp.profit_percentage) || parseFloat(opp.expected_return) || 0,
              profit_percentage: parseFloat(opp.profit_percentage) || 0,
              total_implied_prob: opp.total_implied_prob || '100%',
              stake: opp.investment_needed || 100,
              stake_distribution: opp.stake_distribution || [],
              last_updated: opp.timestamp || new Date().toISOString()
            };
          } catch (error) {
            console.error('Error transforming arbitrage opportunity:', error, opp);
            return null;
          }
        }).filter(Boolean); // Remove any null entries from transformation errors
        
        setArbitrageData(transformedData);
        
        // Increment usage for non-premium users
        if (!isPremium && user) {
          incrementArbitrageUsage();
        }
        
        // Show notification based on results
        if (transformedData.length === 0) {
          let message = `No arbitrage opportunities found. Checked ${data.total_games_checked || 0} games across ${data.books_checked || 'multiple'} sportsbooks.`;
          if (!isPremium && arbitrageUsesLeft === 1) {
            message += ` You have used your free daily search.`;
          }
          setNotification({ 
            type: 'info', 
            message: message
          });
          setTimeout(() => setNotification(null), 4000);
        } else {
          let message = `Found ${transformedData.length} arbitrage opportunities!`;
          if (!isPremium && arbitrageUsesLeft === 1) {
            message += ` You have used your free daily search.`;
          }
          setNotification({ 
            type: 'success', 
            message: message
          });
          setTimeout(() => setNotification(null), 3000);
        }
      } else {
        console.log('No arbitrage data available');
        setArbitrageData([]);
        setNotification({ 
          type: 'info', 
          message: 'No arbitrage opportunities available at this time. Try again later.' 
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error fetching arbitrage data:', error);
      setArbitrageData([]);
      
      let errorMessage = 'Error fetching arbitrage data. Please try again.';
      if (error.name === 'AbortError') {
        errorMessage = 'Search timed out after 30 seconds. The dataset is large, please try again.';
      }
      
      setNotification({ 
        type: 'error', 
        message: errorMessage 
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotifyMe = async (arbitrage) => {
    if (!user) {
      setShowPaywall(true);
      return;
    }
    
    // Premium check can be added here later
    // if (!isPremium) {
    //   setShowPaywall(true);
    //   return;
    // }

    try {
      // Get user email from auth context or prompt
      const userEmail = user?.email;
      if (!userEmail) return;

      console.log('Sending arbitrage notification...');
      
      const response = await apiFetch('/api/arbitrage/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          arbitrageData: arbitrage,
          userPremiumStatus: { isPremium: true }
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setNotification({ type: 'success', message: 'Arbitrage alert sent to your email successfully!' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: 'Failed to send alert: ' + (data.error || 'Unknown error') });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotification({ type: 'error', message: 'Error sending notification. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="betchekr-premium">
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-opacity ${
          notification.type === 'success' ? 'bg-green-600' : 
          notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`}>
          <p className="text-sm">{notification.message}</p>
        </div>
      )}
      
      {/* Paywall Overlay */}
      {showPaywall && (
        <Paywall 
          feature="arbitrage finder"
          usageLimit={!user ? null : "1 free search per day"}
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
          className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h1 className="mb-6">
            Find Arbitrage Opportunities
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-[720px] mx-auto mb-10">
            Cross-book mismatches in real time to guarantee profit regardless of outcome.
          </p>
          
          {/* Arbitrage Finder Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="card max-w-[800px] mx-auto"
          >
            {/* Arbitrage Finder */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-[#F4C430]" />
                <h3 className="text-[#E5E7EB] font-semibold">Find Arbitrage Opportunities</h3>
              </div>
              
              <button 
                  onClick={handleFindArbitrages}
                  disabled={isLoading}
                  className="w-full bg-[#F4C430] text-[#0B0F14] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin mr-2" />
                      Scanning All Sports & Leagues...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Find Arbitrage Opportunities
                    </>
                  )}
                </button>
              
              <div className="text-center">
                <p className="text-[#6B7280] text-sm mb-2">
                  Scanning all available sports and leagues for positive return opportunities
                </p>
                {!isPremium && user && arbitrageUsesLeft !== null && (
                  <p className="text-[#F4C430] text-xs font-medium">
                    {arbitrageUsesLeft === 'unlimited' 
                      ? 'Unlimited searches' 
                      : arbitrageUsesLeft > 0 
                        ? `${arbitrageUsesLeft} free search remaining today`
                        : 'No free searches remaining - upgrade for unlimited access'
                    }
                  </p>
                )}
              </div>
              
              {/* Premium Note */}
              <p className="text-[#6B7280] text-xs text-center">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Real-time arbitrage scanning requires Premium subscription.
              </p>
              
              {/* Arbitrage Results */}
              {arbitrageData.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6"
                >
                  <h3 className="text-[#E5E7EB] font-semibold mb-4">Live Arbitrage Opportunities</h3>
                  <div className="space-y-4">
                    {arbitrageData.map((arb) => (
                      <div key={arb.id} className="p-4 bg-[#0B1220] rounded-lg border border-[#1F2937] hover:border-[#F4C430]/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-[#E5E7EB] font-medium">{arb.matchup}</h4>
                            <p className="text-[#6B7280] text-sm">{arb.sport} • {arb.market_display}</p>
                            <p className="text-[#6B7280] text-xs">{new Date(arb.commence_time).toLocaleDateString()} {new Date(arb.commence_time).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-green-400 font-semibold text-xl">+{arb.profit_percentage}%</span>
                            <p className="text-[#6B7280] text-sm">Expected Return</p>
                            <p className="text-[#F4C430] text-sm">${arb.expected_return}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {(arb.legs || []).map((leg, index) => (
                            <div key={index} className="p-3 bg-[#0F172A] rounded border border-[#1F2937]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[#D1D5DB] font-medium text-sm">{leg?.sportsbook || 'Unknown Book'}</span>
                                <span className="text-[#F4C430] font-semibold">{(leg?.american_odds || 0) > 0 ? '+' : ''}{leg?.american_odds || 0}</span>
                              </div>
                              <p className="text-[#9CA3AF] text-xs break-words">{leg?.selection || 'Unknown Selection'}</p>
                              <p className="text-[#6B7280] text-xs">Decimal: {leg?.decimal_odds || '2.00'} • Implied: {leg?.implied_prob || '50%'}</p>
                            </div>
                          ))}
                        </div>

                        {/* Stakes Breakdown */}
                        <div className="bg-[#0F172A] rounded p-3 mb-4">
                          <h5 className="text-[#E5E7EB] font-medium text-sm mb-2">Optimal Stakes (${arb.investment_needed} total)</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(arb.stake_distribution || []).map((stake, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-[#9CA3AF]">{stake?.sportsbook || 'Book'}:</span>
                                <span className="text-[#F4C430] font-medium">{stake?.stake || '$0'} → {stake?.payout || '$0'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleNotifyMe(arb)}
                            className="btn btn-outline text-sm flex-1"
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Notify Me
                          </button>
                          <button 
                            onClick={() => {
                              const stakeInfo = arb.stake_distribution.map(s => `${s.sportsbook}: ${s.stake} on ${s.selection}`).join('\n');
                              alert(`🎯 Arbitrage Instructions:\n\n${stakeInfo}\n\nTotal Investment: $${arb.investment_needed}\nExpected Return: $${arb.expected_return} (${arb.profit_percentage}%)\n\nPlace these bets quickly - odds may change!`);
                            }}
                            className="btn btn-primary text-sm flex-1"
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Show Stakes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                arbitrageData.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-6 bg-[#0B1220] rounded-lg border border-[#1F2937] text-center"
                  >
                    <Target className="w-12 h-12 mx-auto mb-3 text-[#6B7280]" />
                    <h3 className="text-[#E5E7EB] font-medium mb-2">No Arbitrage Opportunities Found</h3>
                    <p className="text-[#9CA3AF] text-sm">
                      No cross-book mismatches available right now. Try again in a few minutes or check a different sport.
                    </p>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
        
        <Footer />
      </GradientBG>
    </div>
  );
}