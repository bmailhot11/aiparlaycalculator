// Real Daily Picks Generator using Events Cache Data
// This generates picks based on actual odds data from the same source as line shopping/arbitrage

import { supabase } from '../../../utils/supabaseClient';
const eventsCache = require('../../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 Generating daily picks from real Supabase data...');
    
    // Step 1: Get best odds from materialized view
    const opportunities = await findBestOpportunities();
    
    if (opportunities.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No qualifying opportunities found in current odds data'
      });
    }
    
    console.log(`Found ${opportunities.length} opportunities with positive edge`);
    
    // Step 2: Generate picks from opportunities
    const picks = generatePicksFromOpportunities(opportunities);
    
    // Step 3: Save to database
    if (picks.single || picks.parlay2 || picks.parlay4) {
      try {
        await savePicksToDatabase(picks);
        console.log('✅ Picks saved to database');
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError.message);
      }
    }
    
    return res.status(200).json({
      success: true,
      ...picks,
      metadata: {
        totalOpportunities: opportunities.length,
        source: 'supabase_real_odds',
        generated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating picks:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

async function findBestOpportunities() {
  const opportunities = [];
  
  try {
    console.log('📊 Using same data source as line shopping and arbitrage...');
    
    // Use the exact same approach as your working functions
    const sportsToCheck = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF'];
    
    for (const sport of sportsToCheck) {
      try {
        console.log(`🏈 Checking ${sport} for opportunities...`);
        
        // Step 1: Get upcoming events (same as line shopping/arbitrage)
        const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
        
        if (!upcomingEvents || upcomingEvents.length === 0) {
          console.log(`  No events found for ${sport}`);
          continue;
        }
        
        console.log(`  ✅ Found ${upcomingEvents.length} upcoming events for ${sport}`);
        
        // Step 2: Get odds for these events (same as line shopping/arbitrage)
        const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, 'h2h,spreads,totals', true);
        
        if (!oddsData || oddsData.length === 0) {
          console.log(`  No odds data found for ${sport}`);
          continue;
        }
        
        console.log(`  ✅ Got odds for ${oddsData.length} games in ${sport}`);
        
        // Step 3: Find edges in the odds data
        const sportOpportunities = findEdgesInOddsData(oddsData, sport);
        opportunities.push(...sportOpportunities);
        
        console.log(`  ✨ Found ${sportOpportunities.length} edge opportunities in ${sport}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${sport}:`, error.message);
      }
    }
    
    // Also check AI generated bets as additional source
    console.log('🤖 Checking AI generated bets for additional opportunities...');
    const { data: aiBets, error: aiError } = await supabase
      .from('ai_generated_bets')
      .select('*')
      .eq('status', 'pending')
      .gte('confidence_score', 0.7)
      .order('expected_value', { ascending: false })
      .limit(10);
    
    if (aiError) {
      console.log('⚠️ Error fetching AI bets:', aiError.message);
    } else {
      console.log(`✅ Found ${aiBets?.length || 0} high-confidence AI bets`);
      
      if (aiBets && aiBets.length > 0) {
        aiBets.forEach(bet => {
          if (bet.recommended_legs && Array.isArray(bet.recommended_legs)) {
            bet.recommended_legs.forEach(leg => {
              if (leg.odds && (bet.expected_value > 0 || bet.confidence_score > 0.8)) {
                opportunities.push({
                  gameId: `ai_${bet.id}_${leg.leg_index || 0}`,
                  sport: leg.league || leg.sport || 'NBA',
                  homeTeam: leg.home_team || extractHomeTeam(leg.matchup || leg.game),
                  awayTeam: leg.away_team || extractAwayTeam(leg.matchup || leg.game),
                  commenceTime: leg.commence_time || new Date().toISOString(),
                  marketType: leg.market || leg.bet_type || 'spread',
                  selection: leg.selection,
                  bestOdds: parseAmericanOdds(leg.odds),
                  bestSportsbook: leg.sportsbook || 'AI Recommended',
                  decimalOdds: leg.decimal_odds || americanToDecimal(leg.odds),
                  edgePercentage: bet.expected_value || 3,
                  confidence: bet.confidence_score,
                  source: 'ai_generated'
                });
              }
            });
          }
        });
      }
    }
    
    // Sort by edge percentage
    opportunities.sort((a, b) => b.edgePercentage - a.edgePercentage);
    
    console.log(`🎯 Total opportunities found: ${opportunities.length}`);
    return opportunities;
    
  } catch (error) {
    console.error('Error finding opportunities:', error);
    return [];
  }
}

// New function to find edges in odds data (same structure as your working APIs)
function findEdgesInOddsData(oddsData, sport) {
  const opportunities = [];
  
  for (const game of oddsData) {
    if (!game.bookmakers || game.bookmakers.length < 2) continue;
    
    // Process each market
    for (const bookmaker of game.bookmakers) {
      if (!bookmaker.markets) continue;
      
      for (const market of bookmaker.markets) {
        if (!market.outcomes) continue;
        
        // Calculate no-vig fair odds for this market
        const fairOdds = calculateNoVigMarket(market.outcomes);
        
        // Find edges in outcomes
        market.outcomes.forEach(outcome => {
          const fairOdd = fairOdds[outcome.name];
          if (!fairOdd) return;
          
          const edge = calculateEdge(outcome.price, fairOdd);
          
          if (edge > 2) { // Minimum 2% edge
            opportunities.push({
              gameId: game.id,
              sport: sport,
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              commenceTime: game.commence_time,
              marketType: market.key,
              selection: outcome.name,
              bestOdds: outcome.price,
              bestSportsbook: bookmaker.title,
              decimalOdds: americanToDecimal(outcome.price),
              fairOdds: fairOdd,
              edgePercentage: edge
            });
          }
        });
      }
    }
  }
  
  return opportunities;
}

function calculateNoVigMarket(outcomes) {
  const fairOdds = {};
  
  if (!outcomes || outcomes.length < 2) return fairOdds;
  
  // Calculate total implied probability
  let totalImplied = 0;
  outcomes.forEach(outcome => {
    const implied = 1 / americanToDecimal(outcome.price);
    totalImplied += implied;
  });
  
  // Remove vig and calculate fair odds
  outcomes.forEach(outcome => {
    const implied = 1 / americanToDecimal(outcome.price);
    const fairImplied = implied / totalImplied;
    const fairDecimal = 1 / fairImplied;
    fairOdds[outcome.name] = decimalToAmerican(fairDecimal);
  });
  
  return fairOdds;
}

function calculateNoVigOdds(marketOdds) {
  const fairOdds = {};
  
  // Calculate total implied probability
  let totalImplied = 0;
  marketOdds.forEach(odd => {
    const implied = 1 / (odd.odds_decimal || americanToDecimal(odd.odds_american));
    totalImplied += implied;
  });
  
  // Remove vig and calculate fair odds
  const vig = totalImplied - 1;
  marketOdds.forEach(odd => {
    const implied = 1 / (odd.odds_decimal || americanToDecimal(odd.odds_american));
    const fairImplied = implied / totalImplied;
    const fairDecimal = 1 / fairImplied;
    fairOdds[odd.outcome_name] = decimalToAmerican(fairDecimal);
  });
  
  return fairOdds;
}

function calculateEdge(bestOdds, fairOdds) {
  const bestDecimal = americanToDecimal(bestOdds);
  const fairDecimal = americanToDecimal(fairOdds);
  
  // Edge = (Best Decimal Odds / Fair Decimal Odds - 1) * 100
  const edge = ((bestDecimal / fairDecimal) - 1) * 100;
  return Math.max(0, edge);
}

function generatePicksFromOpportunities(opportunities) {
  const picks = {
    single: null,
    parlay2: null,
    parlay4: null,
    publishedAt: new Date().toISOString()
  };
  
  // Single bet - highest edge opportunity
  if (opportunities.length > 0) {
    const bestOpp = opportunities[0];
    picks.single = {
      legs: [bestOpp],
      totalOdds: bestOpp.bestOdds,
      edgePercentage: bestOpp.edgePercentage.toFixed(1),
      impliedProbability: (100 / bestOpp.decimalOdds).toFixed(1),
      potentialPayout: `$${((bestOpp.decimalOdds - 1) * 100).toFixed(0)}`
    };
  }
  
  // 2-leg parlay - avoid same game parlays
  if (opportunities.length >= 2) {
    const parlayLegs = [];
    const usedGames = new Set();
    
    for (const opp of opportunities) {
      const gameKey = opp.gameId.split('_')[0]; // Get base game ID
      if (!usedGames.has(gameKey)) {
        parlayLegs.push(opp);
        usedGames.add(gameKey);
        if (parlayLegs.length === 2) break;
      }
    }
    
    if (parlayLegs.length === 2) {
      const parlayOdds = parlayLegs.reduce((acc, leg) => acc * leg.decimalOdds, 1);
      const avgEdge = parlayLegs.reduce((sum, leg) => sum + leg.edgePercentage, 0) / 2;
      
      picks.parlay2 = {
        legs: parlayLegs,
        totalOdds: decimalToAmerican(parlayOdds),
        edgePercentage: avgEdge.toFixed(1),
        impliedProbability: (100 / parlayOdds).toFixed(1),
        potentialPayout: `$${((parlayOdds - 1) * 100).toFixed(0)}`
      };
    }
  }
  
  // 4-leg parlay
  if (opportunities.length >= 4) {
    const parlayLegs = [];
    const usedGames = new Set();
    
    for (const opp of opportunities) {
      const gameKey = opp.gameId.split('_')[0];
      if (!usedGames.has(gameKey)) {
        parlayLegs.push(opp);
        usedGames.add(gameKey);
        if (parlayLegs.length === 4) break;
      }
    }
    
    if (parlayLegs.length === 4) {
      const parlayOdds = parlayLegs.reduce((acc, leg) => acc * leg.decimalOdds, 1);
      const avgEdge = parlayLegs.reduce((sum, leg) => sum + leg.edgePercentage, 0) / 4;
      
      picks.parlay4 = {
        legs: parlayLegs,
        totalOdds: decimalToAmerican(parlayOdds),
        edgePercentage: avgEdge.toFixed(1),
        impliedProbability: (100 / parlayOdds).toFixed(1),
        potentialPayout: `$${((parlayOdds - 1) * 100).toFixed(0)}`
      };
    }
  }
  
  return picks;
}

// Helper functions
function americanToDecimal(americanOdds) {
  const odds = typeof americanOdds === 'string' ? 
    parseInt(americanOdds.replace('+', '')) : americanOdds;
  
  if (odds > 0) {
    return ((odds / 100) + 1);
  } else {
    return ((100 / Math.abs(odds)) + 1);
  }
}

function decimalToAmerican(decimalOdds) {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

function parseAmericanOdds(oddsStr) {
  if (typeof oddsStr === 'number') return oddsStr;
  if (typeof oddsStr === 'string') {
    return parseInt(oddsStr.replace('+', ''));
  }
  return 100;
}

function extractTeamFromOutcome(outcome, type) {
  // Try to extract team name from outcome string
  if (!outcome) return type === 'home' ? 'Home Team' : 'Away Team';
  
  // Common patterns
  if (outcome.includes(' @ ')) {
    const parts = outcome.split(' @ ');
    return type === 'home' ? parts[1] : parts[0];
  }
  
  if (outcome.includes(' vs ')) {
    const parts = outcome.split(' vs ');
    return type === 'home' ? parts[0] : parts[1];
  }
  
  // For simple team names
  return outcome;
}

function extractHomeTeam(matchup) {
  if (!matchup) return 'Home Team';
  if (matchup.includes('@')) {
    return matchup.split('@')[1]?.trim();
  }
  if (matchup.includes(' vs ')) {
    return matchup.split(' vs ')[0]?.trim();
  }
  return matchup;
}

function extractAwayTeam(matchup) {
  if (!matchup) return 'Away Team';
  if (matchup.includes('@')) {
    return matchup.split('@')[0]?.trim();
  }
  if (matchup.includes(' vs ')) {
    return matchup.split(' vs ')[1]?.trim();
  }
  return matchup;
}

// Save picks to database (same as before)
async function savePicksToDatabase(picks) {
  const today = new Date().toISOString().split('T')[0];
  const publishTime = new Date();
  
  // Check if we already have picks for today
  const { data: existingReco } = await supabase
    .from('daily_recos')
    .select('id')
    .eq('reco_date', today)
    .single();
  
  if (existingReco) {
    console.log('Picks already exist for today, updating...');
    // Delete existing picks for today to replace them
    await supabase
      .from('daily_recos')
      .delete()
      .eq('id', existingReco.id);
  }
  
  // Create daily_recos record
  const { data: dailyReco, error: recoError } = await supabase
    .from('daily_recos')
    .insert({
      reco_date: today,
      published_at: publishTime.toISOString(),
      status: 'published',
      no_bet_reason: null,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'generate-real'
      }
    })
    .select()
    .single();
  
  if (recoError) {
    console.error('Error creating daily_recos:', recoError);
    throw recoError;
  }
  
  let singleBetId = null;
  let parlay2Id = null;
  let parlay4Id = null;
  
  // Save single bet
  if (picks.single) {
    singleBetId = await saveBetToDatabase(dailyReco.id, 'single', picks.single);
  }
  
  // Save 2-leg parlay
  if (picks.parlay2) {
    parlay2Id = await saveBetToDatabase(dailyReco.id, 'parlay2', picks.parlay2);
  }
  
  // Save 4-leg parlay
  if (picks.parlay4) {
    parlay4Id = await saveBetToDatabase(dailyReco.id, 'parlay4', picks.parlay4);
  }
  
  // Update daily_recos with bet IDs
  await supabase
    .from('daily_recos')
    .update({
      single_bet_id: singleBetId,
      parlay_2_id: parlay2Id,
      parlay_4_id: parlay4Id
    })
    .eq('id', dailyReco.id);
  
  console.log(`Saved picks to database: Daily Reco ID=${dailyReco.id}`);
  return dailyReco.id;
}

async function saveBetToDatabase(dailyRecoId, betType, bet) {
  // Save the bet record
  const { data: betRecord, error: betError } = await supabase
    .from('reco_bets')
    .insert({
      daily_reco_id: dailyRecoId,
      bet_type: betType,
      total_legs: bet.legs.length,
      status: 'active',
      combined_odds: bet.totalOdds,
      decimal_odds: americanToDecimal(bet.totalOdds),
      edge_percentage: parseFloat(bet.edgePercentage),
      estimated_payout: parseFloat(bet.potentialPayout.replace('$', ''))
    })
    .select()
    .single();
  
  if (betError) {
    console.error(`Error saving ${betType} bet:`, betError);
    throw betError;
  }
  
  // Save each leg
  for (let i = 0; i < bet.legs.length; i++) {
    const leg = bet.legs[i];
    
    const { error: legError } = await supabase
      .from('reco_bet_legs')
      .insert({
        reco_bet_id: betRecord.id,
        leg_index: i,
        sport: leg.sport || 'NBA',
        game_id: leg.gameId || `game_${Date.now()}_${i}`,
        home_team: leg.homeTeam,
        away_team: leg.awayTeam,
        commence_time: leg.commenceTime || new Date().toISOString(),
        market_type: leg.marketType,
        selection: leg.selection,
        selection_key: leg.selection?.toLowerCase().replace(/\s+/g, '_'),
        best_sportsbook: leg.bestSportsbook,
        best_odds: leg.bestOdds,
        decimal_odds: leg.decimalOdds,
        fair_odds: leg.fairOdds || leg.decimalOdds,
        edge_percentage: leg.edgePercentage,
        no_vig_probability: (100 / leg.decimalOdds)
      });
    
    if (legError) {
      console.error(`Error saving leg ${i} for ${betType}:`, legError);
      throw legError;
    }
  }
  
  console.log(`Saved ${betType} bet with ${bet.legs.length} legs`);
  return betRecord.id;
}