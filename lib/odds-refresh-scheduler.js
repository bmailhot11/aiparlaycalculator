// Comprehensive Odds Refresh Scheduler for 5M Credits Plan ($119/month)
// Target: 4.85M requests/month (~97% quota utilization)

import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OddsRefreshScheduler {
  constructor() {
    this.quotaTarget = 4850000; // 4.85M requests per month (97% of 5M)
    this.monthlyUsage = 0;
    this.dailyUsage = 0;
    this.activeWindow = { start: 7, end: 24 }; // 7 AM - 12 AM
    this.isActive = false;
    this.scheduledJobs = new Map();
    
    // Sport configurations
    this.coreMarkets = ['h2h', 'spreads', 'totals'];
    this.sports = {
      NFL: { key: 'americanfootball_nfl', markets: this.coreMarkets },
      NHL: { key: 'icehockey_nhl', markets: this.coreMarkets },
      MLB: { key: 'baseball_mlb', markets: this.coreMarkets },
      MLS: { key: 'soccer_usa_mls', markets: this.coreMarkets },
      UFC: { key: 'mma_mixed_martial_arts', markets: ['h2h', 'totals'] }
    };
    
    // Dynamic refresh intervals (can be adjusted based on quota usage)
    this.intervals = {
      coreMarkets: 60, // 60 seconds
      nflSundayProps: 30, // 30 seconds on NFL Sundays
      regularProps: 75, // 60-90 seconds (start at 75s average)
      ufc: 60, // 60 seconds during UFC events
      euRegion: 300 // 5 minutes for EU region
    };
    
    this.initializeScheduler();
  }

  initializeScheduler() {
    console.log('🚀 [Scheduler] Initializing comprehensive odds refresh scheduler');
    this.loadUsageStats();
    this.setupActiveWindowControl();
    this.scheduleCoreTasks();
    this.schedulePlayerPropsTasks();
    this.scheduleQuotaManagement();
  }

  // ACTIVE WINDOW CONTROL: 7 AM - 12 AM only
  setupActiveWindowControl() {
    // Start active window at 7 AM daily
    cron.schedule('0 7 * * *', () => {
      console.log('🌅 [Scheduler] Entering active refresh window (7 AM)');
      this.isActive = true;
      this.startAllRefreshJobs();
    });

    // End active window at 12 AM daily
    cron.schedule('0 0 * * *', () => {
      console.log('🌙 [Scheduler] Leaving active refresh window (12 AM) - serving cached odds only');
      this.isActive = false;
      this.stopAllRefreshJobs();
      this.resetDailyUsage();
    });

    // Check if we're currently in active window
    const currentHour = new Date().getHours();
    this.isActive = currentHour >= this.activeWindow.start && currentHour < this.activeWindow.end;
    
    if (this.isActive) {
      console.log('✅ [Scheduler] Currently in active window, starting refresh jobs');
      this.startAllRefreshJobs();
    } else {
      console.log('💤 [Scheduler] Currently outside active window, using cached odds only');
    }
  }

  // CORE MARKETS: 14 requests every 60 seconds during active hours
  scheduleCoreTasks() {
    const coreJob = cron.schedule('*/1 * * * *', async () => {
      if (!this.isActive) return;
      
      console.log('🎯 [Scheduler] Running core markets refresh cycle');
      await this.refreshCoreMarkets('us');
    }, { scheduled: false });

    // EU region core markets - every 5 minutes
    const euCoreJob = cron.schedule('*/5 * * * *', async () => {
      if (!this.isActive) return;
      
      console.log('🇪🇺 [Scheduler] Running EU core markets refresh cycle');
      await this.refreshCoreMarkets('eu');
    }, { scheduled: false });

    this.scheduledJobs.set('coreUS', coreJob);
    this.scheduledJobs.set('coreEU', euCoreJob);
  }

  async refreshCoreMarkets(region = 'us') {
    const requests = [];
    
    for (const [sportName, config] of Object.entries(this.sports)) {
      for (const market of config.markets) {
        const request = this.makeOddsRequest(config.key, market, region);
        requests.push(request);
      }
    }
    
    // Execute all core market requests in parallel
    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    this.updateUsageStats(requests.length);
    console.log(`✅ [Scheduler] Core markets ${region.toUpperCase()}: ${successful}/${requests.length} successful`);
    
    return results;
  }

  // PLAYER PROPS: Sport-specific scheduling
  schedulePlayerPropsTasks() {
    // NFL Sunday props - every 30 seconds during game day
    const nflSundayJob = cron.schedule('*/30 * * * 0', async () => {
      if (!this.isActive) return;
      
      console.log('🏈 [Scheduler] NFL Sunday props refresh (30s interval)');
      await this.refreshPlayerProps('NFL', 'us');
    }, { scheduled: false });

    // NHL regular props - every 75 seconds during game windows
    const nhlPropsJob = cron.schedule('*/75 * * * *', async () => {
      if (!this.isActive) return;
      
      if (await this.hasActiveGames('NHL')) {
        console.log('🏒 [Scheduler] NHL props refresh during games');
        await this.refreshPlayerProps('NHL', 'us');
      }
    }, { scheduled: false });

    // MLB regular props - every 75 seconds during game windows  
    const mlbPropsJob = cron.schedule('*/75 * * * *', async () => {
      if (!this.isActive) return;
      
      if (await this.hasActiveGames('MLB')) {
        console.log('⚾ [Scheduler] MLB props refresh during games');
        await this.refreshPlayerProps('MLB', 'us');
      }
    }, { scheduled: false });

    // MLS regular props - every 75 seconds during game windows
    const mlsPropsJob = cron.schedule('*/75 * * * *', async () => {
      if (!this.isActive) return;
      
      if (await this.hasActiveGames('MLS')) {
        console.log('⚽ [Scheduler] MLS props refresh during games');
        await this.refreshPlayerProps('MLS', 'us');
      }
    }, { scheduled: false });

    // UFC fight night props - every 60 seconds during fight cards
    const ufcPropsJob = cron.schedule('*/60 * * * *', async () => {
      if (!this.isActive) return;
      
      if (await this.hasActiveEvents('UFC')) {
        console.log('🥊 [Scheduler] UFC props refresh during fight card');
        await this.refreshPlayerProps('UFC', 'us');
      }
    }, { scheduled: false });

    this.scheduledJobs.set('nflSundayProps', nflSundayJob);
    this.scheduledJobs.set('nhlProps', nhlPropsJob);
    this.scheduledJobs.set('mlbProps', mlbPropsJob);
    this.scheduledJobs.set('mlsProps', mlsPropsJob);
    this.scheduledJobs.set('ufcProps', ufcPropsJob);
  }

  async refreshPlayerProps(sport, region = 'us') {
    const config = this.sports[sport];
    if (!config) return;

    // Get all available player prop markets for the sport
    const propMarkets = await this.getPlayerPropMarkets(sport);
    const requests = [];

    for (const market of propMarkets) {
      const request = this.makeOddsRequest(config.key, market, region);
      requests.push(request);
    }

    if (requests.length === 0) {
      console.log(`⚠️ [Scheduler] No player props available for ${sport}`);
      return;
    }

    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    this.updateUsageStats(requests.length);
    console.log(`✅ [Scheduler] ${sport} props: ${successful}/${requests.length} successful`);
    
    return results;
  }

  // QUOTA MANAGEMENT: Dynamic adjustment based on usage
  scheduleQuotaManagement() {
    // Check quota usage every hour and adjust intervals
    cron.schedule('0 * * * *', () => {
      this.adjustRefreshIntervals();
    });

    // Daily quota analysis at 6 AM (before active window starts)
    cron.schedule('0 6 * * *', () => {
      this.analyzeDailyQuotaUsage();
    });
  }

  adjustRefreshIntervals() {
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const dayOfMonth = currentDate.getDate();
    const expectedUsage = (this.quotaTarget / daysInMonth) * dayOfMonth;
    
    const usageRatio = this.monthlyUsage / expectedUsage;
    
    console.log(`📊 [Scheduler] Quota check: ${this.monthlyUsage}/${expectedUsage} expected (${(usageRatio * 100).toFixed(1)}%)`);

    if (usageRatio > 1.05) {
      // Running 5% ahead - slow down
      console.log('🐌 [Scheduler] Slowing down refresh intervals (ahead of quota)');
      this.intervals.euRegion = Math.min(600, this.intervals.euRegion + 60); // Slow EU first
      this.intervals.regularProps = Math.min(120, this.intervals.regularProps + 15);
      this.rescheduleJobs();
    } else if (usageRatio < 0.95) {
      // Running 5% behind - speed up
      console.log('🚀 [Scheduler] Speeding up refresh intervals (behind quota)');
      this.intervals.euRegion = Math.max(180, this.intervals.euRegion - 30);
      this.intervals.regularProps = Math.max(60, this.intervals.regularProps - 10);
      this.rescheduleJobs();
    }
  }

  // CORE API FUNCTIONS
  async makeOddsRequest(sport, market, region = 'us') {
    const API_KEY = process.env.ODDS_API_KEY;
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds`;
    
    const params = new URLSearchParams({
      apiKey: API_KEY,
      regions: region,
      markets: market,
      oddsFormat: 'american',
      dateFormat: 'iso'
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      
      if (response.ok && data.length > 0) {
        // Store in Supabase immediately
        await this.storeInSupabase(sport, market, region, data);
        console.log(`✅ [API] ${sport}/${market}/${region}: ${data.length} games cached`);
        return { sport, market, region, data, success: true };
      } else {
        console.log(`⚠️ [API] ${sport}/${market}/${region}: No data or error`);
        return { sport, market, region, data: [], success: false };
      }
    } catch (error) {
      console.error(`❌ [API] ${sport}/${market}/${region}:`, error.message);
      return { sport, market, region, error: error.message, success: false };
    }
  }

  async storeInSupabase(sport, market, region, data) {
    const cacheKey = `${sport}_${market}_${region}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for live data
    
    try {
      const { error } = await supabase
        .from('cache_data')
        .upsert({
          cache_key: cacheKey,
          data: data,
          sport: sport,
          cache_type: market,
          market: market === 'h2h' ? 'moneyline' : market, // Map to standard market names
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('❌ [Supabase] Cache error:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ [Supabase] Connection error:', error.message);
      return false;
    }
  }

  // UTILITY FUNCTIONS
  async hasActiveGames(sport) {
    // Check if there are games happening in the next 4 hours for this sport
    const config = this.sports[sport];
    if (!config) return false;
    
    try {
      const { data, error } = await supabase
        .from('cache_data')
        .select('data')
        .eq('cache_key', `${config.key}_h2h_us`)
        .single();

      if (error || !data?.data) return false;

      // Check if any games start within 4 hours
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
      return data.data.some(game => {
        const gameTime = new Date(game.commence_time);
        return gameTime <= fourHoursFromNow;
      });
    } catch (error) {
      console.error(`❌ [Scheduler] Error checking ${sport} games:`, error.message);
      return false;
    }
  }

  async hasActiveEvents(sport) {
    // UFC-specific: check for fight cards in the next 8 hours
    return await this.hasActiveGames(sport);
  }

  async getPlayerPropMarkets(sport) {
    // Return available player prop markets for each sport
    const propMarkets = {
      NFL: [
        'player_pass_yds', 'player_pass_tds', 'player_pass_completions',
        'player_rush_yds', 'player_rush_tds', 'player_reception_yds',
        'player_receptions', 'player_kicking_points'
      ],
      NHL: [
        'player_points', 'player_assists', 'player_goals',
        'player_shots_on_goal', 'player_blocked_shots'
      ],
      MLB: [
        'player_hits', 'player_total_bases', 'player_rbis',
        'player_home_runs', 'player_stolen_bases', 'pitcher_strikeouts'
      ],
      MLS: [
        'player_shots', 'player_shots_on_goal', 'player_goals',
        'player_assists', 'player_cards'
      ],
      UFC: [
        'fight_time_rounds', 'method_of_victory'
      ]
    };
    
    return propMarkets[sport] || [];
  }

  // JOB CONTROL
  startAllRefreshJobs() {
    for (const [name, job] of this.scheduledJobs) {
      job.start();
      console.log(`▶️ [Scheduler] Started job: ${name}`);
    }
  }

  stopAllRefreshJobs() {
    for (const [name, job] of this.scheduledJobs) {
      job.stop();
      console.log(`⏹️ [Scheduler] Stopped job: ${name}`);
    }
  }

  rescheduleJobs() {
    console.log('🔄 [Scheduler] Rescheduling jobs with updated intervals');
    this.stopAllRefreshJobs();
    this.scheduledJobs.clear();
    this.scheduleCoreTasks();
    this.schedulePlayerPropsTasks();
    if (this.isActive) {
      this.startAllRefreshJobs();
    }
  }

  // USAGE TRACKING
  updateUsageStats(requestCount) {
    this.monthlyUsage += requestCount;
    this.dailyUsage += requestCount;
    
    // Persist to storage
    this.saveUsageStats();
  }

  resetDailyUsage() {
    console.log(`📊 [Scheduler] Daily usage: ${this.dailyUsage} requests`);
    this.dailyUsage = 0;
    this.saveUsageStats();
  }

  async loadUsageStats() {
    try {
      const { data, error } = await supabase
        .from('scheduler_stats')
        .select('monthly_usage, daily_usage')
        .eq('month', new Date().toISOString().slice(0, 7))
        .single();

      if (!error && data) {
        this.monthlyUsage = data.monthly_usage || 0;
        this.dailyUsage = data.daily_usage || 0;
        console.log(`📊 [Scheduler] Loaded usage: ${this.monthlyUsage} monthly, ${this.dailyUsage} daily`);
      }
    } catch (error) {
      console.log('📊 [Scheduler] Starting fresh usage tracking');
    }
  }

  async saveUsageStats() {
    try {
      await supabase
        .from('scheduler_stats')
        .upsert({
          month: new Date().toISOString().slice(0, 7),
          monthly_usage: this.monthlyUsage,
          daily_usage: this.dailyUsage,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ [Scheduler] Failed to save usage stats:', error.message);
    }
  }

  analyzeDailyQuotaUsage() {
    const avgDailyTarget = this.quotaTarget / 30; // Rough daily target
    const efficiency = (this.dailyUsage / avgDailyTarget * 100).toFixed(1);
    
    console.log(`📈 [Scheduler] Yesterday's efficiency: ${efficiency}% (${this.dailyUsage}/${avgDailyTarget.toFixed(0)} requests)`);
    
    // Log comprehensive status
    this.logSchedulerStatus();
  }

  logSchedulerStatus() {
    console.log(`
🎯 [Scheduler Status]
├── Monthly Usage: ${this.monthlyUsage.toLocaleString()}/${this.quotaTarget.toLocaleString()} (${(this.monthlyUsage/this.quotaTarget*100).toFixed(1)}%)
├── Active Window: ${this.isActive ? 'YES' : 'NO'} (7 AM - 12 AM)
├── Intervals: Core=${this.intervals.coreMarkets}s, Props=${this.intervals.regularProps}s, EU=${this.intervals.euRegion}s
├── Jobs Running: ${Array.from(this.scheduledJobs.keys()).filter(name => this.scheduledJobs.get(name).running).length}/${this.scheduledJobs.size}
└── Next Quota Check: ${new Date(Date.now() + 60*60*1000).toLocaleTimeString()}
    `);
  }

  // PUBLIC API
  getSchedulerStats() {
    return {
      quotaTarget: this.quotaTarget,
      monthlyUsage: this.monthlyUsage,
      dailyUsage: this.dailyUsage,
      isActive: this.isActive,
      intervals: this.intervals,
      jobsRunning: Array.from(this.scheduledJobs.keys()).filter(name => this.scheduledJobs.get(name).running).length,
      totalJobs: this.scheduledJobs.size,
      efficiency: (this.monthlyUsage / this.quotaTarget * 100).toFixed(1) + '%'
    };
  }

  // Force refresh for testing
  async forceRefreshAll() {
    if (!this.isActive) {
      console.log('⚠️ [Scheduler] Outside active window, forcing refresh anyway');
    }
    
    console.log('🔄 [Scheduler] Force refresh all markets');
    await Promise.all([
      this.refreshCoreMarkets('us'),
      this.refreshCoreMarkets('eu'),
      this.refreshPlayerProps('NFL', 'us'),
      this.refreshPlayerProps('NHL', 'us'),
      this.refreshPlayerProps('MLB', 'us'),
      this.refreshPlayerProps('MLS', 'us'),
      this.refreshPlayerProps('UFC', 'us')
    ]);
  }
}

// Export singleton instance
const oddsScheduler = new OddsRefreshScheduler();
export default oddsScheduler;