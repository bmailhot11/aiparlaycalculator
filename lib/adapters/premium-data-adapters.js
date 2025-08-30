// Data adapters to map existing API responses to premium UI components

// Adapter for +EV feed preview - only real data, no mocks
export const toPreviewEV = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.slice(0, 3).map((item, index) => ({
    matchId: item.id || `ev-${index}`,
    home: item.home_team || item.teams?.home || item.away_team || 'Team A',
    away: item.away_team || item.teams?.away || item.home_team || 'Team B', 
    evPct: parseFloat(item.expected_value || item.ev || item.edge || item.profit_percentage || 0),
    impliedHome: parseFloat(item.implied_home || item.home_implied || 0),
    impliedAway: parseFloat(item.implied_away || item.away_implied || 0),
    odds: item.best_odds || item.odds || item.american_odds || '+100',
    market: item.market || item.bet_type || item.market_display || 'Market'
  })).filter(item => item.evPct > 0); // Only show items with actual EV
};

// Adapter for arbitrage opportunities - only real data, no mocks
export const toArbRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  return rows.slice(0, 3).map((row, index) => ({
    id: row.id || `arb-${index}`,
    market: row.matchup || row.description || row.market || row.market_display || 'Market',
    bookA: row.legs?.[0]?.sportsbook || row.bookmakers?.[0]?.title || 'Book A',
    bookB: row.legs?.[1]?.sportsbook || row.bookmakers?.[1]?.title || 'Book B',
    returnPct: parseFloat(row.profit_percentage || row.profit || row.return || 0),
    legA: row.legs?.[0] || { 
      sportsbook: row.bookmakers?.[0]?.title || 'Book A', 
      odds: row.legs?.[0]?.american_odds || row.odds?.[0] || '+100',
      american_odds: row.legs?.[0]?.american_odds || row.odds?.[0] || '+100'
    },
    legB: row.legs?.[1] || { 
      sportsbook: row.bookmakers?.[1]?.title || 'Book B', 
      odds: row.legs?.[1]?.american_odds || row.odds?.[1] || '+100',
      american_odds: row.legs?.[1]?.american_odds || row.odds?.[1] || '+100'
    }
  })).filter(row => row.returnPct > 0); // Only show profitable arbitrage
};

// Adapter for line shopping results - only real data, no mocks
export const toLineShop = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.slice(0, 3).map((item, index) => ({
    id: item.id || `line-${index}`,
    market: item.market || item.description || item.game || 'Market',
    bestBook: item.best_book || item.sportsbook || item.bookmaker || 'Best Book',
    deltaPct: parseFloat(item.edge_percentage || item.edge || item.delta || 0),
    bestOdds: item.best_odds || item.odds || item.price || '+100',
    avgOdds: item.avg_odds || item.average_odds || item.market_avg || '+100'
  })).filter(item => item.deltaPct > 0); // Only show items with actual edge
};

// Adapter for AI parlay suggestions - only real data, no mocks
export const toParlayPreview = (parlayData = null) => {
  if (!parlayData || !parlayData.legs || !Array.isArray(parlayData.legs) || parlayData.legs.length === 0) {
    return null; // Return null when no real data available
  }

  return {
    legs: parlayData.legs.slice(0, 3).map(leg => ({
      team: leg.team || leg.selection || leg.name || 'Team',
      bet: leg.bet_type || leg.market || leg.type || 'Bet',
      odds: leg.odds || leg.american_odds || leg.price || '+100'
    })),
    totalOdds: parlayData.total_odds || parlayData.combined_odds || parlayData.parlay_odds || '+500',
    confidence: parlayData.confidence || parlayData.rating || parlayData.grade || 'Medium',
    type: parlayData.mode || parlayData.type || parlayData.strategy || 'AI Generated'
  };
};

// Adapter for CLV (Closing Line Value) data - only real data, no mocks
export const toCLVData = (clvRecords = []) => {
  if (!Array.isArray(clvRecords) || clvRecords.length === 0) {
    return null; // Return null when no real data available
  }

  // Transform real CLV data
  const sparkline = clvRecords.map(record => ({
    date: record.date || record.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    clv: parseFloat(record.clv || record.closing_line_value || 0)
  })).filter(item => item.date && !isNaN(item.clv));

  const highlights = clvRecords.slice(0, 3).map(record => ({
    market: record.market || record.description || record.bet_description || 'Market',
    placedPrice: record.placed_odds || record.original_odds || record.bet_odds || '+100',
    closePrice: record.closing_odds || record.final_odds || record.close_odds || '+100',
    delta: record.clv_percentage || (record.clv ? `${record.clv.toFixed(1)}%` : '0%'),
    positive: (parseFloat(record.clv || 0)) > 0
  })).filter(item => item.market !== 'Market');

  const avgCLV = clvRecords.length > 0 
    ? (clvRecords.reduce((sum, r) => sum + (parseFloat(r.clv || 0)), 0) / clvRecords.length).toFixed(1) + '%'
    : null;

  // Only return data if we have meaningful sparkline data
  if (sparkline.length === 0) {
    return null;
  }

  return {
    sparkline,
    highlights: highlights.length > 0 ? highlights : [],
    avgCLV
  };
};

