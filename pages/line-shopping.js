import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { 
  Search,
  TrendingUp,
  Target,
  Lock,
  Crown,
  RefreshCw,
  Filter,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Paywall from '../components/Paywall';
import { PremiumContext } from './_app';

export default function LineShopping() {
  const { isPremium } = useContext(PremiumContext);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [marketType, setMarketType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const sports = [
    { value: 'NFL', label: 'NFL' },
    { value: 'NBA', label: 'NBA' },
    { value: 'NHL', label: 'NHL' },
    { value: 'MLB', label: 'MLB' },
    { value: 'NCAAF', label: 'NCAAF' },
    { value: 'NCAAB', label: 'NCAAB' },
    { value: 'UFC', label: 'UFC' }
  ];

  const marketTypes = [
    { value: 'all', label: 'All' },
    { value: 'h2h', label: 'ML' },
    { value: 'spreads', label: 'Spread' },
    { value: 'totals', label: 'Total' },
    { value: 'player_props', label: 'Player Props' }
  ];

  const timeFilters = [
    { value: '1d', label: 'Today' },
    { value: '3d', label: 'Next 3 Days' },
    { value: '7d', label: 'This Week' },
    { value: 'all', label: 'All Games' }
  ];


  // Fetch available teams when sport changes
  const fetchTeams = async (sport) => {
    if (!sport) return;
    
    try {
      const response = await fetch(`/api/line-shopping?sport=${sport}&getTeams=true`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableTeams(data.teams || []);
        setAvailableGames(data.games || []); // All games initially
      } else {
        setAvailableTeams([]);
        setAvailableGames([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setAvailableTeams([]);
      setAvailableGames([]);
    }
  };

  // Filter games based on selected team
  const getFilteredGames = () => {
    if (!selectedTeam || !Array.isArray(availableGames)) {
      return availableGames; // Show all games if no team selected
    }
    
    // Filter games that include the selected team
    return availableGames.filter(game => {
      if (!game?.label) return false;
      const gameLabel = game.label.toLowerCase();
      const teamName = selectedTeam.toLowerCase();
      return gameLabel.includes(teamName);
    });
  };

  // Handle team selection - clear game selection when team changes
  const handleTeamChange = (team) => {
    setSelectedTeam(team);
    setSelectedGame(''); // Clear game selection when team changes
  };

  // Fetch line shopping data
  const fetchLines = async () => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    if (!selectedSport) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sport: selectedSport,
        ...(selectedTeam && { team: selectedTeam }),
        ...(selectedGame && { game: selectedGame }),
        ...(marketType !== 'all' && { market: marketType }),
        ...(timeFilter !== 'all' && { timeFilter })
      });

      const response = await fetch(`/api/line-shopping?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLines(Array.isArray(data.lines) ? data.lines : []);
        setLastUpdated(new Date());
      } else {
        console.error('API returned error:', data.message);
        setLines([]);
      }
    } catch (error) {
      console.error('Error fetching lines:', error);
      setLines([]);
      // You could also show a user-friendly error message here
    } finally {
      setLoading(false);
    }
  };

  // Load teams when sport changes
  useEffect(() => {
    if (selectedSport) {
      fetchTeams(selectedSport);
      handleTeamChange(''); // Use the handler to properly clear team and game
      setLines([]);
    }
  }, [selectedSport]);

  const handleSearch = () => {
    if (!selectedSport) {
      alert('Please select a sport first');
      return;
    }
    fetchLines();
  };

  // Group lines by selection for comparison
  const groupedLines = () => {
    try {
      const groups = {};
      
      if (!Array.isArray(lines)) {
        return [];
      }
      
      lines.forEach(line => {
        // Safety checks for required properties
        if (!line || !line.game || !line.market_type || !line.selection) {
          return;
        }
        
        const key = `${line.game}_${line.market_type}_${line.selection}_${line.point || 'no_point'}`;
        if (!groups[key]) {
          groups[key] = {
            game: line.game,
            game_id: line.game_id,
            market: line.market_display || line.market_type,
            selection: line.selection,
            point: line.point,
            commence_time: line.commence_time,
            books: []
          };
        }
        
        groups[key].books.push({
          name: line.sportsbook || 'Unknown',
          odds: line.american_odds || 0,
          americanOdds: line.american_odds || 0,
          value: line.expected_value || 0,
          deviation: line.pinnacle_deviation || 0
        });
      });
      
      // Sort books by best odds (safely)
      Object.values(groups).forEach(group => {
        if (group.books && Array.isArray(group.books)) {
          group.books.sort((a, b) => (b.americanOdds || 0) - (a.americanOdds || 0));
        }
      });
      
      return Object.values(groups);
    } catch (error) {
      console.error('Error in groupedLines:', error);
      return [];
    }
  };

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : odds;
  };

  const formatGameDate = (commenceTime) => {
    if (!commenceTime) return '';
    
    const gameDate = new Date(commenceTime);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const gameDay = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
    
    // Check if it's today, tomorrow, or another day
    if (gameDay.getTime() === today.getTime()) {
      return `Today ${gameDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`;
    } else if (gameDay.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${gameDate.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`;
    } else {
      return gameDate.toLocaleDateString([], {
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit'
      });
    }
  };


  return (
    <div className="betchekr-premium">
      <Head>
        <title>Line Shopping - Compare Odds | BetChekr</title>
        <meta name="description" content="Compare betting lines across all major sportsbooks" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
              Line Shopping <Crown className="inline w-6 h-6 text-[#F4C430] ml-2" />
            </h1>
            <p className="text-[#9CA3AF] text-sm md:text-base max-w-2xl mx-auto">
              Compare odds across all sportsbooks to find the best value
            </p>
          </motion.div>

          {/* Sport Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-[#E5E7EB] font-medium mb-3 text-center">Select a Sport</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 md:gap-3 max-w-3xl mx-auto">
              {sports.map(sport => (
                <button
                  key={sport.value}
                  onClick={() => setSelectedSport(sport.value)}
                  className={`p-4 md:p-4 rounded-lg border transition-all min-h-[44px] text-sm ${
                    selectedSport === sport.value
                      ? 'bg-[#F4C430] border-[#F4C430] text-[#0B0F14]'
                      : 'bg-[#141C28] border-[#1F2937] text-[#9CA3AF] hover:border-[#F4C430]/50'
                  }`}
                >
                  <div className="text-sm font-medium leading-tight">{sport.label}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Filter Section */}
          {selectedSport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="max-w-5xl mx-auto">
                <div className="bg-[#141C28] rounded-lg p-4 border border-[#1F2937]">
                  <h3 className="text-[#E5E7EB] font-medium mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    {/* Team Filter */}
                    <div>
                      <label className="block text-[#9CA3AF] text-sm mb-2">Team</label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => handleTeamChange(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#F4C430]/50 min-h-[44px] text-sm sm:text-base"
                      >
                        <option value="">All Teams</option>
                        {Array.isArray(availableTeams) && availableTeams.map((team, index) => (
                          <option key={team || index} value={team || ''}>{team || 'Unknown Team'}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time Filter */}
                    <div>
                      <label className="block text-[#9CA3AF] text-sm mb-2">Time Frame</label>
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#F4C430]/50 min-h-[44px] text-sm sm:text-base"
                      >
                        {timeFilters.map(filter => (
                          <option key={filter.value} value={filter.value}>{filter.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Market Type Filter */}
                    <div>
                      <label className="block text-[#9CA3AF] text-sm mb-2">Market Type</label>
                      <select
                        value={marketType}
                        onChange={(e) => setMarketType(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#F4C430]/50 min-h-[44px] text-sm sm:text-base"
                      >
                        {marketTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full px-6 py-4 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search Lines
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Section */}
          {lines.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-center text-[#6B7280] text-xs mb-4">
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}

              {/* Line Comparisons */}
              <div className="space-y-3">
                {groupedLines().map((group, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#141C28] rounded-lg border border-[#1F2937] overflow-hidden"
                  >
                    {/* Game Header */}
                    <div className="bg-[#0F172A] px-4 py-3 border-b border-[#1F2937]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[#E5E7EB] font-medium text-sm md:text-base">
                            {group.game}
                          </h3>
                          <p className="text-[#6B7280] text-xs mt-1">
                            {group.market} • {group.selection}{group.point ? ` ${group.point}` : ''}
                          </p>
                          {group.commence_time && (
                            <p className="text-[#9CA3AF] text-xs mt-1">
                              {formatGameDate(group.commence_time)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {group.books[0]?.value > 0 && (
                            <div className="flex items-center gap-1 text-green-400 text-xs">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{group.books[0].value.toFixed(1)}% EV</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sportsbook Odds */}
                    <div className="divide-y divide-[#1F2937]">
                      {group.books.slice(0, 5).map((book, bookIndex) => (
                        <div
                          key={bookIndex}
                          className={`px-4 py-3 flex items-center justify-between ${
                            bookIndex === 0 ? 'bg-[#F4C430]/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-sm ${
                              bookIndex === 0 ? 'text-[#F4C430] font-medium' : 'text-[#9CA3AF]'
                            }`}>
                              {book.name}
                            </span>
                            {bookIndex === 0 && (
                              <span className="px-2 py-0.5 bg-[#F4C430]/20 text-[#F4C430] text-xs rounded">
                                BEST
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-sm ${
                              bookIndex === 0 ? 'text-[#F4C430] font-bold' : 'text-[#E5E7EB]'
                            }`}>
                              {formatOdds(book.americanOdds)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!selectedSport && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#9CA3AF]">Select a sport to start line shopping</p>
            </div>
          )}

          {selectedSport && !loading && lines.length === 0 && (selectedTeam || selectedGame || marketType !== 'all' || timeFilter !== 'all') && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#9CA3AF]">No lines found. Try a different search.</p>
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
      </GradientBG>
    </div>
  );
}