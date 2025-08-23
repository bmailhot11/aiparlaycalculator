// SUPABASE PRO LIMIT MANAGER ($25/month plan)
// 8GB DB, 100GB Storage, 250GB Egress - NEVER EXCEED
// Automated partition management, archival, and safety nets

import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SupabaseProManager {
  constructor() {
    this.limits = {
      database_mb: 8192,      // 8GB database limit
      storage_mb: 102400,     // 100GB storage limit  
      egress_mb: 256000,      // 250GB egress limit
      hot_data_days: 30,      // Hot data retention
      warm_data_days: 90,     // Warm data retention
      safety_margin: 0.9      // Never exceed 90% of limits
    };
    
    this.monitoring = {
      database_usage: 0,
      storage_usage: 0,
      egress_usage: 0,
      last_check: null
    };
    
    this.initializeManager();
  }

  initializeManager() {
    console.log('🔧 [ProManager] Initializing Supabase Pro limit manager');
    this.schedulePartitionManagement();
    this.scheduleStorageArchival();
    this.scheduleMaterializedViewRefresh();
    this.scheduleUsageMonitoring();
    this.scheduleEmergencyCleanup();
  }

  // =============================================================================
  // 1. DAILY PARTITION MANAGEMENT (ENFORCE 30-DAY HOT DATA LIMIT)
  // =============================================================================

  schedulePartitionManagement() {
    // Daily at 2 AM: Create new partitions + drop old ones
    cron.schedule('0 2 * * *', async () => {
      console.log('📅 [ProManager] Running daily partition management');
      await this.createNewPartitions();
      await this.dropOldPartitions();
      await this.updateUsageStats();
    });

    // Hourly: Check if emergency partition cleanup needed
    cron.schedule('0 * * * *', async () => {
      await this.checkEmergencyPartitionCleanup();
    });
  }

  async createNewPartitions() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const dateStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '_');
    
    const tables = ['odds_live', 'props_live', 'egress_tracking'];
    
    for (const table of tables) {
      try {
        const partitionName = `${table}_${dateStr}`;
        
        const { error } = await supabase.rpc('create_partition_if_not_exists', {
          parent_table: table,
          partition_name: partitionName,
          start_date: tomorrow.toISOString().split('T')[0],
          end_date: dayAfter.toISOString().split('T')[0]
        });
        
        if (!error) {
          console.log(`✅ [ProManager] Created partition: ${partitionName}`);
        }
      } catch (error) {
        console.error(`❌ [ProManager] Failed to create partition for ${table}:`, error.message);
      }
    }
  }

  async dropOldPartitions() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.limits.hot_data_days);
    
    try {
      // Get list of old partitions
      const { data: partitions } = await supabase.rpc('get_partition_sizes');
      
      const oldPartitions = partitions?.filter(p => 
        p.partition_date < cutoffDate.toISOString().split('T')[0]
      ) || [];
      
      console.log(`🗑️ [ProManager] Found ${oldPartitions.length} old partitions to archive/drop`);
      
      for (const partition of oldPartitions) {
        // Archive before dropping (if significant data)
        if (partition.size_mb > 10) {
          await this.archivePartitionToStorage(partition);
        }
        
        // Drop the partition
        await this.dropPartition(partition.partition_name);
      }
    } catch (error) {
      console.error('❌ [ProManager] Failed to drop old partitions:', error.message);
    }
  }

  async dropPartition(partitionName) {
    try {
      const { error } = await supabase.rpc('execute_sql', {
        sql: `DROP TABLE IF EXISTS ${partitionName}`
      });
      
      if (!error) {
        console.log(`✅ [ProManager] Dropped partition: ${partitionName}`);
      }
    } catch (error) {
      console.error(`❌ [ProManager] Failed to drop partition ${partitionName}:`, error.message);
    }
  }

  // =============================================================================
  // 2. STORAGE ARCHIVAL SYSTEM (MANAGE 100GB STORAGE LIMIT)  
  // =============================================================================

  scheduleStorageArchival() {
    // Daily at 3 AM: Archive old data to Supabase Storage
    cron.schedule('0 3 * * *', async () => {
      console.log('📦 [ProManager] Running daily storage archival');
      await this.archiveOldData();
      await this.cleanupOldArchives();
      await this.updateStorageUsage();
    });
  }

  async archivePartitionToStorage(partition) {
    try {
      console.log(`📦 [ProManager] Archiving partition: ${partition.partition_name}`);
      
      // Export data to compressed JSON
      const { data: partitionData } = await supabase
        .from(partition.partition_name)
        .select('*');
        
      if (!partitionData || partitionData.length === 0) {
        console.log(`⚠️ [ProManager] No data in partition ${partition.partition_name}, skipping archive`);
        return;
      }
      
      // Compress and upload to storage
      const fileName = `archives/${partition.table_name}/${partition.partition_date}.json.gz`;
      const compressedData = await this.compressJSON(partitionData);
      
      const { error: uploadError } = await supabase.storage
        .from('odds-archives')
        .upload(fileName, compressedData, {
          contentType: 'application/gzip',
          cacheControl: '3600'
        });
        
      if (!uploadError) {
        // Record archive metadata
        await supabase
          .from('archived_data')
          .upsert({
            archive_type: partition.table_name.split('_')[0], // 'odds' or 'props'
            date_partition: partition.partition_date,
            storage_path: fileName,
            file_size_mb: Math.ceil(JSON.stringify(partitionData).length / 1024 / 1024),
            compressed_size_mb: Math.ceil(compressedData.length / 1024 / 1024),
            record_count: partitionData.length
          });
          
        console.log(`✅ [ProManager] Archived ${partitionData.length} records to ${fileName}`);
      } else {
        console.error(`❌ [ProManager] Failed to upload archive: ${uploadError.message}`);
      }
    } catch (error) {
      console.error(`❌ [ProManager] Archive failed for ${partition.partition_name}:`, error.message);
    }
  }

  async compressJSON(data) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const gzip = createGzip();
      
      gzip.on('data', chunk => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.write(JSON.stringify(data));
      gzip.end();
    });
  }

  async cleanupOldArchives() {
    // Remove archives older than 6 months if storage approaching limit
    const storageUsage = await this.getStorageUsage();
    
    if (storageUsage > this.limits.storage_mb * 0.8) {
      console.log('🧹 [ProManager] Storage >80%, cleaning old archives');
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: oldArchives } = await supabase
        .from('archived_data')
        .select('*')
        .lt('date_partition', sixMonthsAgo.toISOString().split('T')[0]);
        
      for (const archive of oldArchives || []) {
        // Delete from storage
        await supabase.storage
          .from('odds-archives')
          .remove([archive.storage_path]);
          
        // Remove metadata
        await supabase
          .from('archived_data')
          .delete()
          .eq('id', archive.id);
          
        console.log(`🗑️ [ProManager] Removed old archive: ${archive.storage_path}`);
      }
    }
  }

  // =============================================================================
  // 3. MATERIALIZED VIEW REFRESH (CONTROLLED ANALYTICS)
  // =============================================================================

  scheduleMaterializedViewRefresh() {
    // Every 5 minutes: Refresh current best odds view
    cron.schedule('*/5 * * * *', async () => {
      await this.refreshMaterializedView('mv_current_best_odds');
    });

    // Every 15 minutes: Refresh line movement view  
    cron.schedule('*/15 * * * *', async () => {
      await this.refreshMaterializedView('mv_line_movement');
    });
  }

  async refreshMaterializedView(viewName) {
    try {
      const startTime = Date.now();
      
      const { error } = await supabase.rpc('execute_sql', {
        sql: `REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`
      });
      
      const duration = Date.now() - startTime;
      
      if (!error) {
        console.log(`🔄 [ProManager] Refreshed ${viewName} in ${duration}ms`);
      } else {
        console.error(`❌ [ProManager] Failed to refresh ${viewName}:`, error.message);
      }
    } catch (error) {
      console.error(`❌ [ProManager] View refresh error for ${viewName}:`, error.message);
    }
  }

  // =============================================================================
  // 4. USAGE MONITORING & SAFETY NETS
  // =============================================================================

  scheduleUsageMonitoring() {
    // Every hour: Check all usage metrics
    cron.schedule('0 * * * *', async () => {
      await this.checkAllUsageLimits();
    });

    // Every 15 minutes: Update egress tracking
    cron.schedule('*/15 * * * *', async () => {
      await this.updateEgressTracking();
    });
  }

  async checkAllUsageLimits() {
    console.log('📊 [ProManager] Checking all Supabase Pro limits');
    
    // Database usage
    const { data: dbStats } = await supabase.rpc('check_db_limits');
    if (dbStats && dbStats.length > 0) {
      const stats = dbStats[0];
      this.monitoring.database_usage = stats.current_size_mb;
      
      console.log(`📊 [ProManager] Database: ${stats.current_size_mb}MB / ${stats.limit_mb}MB (${stats.usage_pct}%)`);
      
      if (stats.usage_pct > 90) {
        console.error('🚨 [ProManager] DATABASE CRITICAL: >90% usage!');
        await this.emergencyDatabaseCleanup();
      } else if (stats.usage_pct > 80) {
        console.warn('⚠️ [ProManager] DATABASE WARNING: >80% usage');
        await this.scheduledDatabaseCleanup();
      }
    }
    
    // Storage usage
    const storageUsage = await this.getStorageUsage();
    this.monitoring.storage_usage = storageUsage;
    const storagePct = (storageUsage / this.limits.storage_mb * 100).toFixed(1);
    
    console.log(`📦 [ProManager] Storage: ${storageUsage}MB / ${this.limits.storage_mb}MB (${storagePct}%)`);
    
    if (storagePct > 90) {
      console.error('🚨 [ProManager] STORAGE CRITICAL: >90% usage!');
      await this.emergencyStorageCleanup();
    }
    
    // Log monitoring stats
    this.monitoring.last_check = new Date();
    await this.recordUsageStats();
  }

  async getStorageUsage() {
    try {
      const { data: files } = await supabase.storage
        .from('odds-archives')
        .list('archives', { limit: 1000 });
        
      const totalBytes = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
      return Math.ceil(totalBytes / 1024 / 1024);
    } catch (error) {
      console.error('❌ [ProManager] Failed to get storage usage:', error.message);
      return 0;
    }
  }

  async recordUsageStats() {
    try {
      await supabase
        .from('db_usage_stats')
        .upsert({
          date: new Date().toISOString().split('T')[0],
          total_size_mb: this.monitoring.database_usage,
          odds_size_mb: 0, // Would need to calculate
          props_size_mb: 0, // Would need to calculate  
          cache_size_mb: 0, // Would need to calculate
          partition_count: 0, // Would need to calculate
          oldest_data_date: new Date(Date.now() - this.limits.hot_data_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    } catch (error) {
      console.error('❌ [ProManager] Failed to record usage stats:', error.message);
    }
  }

  // =============================================================================
  // 5. EMERGENCY CLEANUP PROCEDURES
  // =============================================================================

  scheduleEmergencyCleanup() {
    // Every 30 minutes: Check if emergency action needed
    cron.schedule('*/30 * * * *', async () => {
      await this.checkEmergencyConditions();
    });
  }

  async checkEmergencyConditions() {
    const dbUsage = this.monitoring.database_usage / this.limits.database_mb;
    const storageUsage = this.monitoring.storage_usage / this.limits.storage_mb;
    
    if (dbUsage > 0.95 || storageUsage > 0.95) {
      console.error('🚨 [ProManager] EMERGENCY: Critical usage detected!');
      await this.executeEmergencyCleanup();
    }
  }

  async emergencyDatabaseCleanup() {
    console.log('🚨 [ProManager] EMERGENCY DATABASE CLEANUP ACTIVATED');
    
    // Drop partitions older than 20 days (instead of 30)
    const emergencyCutoff = new Date();
    emergencyCutoff.setDate(emergencyCutoff.getDate() - 20);
    
    try {
      const { data: partitions } = await supabase.rpc('get_partition_sizes');
      const emergencyPartitions = partitions?.filter(p => 
        p.partition_date < emergencyCutoff.toISOString().split('T')[0]
      ) || [];
      
      console.log(`🚨 [ProManager] Emergency dropping ${emergencyPartitions.length} partitions`);
      
      for (const partition of emergencyPartitions) {
        // Skip archival in emergency - just drop
        await this.dropPartition(partition.partition_name);
      }
      
      // Clear response cache
      await supabase
        .from('response_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
        
      console.log('🚨 [ProManager] Emergency database cleanup completed');
    } catch (error) {
      console.error('❌ [ProManager] Emergency cleanup failed:', error.message);
    }
  }

  async emergencyStorageCleanup() {
    console.log('🚨 [ProManager] EMERGENCY STORAGE CLEANUP ACTIVATED');
    
    // Delete archives older than 3 months (instead of 6)
    const emergencyCutoff = new Date();
    emergencyCutoff.setMonth(emergencyCutoff.getMonth() - 3);
    
    try {
      const { data: oldArchives } = await supabase
        .from('archived_data')
        .select('*')
        .lt('date_partition', emergencyCutoff.toISOString().split('T')[0])
        .order('date_partition', { ascending: true })
        .limit(50); // Batch delete
        
      for (const archive of oldArchives || []) {
        await supabase.storage
          .from('odds-archives')
          .remove([archive.storage_path]);
          
        await supabase
          .from('archived_data')
          .delete()
          .eq('id', archive.id);
      }
      
      console.log(`🚨 [ProManager] Emergency deleted ${oldArchives?.length || 0} archives`);
    } catch (error) {
      console.error('❌ [ProManager] Emergency storage cleanup failed:', error.message);
    }
  }

  // =============================================================================
  // 6. PUBLIC API FOR MONITORING
  // =============================================================================

  getUsageStats() {
    return {
      limits: this.limits,
      current_usage: this.monitoring,
      database_pct: (this.monitoring.database_usage / this.limits.database_mb * 100).toFixed(1),
      storage_pct: (this.monitoring.storage_usage / this.limits.storage_mb * 100).toFixed(1),
      safety_margin: this.limits.safety_margin,
      hot_data_retention: `${this.limits.hot_data_days} days`,
      status: this.getOverallStatus()
    };
  }

  getOverallStatus() {
    const dbPct = this.monitoring.database_usage / this.limits.database_mb;
    const storagePct = this.monitoring.storage_usage / this.limits.storage_mb;
    const maxUsage = Math.max(dbPct, storagePct);
    
    if (maxUsage > 0.9) return 'CRITICAL';
    if (maxUsage > 0.8) return 'WARNING';
    if (maxUsage > 0.6) return 'MONITORING';
    return 'HEALTHY';
  }

  // Force cleanup for testing
  async forceCleanupTest() {
    console.log('🧪 [ProManager] Running force cleanup test');
    await this.dropOldPartitions();
    await this.archiveOldData();
    await this.checkAllUsageLimits();
    return this.getUsageStats();
  }
}

// Export singleton
const proManager = new SupabaseProManager();
export default proManager;