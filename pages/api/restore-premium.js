// pages/api/restore-premium.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and access code are required' 
      });
    }

    // Validate access code format
    if (accessCode.length !== 8 || !accessCode.match(/^[A-Z0-9]+$/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid access code format. Must be 8 characters, letters and numbers only.' 
      });
    }

    // Check if user exists in premium database
    const premiumStatus = await checkAndRestorePremium(email, accessCode);
    
    if (premiumStatus.success) {
      return res.status(200).json({ 
        success: true,
        message: 'Premium access restored successfully',
        isPremium: true
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: premiumStatus.message 
      });
    }

  } catch (error) {
    console.error('Restore premium error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again.' 
    });
  }
}

async function checkAndRestorePremium(email, accessCode) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const dataFile = path.join(process.cwd(), 'data', 'premium-users.json');
    
    try {
      // Read current premium users
      const data = await fs.readFile(dataFile, 'utf8');
      const users = JSON.parse(data);
      
      // For MVP: accept specific test codes or check against stored data
      const testCodes = ['TEST1234', 'PREMIUM1', 'DEMO8888'];
      
      if (testCodes.includes(accessCode) || users[email]) {
        // Add/update user in premium database
        users[email] = {
          isPremium: true,
          email: email,
          accessCode: accessCode,
          activatedAt: users[email]?.activatedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          restoredAt: new Date().toISOString()
        };
        
        // Save updated data
        await fs.writeFile(dataFile, JSON.stringify(users, null, 2), 'utf8');
        
        console.log('✅ Premium access restored for:', email);
        return { success: true, message: 'Premium access restored successfully' };
      } else {
        console.log('❌ Invalid access code for:', email);
        return { success: false, message: 'Invalid access code. Please check your purchase confirmation email.' };
      }
      
    } catch (fileError) {
      // File doesn't exist, create it
      console.log('📁 Creating new premium users file');
      
      const testCodes = ['TEST1234', 'PREMIUM1', 'DEMO8888'];
      if (testCodes.includes(accessCode)) {
        const users = {
          [email]: {
            isPremium: true,
            email: email,
            accessCode: accessCode,
            activatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            restoredAt: new Date().toISOString()
          }
        };
        
        // Ensure data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        // Create new file
        await fs.writeFile(dataFile, JSON.stringify(users, null, 2), 'utf8');
        
        console.log('✅ Premium access granted for new user:', email);
        return { success: true, message: 'Premium access activated successfully' };
      } else {
        return { success: false, message: 'Invalid access code. Please check your purchase confirmation email.' };
      }
    }
  } catch (error) {
    console.error('Error in checkAndRestorePremium:', error);
    return { success: false, message: 'System error. Please try again later.' };
  }
}