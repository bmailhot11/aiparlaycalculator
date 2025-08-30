// Test the corrected bet saving functionality
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

function americanToDecimal(americanOdds) {
  const odds = typeof americanOdds === 'string' ? 
    parseInt(americanOdds.replace('+', '')) : americanOdds;
  
  if (odds > 0) {
    return ((odds / 100) + 1);
  } else {
    return ((100 / Math.abs(odds)) + 1);
  }
}

async function testBetSaving() {
  console.log('🧪 Testing corrected bet saving...');
  
  try {
    // Get an existing daily_reco to test with
    const { data: testReco, error: recoError } = await supabase
      .from('daily_recos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recoError) {
      console.error('❌ Failed to get existing reco:', recoError.message);
      return;
    }
    
    console.log('✅ Using existing daily_reco:', testReco.id);
    
    // Create a test bet with the corrected structure
    const testBet = {
      legs: [
        {
          sport: 'NBA',
          gameId: 'test_game_' + Date.now(),
          homeTeam: 'Test Home Team',
          awayTeam: 'Test Away Team',
          commenceTime: new Date().toISOString(),
          marketType: 'h2h',
          selection: 'Test Home Team',
          bestOdds: -110,
          bestSportsbook: 'Test Book',
          decimalOdds: americanToDecimal(-110),
          fairOdds: -105,
          edgePercentage: 2.3
        }
      ],
      totalOdds: -110,
      edgePercentage: '2.3',
      potentialPayout: '$91'
    };
    
    // Test the corrected bet saving logic with core fields only
    console.log('💾 Testing bet save...');
    const { data: betRecord, error: betError } = await supabase
      .from('reco_bets')
      .insert({
        reco_id: testReco.id,
        is_parlay: testBet.legs.length > 1,
        parlay_legs: testBet.legs.length,
        sport: testBet.legs[0]?.sport || 'NBA',
        league: testBet.legs[0]?.sport || 'NBA',
        market: testBet.legs[0]?.marketType || 'h2h',
        selection: testBet.legs[0]?.selection || 'TBD',
        odds_american: testBet.totalOdds,
        stake: 100,
        bet_type: 'single',
        status: 'active'
      })
      .select()
      .single();
    
    if (betError) {
      console.error('❌ Bet save failed:', betError.message);
    } else {
      console.log('✅ Bet saved successfully:', betRecord.id);
      
      // Now test leg saving
      console.log('🦵 Testing leg save...');
      const leg = testBet.legs[0];
      const legData = {
        bet_id: betRecord.id,
        leg_index: 0,
        sport: leg.sport,
        game_id: leg.gameId,
        home_team: leg.homeTeam,
        away_team: leg.awayTeam,
        commence_time: leg.commenceTime,
        market_type: leg.marketType,
        selection: leg.selection,
        best_sportsbook: leg.bestSportsbook,
        best_odds: leg.bestOdds,
        decimal_odds: leg.decimalOdds,
        fair_odds: leg.fairOdds,
        edge_percentage: leg.edgePercentage,
        no_vig_probability: (100 / leg.decimalOdds)
      };
      
      const { error: legError } = await supabase
        .from('reco_bet_legs')
        .insert(legData);
      
      if (legError) {
        console.error('❌ Leg save failed:', legError.message);
      } else {
        console.log('✅ Leg saved successfully!');
      }
    }
    
    // Clean up test bet records only (keep the daily_reco since it wasn't created by us)
    console.log('🧹 Cleaning up test bet records...');
    if (betRecord) {
      await supabase.from('reco_bets').delete().eq('id', betRecord.id);
    }
    console.log('✅ Test records cleaned up');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBetSaving().then(() => {
  console.log('🎯 Bet saving test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});