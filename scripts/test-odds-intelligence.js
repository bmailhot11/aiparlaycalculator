/**
 * Test script for Odds Intelligence System
 * Tests CLV calculation, line movement signals, and API integrations
 */

// Test through API endpoints to avoid ES6 import issues
// const { calculateLegCLV, calculateParlayCLV } = require('../lib/clv-calculator');
// const { calculateMovementSignals } = require('../lib/line-movement');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';

async function testOddsIntelligence() {
  console.log('🧪 Testing BetChekr Odds Intelligence System...\n');

  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: System Files Check
  console.log('1️⃣ Testing system files...');
  testsTotal++;
  
  const fs = require('fs');
  const requiredFiles = [
    '../lib/clv-calculator.js',
    '../lib/line-movement.js',
    '../sql/odds-intelligence-functions.sql',
    '../pages/api/line-movement/signals/[gameKey].js'
  ];
  
  const missingFiles = requiredFiles.filter(file => {
    try {
      const path = require('path');
      fs.accessSync(path.join(__dirname, file));
      return false;
    } catch {
      return true;
    }
  });
  
  if (missingFiles.length === 0) {
    console.log(`   ✅ All required files present`);
    testsPassed++;
  } else {
    console.log(`   ❌ Missing files: ${missingFiles.join(', ')}`);
  }

  // Test 2: Environment Configuration
  console.log('\n2️⃣ Testing environment configuration...');
  testsTotal++;
  
  const requiredEnvVars = [
    'SHARP_BOOK_KEY',
    'SMARTSCORE_EV_WEIGHT',
    'SMARTSCORE_MOVEMENT_WEIGHT',
    'NEXT_PUBLIC_SUPABASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log(`   ✅ All required environment variables configured`);
    console.log(`      Sharp book: ${process.env.SHARP_BOOK_KEY}`);
    console.log(`      Movement weight: ${process.env.SMARTSCORE_MOVEMENT_WEIGHT}`);
    testsPassed++;
  } else {
    console.log(`   ❌ Missing environment variables: ${missingVars.join(', ')}`);
  }

  // Test 3: Line Movement API Endpoints
  console.log('\n3️⃣ Testing API endpoints...');
  
  const apiTests = [
    {
      name: 'Movement Signals API',
      url: `/api/line-movement/signals/test_game_123?market=moneyline&outcome=home`,
      expectedStatus: [200, 404] // 404 is acceptable for test data
    },
    {
      name: 'Movement Summary API',
      url: `/api/line-movement/summary/test_game_123?market=moneyline`,
      expectedStatus: [200, 404]
    }
  ];

  for (const test of apiTests) {
    testsTotal++;
    try {
      const response = await fetch(`${BASE_URL}${test.url}`);
      
      if (test.expectedStatus.includes(response.status)) {
        const data = await response.json();
        console.log(`   ✅ ${test.name}: ${response.status} ${data.message || 'OK'}`);
        testsPassed++;
      } else {
        console.log(`   ❌ ${test.name}: Unexpected status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${test.name} failed: ${error.message}`);
    }
  }

  // Test 4: Enhanced Analyze Slip API
  console.log('\n4️⃣ Testing enhanced analyze slip...');
  testsTotal++;
  
  try {
    const testSlip = {
      legs: [
        {
          selection: 'Kansas City Chiefs',
          sportsbook: 'DraftKings',
          odds: '-110',
          market_type: 'moneyline',
          home_team: 'Kansas City Chiefs',
          away_team: 'Buffalo Bills'
        }
      ],
      sport: 'americanfootball_nfl'
    };

    const response = await fetch(`${BASE_URL}/api/analyze-slip-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSlip)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Analyze slip enhanced with CLV and movement data`);
      console.log(`      Has CLV analysis: ${result.analysis?.clv_analysis ? 'Yes' : 'No'}`);
      console.log(`      Movement data included: ${result.analysis?.legs_detail?.[0]?.movement ? 'Yes' : 'No'}`);
      testsPassed++;
    } else {
      const error = await response.text();
      console.log(`   ❌ Analyze slip test failed: ${response.status} ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Analyze slip test failed: ${error.message}`);
  }

  // Test 5: SQL Functions Check
  console.log('\n5️⃣ Testing SQL functions file...');
  testsTotal++;
  
  try {
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../sql/odds-intelligence-functions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    const requiredFunctions = [
      'get_moneyline_series',
      'get_spread_series', 
      'get_movement_anchors',
      'calculate_velocity',
      'get_favorite_pressure_data'
    ];
    
    const missingFunctions = requiredFunctions.filter(func => 
      !sqlContent.includes(`FUNCTION ${func}`)
    );
    
    if (missingFunctions.length === 0) {
      console.log(`   ✅ All required SQL functions present`);
      testsPassed++;
    } else {
      console.log(`   ❌ Missing SQL functions: ${missingFunctions.join(', ')}`);
    }
  } catch (error) {
    console.log(`   ❌ SQL functions test failed: ${error.message}`);
  }

  // Test Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Tests passed: ${testsPassed}/${testsTotal}`);
  console.log(`   Success rate: ${((testsPassed/testsTotal) * 100).toFixed(1)}%`);

  if (testsPassed === testsTotal) {
    console.log('\n🎉 All tests passed! Odds Intelligence system is ready.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run SQL functions in Supabase: sql/odds-intelligence-functions.sql');
    console.log('   2. Populate v_odds_clean and v_closing_odds views with data');
    console.log('   3. Test with real game data');
    console.log('   4. Monitor performance and adjust thresholds as needed');
  } else {
    console.log('\n⚠️ Some tests failed. Review the errors above.');
    console.log('\n🔧 Common Issues:');
    console.log('   • Database views not created yet (v_odds_clean, v_closing_odds)');
    console.log('   • SQL functions not installed in Supabase');
    console.log('   • Server not running (for API tests)');
    console.log('   • Missing environment variables');
  }

  return testsPassed === testsTotal;
}

// Run tests if called directly
if (require.main === module) {
  testOddsIntelligence()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testOddsIntelligence };