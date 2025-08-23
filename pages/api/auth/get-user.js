// Get user by username
import { UserDB } from '../../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const user = UserDB.getUserByUsername(username.toLowerCase());

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return public user data
    const userData = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats,
      preferences: {
        favoriteLeagues: user.preferences?.favoriteLeagues || []
      }
    };

    return res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('[Get User Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user data'
    });
  }
}