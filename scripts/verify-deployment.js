#!/usr/bin/env node
// Deployment verification script for AI Parlay Calculator

const https = require('https');
const http = require('http');

class DeploymentVerifier {
  constructor(domain) {
    this.domain = domain;
    this.passed = 0;
    this.failed = 0;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = `${this.domain}${endpoint}`;
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = client.request(url, options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async test(name, endpoint, method = 'GET', data = null, expectedStatus = 200) {
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = await this.makeRequest(endpoint, method, data);
      
      if (result.status === expectedStatus) {
        console.log(`✅ PASS: ${name} (${result.status})`);
        this.passed++;
        return result.data;
      } else {
        console.log(`❌ FAIL: ${name} (Expected ${expectedStatus}, got ${result.status})`);
        this.failed++;
        return null;
      }
    } catch (error) {
      console.log(`❌ FAIL: ${name} (Error: ${error.message})`);
      this.failed++;
      return null;
    }
  }

  async verifyDeployment() {
    console.log(`🚀 Verifying deployment at: ${this.domain}\n`);

    // Test 1: Basic scheduler API
    await this.test(
      'Scheduler API Info', 
      '/api/scheduler/control'
    );

    // Test 2: Scheduler status
    const status = await this.test(
      'Scheduler Status', 
      '/api/scheduler/control?action=status'
    );

    if (status) {
      console.log(`   📊 Quota Target: ${status.scheduler.quotaTarget.toLocaleString()}`);
      console.log(`   📈 Monthly Usage: ${status.scheduler.monthlyUsage.toLocaleString()}`);
      console.log(`   🎯 Active: ${status.scheduler.isActive ? 'YES' : 'NO'}`);
      console.log(`   ⚙️  Jobs Running: ${status.scheduler.jobsRunning}/${status.scheduler.totalJobs}`);
    }

    // Test 3: Force refresh (small test)
    await this.test(
      'Force Refresh Command',
      '/api/scheduler/control',
      'POST',
      { command: 'analyze-quota' }
    );

    // Test 4: Cached odds retrieval
    await this.test(
      'NFL Cached Odds',
      '/api/scheduler/cached-odds?sport=NFL&market=h2h&region=us'
    );

    // Test 5: Supabase cache test
    await this.test(
      'Supabase Cache Test',
      '/api/test-supabase'
    );

    // Test 6: Original parlay generation
    await this.test(
      'Optimized Parlay Generation',
      '/api/optimized-generate-parlay',
      'POST',
      { preferences: { sport: 'NFL', riskLevel: 'moderate', legs: 3 } }
    );

    // Test 7: Arbitrage detection
    await this.test(
      'Live Arbitrage Detection',
      '/api/live-odds',
      'POST',
      { sport: 'NFL' }
    );

    // Summary
    console.log(`\n📋 Deployment Verification Results:`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed === 0) {
      console.log(`\n🎉 All tests passed! Deployment is ready for production.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Check the logs above for details.`);
    }

    return this.failed === 0;
  }
}

// Main execution
async function main() {
  const domain = process.argv[2] || 'http://localhost:3000';
  
  console.log(`AI Parlay Calculator - Deployment Verification`);
  console.log(`===========================================\n`);

  const verifier = new DeploymentVerifier(domain);
  const success = await verifier.verifyDeployment();
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentVerifier;