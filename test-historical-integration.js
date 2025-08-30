/**
 * Test script for historical data integration
 * Tests that historical data flows correctly through the system
 */

const bettingMath = require('./lib/betting-math');
const historicalDataService = require('./lib/historical-data-service');

async function testHistoricalIntegration() {
  console.log('🧪 Starting Historical Data Integration Test\n');
  console.log('=' .repeat(50));
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Direct historical data service query
  console.log('\n📊 Test 1: Historical Data Service Query');
  console.log('-'.repeat(40));
  try {
    const historicalStats = await historicalDataService.getHistoricalHitRate({
      sport: 'NFL',
      market_type: 'h2h',
      team: 'Kansas City Chiefs',
      lookbackDays: 90
    });
    
    if (historicalStats) {
      console.log('✅ Historical data retrieved successfully');
      console.log(`   Hit Rate: ${(historicalStats.hit_rate * 100).toFixed(1)}%`);
      console.log(`   Sample Size: ${historicalStats.sample_size} games`);
      console.log(`   Confidence: ${historicalStats.confidence}`);
      results.passed.push('Historical data service query');
    } else {
      console.log('⚠️ No historical data found (database may be empty)');
      results.warnings.push('No historical data in database yet');
    }
  } catch (error) {
    console.log('❌ Historical data service failed:', error.message);
    results.failed.push('Historical data service query');
  }

  // Test 2: Process single leg with historical data
  console.log('\n🎯 Test 2: Process Leg with Historical Data');
  console.log('-'.repeat(40));
  try {
    const testBet = {
      game: 'Buffalo Bills @ Kansas City Chiefs',
      sport: 'NFL',
      market_type: 'h2h',
      selection: 'Kansas City Chiefs',
      odds: '-110',
      decimal_odds: 1.91,
      sportsbook: 'DraftKings'
    };

    const mockBookmakers = [
      {
        title: 'Pinnacle',
        markets: [{
          key: 'h2h',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -115 },
            { name: 'Buffalo Bills', price: -105 }
          ]
        }]
      },
      {
        title: 'DraftKings',
        markets: [{
          key: 'h2h',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -110 },
            { name: 'Buffalo Bills', price: -110 }
          ]
        }]
      }
    ];

    console.log('Processing bet: Chiefs -110');
    const processedLeg = await bettingMath.processLeg(testBet, mockBookmakers);
    
    console.log('✅ Leg processed successfully');
    console.log(`   Sharp Prob: ${processedLeg.probabilities.sharp ? (processedLeg.probabilities.sharp * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   Consensus Prob: ${processedLeg.probabilities.consensus ? (processedLeg.probabilities.consensus * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   Historical Prior: ${processedLeg.probabilities.prior ? (processedLeg.probabilities.prior * 100).toFixed(1) + '%' : 'N/A'}`);
    console.log(`   True Prob (blended): ${(processedLeg.probabilities.true * 100).toFixed(1)}%`);
    console.log(`   EV: ${(processedLeg.metrics.evPercent).toFixed(2)}%`);
    
    if (processedLeg.probabilities.prior !== null) {
      console.log('   ✓ Historical data successfully integrated!');
      results.passed.push('Process leg with historical data');
    } else {
      console.log('   ⚠️ Historical data not available (expected if DB empty)');
      results.warnings.push('Historical prior not available');
    }
    
    results.passed.push('Async processLeg execution');
  } catch (error) {
    console.log('❌ Process leg failed:', error.message);
    results.failed.push('Process leg with historical data');
  }

  // Test 3: Process full parlay
  console.log('\n🎰 Test 3: Process Full Parlay');
  console.log('-'.repeat(40));
  try {
    const parlayLegs = [
      {
        game: 'Buffalo Bills @ Kansas City Chiefs',
        sport: 'NFL',
        market_type: 'h2h',
        selection: 'Kansas City Chiefs',
        odds: '-110',
        decimal_odds: 1.91,
        sportsbook: 'DraftKings'
      },
      {
        game: 'Miami Dolphins @ New York Jets',
        sport: 'NFL',
        market_type: 'totals',
        selection: 'Over 44.5',
        odds: '-105',
        decimal_odds: 1.95,
        sportsbook: 'FanDuel'
      }
    ];

    const mockBookmakers = [
      {
        title: 'DraftKings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Kansas City Chiefs', price: -110 },
              { name: 'Buffalo Bills', price: -110 }
            ]
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over 44.5', price: -105 },
              { name: 'Under 44.5', price: -115 }
            ]
          }
        ]
      }
    ];

    console.log('Processing 2-leg parlay...');
    const parlayAnalysis = await bettingMath.processParlay(parlayLegs, mockBookmakers);
    
    console.log('✅ Parlay processed successfully');
    console.log(`   Combined Odds: ${parlayAnalysis.parlay.odds.american}`);
    console.log(`   Parlay EV: ${parlayAnalysis.parlay.metrics.evPercent.toFixed(2)}%`);
    console.log(`   Smart Score: ${parlayAnalysis.parlay.metrics.smartScore.toFixed(1)}`);
    console.log(`   Correlation Factor: ${parlayAnalysis.parlay.probability.correlationFactor.toFixed(2)}`);
    
    results.passed.push('Process parlay with async flow');
  } catch (error) {
    console.log('❌ Process parlay failed:', error.message);
    results.failed.push('Process parlay');
  }

  // Test 4: Closing odds fetch
  console.log('\n📈 Test 4: Closing Odds Fetch');
  console.log('-'.repeat(40));
  try {
    const closingOdds = await historicalDataService.getClosingOdds(
      'test_game_123',
      'h2h',
      'Kansas City Chiefs',
      'Pinnacle'
    );
    
    if (closingOdds) {
      console.log('✅ Closing odds retrieved');
      console.log(`   Odds: ${closingOdds.odds}`);
      console.log(`   Decimal: ${closingOdds.decimal_odds}`);
      results.passed.push('Closing odds fetch');
    } else {
      console.log('⚠️ No closing odds found (expected if no games graded yet)');
      results.warnings.push('No closing odds available');
    }
  } catch (error) {
    console.log('❌ Closing odds fetch failed:', error.message);
    results.failed.push('Closing odds fetch');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed.length}`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️ Warnings: ${results.warnings.length}`);
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(test => console.log(`   • ${test}`));
  }

  // Overall status
  console.log('\n' + '='.repeat(50));
  if (results.failed.length === 0) {
    console.log('🎉 INTEGRATION TEST PASSED!');
    console.log('Historical data system is connected and working.');
    
    if (results.warnings.length > 0) {
      console.log('\n📝 Note: Some warnings indicate empty database.');
      console.log('This is expected if the system hasn\'t collected data yet.');
      console.log('After deployment, data will accumulate automatically.');
    }
  } else {
    console.log('❌ INTEGRATION TEST FAILED');
    console.log('Please check the errors above.');
  }
  
  return results;
}

// Run test if called directly
if (require.main === module) {
  testHistoricalIntegration()
    .then(results => {
      process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}

module.exports = { testHistoricalIntegration };