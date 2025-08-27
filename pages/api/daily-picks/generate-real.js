// Real Daily Picks Generator using Supabase Odds Data
// This generates picks based on actual edge calculations from your database

import { supabase } from '../../../utils/supabaseClient';

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
    console.log('📊 Fetching best odds from mv_current_best_odds...');
    
    // Get current best odds from materialized view
    const { data: bestOdds, error } = await supabase
      .from('mv_current_best_odds')
      .select('*')
      .order('odds_american', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('❌ Error fetching best odds:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return [];
    }
    
    console.log(`✅ Fetched ${bestOdds?.length || 0} odds from mv_current_best_odds`);
    
    if (!bestOdds || bestOdds.length === 0) {
      console.log('⚠️ No odds data found in mv_current_best_odds');
      console.log('This could mean:');
      console.log('  1. The materialized view is empty');
      console.log('  2. The view needs to be refreshed');
      console.log('  3. No recent odds data has been collected');
      
      // Try checking other potential odds tables as fallback
      console.log('🔍 Checking for alternative odds tables...');
      const alternativeTables = ['odds_history', 'live_odds', 'current_odds'];
      
      for (const tableName of alternativeTables) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(1);
          
          console.log(`  ${tableName}: ${error ? 'ERROR - ' + error.message : `Found ${count || 0} records`}`);
          
          if (data && data.length > 0) {
            console.log(`  Sample record from ${tableName}:`, JSON.stringify(data[0], null, 2));
          }
        } catch (e) {
          console.log(`  ${tableName}: Table doesn't exist or access denied`);
        }
      }
      
      return [];
    }
    
    // Group by game and market to find edges
    const gameMarkets = {};
    
    bestOdds.forEach(odd => {
      const key = `${odd.game_id}_${odd.market_id}`;
      if (!gameMarkets[key]) {
        gameMarkets[key] = [];
      }
      gameMarkets[key].push(odd);
    });
    
    console.log(`📈 Grouped into ${Object.keys(gameMarkets).length} unique game/market combinations`);
    
    // Calculate edges for each market
    let marketsAnalyzed = 0;
    let edgesFound = 0;
    
    for (const [key, marketOdds] of Object.entries(gameMarkets)) {
      if (marketOdds.length < 2) continue; // Need at least 2 outcomes for a market
      
      marketsAnalyzed++;
      
      // Calculate no-vig fair odds
      const fairOdds = calculateNoVigOdds(marketOdds);
      
      // Find positive edge opportunities
      marketOdds.forEach(odd => {
        const fairOdd = fairOdds[odd.outcome_name];
        if (!fairOdd) return;
        
        const edge = calculateEdge(odd.odds_american, fairOdd);
        
        if (edge > 2) { // Minimum 2% edge threshold
          edgesFound++;
          console.log(`  ✨ Found edge: ${odd.outcome_name} @ ${odd.odds_american} (${edge.toFixed(2)}% edge)`);
          
          opportunities.push({
            gameId: odd.game_id,
            sport: odd.sport || 'NBA',
            homeTeam: extractTeamFromOutcome(odd.outcome_name, 'home'),
            awayTeam: extractTeamFromOutcome(odd.outcome_name, 'away'),
            commenceTime: odd.ts || new Date().toISOString(),
            marketType: odd.market_id,
            selection: odd.outcome_name,
            bestOdds: odd.odds_american,
            bestSportsbook: odd.book_id,
            decimalOdds: odd.odds_decimal || americanToDecimal(odd.odds_american),
            fairOdds: fairOdd,
            edgePercentage: edge,
            rank: odd.rank || 1
          });
        }
      });
    }
    
    console.log(`📊 Analysis complete: ${marketsAnalyzed} markets analyzed, ${edgesFound} edges found`);
    
    // Also check AI generated bets for additional opportunities
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
    }
    
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
    
    // Sort by edge percentage
    opportunities.sort((a, b) => b.edgePercentage - a.edgePercentage);
    
    // Remove duplicates (same game, same market)
    const unique = new Map();
    opportunities.forEach(opp => {
      const key = `${opp.gameId}_${opp.marketType}_${opp.selection}`;
      if (!unique.has(key) || unique.get(key).edgePercentage < opp.edgePercentage) {
        unique.set(key, opp);
      }
    });
    
    return Array.from(unique.values());
    
  } catch (error) {
    console.error('Error finding opportunities:', error);
    return [];
  }
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