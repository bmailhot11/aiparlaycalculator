// Fixed Daily Picks Generator - Properly saves legs to database
import { supabase } from '../../../utils/supabaseClient';
const eventsCache = require('../../../lib/events-cache.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 Generating daily picks with FIXED leg saving...');
    
    const opportunities = await findBestOpportunities();
    
    if (opportunities.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No qualifying opportunities found in current odds data'
      });
    }
    
    console.log(`Found ${opportunities.length} opportunities with positive edge`);
    
    const picks = generatePicksFromOpportunities(opportunities);
    
    // Save to database with proper leg saving
    if (picks.single || picks.parlay2 || picks.parlay4) {
      try {
        await savePicksToDatabase(picks);
        console.log('✅ Picks saved to database with legs');
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError.message);
        return res.status(500).json({
          success: false,
          error: 'Database save failed: ' + dbError.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      ...picks,
      metadata: {
        totalOpportunities: opportunities.length,
        source: 'supabase_real_odds_fixed',
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

// Same opportunity finding logic but with better validation
async function findBestOpportunities() {
  const opportunities = [];
  
  try {
    console.log('📊 Finding opportunities with realistic validation...');
    
    const sportsToCheck = ['NFL', 'NBA', 'NHL', 'MLB', 'NCAAF'];
    
    for (const sport of sportsToCheck) {
      try {
        console.log(`🏈 Checking ${sport} for opportunities...`);
        
        const upcomingEvents = await eventsCache.cacheUpcomingEvents(sport);
        
        if (!upcomingEvents || upcomingEvents.length === 0) {
          console.log(`  No events found for ${sport}`);
          continue;
        }
        
        console.log(`  ✅ Found ${upcomingEvents.length} upcoming events for ${sport}`);
        
        const oddsData = await eventsCache.getOddsForEvents(upcomingEvents, 'h2h,spreads,totals', true);
        
        if (!oddsData || oddsData.length === 0) {
          console.log(`  No odds data found for ${sport}`);
          continue;
        }
        
        console.log(`  ✅ Got odds for ${oddsData.length} games in ${sport}`);
        
        const sportOpportunities = findEdgesInOddsData(oddsData, sport);
        opportunities.push(...sportOpportunities);
        
        console.log(`  ✨ Found ${sportOpportunities.length} edge opportunities in ${sport}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${sport}:`, error.message);
      }
    }
    
    // Filter out unrealistic opportunities
    const realisticOpportunities = opportunities.filter(opp => {
      return (
        opp.edgePercentage >= 1 && // At least 1% edge
        opp.edgePercentage <= 25 && // Max 25% edge (realistic)
        opp.bestOdds >= -2000 && // No crazy favorites
        opp.bestOdds <= 2000 && // No crazy underdogs
        !opp.bestSportsbook.includes('Betfair') // Skip betting exchange odds
      );
    });
    
    console.log(`🎯 Filtered to ${realisticOpportunities.length} realistic opportunities`);
    
    // Sort by edge percentage
    realisticOpportunities.sort((a, b) => b.edgePercentage - a.edgePercentage);
    
    return realisticOpportunities;
    
  } catch (error) {
    console.error('Error finding opportunities:', error);
    return [];
  }
}

function findEdgesInOddsData(oddsData, sport) {
  const opportunities = [];
  
  for (const game of oddsData) {
    if (!game.bookmakers || game.bookmakers.length < 2) continue;
    
    // Only process games within next 7 days
    const gameTime = new Date(game.commence_time);
    const now = new Date();
    const daysDifference = (gameTime - now) / (1000 * 60 * 60 * 24);
    
    if (daysDifference > 7 || daysDifference < 0) continue;
    
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
      const gameKey = opp.gameId.split('_')[0];
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

// FIXED: Save picks to database with proper leg saving and error handling
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
        source: 'generate-real-fixed'
      }
    })
    .select()
    .single();
  
  if (recoError) {
    console.error('Error creating daily_recos:', recoError);
    throw recoError;
  }
  
  console.log(`✅ Created daily_recos: ${dailyReco.id}`);
  
  let singleBetId = null;
  let parlay2Id = null;
  let parlay4Id = null;
  
  // Save single bet
  if (picks.single) {
    console.log('💾 Saving single bet...');
    singleBetId = await saveBetToDatabase(dailyReco.id, 'single', picks.single);
    console.log(`✅ Single bet saved: ${singleBetId}`);
  }
  
  // Save 2-leg parlay
  if (picks.parlay2) {
    console.log('💾 Saving 2-leg parlay...');
    parlay2Id = await saveBetToDatabase(dailyReco.id, 'parlay2', picks.parlay2);
    console.log(`✅ 2-leg parlay saved: ${parlay2Id}`);
  }
  
  // Save 4-leg parlay
  if (picks.parlay4) {
    console.log('💾 Saving 4-leg parlay...');
    parlay4Id = await saveBetToDatabase(dailyReco.id, 'parlay4', picks.parlay4);
    console.log(`✅ 4-leg parlay saved: ${parlay4Id}`);
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
  
  console.log(`✅ Saved picks to database: Daily Reco ID=${dailyReco.id}`);
  return dailyReco.id;
}

// FIXED: Proper bet saving with detailed logging and error handling
async function saveBetToDatabase(dailyRecoId, betType, bet) {
  try {
    console.log(`📝 Saving ${betType} bet with ${bet.legs.length} legs...`);
    
    // Save the bet record first - using only the core fields that work
    const { data: betRecord, error: betError } = await supabase
      .from('reco_bets')
      .insert({
        reco_id: dailyRecoId,
        is_parlay: bet.legs.length > 1,
        parlay_legs: bet.legs.length,
        sport: bet.legs[0]?.sport || 'NBA',
        league: bet.legs[0]?.sport || 'NBA',
        market: bet.legs[0]?.marketType || 'h2h',
        selection: bet.legs[0]?.selection || 'TBD',
        odds_american: bet.totalOdds,
        stake: 100, // Default stake for tracking
        bet_type: betType,
        status: 'active'
      })
      .select()
      .single();

    if (betError) {
      console.error(`❌ Error saving ${betType} bet:`, betError);
      throw betError;
    }

    console.log(`✅ Bet record saved: ${betRecord.id}`);

    // Now save each leg individually with proper error handling
    for (let i = 0; i < bet.legs.length; i++) {
      const leg = bet.legs[i];
      
      console.log(`  📝 Saving leg ${i + 1}/${bet.legs.length}: ${leg.awayTeam} @ ${leg.homeTeam}`);

      const legData = {
        bet_id: betRecord.id,
        leg_index: i,
        sport: leg.sport || 'NBA',
        game_id: leg.gameId || `game_${Date.now()}_${i}`,
        home_team: leg.homeTeam,
        away_team: leg.awayTeam,
        commence_time: leg.commenceTime || new Date().toISOString(),
        market_type: leg.marketType,
        selection: leg.selection,
        best_sportsbook: leg.bestSportsbook,
        best_odds: leg.bestOdds,
        decimal_odds: leg.decimalOdds,
        fair_odds: leg.fairOdds || leg.decimalOdds,
        edge_percentage: leg.edgePercentage,
        no_vig_probability: (100 / leg.decimalOdds)
      };

      const { error: legError } = await supabase
        .from('reco_bet_legs')
        .insert(legData);

      if (legError) {
        console.error(`❌ Error saving leg ${i + 1}:`, legError);
        console.error('❌ Leg data:', legData);
        throw legError;
      }
      
      console.log(`  ✅ Leg ${i + 1} saved successfully`);
    }

    console.log(`🎉 Successfully saved ${betType} bet with ${bet.legs.length} legs`);
    return betRecord.id;

  } catch (error) {
    console.error(`❌ Error in saveBetToDatabase for ${betType}:`, error);
    throw error;
  }
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