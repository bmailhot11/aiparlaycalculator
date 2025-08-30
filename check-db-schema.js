// Check database schema for betting tables
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

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Get a sample reco_bets record to see its structure
    const { data: betSample, error: betError } = await supabase
      .from('reco_bets')
      .select('*')
      .limit(1)
      .single();
    
    if (betError) {
      console.log('❌ reco_bets error:', betError.message);
    } else if (betSample) {
      console.log('reco_bets structure:');
      console.log(JSON.stringify(betSample, null, 2));
    }
    
    // Try to get a legs sample to see what fields exist
    const { data: legsSample, error: legsError } = await supabase
      .from('reco_bet_legs')
      .select('*')
      .limit(1);
    
    if (legsError) {
      console.log('❌ reco_bet_legs error:', legsError.message);
    } else {
      console.log('\nreco_bet_legs found:', legsSample.length);
      if (legsSample.length > 0) {
        console.log('reco_bet_legs structure:');
        console.log(JSON.stringify(legsSample[0], null, 2));
      }
    }
    
    // Check if there are any missing required columns by trying a simple insert
    console.log('\n🧪 Testing minimal insert...');
    const testBetData = {
      reco_id: '123e4567-e89b-12d3-a456-426614174000', // dummy UUID
      bet_type: 'single',
      total_legs: 1,
      status: 'test',
      combined_odds: -110
    };
    
    console.log('Attempting to insert bet with minimal data...');
    const { data: testBet, error: testBetError } = await supabase
      .from('reco_bets')
      .insert(testBetData)
      .select()
      .single();
    
    if (testBetError) {
      console.log('❌ Minimal bet insert failed:', testBetError.message);
      console.log('This tells us which fields are required...');
    } else {
      console.log('✅ Minimal bet insert worked, ID:', testBet.id);
      
      // Now test leg insert
      const testLegData = {
        reco_bet_id: testBet.id,
        leg_index: 0,
        sport: 'NBA',
        game_id: 'test_game_123',
        home_team: 'Test Home',
        away_team: 'Test Away',
        commence_time: new Date().toISOString(),
        market_type: 'h2h',
        selection: 'Test Home',
        selection_key: 'test_home',
        best_sportsbook: 'TestBook',
        best_odds: -110,
        decimal_odds: 1.91
      };
      
      console.log('Attempting to insert leg with minimal data...');
      const { error: testLegError } = await supabase
        .from('reco_bet_legs')
        .insert(testLegData);
      
      if (testLegError) {
        console.log('❌ Minimal leg insert failed:', testLegError.message);
      } else {
        console.log('✅ Minimal leg insert worked!');
      }
      
      // Clean up
      await supabase.from('reco_bets').delete().eq('id', testBet.id);
      console.log('✅ Test records cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error);
  }
}

checkSchema().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});