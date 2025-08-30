// Strict Arbitrage Detection Module
// Implements true arbitrage detection with same-line requirements

// Convert American odds to decimal
function toDecimal(american) {
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

// Check if two lines are the same (within epsilon for float comparison)
function isSameLine(line1, line2) {
  if (line1 === null || line2 === null) return false;
  return Math.abs(line1 - line2) < 0.001; // Small epsilon for float comparison
}

// Detect sport type from game data
function detectSport(game) {
  const sport = game.sport_title?.toLowerCase() || game.sport?.toLowerCase() || '';
  
  // Map variations to standard sport names
  if (sport.includes('soccer') || sport.includes('football') && !sport.includes('american')) {
    return 'soccer';
  }
  if (sport.includes('hockey') || sport.includes('nhl')) {
    return 'hockey';
  }
  if (sport.includes('basketball') || sport.includes('nba') || sport.includes('ncaab')) {
    return 'basketball';
  }
  if (sport.includes('baseball') || sport.includes('mlb')) {
    return 'baseball';
  }
  if (sport.includes('american football') || sport.includes('nfl') || sport.includes('ncaaf')) {
    return 'american_football';
  }
  
  return 'unknown';
}

// Check if sport has 3-way markets (includes draw)
function hasThreeWayMarkets(sport) {
  return sport === 'soccer';
}

// Check if outcomes are valid for the sport and market type
function areValidOutcomes(outcomes, sport, marketType) {
  if (marketType !== 'h2h' && marketType !== 'moneyline') {
    return true; // Non-moneyline markets are handled elsewhere
  }
  
  const selectionNames = outcomes.map(o => o.selection?.toLowerCase() || '');
  
  // Filter out draw for sports that don't have draws
  if (sport === 'hockey' || sport === 'basketball' || sport === 'american_football' || sport === 'baseball') {
    // These sports shouldn't have draws in regular markets
    return outcomes.filter(o => {
      const name = o.selection?.toLowerCase() || '';
      return !name.includes('draw') && !name.includes('tie');
    });
  }
  
  return outcomes;
}

// Check if outcomes are truly complementary (opposite sides of same line)
function areComplementaryOutcomes(leg1, leg2, marketType, sport) {
  if (marketType === 'h2h' || marketType === 'moneyline') {
    // For moneyline, just need different selections
    // The actual arbitrage calculation will handle whether it's profitable
    return leg1.selection !== leg2.selection;
  }
  
  if (marketType === 'totals' || marketType.includes('total')) {
    // For totals, need same line and opposite Over/Under
    if (!isSameLine(leg1.point, leg2.point)) return false;
    const isOver1 = leg1.selection.toLowerCase().includes('over');
    const isOver2 = leg2.selection.toLowerCase().includes('over');
    return isOver1 !== isOver2;
  }
  
  if (marketType === 'spreads' || marketType.includes('spread')) {
    // For spreads, need same absolute line value and opposite teams
    if (!leg1.point || !leg2.point) return false;
    // Spreads are opposite (one team +X, other team -X)
    if (!isSameLine(Math.abs(leg1.point), Math.abs(leg2.point))) return false;
    return leg1.selection !== leg2.selection;
  }
  
  // For other markets, just check different selections
  return leg1.selection !== leg2.selection;
}

// Calculate arbitrage index (sum of 1/decimal odds)
function calculateArbIndex(legs) {
  return legs.reduce((sum, leg) => sum + (1 / leg.decimal_odds), 0);
}

// Check if this is a true arbitrage opportunity (2-way)
function isTrueArbitrage(leg1, leg2, marketType, sport, buffer = 0.015) {
  // Must be different sportsbooks
  if (leg1.sportsbook === leg2.sportsbook) return false;
  
  // Filter out unrealistic odds (likely stale/suspended markets)
  const maxRealisticOdds = 20.0; // Decimal odds above 20 (1900% return) are likely stale
  if (leg1.decimal_odds > maxRealisticOdds || leg2.decimal_odds > maxRealisticOdds) return false;
  
  // Must be complementary outcomes (same line, opposite sides)
  if (!areComplementaryOutcomes(leg1, leg2, marketType, sport)) return false;
  
  // Calculate arbitrage index
  const arbIndex = (1 / leg1.decimal_odds) + (1 / leg2.decimal_odds);
  
  // Must be profitable after buffer for slippage
  if (arbIndex >= (1 - buffer)) return false;
  
  // Filter out unrealistically high profit margins (>10% is suspicious)
  const profitMargin = (1 - arbIndex) * 100;
  if (profitMargin > 10) return false;
  
  return true;
}

// Check if this is a true 3-way arbitrage opportunity
function isTrue3WayArbitrage(leg1, leg2, leg3, marketType, sport, buffer = 0.015) {
  // Must be different sportsbooks for at least 2 legs
  const sportsbooks = [leg1.sportsbook, leg2.sportsbook, leg3.sportsbook];
  const uniqueSportsbooks = [...new Set(sportsbooks)];
  if (uniqueSportsbooks.length < 2) return false;
  
  // Filter out unrealistic odds
  const maxRealisticOdds = 20.0;
  if (leg1.decimal_odds > maxRealisticOdds || leg2.decimal_odds > maxRealisticOdds || leg3.decimal_odds > maxRealisticOdds) return false;
  
  // Must have different selections
  const selections = [leg1.selection, leg2.selection, leg3.selection];
  const uniqueSelections = [...new Set(selections)];
  if (uniqueSelections.length !== 3) return false;
  
  // Calculate arbitrage index for 3-way
  const arbIndex = (1 / leg1.decimal_odds) + (1 / leg2.decimal_odds) + (1 / leg3.decimal_odds);
  
  // Must be profitable after buffer
  if (arbIndex >= (1 - buffer)) return false;
  
  // Filter out unrealistically high profit margins
  const profitMargin = (1 - arbIndex) * 100;
  if (profitMargin > 10) return false;
  
  return true;
}

// Handle pushable lines (whole numbers)
function handlePushableLines(leg1, leg2, marketType) {
  // Only relevant for totals and spreads with whole numbers
  if (marketType !== 'totals' && marketType !== 'spreads') {
    return { isPushable: false };
  }
  
  const line = leg1.point;
  if (line === null || line === undefined) return { isPushable: false };
  
  // Check if it's a whole number (pushable)
  const isPushable = Number.isInteger(line);
  
  if (!isPushable) return { isPushable: false };
  
  // For pushable lines, calculate worst-case scenario
  // If one leg pushes, we get stake back but lose the other
  const d1 = leg1.decimal_odds;
  const d2 = leg2.decimal_odds;
  
  // Optimal stakes for $100 total
  const stake1 = (100 * d2) / (d1 + d2);
  const stake2 = (100 * d1) / (d1 + d2);
  
  // Worst case: one pushes (stake returned), other loses
  const worstCase1 = stake1 - stake2; // Leg1 pushes, leg2 loses
  const worstCase2 = stake2 - stake1; // Leg2 pushes, leg1 loses
  const worstCasePayout = Math.min(worstCase1, worstCase2);
  
  return {
    isPushable: true,
    worstCasePayout,
    isStillProfitable: worstCasePayout >= 0
  };
}

// Find strict arbitrage opportunities in a game
function findStrictArbitrage(game, marketKey, displayName) {
  const opportunities = [];
  
  // Detect sport type
  const sport = detectSport(game);
  
  // Get all bookmakers with this market
  const marketBooks = game.bookmakers?.filter(book => 
    book.markets?.some(market => market.key === marketKey)
  ) || [];
  
  if (marketBooks.length < 2) return opportunities;
  
  // Collect all odds with proper structure
  const allOdds = [];
  marketBooks.forEach(book => {
    const market = book.markets.find(m => m.key === marketKey);
    if (market?.outcomes) {
      // Filter outcomes based on sport validity
      const validOutcomes = areValidOutcomes(market.outcomes, sport, marketKey);
      validOutcomes.forEach(outcome => {
        const decimal = toDecimal(outcome.price);
        allOdds.push({
          sportsbook: book.title,
          selection: outcome.name,
          point: outcome.point || null,
          american_odds: outcome.price,
          decimal_odds: decimal,
          implied_prob: 1 / decimal,
          timestamp: new Date().getTime()
        });
      });
    }
  });
  
  // Group by line for spreads/totals
  if (marketKey === 'spreads' || marketKey === 'totals' || 
      marketKey.includes('spread') || marketKey.includes('total')) {
    
    // Group odds by line
    const lineGroups = {};
    allOdds.forEach(odd => {
      const lineKey = odd.point !== null ? odd.point.toFixed(1) : 'no-line';
      if (!lineGroups[lineKey]) lineGroups[lineKey] = [];
      lineGroups[lineKey].push(odd);
    });
    
    // Check each line group for arbitrage
    Object.entries(lineGroups).forEach(([line, odds]) => {
      // Need at least 2 different outcomes for the same line
      const uniqueSelections = [...new Set(odds.map(o => o.selection))];
      if (uniqueSelections.length < 2) return;
      
      // Find best odds for each outcome
      const bestOdds = uniqueSelections.map(selection => {
        const selectionOdds = odds.filter(o => o.selection === selection);
        return selectionOdds.reduce((best, current) => 
          current.decimal_odds > best.decimal_odds ? current : best
        );
      });
      
      // Check pairs for arbitrage
      for (let i = 0; i < bestOdds.length; i++) {
        for (let j = i + 1; j < bestOdds.length; j++) {
          const leg1 = bestOdds[i];
          const leg2 = bestOdds[j];
          
          if (isTrueArbitrage(leg1, leg2, marketKey)) {
            const arbIndex = calculateArbIndex([leg1, leg2]);
            const profitMargin = ((1 - arbIndex) * 100);
            
            // Check push handling for whole number lines
            const pushInfo = handlePushableLines(leg1, leg2, marketKey);
            
            // Skip if pushable and not profitable in worst case
            if (pushInfo.isPushable && !pushInfo.isStillProfitable) continue;
            
            // Calculate optimal stakes
            const T = 100; // Total stake
            const d1 = leg1.decimal_odds;
            const d2 = leg2.decimal_odds;
            const stake1 = (T * d2) / (d1 + d2);
            const stake2 = (T * d1) / (d1 + d2);
            const guaranteedProfit = T * ((d1 * d2) / (d1 + d2) - 1);
            
            opportunities.push({
              id: `${game.id}_${marketKey}_${line}_${Date.now()}`,
              type: 'STRICT_ARBITRAGE',
              sport: game.sport_nice || game.sport || 'Unknown',
              game_id: game.id,
              matchup: `${game.away_team} @ ${game.home_team}`,
              market_type: marketKey,
              market_display: displayName,
              line: parseFloat(line),
              commence_time: game.commence_time,
              legs: [leg1, leg2].map(leg => ({
                sportsbook: leg.sportsbook,
                selection: leg.selection,
                point: leg.point,
                american_odds: leg.american_odds,
                decimal_odds: leg.decimal_odds.toFixed(3),
                implied_prob: (leg.implied_prob * 100).toFixed(2) + '%'
              })),
              arb_index: arbIndex.toFixed(4),
              profit_percentage: profitMargin.toFixed(2),
              investment_needed: T,
              guaranteed_profit: guaranteedProfit.toFixed(2),
              stake_distribution: [
                {
                  sportsbook: leg1.sportsbook,
                  selection: leg1.selection,
                  stake: `$${stake1.toFixed(2)}`,
                  payout: `$${(stake1 * d1).toFixed(2)}`
                },
                {
                  sportsbook: leg2.sportsbook,
                  selection: leg2.selection,
                  stake: `$${stake2.toFixed(2)}`,
                  payout: `$${(stake2 * d2).toFixed(2)}`
                }
              ],
              push_info: pushInfo.isPushable ? {
                is_pushable: true,
                worst_case_payout: pushInfo.worstCasePayout.toFixed(2)
              } : null,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    });
  } else {
    // For moneyline and other markets (no line to match)
    const uniqueOutcomes = [...new Set(allOdds.map(o => o.selection))];
    
    if (uniqueOutcomes.length >= 2) {
      // Find best odds for each outcome
      const bestOdds = uniqueOutcomes.map(outcome => {
        const outcomeOdds = allOdds.filter(o => o.selection === outcome);
        return outcomeOdds.reduce((best, current) => 
          current.decimal_odds > best.decimal_odds ? current : best
        );
      });
      
      // Handle 3-way markets (soccer) vs 2-way markets
      if (hasThreeWayMarkets(sport) && uniqueOutcomes.length === 3 && (marketKey === 'h2h' || marketKey === 'moneyline')) {
        // 3-way arbitrage for soccer
        const [leg1, leg2, leg3] = bestOdds;
        
        if (isTrue3WayArbitrage(leg1, leg2, leg3, marketKey, sport)) {
          const arbIndex = calculateArbIndex([leg1, leg2, leg3]);
          const profitMargin = ((1 - arbIndex) * 100);
          
          // Calculate optimal stakes for 3-way arbitrage
          const T = 100;
          const d1 = leg1.decimal_odds;
          const d2 = leg2.decimal_odds;
          const d3 = leg3.decimal_odds;
          
          // Optimal stake distribution for 3-way
          const stake1 = T / (d1 * arbIndex);
          const stake2 = T / (d2 * arbIndex);
          const stake3 = T / (d3 * arbIndex);
          const guaranteedProfit = T - (stake1 + stake2 + stake3);
          
          opportunities.push({
            id: `${game.id}_${marketKey}_3way_${Date.now()}`,
            type: 'STRICT_ARBITRAGE_3WAY',
            sport: game.sport_nice || game.sport || 'Unknown',
            game_id: game.id,
            matchup: `${game.away_team} @ ${game.home_team}`,
            market_type: marketKey,
            market_display: displayName + ' (3-Way)',
            commence_time: game.commence_time,
            legs: [leg1, leg2, leg3].map(leg => ({
              sportsbook: leg.sportsbook,
              selection: leg.selection,
              american_odds: leg.american_odds,
              decimal_odds: leg.decimal_odds.toFixed(3),
              implied_prob: (leg.implied_prob * 100).toFixed(2) + '%'
            })),
            arb_index: arbIndex.toFixed(4),
            profit_percentage: profitMargin.toFixed(2),
            investment_needed: (stake1 + stake2 + stake3).toFixed(2),
            guaranteed_profit: guaranteedProfit.toFixed(2),
            stake_distribution: [
              {
                sportsbook: leg1.sportsbook,
                selection: leg1.selection,
                stake: `$${stake1.toFixed(2)}`,
                payout: `$${(stake1 * d1).toFixed(2)}`
              },
              {
                sportsbook: leg2.sportsbook,
                selection: leg2.selection,
                stake: `$${stake2.toFixed(2)}`,
                payout: `$${(stake2 * d2).toFixed(2)}`
              },
              {
                sportsbook: leg3.sportsbook,
                selection: leg3.selection,
                stake: `$${stake3.toFixed(2)}`,
                payout: `$${(stake3 * d3).toFixed(2)}`
              }
            ],
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // 2-way arbitrage for all other sports/markets
        for (let i = 0; i < bestOdds.length; i++) {
          for (let j = i + 1; j < bestOdds.length; j++) {
            const leg1 = bestOdds[i];
            const leg2 = bestOdds[j];
            
            if (isTrueArbitrage(leg1, leg2, marketKey, sport)) {
              const arbIndex = calculateArbIndex([leg1, leg2]);
              const profitMargin = ((1 - arbIndex) * 100);
              
              // Calculate optimal stakes
              const T = 100;
              const d1 = leg1.decimal_odds;
              const d2 = leg2.decimal_odds;
              const stake1 = (T * d2) / (d1 + d2);
              const stake2 = (T * d1) / (d1 + d2);
              const guaranteedProfit = T * ((d1 * d2) / (d1 + d2) - 1);
              
              opportunities.push({
                id: `${game.id}_${marketKey}_${Date.now()}`,
                type: 'STRICT_ARBITRAGE',
                sport: game.sport_nice || game.sport || 'Unknown',
                game_id: game.id,
                matchup: `${game.away_team} @ ${game.home_team}`,
                market_type: marketKey,
                market_display: displayName,
                commence_time: game.commence_time,
                legs: [leg1, leg2].map(leg => ({
                  sportsbook: leg.sportsbook,
                  selection: leg.selection,
                  american_odds: leg.american_odds,
                  decimal_odds: leg.decimal_odds.toFixed(3),
                  implied_prob: (leg.implied_prob * 100).toFixed(2) + '%'
                })),
                arb_index: arbIndex.toFixed(4),
                profit_percentage: profitMargin.toFixed(2),
                investment_needed: T,
                guaranteed_profit: guaranteedProfit.toFixed(2),
                stake_distribution: [
                  {
                    sportsbook: leg1.sportsbook,
                    selection: leg1.selection,
                    stake: `$${stake1.toFixed(2)}`,
                    payout: `$${(stake1 * d1).toFixed(2)}`
                  },
                  {
                    sportsbook: leg2.sportsbook,
                    selection: leg2.selection,
                    stake: `$${stake2.toFixed(2)}`,
                    payout: `$${(stake2 * d2).toFixed(2)}`
                  }
                ],
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    }
  }
  
  return opportunities;
}

// Identify middles (not arbitrage, but can be profitable)
function findMiddles(game, marketKey, displayName) {
  const middles = [];
  
  // Only relevant for spreads and totals
  if (!['spreads', 'totals'].includes(marketKey) && 
      !marketKey.includes('spread') && !marketKey.includes('total')) {
    return middles;
  }
  
  const marketBooks = game.bookmakers?.filter(book => 
    book.markets?.some(market => market.key === marketKey)
  ) || [];
  
  if (marketBooks.length < 2) return middles;
  
  // Collect all odds
  const allOdds = [];
  marketBooks.forEach(book => {
    const market = book.markets.find(m => m.key === marketKey);
    if (market?.outcomes) {
      market.outcomes.forEach(outcome => {
        const decimal = toDecimal(outcome.price);
        allOdds.push({
          sportsbook: book.title,
          selection: outcome.name,
          point: outcome.point || null,
          american_odds: outcome.price,
          decimal_odds: decimal
        });
      });
    }
  });
  
  // Find opportunities with different lines (middles)
  for (let i = 0; i < allOdds.length; i++) {
    for (let j = i + 1; j < allOdds.length; j++) {
      const leg1 = allOdds[i];
      const leg2 = allOdds[j];
      
      // Skip if same sportsbook or same line (not a middle)
      if (leg1.sportsbook === leg2.sportsbook) continue;
      if (isSameLine(leg1.point, leg2.point)) continue;
      
      // Check for middle opportunity
      if (marketKey === 'totals' || marketKey.includes('total')) {
        const isOver1 = leg1.selection.toLowerCase().includes('over');
        const isOver2 = leg2.selection.toLowerCase().includes('over');
        
        // Need opposite sides with gap
        if (isOver1 === isOver2) continue;
        
        const gap = Math.abs(leg1.point - leg2.point);
        if (gap > 0.5 && gap <= 20) { // Reasonable gap for middle
          middles.push({
            id: `${game.id}_middle_${marketKey}_${Date.now()}`,
            type: 'MIDDLE',
            sport: game.sport_nice || game.sport || 'Unknown',
            game_id: game.id,
            matchup: `${game.away_team} @ ${game.home_team}`,
            market_type: marketKey,
            market_display: displayName + ' Middle',
            commence_time: game.commence_time,
            legs: [leg1, leg2].map(leg => ({
              sportsbook: leg.sportsbook,
              selection: leg.selection,
              point: leg.point,
              american_odds: leg.american_odds,
              decimal_odds: leg.decimal_odds.toFixed(3)
            })),
            middle_gap: gap.toFixed(1),
            middle_range: `${Math.min(leg1.point, leg2.point)} - ${Math.max(leg1.point, leg2.point)}`,
            note: 'Middle opportunity - both bets can win if result lands in the gap'
          });
        }
      }
    }
  }
  
  return middles;
}

module.exports = {
  toDecimal,
  isSameLine,
  areComplementaryOutcomes,
  calculateArbIndex,
  isTrueArbitrage,
  handlePushableLines,
  findStrictArbitrage,
  findMiddles
};