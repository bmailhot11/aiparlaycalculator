// Community leaderboard API
import { UserDB, UserBetsDB } from '../../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      limit = 10,
      sortBy = 'cashRate' // cashRate, totalBets, winRate, recentActivity
    } = req.query;

    console.log('[Leaderboard] Generating leaderboard...');

    // Get all users with their stats
    const users = UserDB.getAllUsers();
    
    // Calculate additional stats for each user
    const enrichedUsers = users.map(user => {
      const userBets = UserBetsDB.getUserBets(user.id, 100);
      
      // Calculate win rate from settled bets
      const settledBets = userBets.filter(bet => bet.status !== 'pending');
      const wonBets = settledBets.filter(bet => bet.status === 'won');
      const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;
      
      // Calculate cash rate (percentage of bets rated as CASH)
      const totalRatedBets = userBets.filter(bet => bet.analysis?.overall);
      const cashBets = userBets.filter(bet => bet.analysis?.overall === 'CASH');
      const cashRate = totalRatedBets.length > 0 ? (cashBets.length / totalRatedBets.length) * 100 : 0;
      
      // Recent activity score (bets in last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentBets = userBets.filter(bet => new Date(bet.submittedAt) > weekAgo);
      
      // Calculate total profit (mock calculation since we'd need actual results)
      const totalProfit = settledBets.reduce((sum, bet) => {
        if (bet.status === 'won' && bet.actualPayout) {
          return sum + (bet.actualPayout - parseFloat(bet.stake?.replace('$', '') || '0'));
        } else if (bet.status === 'lost') {
          return sum - parseFloat(bet.stake?.replace('$', '') || '0');
        }
        return sum;
      }, 0);

      return {
        ...user,
        stats: {
          ...user.stats,
          winRate: Math.round(winRate),
          cashRate: Math.round(cashRate),
          totalProfit: Math.round(totalProfit),
          recentActivity: recentBets.length,
          settledBets: settledBets.length
        }
      };
    });

    // Filter users with some activity
    const activeUsers = enrichedUsers.filter(user => 
      user.stats.totalBets > 0
    );

    // Sort based on criteria
    const sortedUsers = activeUsers.sort((a, b) => {
      switch (sortBy) {
        case 'cashRate':
          if (b.stats.cashRate !== a.stats.cashRate) {
            return b.stats.cashRate - a.stats.cashRate;
          }
          return b.stats.totalBets - a.stats.totalBets; // Tie-breaker
        
        case 'totalBets':
          return b.stats.totalBets - a.stats.totalBets;
        
        case 'winRate':
          // Only consider users with at least 5 settled bets
          const aQualified = a.stats.settledBets >= 5;
          const bQualified = b.stats.settledBets >= 5;
          
          if (bQualified && !aQualified) return 1;
          if (aQualified && !bQualified) return -1;
          if (!aQualified && !bQualified) return b.stats.totalBets - a.stats.totalBets;
          
          return b.stats.winRate - a.stats.winRate;
        
        case 'totalProfit':
          return b.stats.totalProfit - a.stats.totalProfit;
        
        case 'recentActivity':
          return b.stats.recentActivity - a.stats.recentActivity;
        
        default:
          return b.stats.cashRate - a.stats.cashRate;
      }
    });

    // Limit results
    const leaderboard = sortedUsers.slice(0, parseInt(limit));

    // Add rankings
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats,
      badges: generateBadges(user.stats)
    }));

    return res.status(200).json({
      success: true,
      leaderboard: rankedLeaderboard,
      meta: {
        sortBy,
        totalUsers: activeUsers.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate leaderboard',
      error: error.message
    });
  }
}

// Generate achievement badges for users
function generateBadges(stats) {
  const badges = [];
  
  // Volume badges
  if (stats.totalBets >= 100) badges.push({ name: 'Century Club', icon: '💯', description: '100+ bets placed' });
  else if (stats.totalBets >= 50) badges.push({ name: 'High Roller', icon: '🎰', description: '50+ bets placed' });
  else if (stats.totalBets >= 10) badges.push({ name: 'Active Bettor', icon: '📈', description: '10+ bets placed' });
  
  // Quality badges
  if (stats.cashRate >= 80 && stats.totalBets >= 10) {
    badges.push({ name: 'Cash King', icon: '👑', description: '80%+ Cash rate' });
  } else if (stats.cashRate >= 60 && stats.totalBets >= 5) {
    badges.push({ name: 'Sharp Bettor', icon: '🎯', description: '60%+ Cash rate' });
  }
  
  // Win rate badges (only for users with enough settled bets)
  if (stats.settledBets >= 10) {
    if (stats.winRate >= 60) badges.push({ name: 'Winner', icon: '🏆', description: '60%+ win rate' });
    else if (stats.winRate >= 55) badges.push({ name: 'Profitable', icon: '💰', description: '55%+ win rate' });
  }
  
  // Profit badges
  if (stats.totalProfit > 1000) badges.push({ name: 'Profit Master', icon: '💎', description: '$1000+ profit' });
  else if (stats.totalProfit > 500) badges.push({ name: 'Money Maker', icon: '💵', description: '$500+ profit' });
  
  // Activity badges
  if (stats.recentActivity >= 5) badges.push({ name: 'Hot Streak', icon: '🔥', description: '5+ bets this week' });
  
  return badges.slice(0, 3); // Limit to 3 badges for UI
}