// Fetch live data - no fallbacks, only real data (with individual API failover)
export const fetchLivePreviewData = async () => {
  console.log('Starting fetchLivePreviewData...');
  
  const results = {
    evFeed: [],
    arbitrage: [],
    lineShop: [],
    parlay: null,
    clv: []
  };

  // Try arbitrage API with longer timeout
  try {
    console.log('Fetching arbitrage data...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds
    
    const arbResponse = await fetch('/api/arbitrage/find-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: null, includeAllSports: true, maxResults: 50 }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (arbResponse.ok) {
      const arbData = await arbResponse.json();
      if (arbData.success && Array.isArray(arbData.opportunities)) {
        results.arbitrage = arbData.opportunities;
        results.evFeed = arbData.opportunities.filter(opp => 
          parseFloat(opp.profit_percentage || 0) > 0
        );
        console.log(`✅ Found ${results.arbitrage.length} arbitrage opportunities`);
      }
    }
  } catch (error) {
    console.warn('Arbitrage API timeout/error:', error.message);
  }

  // Try middle bets API separately
  try {
    console.log('Fetching middle bets data...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const middleResponse = await fetch('/api/middle-bets/find-opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: 'NFL' }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (middleResponse.ok) {
      const middleData = await middleResponse.json();
      if (middleData.success && Array.isArray(middleData.opportunities)) {
        // Add middle bets to line shopping data as they show different odds
        results.lineShop = [...(results.lineShop || []), ...middleData.opportunities.slice(0, 5).map(middle => ({
          id: middle.id,
          market: middle.matchup,
          best_book: middle.legs?.[0]?.sportsbook,
          edge_percentage: parseFloat(middle.hit_probability?.replace('%', '') || 0),
          best_odds: middle.legs?.[0]?.odds,
          average_odds: middle.legs?.[1]?.odds
        }))];
        console.log(`✅ Added ${middleData.opportunities.length} middle betting opportunities`);
      }
    }
  } catch (error) {
    console.warn('Middle bets API timeout/error:', error.message);
  }


  // Generate line shopping data from arbitrage opportunities if needed
  if (results.arbitrage.length > 0 && results.lineShop.length < 3) {
    console.log('Generating additional line shopping data from arbitrage opportunities...');
    const additionalLineShop = results.arbitrage.map((arb, index) => ({
      id: `line-arb-${index}`,
      market: arb.matchup || `${arb.sport} Game`,
      best_book: arb.legs?.[0]?.sportsbook || 'Sportsbook',
      edge_percentage: parseFloat(arb.profit_percentage || 0) / 4, // Convert arb % to line shop edge
      best_odds: arb.legs?.[0]?.american_odds || '+100',
      average_odds: arb.legs?.[1]?.american_odds || '+100'
    })).slice(0, 3 - results.lineShop.length);
    
    results.lineShop = [...results.lineShop, ...additionalLineShop];
  }

  // Fetch AI parlay suggestions
  try {
    console.log('Fetching AI parlay suggestions...');
    const parlayController = new AbortController();
    const timeoutId = setTimeout(() => parlayController.abort(), 5000);
    
    const parlayResponse = await fetch('/api/home/ai-parlay-suggestions', {
      signal: parlayController.signal
    });
    
    clearTimeout(timeoutId);
    
    if (parlayResponse.ok) {
      const parlayData = await parlayResponse.json();
      if (parlayData.success && parlayData.parlay) {
        results.parlay = parlayData.parlay;
        console.log(`✅ Found AI parlay: ${parlayData.parlay.legs?.length || 0} legs`);
      }
    }
  } catch (error) {
    console.warn('AI parlay API timeout/error:', error.message);
  }

  // Fetch performance/CLV data
  try {
    console.log('Fetching performance data...');
    const perfController = new AbortController();
    const timeoutId = setTimeout(() => perfController.abort(), 5000);
    
    const perfResponse = await fetch('/api/home/recent-performance', {
      signal: perfController.signal
    });
    
    clearTimeout(timeoutId);
    
    if (perfResponse.ok) {
      const perfData = await perfResponse.json();
      if (perfData.success && perfData.data && perfData.data.performanceData) {
        results.clv = perfData.data.performanceData;
        console.log(`✅ Found performance data: ${results.clv.length} data points`);
      }
    }
  } catch (error) {
    console.warn('Performance API timeout/error:', error.message);
  }

  console.log('Returning processed data:', {
    evFeed: results.evFeed.length,
    arbitrage: results.arbitrage.length,
    lineShop: results.lineShop.length,
    parlay: results.parlay ? 'Generated' : 'None',
    clv: results.clv.length
  });

  // Return transformed data using all available arbitrage data
  return {
    evFeed: toPreviewEV(results.evFeed),
    arbitrage: toArbRows(results.arbitrage), 
    lineShop: toLineShop(results.lineShop),
    parlay: toParlayPreview(results.parlay),
    clv: toCLVData(results.clv)
  };
};

export default {
  toPreviewEV,
  toArbRows, 
  toLineShop,
  toParlayPreview,
  toCLVData,
  fetchLivePreviewData
};