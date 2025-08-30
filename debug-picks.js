// Simple debug script to test daily picks generation
// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env.local file
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

async function debugDailyPicks() {
  console.log('🔍 Debug: Starting daily picks test...');
  
  try {
    // Test 1: Check Supabase connection
    console.log('📡 Testing Supabase connection...');
    const { data, error } = await supabase.from('daily_recos').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase error:', error.message);
      return;
    }
    console.log('✅ Supabase connected');
    
    // Test 2: Try getting NBA events (should be faster than all sports)
    console.log('🏀 Testing NBA events cache...');
    const nbaEvents = await eventsCache.cacheUpcomingEvents('NBA');
    console.log(`✅ Got ${nbaEvents?.length || 0} NBA events`);
    
    if (nbaEvents && nbaEvents.length > 0) {
      console.log('📊 Getting odds for first NBA event...');
      const firstEvent = [nbaEvents[0]];
      const oddsData = await eventsCache.getOddsForEvents(firstEvent, 'h2h', true);
      console.log(`✅ Got odds for ${oddsData?.length || 0} games`);
      
      if (oddsData && oddsData.length > 0) {
        console.log('Sample game:', {
          id: oddsData[0].id,
          home: oddsData[0].home_team,
          away: oddsData[0].away_team,
          bookmakers: oddsData[0].bookmakers?.length || 0
        });
      }
    }
    
    console.log('🎯 Debug completed successfully');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('⏰ Debug timed out after 30 seconds');
  process.exit(1);
}, 30000);

debugDailyPicks().then(() => {
  clearTimeout(timeout);
  process.exit(0);
}).catch(error => {
  clearTimeout(timeout);
  console.error('❌ Debug failed:', error);
  process.exit(1);
});