// Parlay Validation Logic
// Prevents logical contradictions in parlay selections

/**
 * Validates that parlay legs don't contain contrary/conflicting selections for the same game
 */
function validateParlayLogic(legs) {
  const errors = [];
  const gameSelections = new Map();

  // Group selections by game
  legs.forEach((leg, index) => {
    const gameKey = `${leg.homeTeam}_${leg.awayTeam}`;
    
    if (!gameSelections.has(gameKey)) {
      gameSelections.set(gameKey, []);
    }
    
    gameSelections.get(gameKey).push({
      index,
      marketType: leg.marketType,
      selection: leg.selection,
      leg
    });
  });

  // Check each game for contradictions
  gameSelections.forEach((selections, gameKey) => {
    if (selections.length > 1) {
      const contradictions = findContradictions(selections);
      if (contradictions.length > 0) {
        errors.push({
          game: gameKey,
          contradictions,
          message: `Game ${gameKey.replace('_', ' @ ')}: Cannot have contradictory selections in same parlay`
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Finds contradictory selections within the same game
 */
function findContradictions(selections) {
  const contradictions = [];
  
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const sel1 = selections[i];
      const sel2 = selections[j];
      
      if (areContradictory(sel1, sel2)) {
        contradictions.push({
          leg1: sel1,
          leg2: sel2,
          reason: getContradictionReason(sel1, sel2)
        });
      }
    }
  }
  
  return contradictions;
}

/**
 * Determines if two selections are contradictory
 */
function areContradictory(sel1, sel2) {
  // Same market type contradictions
  if (sel1.marketType === sel2.marketType) {
    return checkSameMarketContradiction(sel1, sel2);
  }
  
  // Cross-market contradictions
  return checkCrossMarketContradiction(sel1, sel2);
}

/**
 * Check contradictions within the same market type
 */
function checkSameMarketContradiction(sel1, sel2) {
  const market1 = sel1.marketType.toLowerCase();
  const selection1 = sel1.selection.toLowerCase();
  const selection2 = sel2.selection.toLowerCase();
  
  switch (market1) {
    case 'moneyline':
    case 'h2h':
      // Can't bet on both teams to win
      return selection1 !== selection2;
      
    case 'total':
    case 'totals':
      // Can't bet over and under on same total
      return (
        (selection1.includes('over') && selection2.includes('under')) ||
        (selection1.includes('under') && selection2.includes('over'))
      );
      
    case 'spread':
    case 'spreads':
    case 'point_spread':
      // Can't bet on both sides of the spread
      return selection1 !== selection2;
      
    default:
      return false;
  }
}

/**
 * Check contradictions across different market types
 */
function checkCrossMarketContradiction(sel1, sel2) {
  // Currently no cross-market contradictions defined
  // Could add logic for things like:
  // - Team to win + opponent to cover large spread
  // - High total + both teams to score under their team totals
  return false;
}

/**
 * Get human-readable reason for contradiction
 */
function getContradictionReason(sel1, sel2) {
  const market1 = sel1.marketType.toLowerCase();
  const market2 = sel2.marketType.toLowerCase();
  
  if (market1 === market2) {
    switch (market1) {
      case 'moneyline':
      case 'h2h':
        return 'Cannot bet on both teams to win the same game';
        
      case 'total':
      case 'totals':
        return 'Cannot bet both Over and Under on the same total';
        
      case 'spread':
      case 'spreads':
      case 'point_spread':
        return 'Cannot bet on both sides of the same spread';
        
      default:
        return 'Contradictory selections in same market';
    }
  }
  
  return 'Contradictory selections detected';
}

/**
 * Filter out legs that would create contradictions
 */
function removeContradictoryLegs(legs) {
  const gameSelections = new Map();
  const validLegs = [];
  
  legs.forEach(leg => {
    const gameKey = `${leg.homeTeam}_${leg.awayTeam}`;
    
    if (!gameSelections.has(gameKey)) {
      gameSelections.set(gameKey, []);
      validLegs.push(leg);
      gameSelections.get(gameKey).push({
        marketType: leg.marketType,
        selection: leg.selection,
        leg
      });
    } else {
      // Check if this leg contradicts existing selections for this game
      const existingSelections = gameSelections.get(gameKey);
      const newSelection = {
        marketType: leg.marketType,
        selection: leg.selection,
        leg
      };
      
      const hasContradiction = existingSelections.some(existing => 
        areContradictory(existing, newSelection)
      );
      
      if (!hasContradiction) {
        validLegs.push(leg);
        gameSelections.get(gameKey).push(newSelection);
      }
    }
  });
  
  return validLegs;
}

module.exports = {
  validateParlayLogic,
  removeContradictoryLegs,
  areContradictory,
  findContradictions
};