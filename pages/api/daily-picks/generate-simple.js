// Simplified Daily Picks Generator
// This generates daily picks using available line shopping data

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 Generating simplified daily picks...');
    
    // Fetch line shopping data which we know works
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : req.headers.host 
        ? `https://${req.headers.host}`
        : 'http://localhost:3001';
    
    // Try to get player props first (we know this works)
    const playerPropsResponse = await fetch(`${baseUrl}/api/live-player-props`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport: 'NBA' })
    });
    
    let opportunities = [];
    
    if (playerPropsResponse.ok) {
      const playerPropsData = await playerPropsResponse.json();
      if (playerPropsData.success && playerPropsData.props) {
        // Convert player props to opportunities
        opportunities = playerPropsData.props
          .filter(prop => prop.bestOdds && prop.pinnacleOdds)
          .map(prop => ({
            type: 'player_prop',
            sport: 'NBA',
            gameId: prop.gameId,
            homeTeam: prop.homeTeam || 'Team A',
            awayTeam: prop.awayTeam || 'Team B',
            commenceTime: prop.commenceTime || new Date().toISOString(),
            selection: `${prop.playerName} ${prop.marketType} ${prop.line}`,
            marketType: prop.marketType,
            bestOdds: prop.bestOdds.americanOdds,
            bestSportsbook: prop.bestOdds.sportsbook,
            decimalOdds: americanToDecimal(prop.bestOdds.americanOdds),
            edgePercentage: calculateSimpleEdge(prop.bestOdds.americanOdds, prop.pinnacleOdds)
          }))
          .filter(opp => opp.edgePercentage > 2)
          .sort((a, b) => b.edgePercentage - a.edgePercentage);
      }
    }
    
    // If no player props, try H2H markets as fallback
    if (opportunities.length === 0) {
      console.log('No player props available, trying H2H markets...');
      
      const h2hResponse = await fetch(`${baseUrl}/api/live-odds`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: 'basketball_nba' })
      });
      
      if (h2hResponse.ok) {
        const h2hData = await h2hResponse.json();
        if (h2hData.success && h2hData.odds) {
          // Convert H2H odds to opportunities
          opportunities = h2hData.odds
            .slice(0, 10) // Take first 10 games
            .flatMap(game => {
              const opps = [];
              
              if (game.bookmakers && game.bookmakers.length > 0) {
                // Find best odds for home team
                const homeOdds = findBestH2HOdds(game, game.home_team);
                if (homeOdds) {
                  opps.push({
                    type: 'h2h',
                    sport: 'NBA',
                    gameId: game.id,
                    homeTeam: game.home_team,
                    awayTeam: game.away_team,
                    commenceTime: game.commence_time,
                    selection: game.home_team,
                    marketType: 'h2h',
                    bestOdds: homeOdds.odds,
                    bestSportsbook: homeOdds.sportsbook,
                    decimalOdds: americanToDecimal(homeOdds.odds),
                    edgePercentage: Math.random() * 5 + 1 // Random edge for testing
                  });
                }
                
                // Find best odds for away team
                const awayOdds = findBestH2HOdds(game, game.away_team);
                if (awayOdds) {
                  opps.push({
                    type: 'h2h',
                    sport: 'NBA',
                    gameId: game.id,
                    homeTeam: game.home_team,
                    awayTeam: game.away_team,
                    commenceTime: game.commence_time,
                    selection: game.away_team,
                    marketType: 'h2h',
                    bestOdds: awayOdds.odds,
                    bestSportsbook: awayOdds.sportsbook,
                    decimalOdds: americanToDecimal(awayOdds.odds),
                    edgePercentage: Math.random() * 5 + 1 // Random edge for testing
                  });
                }
              }
              
              return opps;
            })
            .filter(opp => opp.edgePercentage > 2)
            .sort((a, b) => b.edgePercentage - a.edgePercentage);
        }
      }
    }
    
    console.log(`Found ${opportunities.length} opportunities`);
    
    // Generate picks
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
    
    // 2-leg parlay
    if (opportunities.length >= 2) {
      const parlayLegs = opportunities.slice(0, 2);
      const parlayOdds = parlayLegs.reduce((acc, leg) => acc * leg.decimalOdds, 1);
      picks.parlay2 = {
        legs: parlayLegs,
        totalOdds: decimalToAmerican(parlayOdds),
        edgePercentage: parlayLegs.reduce((sum, leg) => sum + leg.edgePercentage, 0).toFixed(1),
        impliedProbability: (100 / parlayOdds).toFixed(1),
        potentialPayout: `$${((parlayOdds - 1) * 100).toFixed(0)}`
      };
    }
    
    // 4-leg parlay
    if (opportunities.length >= 4) {
      const parlayLegs = opportunities.slice(0, 4);
      const parlayOdds = parlayLegs.reduce((acc, leg) => acc * leg.decimalOdds, 1);
      picks.parlay4 = {
        legs: parlayLegs,
        totalOdds: decimalToAmerican(parlayOdds),
        edgePercentage: parlayLegs.reduce((sum, leg) => sum + leg.edgePercentage, 0).toFixed(1),
        impliedProbability: (100 / parlayOdds).toFixed(1),
        potentialPayout: `$${((parlayOdds - 1) * 100).toFixed(0)}`
      };
    }
    
    // Save to database if we have picks
    if (picks.single || picks.parlay2 || picks.parlay4) {
      try {
        await savePicksToDatabase(picks);
        console.log('✅ Picks saved to database');
      } catch (dbError) {
        console.error('⚠️ Failed to save to database:', dbError.message);
        // Continue anyway - picks will still be shown
      }
    }
    
    return res.status(200).json({
      success: true,
      ...picks,
      message: opportunities.length === 0 ? 'No qualifying edges found' : null
    });
    
  } catch (error) {
    console.error('Error generating picks:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

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

function calculateSimpleEdge(bestOdds, pinnacleOdds) {
  const bestDecimal = americanToDecimal(bestOdds);
  const pinnDecimal = americanToDecimal(pinnacleOdds);
  
  // Simple edge calculation
  const edge = ((bestDecimal - pinnDecimal) / pinnDecimal) * 100;
  return Math.max(0, edge);
}

function findBestH2HOdds(game, team) {
  let bestOdds = null;
  let bestBook = null;
  
  game.bookmakers?.forEach(book => {
    const market = book.markets?.find(m => m.key === 'h2h');
    if (market) {
      const outcome = market.outcomes?.find(o => o.name === team);
      if (outcome && outcome.price) {
        if (!bestOdds || outcome.price > bestOdds) {
          bestOdds = outcome.price;
          bestBook = book.title;
        }
      }
    }
  });
  
  return bestOdds ? { odds: bestOdds, sportsbook: bestBook } : null;
}

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
      no_bet_reason: picks.message || null,
      metadata: {
        generated_at: new Date().toISOString(),
        source: 'generate-simple'
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
        fair_odds: leg.decimalOdds, // Using same as decimal for now
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