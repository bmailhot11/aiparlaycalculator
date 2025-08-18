// pages/api/track-usage.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action, userIdentifier } = req.body; // action: 'upload' or 'generation'
    
    if (!action || !userIdentifier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user's IP and create unique identifier
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const fingerprint = `${userIdentifier}_${ip}_${userAgent.slice(0, 50)}`;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const key = `usage_${fingerprint}_${today}`;
    
    // In-memory store (replace with database in production)
    if (!global.usageStore) {
      global.usageStore = new Map();
    }
    
    // Get current usage
    const currentUsage = global.usageStore.get(key) || { uploads: 0, generations: 0, ev_generations: 0, filter_changes: 0, date: today };
    
    // Check limits
    const maxUploads = 2;
    const maxGenerations = 1;
    const maxEvGenerations = 1;
    const maxFilterChanges = 2;
    
    if (action === 'upload') {
      if (currentUsage.uploads >= maxUploads) {
        return res.status(429).json({ 
          error: 'Daily upload limit reached',
          usage: currentUsage,
          limits: { uploads: maxUploads, generations: maxGenerations, ev_generations: maxEvGenerations }
        });
      }
      currentUsage.uploads += 1;
    } else if (action === 'generation') {
      if (currentUsage.generations >= maxGenerations) {
        return res.status(429).json({ 
          error: 'Daily generation limit reached',
          usage: currentUsage,
          limits: { uploads: maxUploads, generations: maxGenerations, ev_generations: maxEvGenerations }
        });
      }
      currentUsage.generations += 1;
    } else if (action === 'ev_generation') {
      if (currentUsage.ev_generations >= maxEvGenerations) {
        return res.status(429).json({ 
          error: 'Daily EV line limit reached',
          usage: currentUsage,
          limits: { uploads: maxUploads, generations: maxGenerations, ev_generations: maxEvGenerations }
        });
      }
      currentUsage.ev_generations += 1;
    } else if (action === 'filter_change') {
      if (currentUsage.filter_changes >= maxFilterChanges) {
        return res.status(429).json({ 
          error: 'Daily filter change limit reached',
          usage: currentUsage,
          limits: { uploads: maxUploads, generations: maxGenerations, ev_generations: maxEvGenerations, filter_changes: maxFilterChanges }
        });
      }
      currentUsage.filter_changes += 1;
    }
    
    // Save updated usage
    global.usageStore.set(key, currentUsage);
    
    // Clean up old entries (older than 2 days)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const cutoffDate = twoDaysAgo.toISOString().split('T')[0];
    
    for (const [storeKey] of global.usageStore) {
      const keyDate = storeKey.split('_').pop();
      if (keyDate < cutoffDate) {
        global.usageStore.delete(storeKey);
      }
    }
    
    console.log(`✅ Usage tracked: ${action} for ${fingerprint.slice(0, 20)}... - Total: ${JSON.stringify(currentUsage)}`);
    
    return res.status(200).json({
      success: true,
      usage: currentUsage,
      limits: { uploads: maxUploads, generations: maxGenerations, ev_generations: maxEvGenerations }
    });

  } catch (error) {
    console.error('Usage tracking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}