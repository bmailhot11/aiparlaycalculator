// Health Monitoring Endpoint for Daily Picks System

import { supabase } from '../../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    errors: [],
    warnings: []
  };

  try {
    // Check 1: Database connectivity
    healthStatus.checks.database = await checkDatabase();

    // Check 2: Recent publication status
    healthStatus.checks.recent_publication = await checkRecentPublication();

    // Check 3: Grading pipeline status
    healthStatus.checks.grading_pipeline = await checkGradingPipeline();

    // Check 4: API dependencies
    healthStatus.checks.api_dependencies = await checkAPIDependencies();

    // Check 5: Data freshness
    healthStatus.checks.data_freshness = await checkDataFreshness();

    // Determine overall health status
    const failedChecks = Object.entries(healthStatus.checks).filter(([key, check]) => !check.healthy);
    const warningChecks = Object.entries(healthStatus.checks).filter(([key, check]) => check.warning);

    if (failedChecks.length > 0) {
      healthStatus.status = 'unhealthy';
      healthStatus.errors = failedChecks.map(([key, check]) => ({
        check: key,
        message: check.message,
        details: check.details
      }));
    } else if (warningChecks.length > 0) {
      healthStatus.status = 'degraded';
      healthStatus.warnings = warningChecks.map(([key, check]) => ({
        check: key,
        message: check.message,
        details: check.details
      }));
    }

    healthStatus.response_time_ms = Date.now() - startTime;

    // Return appropriate HTTP status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check failed:', error);

    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      message: error.message,
      response_time_ms: Date.now() - startTime
    });
  }
}

/**
 * Check database connectivity and basic table access
 */
async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('daily_recos')
      .select('count')
      .limit(1);

    if (error) throw error;

    return {
      healthy: true,
      message: 'Database connection successful',
      details: {
        connection: 'active',
        response_time_ms: 'normal'
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Database connection failed',
      details: {
        error: error.message,
        connection: 'failed'
      }
    };
  }
}

/**
 * Check if recommendations were published recently
 */
async function checkRecentPublication() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: todayReco } = await supabase
      .from('daily_recos')
      .select('reco_date, status, published_at')
      .eq('reco_date', today)
      .single();

    const { data: yesterdayReco } = await supabase
      .from('daily_recos')
      .select('reco_date, status, published_at')
      .eq('reco_date', yesterdayStr)
      .single();

    const hasToday = todayReco && todayReco.status === 'published';
    const hadYesterday = yesterdayReco && yesterdayReco.status === 'published';

    if (!hasToday && !hadYesterday) {
      return {
        healthy: false,
        message: 'No recent publications found',
        details: {
          today_status: todayReco?.status || 'none',
          yesterday_status: yesterdayReco?.status || 'none',
          last_publication: null
        }
      };
    }

    // Check if today's publication is late (after 12 PM CT)
    const now = new Date();
    const ctHour = now.getUTCHours() - 5; // Approximate CT conversion
    const isLate = ctHour > 12 && !hasToday;

    return {
      healthy: true,
      warning: isLate,
      message: isLate ? 'Today\'s publication is late' : 'Recent publications found',
      details: {
        today_published: hasToday,
        yesterday_published: hadYesterday,
        today_published_at: todayReco?.published_at,
        is_late: isLate
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Failed to check publication status',
      details: { error: error.message }
    };
  }
}

/**
 * Check grading pipeline for stuck bets
 */
async function checkGradingPipeline() {
  try {
    // Look for legs that should be settled but aren't
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: stuckLegs, error } = await supabase
      .from('reco_bet_legs')
      .select('id, sport, commence_time, home_team, away_team')
      .is('result', null)
      .lte('commence_time', twentyFourHoursAgo.toISOString());

    if (error) throw error;

    const stuckCount = stuckLegs?.length || 0;

    if (stuckCount > 5) {
      return {
        healthy: false,
        message: `${stuckCount} bets stuck in grading pipeline`,
        details: {
          stuck_legs: stuckCount,
          oldest_stuck: stuckLegs[0]?.commence_time,
          sample_stuck: stuckLegs.slice(0, 3).map(leg => 
            `${leg.sport}: ${leg.home_team} vs ${leg.away_team}`
          )
        }
      };
    }

    return {
      healthy: true,
      warning: stuckCount > 0,
      message: stuckCount > 0 ? `${stuckCount} legs pending settlement` : 'Grading pipeline healthy',
      details: {
        stuck_legs: stuckCount,
        pipeline_status: 'active'
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Failed to check grading pipeline',
      details: { error: error.message }
    };
  }
}

/**
 * Check API dependencies (Odds API, external services)
 */
async function checkAPIDependencies() {
  try {
    // Test The Odds API connectivity
    const testResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${process.env.ODDS_API_KEY}`,
      { timeout: 10000 }
    );

    const hasOddsAPI = testResponse.ok;
    
    // Check API usage/rate limits if available
    const remainingRequests = testResponse.headers.get('x-requests-remaining');
    const usedRequests = testResponse.headers.get('x-requests-used');

    return {
      healthy: hasOddsAPI,
      message: hasOddsAPI ? 'API dependencies healthy' : 'Odds API unavailable',
      details: {
        odds_api: hasOddsAPI ? 'available' : 'unavailable',
        remaining_requests: remainingRequests,
        used_requests: usedRequests,
        response_status: testResponse.status
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'API dependency check failed',
      details: { 
        error: error.message,
        odds_api: 'unreachable'
      }
    };
  }
}

/**
 * Check data freshness (recent odds updates, etc.)
 */
async function checkDataFreshness() {
  try {
    // Check when the last KPI update occurred
    const { data: latestKPI } = await supabase
      .from('reco_daily_kpis')
      .select('kpi_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const lastUpdate = latestKPI ? new Date(latestKPI.updated_at) : null;
    const hoursSinceUpdate = lastUpdate ? 
      (now - lastUpdate) / (1000 * 60 * 60) : null;

    // Data should be updated at least daily
    const isStale = hoursSinceUpdate && hoursSinceUpdate > 26;

    return {
      healthy: !isStale,
      warning: hoursSinceUpdate > 24,
      message: isStale ? 'Data is stale' : 'Data freshness acceptable',
      details: {
        last_kpi_update: latestKPI?.updated_at,
        hours_since_update: hoursSinceUpdate?.toFixed(1),
        is_stale: isStale,
        latest_kpi_date: latestKPI?.kpi_date
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: 'Data freshness check failed',
      details: { error: error.message }
    };
  }
}