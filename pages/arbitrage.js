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
import { PremiumContext } from './_app';

export default function ArbitragePage() {
  const { isPremium } = useContext(PremiumContext);
  const [isLoading, setIsLoading] = useState(false);
  const [arbitrageData, setArbitrageData] = useState([]);
  const [selectedSports, setSelectedSports] = useState(['NFL']);
  const [minProfit, setMinProfit] = useState('1');

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
      if (!game.bookmakers || game.bookmakers.length < 2) {
        console.log('Skipping game - insufficient bookmakers:', game.away_team, game.home_team);
        continue;
      }
      
      // Find H2H markets
      const h2hBooks = game.bookmakers.filter(book => 
        book.markets?.some(market => market.key === 'h2h')
      );
      
      if (h2hBooks.length < 2) continue;
      
      // Get all H2H odds for this game
      const allOdds = [];
      h2hBooks.forEach(book => {
        const h2hMarket = book.markets.find(m => m.key === 'h2h');
        if (h2hMarket?.outcomes) {
          h2hMarket.outcomes.forEach(outcome => {
            const decimal = outcome.price > 0 ? (outcome.price / 100) + 1 : (100 / Math.abs(outcome.price)) + 1;
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
      
      // Find arbitrage opportunities
      const teams = [...new Set(allOdds.map(o => o.team))];
      if (teams.length >= 2) {
        // Get best odds for each team
        const bestOdds = teams.map(team => {
          const teamOdds = allOdds.filter(o => o.team === team);
          return teamOdds.reduce((best, current) => 
            current.decimal > best.decimal ? current : best
          );
        });
        
        if (bestOdds.length >= 2) {
          // Calculate if arbitrage exists
          const totalImplied = bestOdds.reduce((sum, odd) => sum + (1/odd.decimal), 0);
          
          if (totalImplied < 1) {
            // Arbitrage opportunity found!
            const profit = (1 - totalImplied) * 100;
            const totalStake = 100;
            
            arbitrages.push({
              id: arbitrages.length + 1,
              sport: game.sport || 'Unknown',
              game: `${game.away_team} vs ${game.home_team}`,
              market: 'Moneyline',
              book1: { 
                name: bestOdds[0].book, 
                odds: bestOdds[0].odds > 0 ? `+${bestOdds[0].odds}` : `${bestOdds[0].odds}`, 
                bet: bestOdds[0].team 
              },
              book2: { 
                name: bestOdds[1].book, 
                odds: bestOdds[1].odds > 0 ? `+${bestOdds[1].odds}` : `${bestOdds[1].odds}`, 
                bet: bestOdds[1].team 
              },
              profit: profit.toFixed(1),
              stake: totalStake
            });
          }
        }
      }
    }
    
    return arbitrages;
  };

  const handleCalculateStakes = (arbitrage) => {
    const totalStake = parseFloat(arbitrage.stake) || 100;
    const book1Decimal = arbitrage.book1.odds.startsWith('+') ? 
      (parseInt(arbitrage.book1.odds.slice(1)) / 100) + 1 : 
      (100 / Math.abs(parseInt(arbitrage.book1.odds))) + 1;
    const book2Decimal = arbitrage.book2.odds.startsWith('+') ? 
      (parseInt(arbitrage.book2.odds.slice(1)) / 100) + 1 : 
      (100 / Math.abs(parseInt(arbitrage.book2.odds))) + 1;
    
    const book1Stake = totalStake / (1 + (book1Decimal / book2Decimal));
    const book2Stake = totalStake - book1Stake;
    
    alert(`Optimal Stakes:\n${arbitrage.book1.name}: $${book1Stake.toFixed(2)}\n${arbitrage.book2.name}: $${book2Stake.toFixed(2)}\nTotal: $${totalStake}\nProfit: $${arbitrage.profit}`);
  };

  const handlePlaceBets = (arbitrage) => {
    alert(`This feature would redirect you to:\n\n1. ${arbitrage.book1.name} to bet on ${arbitrage.book1.bet}\n2. ${arbitrage.book2.name} to bet on ${arbitrage.book2.bet}\n\nPlease place bets manually on each sportsbook.`);
  };

  const handleFindArbitrages = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/live-odds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: selectedSports.includes('all') ? 'NFL' : selectedSports[0] || 'NFL'
        }),
      });

      const data = await response.json();
      
      console.log('Live odds response:', data);
      
      if (response.ok && data.success && data.odds?.length > 0) {
        // Calculate arbitrage opportunities from live odds
        console.log('Calculating arbitrage from', data.odds.length, 'games');
        const arbitrageOpps = calculateArbitrageOpportunities(data.odds);
        console.log('Found', arbitrageOpps.length, 'arbitrage opportunities');
        
        if (arbitrageOpps.length > 0) {
          setArbitrageData(arbitrageOpps);
        } else {
          setArbitrageData([]);
        }
      } else {
        console.log('No live data available');
        setArbitrageData([]);
      }
    } catch (error) {
      console.error('Error fetching arbitrage data:', error);
      setArbitrageData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
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
            <Target className="w-16 h-16 mx-auto mb-4 text-[#F4C430]" />
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
            {/* Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-[#F4C430]" />
                <h3 className="text-[#E5E7EB] font-semibold">Filter Options</h3>
              </div>
              
              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={selectedSports[0]}
                  onChange={(e) => setSelectedSports([e.target.value])}
                  className="select"
                >
                  <option value="all">All Sports</option>
                  <option value="nfl">NFL</option>
                  <option value="nba">NBA</option>
                  <option value="mlb">MLB</option>
                  <option value="nhl">NHL</option>
                </select>
                <input
                  type="number"
                  value={minProfit}
                  onChange={(e) => setMinProfit(e.target.value)}
                  placeholder="Min Profit %"
                  className="input"
                  min="0"
                  step="0.1"
                />
                <input
                  type="number"
                  value={100}
                  readOnly
                  placeholder="Stake Amount ($)"
                  className="input bg-[#1F2937] text-[#6B7280]"
                />
              </div>
              
              {/* CTA */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleFindArbitrages}
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin mr-2" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Find Arbitrage Opportunities
                    </>
                  )}
                </button>
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
                      <div key={arb.id} className="p-4 bg-[#0B1220] rounded-lg border border-[#1F2937]">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-[#E5E7EB] font-medium">{arb.game}</h4>
                            <p className="text-[#6B7280] text-sm">{arb.sport} • {arb.market}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-green-400 font-semibold text-lg">+{arb.profit}%</span>
                            <p className="text-[#6B7280] text-sm">Profit</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-[#0F172A] rounded border border-[#1F2937]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[#D1D5DB] font-medium text-sm">{arb.book1.name}</span>
                              <span className="text-[#F4C430] font-semibold">{arb.book1.odds}</span>
                            </div>
                            <p className="text-[#9CA3AF] text-xs break-words">{arb.book1.bet}</p>
                          </div>
                          
                          <div className="p-3 bg-[#0F172A] rounded border border-[#1F2937]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[#D1D5DB] font-medium text-sm">{arb.book2.name}</span>
                              <span className="text-[#F4C430] font-semibold">{arb.book2.odds}</span>
                            </div>
                            <p className="text-[#9CA3AF] text-xs break-words">{arb.book2.bet}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => handleCalculateStakes(arb)}
                            className="btn btn-outline text-sm flex-1"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Calculate Stakes
                          </button>
                          <button 
                            onClick={() => handlePlaceBets(arb)}
                            className="btn btn-primary text-sm flex-1"
                          >
                            Place Bets
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
    </div>
  );
}