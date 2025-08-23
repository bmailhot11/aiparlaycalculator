#!/usr/bin/env node
// Production startup script - ensures scheduler initializes correctly

const path = require('path');

// Import the scheduler
const schedulerPath = path.join(__dirname, '../lib/odds-refresh-scheduler.js');

async function initializeProduction() {
  console.log('🚀 AI Parlay Calculator - Production Startup');
  console.log('===========================================');
  
  try {
    // Verify environment variables
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY', 
      'ODDS_API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      process.exit(1);
    }
    
    console.log('✅ Environment variables validated');
    
    // Import and initialize scheduler
    const { default: oddsScheduler } = await import(schedulerPath);
    
    // Wait for scheduler to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify scheduler status
    const stats = oddsScheduler.getSchedulerStats();
    console.log('📊 Scheduler Status:');
    console.log(`   Active: ${stats.isActive}`);
    console.log(`   Jobs: ${stats.jobsRunning}/${stats.totalJobs}`);
    console.log(`   Monthly Usage: ${stats.monthlyUsage.toLocaleString()}`);
    console.log(`   Quota Target: ${stats.quotaTarget.toLocaleString()}`);
    
    if (stats.isActive && stats.jobsRunning > 0) {
      console.log('✅ Scheduler initialized and running');
      
      // Optional: Force a small refresh to verify API connectivity
      console.log('🔍 Testing API connectivity...');
      try {
        await oddsScheduler.forceRefreshAll();
        console.log('✅ API connectivity verified');
      } catch (error) {
        console.warn('⚠️  API test failed (this may be normal):', error.message);
      }
      
    } else {
      console.warn('⚠️  Scheduler may not be fully initialized yet');
    }
    
    console.log('\n🎉 Production startup complete!');
    console.log('Monitor scheduler at: /api/scheduler/control?action=status');
    
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (require.main === module) {
  initializeProduction();
}

module.exports = { initializeProduction };