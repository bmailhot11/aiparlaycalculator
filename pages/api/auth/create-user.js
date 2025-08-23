// Create new user account
import { UserDB } from '../../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { username, email } = req.body;

    // Validation
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be less than 20 characters'
      });
    }

    // Check for valid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // Create user
    const user = UserDB.createUser({
      username: username.toLowerCase(),
      email: email || null
    });

    // Return user data (without sensitive info)
    const userData = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats
    };

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('[Create User Error]:', error);
    
    if (error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: 'Username already taken. Please choose another.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create user account'
    });
  }
}