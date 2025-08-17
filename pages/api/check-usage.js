// pages/api/check-usage.js  
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userIdentifier } = req.query;
    
    if (!userIdentifier) {
      return res.status(400).json({ error: 'Missing user identifier' });
    }

    // Create fingerprint
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = `${userIdentifier}_${ip}_${userAgent.slice(0, 50)}`;
    
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${fingerprint}_${today}`;
    
    if (!global.usageStore) {
      global.usageStore = new Map();
    }
    
    const currentUsage = global.usageStore.get(key) || { uploads: 0, generations: 0, date: today };
    const limits = { uploads: 2, generations: 1 };
    
    console.log(`📊 Usage check for ${fingerprint.slice(0, 20)}...: ${JSON.stringify(currentUsage)}`);
    
    return res.status(200).json({
      usage: currentUsage,
      limits,
      canUpload: currentUsage.uploads < limits.uploads,
      canGenerate: currentUsage.generations < limits.generations
    });

  } catch (error) {
    console.error('Usage check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}