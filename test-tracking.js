// Test tracking functionality - check database tables
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

async function testTracking() {
  console.log('📊 Testing tracking functionality...');
  
  try {
    // Check daily_recos table
    console.log('1. Checking daily_recos table...');
    const { data: recos, error: recosError } = await supabase
      .from('daily_recos')
      .select('*')
      .order('reco_date', { ascending: false })
      .limit(5);
    
    if (recosError) {
      console.error('❌ daily_recos error:', recosError.message);
    } else {
      console.log(`✅ Found ${recos.length} recent daily recommendations`);
      if (recos.length > 0) {
        console.log('Latest reco:', {
          id: recos[0].id,
          date: recos[0].reco_date,
          status: recos[0].status,
          published_at: recos[0].published_at
        });
      }
    }
    
    // Check reco_bets table
    console.log('2. Checking reco_bets table...');
    const { data: bets, error: betsError } = await supabase
      .from('reco_bets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (betsError) {
      console.error('❌ reco_bets error:', betsError.message);
    } else {
      console.log(`✅ Found ${bets.length} recent bets`);
      if (bets.length > 0) {
        console.log('Latest bet:', {
          id: bets[0].id,
          type: bets[0].bet_type,
          legs: bets[0].total_legs,
          status: bets[0].status,
          odds: bets[0].combined_odds
        });
      }
    }
    
    // Check reco_bet_legs table
    console.log('3. Checking reco_bet_legs table...');
    const { data: legs, error: legsError } = await supabase
      .from('reco_bet_legs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (legsError) {
      console.error('❌ reco_bet_legs error:', legsError.message);
    } else {
      console.log(`✅ Found ${legs.length} recent bet legs`);
      if (legs.length > 0) {
        console.log('Latest leg:', {
          id: legs[0].id,
          sport: legs[0].sport,
          home_team: legs[0].home_team,
          away_team: legs[0].away_team,
          market: legs[0].market_type,
          selection: legs[0].selection
        });
      }
    }
    
    // Test insert capability with a dummy record
    console.log('4. Testing insert capability...');
    const testDate = new Date().toISOString().split('T')[0];
    
    // Try to insert a test daily_reco
    const { data: testReco, error: testError } = await supabase
      .from('daily_recos')
      .insert({
        reco_date: testDate + '_test',
        published_at: new Date().toISOString(),
        status: 'test',
        no_bet_reason: 'Testing tracking functionality',
        metadata: { test: true }
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Insert test failed:', testError.message);
    } else {
      console.log('✅ Insert test successful, ID:', testReco.id);
      
      // Clean up test record
      await supabase.from('daily_recos').delete().eq('id', testReco.id);
      console.log('✅ Test record cleaned up');
    }
    
    console.log('🎯 Tracking functionality test completed');
    
  } catch (error) {
    console.error('❌ Tracking test error:', error);
  }
}

testTracking().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed:', error);
  process.exit(1);
});