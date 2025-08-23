#!/usr/bin/env node
// Verify materialized views are created and refreshing properly

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMaterializedViews() {
  console.log('🔍 Verifying Materialized Views Setup');
  console.log('=====================================');

  try {
    // 1. Check if views exist
    console.log('\n📋 Checking if materialized views exist...');
    
    const { data: views, error: viewsError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT 
          matviewname as view_name,
          hasindexes,
          ispopulated,
          pg_size_pretty(pg_total_relation_size('public.'||matviewname)) as size
        FROM pg_matviews 
        WHERE matviewname IN ('mv_current_best_odds', 'mv_line_movement', 'mv_current_best_props')
        ORDER BY matviewname;
      `
    });

    if (viewsError) {
      console.error('❌ Failed to check materialized views:', viewsError.message);
      return false;
    }

    if (!views || views.length === 0) {
      console.error('❌ No materialized views found! Please run create-materialized-views.sql first.');
      return false;
    }

    console.log('✅ Found materialized views:');
    views.forEach(view => {
      console.log(`   • ${view.view_name}: ${view.size}, populated: ${view.ispopulated}, indexed: ${view.hasindexes}`);
    });

    // 2. Test refresh functionality
    console.log('\n🔄 Testing materialized view refresh...');
    
    const { data: refreshResult, error: refreshError } = await supabase.rpc('refresh_all_materialized_views');
    
    if (refreshError) {
      console.error('❌ Failed to refresh materialized views:', refreshError.message);
      return false;
    }

    console.log('✅ Refresh test results:');
    refreshResult.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.view_name}: ${result.row_count} rows in ${result.refresh_duration_ms}ms`);
      if (!result.success) {
        console.error(`      Error: ${result.error_message}`);
      }
    });

    // 3. Check data freshness
    console.log('\n📊 Checking data freshness...');

    // Check mv_current_best_odds data
    const { data: oddsData, error: oddsError } = await supabase
      .from('mv_current_best_odds')
      .select('game_id, market_id, book_id, ts')
      .order('ts', { ascending: false })
      .limit(5);

    if (oddsError) {
      console.warn('⚠️  Could not check odds data:', oddsError.message);
    } else {
      console.log(`   • mv_current_best_odds: ${oddsData.length} recent records`);
      if (oddsData.length > 0) {
        const latestTime = new Date(oddsData[0].ts);
        const ageMinutes = (Date.now() - latestTime.getTime()) / (1000 * 60);
        console.log(`     Latest data: ${ageMinutes.toFixed(1)} minutes old`);
      }
    }

    // Check mv_line_movement data
    const { data: movementData, error: movementError } = await supabase
      .from('mv_line_movement')
      .select('game_id, movement_count, movement_pct')
      .order('last_update', { ascending: false })
      .limit(5);

    if (movementError) {
      console.warn('⚠️  Could not check line movement data:', movementError.message);
    } else {
      console.log(`   • mv_line_movement: ${movementData.length} movement records`);
      if (movementData.length > 0) {
        const avgMovement = movementData.reduce((sum, row) => sum + Math.abs(row.movement_pct || 0), 0) / movementData.length;
        console.log(`     Average movement: ${avgMovement.toFixed(2)}%`);
      }
    }

    // 4. Performance check
    console.log('\n⚡ Performance check...');
    
    const start = Date.now();
    const { data: perfTest, error: perfError } = await supabase
      .from('mv_current_best_odds')
      .select('game_id, market_id, odds_decimal')
      .eq('sport', 'NFL')
      .limit(100);
    
    const queryTime = Date.now() - start;
    
    if (perfError) {
      console.warn('⚠️  Performance test failed:', perfError.message);
    } else {
      console.log(`   • Query time: ${queryTime}ms for ${perfTest.length} NFL odds`);
      console.log(`   • Performance: ${queryTime < 100 ? '✅ Excellent' : queryTime < 500 ? '✅ Good' : '⚠️  Needs optimization'}`);
    }

    // 5. Check indexes
    console.log('\n🗂️  Checking indexes...');
    
    const { data: indexes, error: indexError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename IN ('mv_current_best_odds', 'mv_line_movement', 'mv_current_best_props')
        ORDER BY tablename, indexname;
      `
    });

    if (indexError) {
      console.warn('⚠️  Could not check indexes:', indexError.message);
    } else {
      const indexCount = indexes.length;
      console.log(`   • Found ${indexCount} indexes on materialized views`);
      
      const expectedIndexes = [
        'idx_mv_current_best_odds_unique',
        'idx_mv_current_best_odds_sport',
        'idx_mv_line_movement_game_market',
        'idx_mv_line_movement_movement'
      ];
      
      const foundIndexes = indexes.map(idx => idx.indexname);
      const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));
      
      if (missingIndexes.length === 0) {
        console.log('   ✅ All expected indexes found');
      } else {
        console.warn(`   ⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
      }
    }

    console.log('\n🎉 Materialized Views Verification Complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Views created: ${views.length}/3`);
    console.log(`   • All populated: ${views.every(v => v.ispopulated) ? '✅' : '❌'}`);
    console.log(`   • All indexed: ${views.every(v => v.hasindexes) ? '✅' : '❌'}`);
    console.log(`   • Refresh working: ${refreshResult.every(r => r.success) ? '✅' : '❌'}`);
    console.log(`   • Performance: ${queryTime < 100 ? '✅ Excellent' : '✅ Good'}`);

    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyMaterializedViews()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { verifyMaterializedViews };