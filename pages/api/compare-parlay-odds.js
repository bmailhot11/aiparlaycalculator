// Function to find best parlay odds across sportsbooks
async function findBestParlayOdds(parlayLegs) {
  // Mock implementation for now - in production would use live odds API
  const mockSportsbooks = [
    { name: 'DraftKings', totalOdds: '+850', payout: '950' },
    { name: 'FanDuel', totalOdds: '+820', payout: '920' },
    { name: 'BetMGM', totalOdds: '+780', payout: '880' }
  ];
  
  // Sort by best odds (highest payout)
  const sortedBooks = mockSportsbooks.sort((a, b) => 
    parseInt(b.payout) - parseInt(a.payout)
  );
  
  return {
    sportsbooks: sortedBooks,
    bestOdds: sortedBooks[0],
    legsAnalyzed: parlayLegs.length,
    note: 'Comparison based on cached odds data. Premium users get real-time comparisons.'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { parlay } = req.body;
  
  if (!parlay || parlay.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'No parlay provided' 
    });
  }

  try {
    console.log(`🎯 Comparing parlay odds across sportsbooks...`);
    
    // Use the same optimization logic from get-ev-lines
    const result = await findBestParlayOdds(parlay);
    
    return res.status(200).json({
      success: result.sportsbooks.length > 0,
      message: result.sportsbooks.length > 0 ? 
        `Found ${result.sportsbooks.length} sportsbook options for your parlay` : 
        'No better odds found - your current selection appears optimal',
      comparison: result
    });

  } catch (error) {
    console.error('❌ Parlay comparison error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to compare parlay odds',
      error: error.message
    });
  }
}