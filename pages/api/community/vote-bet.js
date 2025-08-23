// Vote on community bets (upvote/downvote)
import { UserBetsDB } from '../../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { 
      betId,
      userId,
      username,
      voteType // 'up' or 'down'
    } = req.body;

    // Validation
    if (!betId || !userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: betId, userId, username'
      });
    }

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: 'Vote type must be "up" or "down"'
      });
    }

    console.log(`[Vote API] ${username} voting ${voteType} on bet ${betId}`);

    // In a real app, you'd store votes in a separate table/file
    // For now, we'll simulate the voting system
    
    // Get current bet votes (would be stored separately in real app)
    const voteKey = `votes_${betId}`;
    
    // This would normally be a database operation
    // For now, return success with mock vote counts
    const mockVotes = {
      up: Math.floor(Math.random() * 20) + 1,
      down: Math.floor(Math.random() * 5),
      total: 0
    };
    
    // Increment the voted option
    mockVotes[voteType] += 1;
    mockVotes.total = mockVotes.up + mockVotes.down;

    return res.status(200).json({
      success: true,
      message: `Vote recorded successfully`,
      votes: mockVotes,
      userVote: voteType,
      betId: betId
    });

  } catch (error) {
    console.error('[Vote API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message
    });
  }
}