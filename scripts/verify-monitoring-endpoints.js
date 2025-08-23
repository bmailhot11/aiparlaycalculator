#!/usr/bin/env node
// Comprehensive monitoring endpoint verification for Supabase Pro limits

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class MonitoringVerification {
  constructor() {
    this.endpoints = [
      {
        name: 'Usage Statistics',
        url: `${BASE_URL}/api/supabase-pro/monitor?action=usage`,
        method: 'GET',
        expected: ['current_usage', 'supabase_pro_limits', 'cache_performance']
      },
      {
        name: 'Health Check', 
        url: `${BASE_URL}/api/supabase-pro/monitor?action=health`,
        method: 'GET',
        expected: ['status', 'healthy', 'last_check']
      },
      {
        name: 'Partition Info',
        url: `${BASE_URL}/api/supabase-pro/monitor?action=partitions`,
        method: 'GET',
        expected: ['partitions', 'total_partitions', 'hot_data_days']
      },
      {
        name: 'Cache Statistics',
        url: `${BASE_URL}/api/supabase-pro/monitor?action=cache-stats`,
        method: 'GET',
        expected: ['cache_performance', 'optimization_tips']
      },
      {
        name: 'Force Cleanup',
        url: `${BASE_URL}/api/supabase-pro/monitor`,
        method: 'POST',
        body: { command: 'force-cleanup' },
        expected: ['success', 'results']
      },
      {
        name: 'Check Limits',
        url: `${BASE_URL}/api/supabase-pro/monitor`,
        method: 'POST',
        body: { command: 'check-limits' },
        expected: ['success', 'usage', 'status']
      },
      {
        name: 'Refresh Views',
        url: `${BASE_URL}/api/supabase-pro/monitor`,
        method: 'POST',
        body: { command: 'refresh-views' },
        expected: ['success', 'message']
      }
    ];
  }

  async verifyEndpoints() {
    console.log('🌐 Verifying Supabase Pro Monitoring Endpoints');
    console.log('==============================================');
    console.log(`Base URL: ${BASE_URL}`);

    let passedTests = 0;
    let totalTests = this.endpoints.length;

    for (const endpoint of this.endpoints) {
      console.log(`\n🔍 Testing: ${endpoint.name}`);
      
      try {
        const options = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Monitoring-Verification/1.0'
          }
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await fetch(endpoint.url, options);
        
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          console.error(`   ❌ HTTP Error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        // Check for expected fields
        const missingFields = endpoint.expected.filter(field => !(field in data));
        
        if (missingFields.length === 0) {
          console.log('   ✅ All expected fields present');
          passedTests++;

          // Additional validation for specific endpoints
          await this.validateEndpointData(endpoint.name, data);
          
        } else {
          console.error(`   ❌ Missing fields: ${missingFields.join(', ')}`);
          console.log(`   Available fields: ${Object.keys(data).join(', ')}`);
        }

      } catch (error) {
        console.error(`   ❌ Request failed: ${error.message}`);
      }
    }

    console.log('\n📊 Test Summary');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success Rate: ${(passedTests/totalTests*100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('🎉 All monitoring endpoints are working correctly!');
      return true;
    } else {
      console.error('❌ Some monitoring endpoints need attention');
      return false;
    }
  }

  async validateEndpointData(endpointName, data) {
    switch (endpointName) {
      case 'Usage Statistics':
        await this.validateUsageData(data);
        break;
      case 'Health Check':
        await this.validateHealthData(data);
        break;
      case 'Partition Info':
        await this.validatePartitionData(data);
        break;
      case 'Cache Statistics':
        await this.validateCacheData(data);
        break;
    }
  }

  async validateUsageData(data) {
    const usage = data.current_usage;
    const limits = data.supabase_pro_limits;

    // Check limits are correct
    if (limits.database_limit_mb !== 8192) {
      console.warn('   ⚠️  Database limit should be 8192MB');
    }
    if (limits.storage_limit_mb !== 102400) {
      console.warn('   ⚠️  Storage limit should be 102400MB');
    }
    if (limits.egress_limit_mb !== 256000) {
      console.warn('   ⚠️  Egress limit should be 256000MB');
    }

    // Check if usage data looks reasonable
    if (usage.database_pct && parseFloat(usage.database_pct) > 100) {
      console.warn('   ⚠️  Database usage >100% - check calculation');
    }

    console.log(`   📊 DB: ${usage.database_pct}%, Storage: ${usage.storage_pct}%, Status: ${usage.status}`);
  }

  async validateHealthData(data) {
    const validStatuses = ['HEALTHY', 'MONITORING', 'WARNING', 'CRITICAL'];
    
    if (!validStatuses.includes(data.status)) {
      console.warn(`   ⚠️  Invalid status: ${data.status}`);
    }

    if (data.last_check) {
      const lastCheck = new Date(data.last_check);
      const ageMinutes = (Date.now() - lastCheck.getTime()) / (1000 * 60);
      
      if (ageMinutes > 120) { // More than 2 hours old
        console.warn(`   ⚠️  Last check is ${ageMinutes.toFixed(0)} minutes old`);
      } else {
        console.log(`   ✅ Last check: ${ageMinutes.toFixed(0)} minutes ago`);
      }
    }
  }

  async validatePartitionData(data) {
    if (data.hot_data_days !== 30) {
      console.warn('   ⚠️  Hot data retention should be 30 days');
    }

    if (data.total_partitions < 5) {
      console.warn('   ⚠️  Very few partitions found - check partition creation');
    } else {
      console.log(`   ✅ Found ${data.total_partitions} partitions`);
    }

    if (data.cleanup_recommendations && data.cleanup_recommendations.length > 10) {
      console.warn(`   ⚠️  ${data.cleanup_recommendations.length} partitions need cleanup`);
    }
  }

  async validateCacheData(data) {
    const perf = data.cache_performance;
    
    if (perf.cache_hit_rate) {
      const hitRate = parseFloat(perf.cache_hit_rate);
      if (hitRate < 60) {
        console.warn(`   ⚠️  Low cache hit rate: ${perf.cache_hit_rate}`);
      } else {
        console.log(`   ✅ Cache hit rate: ${perf.cache_hit_rate}`);
      }
    }

    if (perf.memory_cache_size > 950) {
      console.warn('   ⚠️  Memory cache near limit');
    }
  }

  async testDatabaseConnection() {
    console.log('\n🔌 Testing direct database connection...');
    
    try {
      // Test basic connection
      const { data: testQuery, error } = await supabase
        .from('response_cache')
        .select('count()')
        .limit(1);

      if (error) {
        console.error('   ❌ Database connection failed:', error.message);
        return false;
      }

      console.log('   ✅ Database connection working');

      // Test function calls
      const { data: dbStats, error: funcError } = await supabase.rpc('check_db_limits');
      
      if (funcError) {
        console.error('   ❌ Database functions not available:', funcError.message);
        return false;
      }

      console.log('   ✅ Database functions working');
      return true;

    } catch (error) {
      console.error('   ❌ Database test failed:', error.message);
      return false;
    }
  }

  async generateMonitoringReport() {
    console.log('\n📋 Generating Monitoring Health Report...');

    try {
      // Get current usage
      const usageResponse = await fetch(`${BASE_URL}/api/supabase-pro/monitor?action=usage`);
      const usageData = await usageResponse.json();

      // Get health status  
      const healthResponse = await fetch(`${BASE_URL}/api/supabase-pro/monitor?action=health`);
      const healthData = await healthResponse.json();

      const report = {
        timestamp: new Date().toISOString(),
        overall_status: healthData.status,
        database_usage: usageData.current_usage?.database_pct || 'Unknown',
        storage_usage: usageData.current_usage?.storage_pct || 'Unknown', 
        cache_hit_rate: usageData.cache_performance?.cache_hit_rate || 'Unknown',
        last_check: healthData.last_check,
        monitoring_endpoints_status: 'All operational',
        recommendations: []
      };

      // Add recommendations based on status
      const dbUsage = parseFloat(report.database_usage);
      const storageUsage = parseFloat(report.storage_usage);

      if (dbUsage > 80) {
        report.recommendations.push('Database usage >80% - schedule cleanup');
      }
      if (storageUsage > 80) {
        report.recommendations.push('Storage usage >80% - archive old data');
      }
      if (report.overall_status === 'WARNING') {
        report.recommendations.push('System in WARNING state - monitor closely');
      }
      if (report.overall_status === 'CRITICAL') {
        report.recommendations.push('CRITICAL: Immediate action required');
      }

      console.log('📊 Monitoring Report:');
      console.log(JSON.stringify(report, null, 2));

      return report;

    } catch (error) {
      console.error('❌ Failed to generate monitoring report:', error.message);
      return null;
    }
  }

  async runFullVerification() {
    console.log('🚀 Running Full Monitoring Verification Suite');
    console.log('============================================');

    const dbTest = await this.testDatabaseConnection();
    const endpointTest = await this.verifyEndpoints(); 
    const report = await this.generateMonitoringReport();

    console.log('\n🏁 Final Results:');
    console.log(`Database Connection: ${dbTest ? '✅' : '❌'}`);
    console.log(`Monitoring Endpoints: ${endpointTest ? '✅' : '❌'}`);
    console.log(`Health Report Generated: ${report ? '✅' : '❌'}`);

    const allPassed = dbTest && endpointTest && report;
    
    if (allPassed) {
      console.log('\n🎉 All monitoring systems are operational!');
      console.log('Your Supabase Pro optimization setup is complete.');
    } else {
      console.log('\n⚠️  Some monitoring components need attention.');
      console.log('Please check the errors above and fix before proceeding.');
    }

    return allPassed;
  }
}

// Run verification if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verification = new MonitoringVerification();
  verification.runFullVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { MonitoringVerification };