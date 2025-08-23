// Scheduler Control API - Initialize and manage the comprehensive refresh system
import oddsScheduler from '../../../lib/odds-refresh-scheduler.js';

export default async function handler(req, res) {
  const { method } = req;
  const { action } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (action === 'status') {
          // Get scheduler status
          const stats = oddsScheduler.getSchedulerStats();
          return res.status(200).json({
            success: true,
            scheduler: stats,
            message: 'Scheduler status retrieved'
          });
        }
        
        // Default: return basic info
        return res.status(200).json({
          success: true,
          message: 'Odds Refresh Scheduler API',
          endpoints: {
            'GET /api/scheduler/control?action=status': 'Get scheduler status',
            'POST /api/scheduler/control': 'Control scheduler (start/stop/force-refresh)',
          },
          quota_info: {
            plan: '$119/month - 5M credits',
            target: '4.85M requests/month (97% utilization)',
            active_window: '7 AM - 12 AM daily (17 hours)',
            core_markets: 'Every 60 seconds (NFL, NHL, MLB, MLS, UFC)',
            player_props: 'Variable timing based on games/events',
            eu_region: 'Every 5-10 minutes'
          }
        });

      case 'POST':
        const { command } = req.body;

        switch (command) {
          case 'start':
            oddsScheduler.startAllRefreshJobs();
            return res.status(200).json({
              success: true,
              message: 'All refresh jobs started'
            });

          case 'stop':
            oddsScheduler.stopAllRefreshJobs();
            return res.status(200).json({
              success: true,
              message: 'All refresh jobs stopped'
            });

          case 'force-refresh':
            console.log('🔄 [API] Force refresh requested');
            await oddsScheduler.forceRefreshAll();
            return res.status(200).json({
              success: true,
              message: 'Force refresh completed for all markets'
            });

          case 'reschedule':
            oddsScheduler.rescheduleJobs();
            return res.status(200).json({
              success: true,
              message: 'Jobs rescheduled with current intervals'
            });

          case 'analyze-quota':
            oddsScheduler.analyzeDailyQuotaUsage();
            const currentStats = oddsScheduler.getSchedulerStats();
            return res.status(200).json({
              success: true,
              message: 'Quota analysis completed',
              stats: currentStats
            });

          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid command. Use: start, stop, force-refresh, reschedule, analyze-quota'
            });
        }

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }

  } catch (error) {
    console.error('❌ [Scheduler API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Scheduler control failed',
      error: error.message
    });
  }
}