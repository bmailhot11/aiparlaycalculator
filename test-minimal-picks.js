// Minimal daily picks test
const fs = require('fs');
const path = require('path');

// Load env vars
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      process.env[key.trim()] = values.join('=').trim();
    }
  }
});

const { supabase } = require('./utils/supabaseClient');
const eventsCache = require('./lib/events-cache.js');

// Simplified functions from the real file
function americanToDecimal(americanOdds) {
  const odds = typeof americanOdds === 'string' ? 
    parseInt(americanOdds.replace('+', '')) : americanOdds;
  
  if (odds > 0) {
    return ((odds / 100) + 1);
  } else {
    return ((100 / Math.abs(odds)) + 1);
  }
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
    fairOdds[outcome.name] = fairDecimal > 2 ? 
      Math.round((fairDecimal - 1) * 100) : 
      Math.round(-100 / (fairDecimal - 1));
  });
  
  return fairOdds;
}

function calculateEdge(bestOdds, fairOdds) {
  const bestDecimal = americanToDecimal(bestOdds);
  const fairDecimal = americanToDecimal(fairOdds);
  
  const edge = ((bestDecimal / fairDecimal) - 1) * 100;
  return Math.max(0, edge);
}

async function testMinimalPicks() {
  console.log('🎯 Testing minimal picks generation...');
  
  try {
    // Just test NBA with limited scope
    const nbaEvents = await eventsCache.cacheUpcomingEvents('NBA');
    console.log(`Got ${nbaEvents.length} NBA events`);
    
    if (nbaEvents.length === 0) {
      console.log('No NBA events found');
      return;
    }
    
    // Get odds for just the first event to test
    const firstEvent = [nbaEvents[0]];
    const oddsData = await eventsCache.getOddsForEvents(firstEvent, 'h2h', true);
    console.log(`Got odds for ${oddsData.length} games`);
    
    if (oddsData.length === 0) {
      console.log('No odds data found');
      return;
    }
    
    // Find edges in just this one game
    const opportunities = [];
    const game = oddsData[0];
    
    if (game.bookmakers && game.bookmakers.length >= 2) {
      console.log(`Processing ${game.home_team} vs ${game.away_team} with ${game.bookmakers.length} bookmakers`);
      
      for (const bookmaker of game.bookmakers.slice(0, 5)) { // Limit to first 5 bookmakers
        if (!bookmaker.markets) continue;
        
        for (const market of bookmaker.markets) {
          if (!market.outcomes || market.key !== 'h2h') continue; // Only h2h market
          
          const fairOdds = calculateNoVigMarket(market.outcomes);
          
          market.outcomes.forEach(outcome => {
            const fairOdd = fairOdds[outcome.name];
            if (!fairOdd) return;
            
            const edge = calculateEdge(outcome.price, fairOdd);
            
            if (edge > 1) {
              opportunities.push({
                gameId: game.id,
                sport: 'NBA',
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
    
    console.log(`Found ${opportunities.length} opportunities`);
    
    if (opportunities.length > 0) {
      const bestOpp = opportunities.sort((a, b) => b.edgePercentage - a.edgePercentage)[0];
      console.log('Best opportunity:', {
        selection: bestOpp.selection,
        odds: bestOpp.bestOdds,
        edge: bestOpp.edgePercentage.toFixed(2) + '%',
        sportsbook: bestOpp.bestSportsbook
      });
    }
    
    console.log('✅ Minimal test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Add timeout
const timeout = setTimeout(() => {
  console.log('⏰ Timed out after 30 seconds');
  process.exit(1);
}, 30000);

testMinimalPicks().then(() => {
  clearTimeout(timeout);
  process.exit(0);
}).catch(error => {
  clearTimeout(timeout);
  console.error('❌ Failed:', error);
  process.exit(1);
});