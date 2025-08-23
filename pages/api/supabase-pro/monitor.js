// SUPABASE PRO MONITORING API - Track all limits in real-time
// 8GB DB, 100GB Storage, 250GB Egress monitoring

import proManager from '../../../lib/supabase-pro-manager.js';
import cacheLayer from '../../../lib/optimized-cache-layer.js';
import tokenEfficientLLM from '../../../lib/token-efficient-llm.js';

export default async function handler(req, res) {
  const { method } = req;
  const { action, force } = req.query;

  try {
    switch (method) {
      case 'GET':
        switch (action) {
          case 'usage':
            // Get comprehensive usage statistics
            const usage = proManager.getUsageStats();
            const cache = await cacheLayer.getDatabaseCacheStats();
            const llm = tokenEfficientLLM.getUsageStats();
            
            return res.status(200).json({
              success: true,
              supabase_pro_limits: {
                database_limit_mb: 8192,
                storage_limit_mb: 102400,
                egress_limit_mb: 256000
              },
              current_usage: usage,
              cache_performance: cache,
              llm_efficiency: llm,
              recommendations: generateRecommendations(usage)
            });

          case 'health':
            // Quick health check
            const status = proManager.getOverallStatus();
            return res.status(200).json({
              success: true,
              status: status,
              healthy: status === 'HEALTHY',
              last_check: proManager.monitoring.last_check,
              critical_alerts: status === 'CRITICAL' ? [
                'Database or storage usage >90%',
                'Immediate cleanup required'
              ] : []
            });

          case 'partitions':
            // Get partition information
            try {
              const { data: partitions } = await supabase.rpc('get_partition_sizes');
              return res.status(200).json({
                success: true,
                partitions: partitions || [],
                total_partitions: partitions?.length || 0,
                hot_data_days: 30,
                cleanup_recommendations: partitions?.filter(p => {
                  const age = Math.floor((Date.now() - new Date(p.partition_date).getTime()) / (1000 * 60 * 60 * 24));
                  return age > 30;
                }) || []
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                error: 'Failed to get partition info',
                details: error.message
              });
            }

          case 'cache-stats':
            // Detailed cache performance
            const cacheStats = cacheLayer.getCacheStats();
            return res.status(200).json({
              success: true,
              cache_performance: cacheStats,
              optimization_tips: [
                cacheStats.cache_hit_rate < 80 ? 'Consider increasing cache TTL' : null,
                cacheStats.memory_cache_size > 900 ? 'Memory cache near limit' : null,
                'Use paginated endpoints to reduce response sizes'
              ].filter(Boolean)
            });

          default:
            // Default: Return API documentation
            return res.status(200).json({
              success: true,
              message: 'Supabase Pro Monitoring API',
              endpoints: {
                'GET /api/supabase-pro/monitor?action=usage': 'Complete usage statistics',
                'GET /api/supabase-pro/monitor?action=health': 'Quick health check',
                'GET /api/supabase-pro/monitor?action=partitions': 'Partition information',
                'GET /api/supabase-pro/monitor?action=cache-stats': 'Cache performance',
                'POST /api/supabase-pro/monitor': 'Management actions'
              },
              limits: {
                database: '8GB',
                storage: '100GB',
                egress: '250GB/month'
              }
            });
        }

      case 'POST':
        const { command } = req.body;

        switch (command) {
          case 'force-cleanup':
            console.log('🧹 [Monitor] Force cleanup requested');
            const cleanupResult = await proManager.forceCleanupTest();
            return res.status(200).json({
              success: true,
              message: 'Force cleanup completed',
              results: cleanupResult
            });

          case 'emergency-purge':
            console.log('🚨 [Monitor] Emergency purge requested');
            const purgeResult = await cacheLayer.emergencyPurgeCache();
            return res.status(200).json({
              success: true,
              message: 'Emergency cache purge completed',
              results: purgeResult
            });

          case 'refresh-views':
            // Manually refresh materialized views
            try {
              await proManager.refreshMaterializedView('mv_current_best_odds');
              await proManager.refreshMaterializedView('mv_line_movement');
              
              return res.status(200).json({
                success: true,
                message: 'Materialized views refreshed'
              });
            } catch (error) {
              return res.status(500).json({
                success: false,
                error: 'Failed to refresh views',
                details: error.message
              });
            }

          case 'create-partitions':
            // Create tomorrow's partitions
            await proManager.createNewPartitions();
            return res.status(200).json({
              success: true,
              message: 'New partitions created'
            });

          case 'check-limits':
            // Force limit check
            await proManager.checkAllUsageLimits();
            const currentUsage = proManager.getUsageStats();
            return res.status(200).json({
              success: true,
              message: 'Limits checked',
              usage: currentUsage,
              status: proManager.getOverallStatus()
            });

          case 'reset-llm-stats':
            await tokenEfficientLLM.resetUsageStats();
            return res.status(200).json({
              success: true,
              message: 'LLM usage stats reset'
            });

          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid command',
              available_commands: [
                'force-cleanup',
                'emergency-purge', 
                'refresh-views',
                'create-partitions',
                'check-limits',
                'reset-llm-stats'
              ]
            });
        }

      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }

  } catch (error) {
    console.error('❌ [Monitor API] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Monitoring API failed',
      error: error.message
    });
  }
}

function generateRecommendations(usage) {
  const recommendations = [];
  
  const dbUsage = parseFloat(usage.database_pct);
  const storageUsage = parseFloat(usage.storage_pct);
  
  if (dbUsage > 80) {
    recommendations.push({
      type: 'database',
      severity: 'high',
      message: 'Database >80% - Schedule partition cleanup',
      action: 'Run force-cleanup or drop old partitions'
    });
  }
  
  if (storageUsage > 80) {
    recommendations.push({
      type: 'storage', 
      severity: 'high',
      message: 'Storage >80% - Archive or delete old files',
      action: 'Clean archives older than 3-6 months'
    });
  }
  
  if (dbUsage > 60 || storageUsage > 60) {
    recommendations.push({
      type: 'monitoring',
      severity: 'medium', 
      message: 'Usage >60% - Increase monitoring frequency',
      action: 'Check limits more frequently'
    });
  }
  
  if (usage.status === 'HEALTHY') {
    recommendations.push({
      type: 'optimization',
      severity: 'low',
      message: 'System healthy - Consider optimizations',
      action: 'Review cache hit rates and query patterns'
    });
  }
  
  return recommendations;
}