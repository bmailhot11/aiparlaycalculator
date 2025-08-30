// Dashboard integration utilities for automatically logging bets from various systems

export const logBetToDashboard = async (userId, betData, source) => {
  try {
    if (!userId || !betData) {
      console.warn('Cannot log bet: missing userId or betData');
      return { success: false, error: 'Missing required data' };
    }

    const response = await fetch('/api/dashboard/log-bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        betData,
        source
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to log bet:', result.message);
      return { success: false, error: result.message };
    }

    console.log('Bet logged successfully:', result.bet);
    return result;

  } catch (error) {
    console.error('Error logging bet to dashboard:', error);
    return { success: false, error: error.message };
  }
};

// Adapter functions to convert different bet formats to dashboard format

export const adaptArbitrageBet = (arbOpportunity, legIndex, stake) => {
  if (!arbOpportunity.legs || !arbOpportunity.legs[legIndex]) {
    return null;
  }

  const leg = arbOpportunity.legs[legIndex];
  
  return {
    sport: arbOpportunity.sport || 'Unknown',
    market: arbOpportunity.market_type || 'Market',
    selection: leg.selection || leg.name || `${arbOpportunity.matchup} - Leg ${legIndex + 1}`,
    odds: leg.american_odds || leg.odds || '+100',
    stake: parseFloat(stake),
    sportsbook: leg.sportsbook || 'Unknown',
    confidence: 'High',
    expectedValue: arbOpportunity.profit_percentage || 0,
    arbitrageId: arbOpportunity.id
  };
};

export const adaptMiddleBet = (middleOpportunity, legIndex, stake) => {
  if (!middleOpportunity.legs || !middleOpportunity.legs[legIndex]) {
    return null;
  }

  const leg = middleOpportunity.legs[legIndex];
  
  return {
    sport: middleOpportunity.sport || 'Unknown',
    market: middleOpportunity.market_type || 'Middle Bet',
    selection: leg.selection || `${middleOpportunity.matchup} ${leg.point || ''}`,
    odds: leg.american_odds || leg.odds || '+100',
    stake: parseFloat(stake),
    sportsbook: leg.sportsbook || 'Unknown',
    confidence: middleOpportunity.hit_probability || 'Medium',
    expectedValue: middleOpportunity.expected_return || 0,
    middleBetId: middleOpportunity.id
  };
};

export const adaptParlayBet = (parlayData, stake) => {
  if (!parlayData.legs || parlayData.legs.length === 0) {
    return null;
  }

  const selections = parlayData.legs.map(leg => 
    `${leg.team} ${leg.bet}`.trim()
  ).join(' + ');

  return {
    sport: 'Multi-Sport',
    market: 'Parlay',
    selection: selections,
    odds: parlayData.totalOdds || parlayData.combined_odds || '+500',
    stake: parseFloat(stake),
    sportsbook: 'Multiple',
    confidence: parlayData.confidence || 'Medium',
    expectedValue: parlayData.expected_return || 0,
    parlayId: parlayData.id || Date.now()
  };
};

// Helper to suggest bet logging after user actions
export const suggestBetLogging = (betData, source, onConfirm) => {
  if (typeof window === 'undefined') return;

  const shouldAsk = localStorage.getItem('dashboardAutoLog') !== 'disabled';
  
  if (!shouldAsk) return;

  const message = `Would you like to log this ${source} bet to your dashboard?\n\n` +
                 `${betData.selection} @ ${betData.odds}\n` +
                 `Stake: $${betData.stake}`;

  if (confirm(message)) {
    onConfirm();
  }
};

// Settings for auto-logging behavior
export const getDashboardSettings = () => {
  if (typeof window === 'undefined') return { autoLog: false };

  return {
    autoLog: localStorage.getItem('dashboardAutoLog') === 'enabled',
    autoLogArbitrage: localStorage.getItem('dashboardAutoLogArb') !== 'false',
    autoLogMiddleBets: localStorage.getItem('dashboardAutoLogMiddle') !== 'false',
    autoLogAIParlays: localStorage.getItem('dashboardAutoLogParlay') !== 'false'
  };
};

export const updateDashboardSettings = (settings) => {
  if (typeof window === 'undefined') return;

  Object.keys(settings).forEach(key => {
    if (settings[key] !== undefined) {
      localStorage.setItem(`dashboard${key.charAt(0).toUpperCase() + key.slice(1)}`, 
                          settings[key].toString());
    }
  });
};

export default {
  logBetToDashboard,
  adaptArbitrageBet,
  adaptMiddleBet,
  adaptParlayBet,
  suggestBetLogging,
  getDashboardSettings,
  updateDashboardSettings
};