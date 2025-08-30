// Test script for line shopping API
const fetch = require('node-fetch');

async function testLineShoppingAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Line Shopping API with Updated Market Names\n');
  
  const tests = [
    {
      name: 'Test NBA with player props',
      url: `${baseUrl}/api/line-shopping?sport=NBA&getTeams=false`,
      expectedMarkets: ['player_points', 'player_rebounds', 'player_assists', 'player_threes', 'player_blocks', 'player_steals']
    },
    {
      name: 'Test NFL with player props',
      url: `${baseUrl}/api/line-shopping?sport=NFL&getTeams=false`,
      expectedMarkets: ['player_pass_yds', 'player_rush_yds', 'player_reception_yds', 'player_pass_tds', 'player_rush_tds', 'player_reception_tds']
    },
    {
      name: 'Test MLB with batter props',
      url: `${baseUrl}/api/line-shopping?sport=MLB&getTeams=false`,
      expectedMarkets: ['batter_hits', 'batter_home_runs', 'batter_rbis', 'pitcher_strikeouts', 'batter_total_bases']
    },
    {
      name: 'Test NHL with player props',
      url: `${baseUrl}/api/line-shopping?sport=NHL&getTeams=false`,
      expectedMarkets: ['player_points', 'player_goals', 'player_assists', 'player_shots_on_goal']
    },
    {
      name: 'Test teams endpoint',
      url: `${baseUrl}/api/line-shopping?sport=NBA&getTeams=true`,
      expectTeams: true
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${data.message || 'Unknown error'}`);
        continue;
      }
      
      if (test.expectTeams) {
        console.log(`✅ Teams endpoint successful`);
        console.log(`   - Teams found: ${data.teams?.length || 0}`);
        console.log(`   - Games found: ${data.games?.length || 0}`);
      } else {
        console.log(`✅ API call successful`);
        console.log(`   - Total lines: ${data.total_lines || 0}`);
        console.log(`   - Total available: ${data.total_available || 0}`);
        console.log(`   - Sportsbooks: ${data.sportsbooks?.length || 0}`);
        
        // Check if we got lines with expected market types
        if (data.lines && data.lines.length > 0) {
          const marketTypes = [...new Set(data.lines.map(line => line.market_type))];
          console.log(`   - Market types found: ${marketTypes.join(', ')}`);
          
          // Check for expected markets
          const foundExpectedMarkets = test.expectedMarkets.filter(market => 
            marketTypes.includes(market)
          );
          
          if (foundExpectedMarkets.length > 0) {
            console.log(`   ✅ Found expected markets: ${foundExpectedMarkets.join(', ')}`);
          } else {
            console.log(`   ⚠️  No expected markets found. Available: ${marketTypes.join(', ')}`);
          }
          
          // Check player extraction for player props
          const playerProps = data.lines.filter(line => 
            line.market_type.includes('player_') || 
            line.market_type.includes('batter_') || 
            line.market_type.includes('pitcher_')
          );
          
          if (playerProps.length > 0) {
            const playersFound = playerProps.filter(line => line.player).length;
            console.log(`   - Player props: ${playerProps.length} total, ${playersFound} with player names extracted`);
            
            if (playersFound > 0) {
              const samplePlayer = playerProps.find(line => line.player);
              console.log(`   - Sample player: ${samplePlayer.player} (${samplePlayer.market_display})`);
            }
          }
        } else {
          console.log(`   ℹ️  No lines returned (may be normal if no games or API unavailable)`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Testing complete!');
}

testLineShoppingAPI().catch(console.error);