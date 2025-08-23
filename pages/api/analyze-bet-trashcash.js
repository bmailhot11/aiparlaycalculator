// Enhanced bet analysis with Trash/Cash rating system
import { TrashCashAnalyzer } from '../../lib/trash-cash-analyzer.js';
import { UserBetsDB, UserDB } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      betData, 
      userId, 
      username,
      imageData 
    } = req.body;

    console.log('[TrashCash API] Starting analysis for user:', username || 'anonymous');

    // Validate input
    if (!betData || !betData.legs || betData.legs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bet data provided'
      });
    }

    // Initialize analyzer
    const analyzer = new TrashCashAnalyzer();

    // Parse bet data into proper format
    const parsedBet = {
      type: betData.legs.length > 1 ? 'parlay' : 'single',
      legs: betData.legs.map(leg => ({
        team: leg.team || leg.selection,
        market: leg.market || leg.bet_type,
        odds: leg.odds || leg.price,
        book: leg.book || leg.sportsbook,
        gameId: leg.gameId,
        league: leg.league || determineSportFromText(leg.team || ''),
        confidence: leg.confidence || 0
      })),
      stake: betData.stake,
      potentialPayout: betData.potentialPayout,
      userId: userId,
      username: username
    };

    // Run trash/cash analysis
    const analysis = await analyzer.analyzeBet(parsedBet);

    // Store the bet if user is logged in
    let betId = null;
    if (userId && username) {
      try {
        betId = UserBetsDB.storeBet({
          ...parsedBet,
          analysis: analysis
        });

        // Update user stats
        const currentStats = UserDB.getUserById(userId)?.stats || {
          totalBets: 0,
          cashBets: 0,
          trashBets: 0
        };

        const updatedStats = {
          totalBets: currentStats.totalBets + 1,
          cashBets: analysis.overall === 'CASH' ? currentStats.cashBets + 1 : currentStats.cashBets,
          trashBets: analysis.overall === 'TRASH' ? currentStats.trashBets + 1 : currentStats.trashBets
        };

        UserDB.updateUserStats(userId, updatedStats);
        
      } catch (error) {
        console.error('[TrashCash API] Error storing bet:', error);
        // Don't fail the analysis if storage fails
      }
    }

    // Format response for frontend
    const response = {
      success: true,
      betId: betId,
      analysis: {
        rating: analysis.overall,
        score: analysis.score,
        confidence: analysis.confidence,
        recommendation: analysis.recommendation,
        reasoning: analysis.reasoning,
        factors: analysis.factors,
        timestamp: analysis.timestamp
      },
      bet: {
        type: parsedBet.type,
        legs: parsedBet.legs,
        stake: parsedBet.stake,
        potentialPayout: parsedBet.potentialPayout
      },
      // Include community stats
      communityStats: await getCommunityStats(analysis.overall)
    };

    console.log(`[TrashCash API] Analysis complete: ${analysis.overall} (${analysis.score}/100)`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('[TrashCash API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze bet',
      error: error.message
    });
  }
}

// Helper function to determine sport from text
function determineSportFromText(text) {
  if (!text) return 'NFL';
  
  const textLower = text.toLowerCase();
  
  // NFL teams
  const nflTeams = ['chiefs', 'patriots', 'cowboys', 'steelers', 'packers', 'ravens', 'saints', 'broncos', 'seahawks', 'giants', 'eagles', 'rams', 'chargers', 'raiders', 'bills', 'dolphins', 'jets', 'colts', 'texans', 'jaguars', 'titans', 'bengals', 'browns', 'lions', 'bears', 'vikings', 'panthers', 'falcons', 'buccaneers', 'cardinals', '49ers', 'commanders'];
  
  // NBA teams
  const nbaTeams = ['lakers', 'warriors', 'celtics', 'heat', 'knicks', 'nets', 'bulls', 'cavaliers', 'pistons', 'pacers', 'bucks', 'hawks', 'hornets', 'magic', 'wizards', '76ers', 'raptors', 'timberwolves', 'nuggets', 'thunder', 'trail blazers', 'jazz', 'kings', 'suns', 'clippers', 'mavericks', 'rockets', 'grizzlies', 'pelicans', 'spurs'];
  
  // Check for team matches
  if (nflTeams.some(team => textLower.includes(team))) return 'NFL';
  if (nbaTeams.some(team => textLower.includes(team))) return 'NBA';
  
  // Check for league mentions
  if (textLower.includes('nfl') || textLower.includes('football')) return 'NFL';
  if (textLower.includes('nba') || textLower.includes('basketball')) return 'NBA';
  if (textLower.includes('nhl') || textLower.includes('hockey')) return 'NHL';
  if (textLower.includes('mlb') || textLower.includes('baseball')) return 'MLB';
  
  return 'NFL'; // Default
}

// Get community stats for similar bets
async function getCommunityStats(rating) {
  try {
    const recentBets = UserBetsDB.getRecentCommunityBets(50);
    
    const stats = recentBets.reduce((acc, bet) => {
      if (bet.analysis?.overall) {
        acc.total++;
        if (bet.analysis.overall === 'CASH') acc.cash++;
        if (bet.analysis.overall === 'TRASH') acc.trash++;
        if (bet.analysis.overall === rating) acc.same++;
      }
      return acc;
    }, { total: 0, cash: 0, trash: 0, same: 0 });

    return {
      totalBets: stats.total,
      cashRate: stats.total > 0 ? Math.round((stats.cash / stats.total) * 100) : 0,
      trashRate: stats.total > 0 ? Math.round((stats.trash / stats.total) * 100) : 0,
      similarRating: stats.same,
      message: stats.total > 0 
        ? `${stats.cashRate}% of recent bets were rated CASH`
        : 'Be the first to share a bet!'
    };

  } catch (error) {
    console.error('[Community Stats Error]:', error);
    return {
      totalBets: 0,
      cashRate: 0,
      trashRate: 0,
      similarRating: 0,
      message: 'Community stats unavailable'
    };
  }
}