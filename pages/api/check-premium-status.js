// pages/api/check-premium-status.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userIdentifier, email } = req.query;

    if (!userIdentifier && !email) {
      return res.status(400).json({ error: 'userIdentifier or email required' });
    }

    // Check premium status from your database/file
    const isPremium = await checkUserPremiumStatus(userIdentifier, email);
    
    res.status(200).json({ 
      isPremium,
      userIdentifier,
      email: email || null,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
}

async function checkUserPremiumStatus(userIdentifier, email) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(process.cwd(), 'data', 'premium-users.json');
    
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      const users = JSON.parse(data);
      
      // Check by userIdentifier (if it's stored as a key)
      if (userIdentifier && users[userIdentifier]) {
        console.log('Found user by userIdentifier:', userIdentifier);
        return users[userIdentifier].isPremium || false;
      }
      
      // Check by email as key (current storage method)
      if (email && users[email]) {
        console.log('Found user by email key:', email);
        return users[email].isPremium || false;
      }
      
      // Search through all users for matching userIdentifier or email in data
      for (const [key, userData] of Object.entries(users)) {
        if (userData.userIdentifier === userIdentifier || 
            userData.email === email || 
            key === email) {
          console.log('Found premium user:', { key, userIdentifier, email });
          return userData.isPremium || false;
        }
      }
      
      // No match found
      console.log('No premium user found for:', { userIdentifier, email });
      return false;
      
    } catch (error) {
      // File doesn't exist or is corrupted
      console.log('Premium users file not found or corrupted:', error.message);
      return false;
    }
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}