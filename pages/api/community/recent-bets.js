// Recent community bets feed
import { UserBetsDB } from '../../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      limit = 20,
      filter = 'all' // all, cash, trash, recent
    } = req.query;

    console.log('[Recent Bets] Fetching community bets...');

    // Get recent community bets
    let bets = UserBetsDB.getRecentCommunityBets(100);

    // Apply filters
    if (filter === 'cash') {
      bets = bets.filter(bet => bet.analysis?.overall === 'CASH');
    } else if (filter === 'trash') {
      bets = bets.filter(bet => bet.analysis?.overall === 'TRASH');
    } else if (filter === 'recent') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      bets = bets.filter(bet => new Date(bet.submittedAt) > sixHoursAgo);
    }

    // Limit results
    bets = bets.slice(0, parseInt(limit));

    // Format for display
    const formattedBets = bets.map(bet => ({
      id: bet.id,
      username: bet.username,
      type: bet.type,
      legs: bet.legs.map(leg => ({
        team: leg.team,
        market: leg.market,
        odds: leg.odds,
        book: leg.book
      })),
      stake: bet.stake,
      potentialPayout: bet.potentialPayout,
      analysis: {
        rating: bet.analysis?.overall || 'PENDING',
        score: bet.analysis?.score || 0,
        confidence: bet.analysis?.confidence || 0,
        recommendation: bet.analysis?.recommendation || 'Analysis pending'
      },
      submittedAt: bet.submittedAt,
      status: bet.status,
      timeAgo: getTimeAgo(bet.submittedAt)
    }));

    // Get community stats
    const stats = {
      totalBets: bets.length,
      cashCount: bets.filter(bet => bet.analysis?.overall === 'CASH').length,
      trashCount: bets.filter(bet => bet.analysis?.overall === 'TRASH').length,
      averageScore: bets.length > 0 
        ? Math.round(bets.reduce((sum, bet) => sum + (bet.analysis?.score || 0), 0) / bets.length)
        : 0
    };

    return res.status(200).json({
      success: true,
      bets: formattedBets,
      stats: stats,
      meta: {
        filter,
        limit: parseInt(limit),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Recent Bets] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch community bets',
      error: error.message
    });
  }
}

// Helper function to get time ago string
function getTimeAgo(timestamp) {
  const now = new Date();
  const betTime = new Date(timestamp);
  const diffMs = now - betTime;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}