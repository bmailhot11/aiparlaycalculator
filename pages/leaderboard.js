import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy,
  TrendingUp,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Eye,
  User,
  Medal,
  Star,
  Target,
  Calendar,
  ChevronRight,
  Zap
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('top'); // 'top' or 'new'
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [recentBets, setRecentBets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('betchekr_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
  }, []);

  // Fetch data on component mount and tab change
  useEffect(() => {
    if (activeTab === 'top') {
      fetchLeaderboard();
    } else {
      fetchRecentBets();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/community/leaderboard?limit=20&sortBy=cashRate');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentBets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/community/recent-bets?limit=20&filter=recent');
      const data = await response.json();
      
      if (data.success) {
        setRecentBets(data.bets);
      }
    } catch (error) {
      console.error('Error fetching recent bets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (betId, voteType) => {
    if (!currentUser) {
      alert('Please join the community to vote on bets');
      return;
    }

    try {
      // This would be an API call to vote on bets
      console.log(`User ${currentUser.username} voted ${voteType} on bet ${betId}`);
      // Update local state to show the vote
      setRecentBets(prev => prev.map(bet => 
        bet.id === betId 
          ? { ...bet, userVote: voteType, votes: { ...bet.votes, [voteType]: (bet.votes?.[voteType] || 0) + 1 } }
          : bet
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleExpandBet = (bet) => {
    setSelectedBet(bet);
  };

  const handleNextBet = (betId) => {
    const currentIndex = recentBets.findIndex(bet => bet.id === betId);
    if (currentIndex < recentBets.length - 1) {
      setSelectedBet(recentBets[currentIndex + 1]);
    } else {
      setSelectedBet(recentBets[0]); // Loop back to first
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Trophy className="w-16 h-16 mx-auto mb-6 text-[#F4C430]" />
            <h1 className="text-4xl md:text-5xl font-bold text-[#E5E7EB] mb-6">
              Community Leaderboard
            </h1>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
              See who's making the smartest picks and discover the latest community bets
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#1F2937] rounded-lg p-1 flex">
              <button
                onClick={() => setActiveTab('top')}
                className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'top'
                    ? 'bg-[#F4C430] text-[#0B0F14]'
                    : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Top Players
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'new'
                    ? 'bg-[#F4C430] text-[#0B0F14]'
                    : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                }`}
              >
                <Clock className="w-4 h-4" />
                New Bets
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'top' ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                    <Medal className="w-6 h-6 text-[#F4C430]" />
                    Top Performers
                  </h2>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#9CA3AF]">Loading leaderboard...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboardData.map((player, index) => (
                        <motion.div
                          key={player.username}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-[#1F2937] rounded-lg p-4 border border-[#374151]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500 text-black' :
                                index === 1 ? 'bg-gray-400 text-black' :
                                index === 2 ? 'bg-orange-600 text-white' :
                                'bg-[#374151] text-[#9CA3AF]'
                              }`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-[#F4C430]" />
                                <div>
                                  <h3 className="text-[#E5E7EB] font-medium">{player.username}</h3>
                                  <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                                    <span>{player.stats.totalBets} bets</span>
                                    <span>{player.stats.cashRate}% cash rate</span>
                                    {player.stats.winRate > 0 && <span>{player.stats.winRate}% win rate</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {player.badges && player.badges.slice(0, 2).map((badge, i) => (
                                <span 
                                  key={i}
                                  className="text-lg" 
                                  title={badge.description}
                                >
                                  {badge.icon}
                                </span>
                              ))}
                              
                              <div className="text-right">
                                <div className="text-[#F4C430] font-bold text-lg">{player.stats.cashRate}%</div>
                                <div className="text-[#6B7280] text-xs">Cash Rate</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-[#F4C430]" />
                    Fresh Parlays
                  </h2>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-[#9CA3AF]">Loading recent bets...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentBets.filter(bet => bet.type === 'parlay').map((bet) => (
                        <motion.div
                          key={bet.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#1F2937] rounded-lg p-4 border border-[#374151] cursor-pointer hover:border-[#F4C430]/30 transition-colors"
                          onClick={() => handleExpandBet(bet)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                bet.analysis.rating === 'CASH' ? 'bg-green-500' :
                                bet.analysis.rating === 'TRASH' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}>
                                {bet.analysis.rating === 'CASH' ? '💰' : 
                                 bet.analysis.rating === 'TRASH' ? '🗑️' : '⚠️'}
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-[#F4C430]" />
                                  <span className="text-[#E5E7EB] font-medium">{bet.username}</span>
                                  <span className="text-[#6B7280] text-xs">{bet.timeAgo}</span>
                                </div>
                                <p className="text-[#9CA3AF] text-sm">{bet.legs.length}-leg parlay • {bet.stake}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(bet.id, 'up');
                                }}
                                className={`p-1 rounded transition-colors ${
                                  bet.userVote === 'up' ? 'bg-green-500 text-white' : 'hover:bg-[#374151]'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <span className="text-[#9CA3AF] text-sm">{bet.votes?.up || 0}</span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVote(bet.id, 'down');
                                }}
                                className={`p-1 rounded transition-colors ${
                                  bet.userVote === 'down' ? 'bg-red-500 text-white' : 'hover:bg-[#374151]'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                              <span className="text-[#9CA3AF] text-sm">{bet.votes?.down || 0}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {bet.legs.slice(0, 3).map((leg, index) => (
                              <div key={index} className="bg-[#0F172A] rounded p-2">
                                <div className="text-[#E5E7EB] text-sm font-medium">{leg.team}</div>
                                <div className="text-[#9CA3AF] text-xs">{leg.market} • {leg.odds}</div>
                              </div>
                            ))}
                            {bet.legs.length > 3 && (
                              <div className="bg-[#0F172A] rounded p-2 flex items-center justify-center">
                                <span className="text-[#6B7280] text-sm">+{bet.legs.length - 3} more</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                              <span>Score: {bet.analysis.score}/100</span>
                              <span>Potential: {bet.potentialPayout}</span>
                            </div>
                            <Eye className="w-4 h-4 text-[#6B7280]" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-[#1F2937] rounded-lg p-4 border border-[#374151]">
                <h3 className="text-[#E5E7EB] font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#F4C430]" />
                  Community Stats
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Total Members</span>
                    <span className="text-[#E5E7EB] font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Active Today</span>
                    <span className="text-[#E5E7EB] font-medium">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Bets Analyzed</span>
                    <span className="text-[#E5E7EB] font-medium">12,456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Cash Rate</span>
                    <span className="text-green-400 font-medium">67%</span>
                  </div>
                </div>
              </div>

              {currentUser && (
                <div className="bg-[#1F2937] rounded-lg p-4 border border-[#374151]">
                  <h3 className="text-[#E5E7EB] font-semibold mb-3">Your Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Total Bets</span>
                      <span className="text-[#E5E7EB]">{currentUser.stats?.totalBets || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9CA3AF]">Cash Rate</span>
                      <span className="text-green-400">{currentUser.stats?.cashRate || 0}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bet Detail Modal */}
      {selectedBet && (
        <div className="fixed inset-0 bg-[#0B0F14]/90 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1F2937] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#374151]"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-[#E5E7EB] text-xl font-bold">{selectedBet.username}'s Parlay</h2>
                <p className="text-[#9CA3AF] text-sm">{selectedBet.timeAgo} • {selectedBet.legs.length} legs</p>
              </div>
              <button
                onClick={() => setSelectedBet(null)}
                className="text-[#6B7280] hover:text-[#9CA3AF]"
              >
                ✕
              </button>
            </div>

            {/* Analysis Rating */}
            <div className="bg-[#0F172A] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className={`text-xl font-bold ${
                  selectedBet.analysis.rating === 'CASH' ? 'text-green-400' :
                  selectedBet.analysis.rating === 'TRASH' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {selectedBet.analysis.rating} {selectedBet.analysis.rating === 'CASH' ? '💰' : 
                   selectedBet.analysis.rating === 'TRASH' ? '🗑️' : '⚠️'}
                </div>
                <div className="text-[#F4C430] font-bold text-lg">{selectedBet.analysis.score}/100</div>
              </div>
              <p className="text-[#9CA3AF] text-sm mt-2">{selectedBet.analysis.recommendation}</p>
            </div>

            {/* Bet Details */}
            <div className="space-y-3 mb-4">
              {selectedBet.legs.map((leg, index) => (
                <div key={index} className="bg-[#0F172A] rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[#E5E7EB] font-medium">{leg.team}</div>
                      <div className="text-[#9CA3AF] text-sm">{leg.market}</div>
                      <div className="text-[#6B7280] text-xs">{leg.book}</div>
                    </div>
                    <div className="text-[#F4C430] font-bold">{leg.odds}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stake and Payout */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                <div className="text-[#9CA3AF] text-sm">Stake</div>
                <div className="text-[#E5E7EB] font-bold">{selectedBet.stake}</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-3 text-center">
                <div className="text-[#9CA3AF] text-sm">Potential Payout</div>
                <div className="text-green-400 font-bold">{selectedBet.potentialPayout}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleNextBet(selectedBet.id)}
                className="btn btn-outline flex-1"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Next Bet
              </button>
              <button
                onClick={() => setSelectedBet(null)}
                className="btn btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}