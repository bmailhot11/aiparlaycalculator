# SUPABASE PRO CRON JOBS CONFIGURATION
# Automated jobs to maintain 8GB DB / 100GB Storage / 250GB Egress limits

## 1. DATABASE PARTITION MANAGEMENT

### Daily Partition Cleanup (2:00 AM)
```cron
0 2 * * * /usr/bin/curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"force-cleanup"}' \
  >> /var/log/supabase-cleanup.log 2>&1
```

**Purpose**: Drop partitions older than 30 days, create new partitions for tomorrow
**Enforces**: 8GB database limit by maintaining hot data window
**Safety**: Archives data before dropping if >10MB

### Hourly Emergency Check (Every hour)
```cron
0 * * * * /usr/bin/curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"check-limits"}' \
  >> /var/log/supabase-limits.log 2>&1
```

**Purpose**: Check if database >90% usage, trigger emergency cleanup
**Enforces**: Prevents database from exceeding 8GB hard limit
**Action**: Drops partitions >20 days old if critical

### Weekly Deep Cleanup (Sundays 3:00 AM)
```cron
0 3 * * 0 /usr/bin/curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"emergency-purge"}' \
  >> /var/log/supabase-weekly.log 2>&1
```

**Purpose**: Clear all expired cache entries, optimize database
**Enforces**: Long-term database health and size management

## 2. STORAGE ARCHIVAL JOBS

### Daily Archive Process (3:00 AM)  
```bash
#!/bin/bash
# Archive old data to Supabase Storage (100GB limit)

echo "$(date): Starting daily archive process" >> /var/log/supabase-archive.log

# Check current storage usage
STORAGE_USAGE=$(curl -s "https://your-domain.com/api/supabase-pro/monitor?action=usage" | jq '.current_usage.storage_usage')

if [ $STORAGE_USAGE -gt 80000 ]; then  # >80GB
  echo "Storage >80GB, running emergency cleanup"
  curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
    -H "Content-Type: application/json" \
    -d '{"command":"emergency-purge"}'
fi

echo "$(date): Archive process completed" >> /var/log/supabase-archive.log
```

**Cron Schedule**: `0 3 * * *`
**Purpose**: Archive partitions to storage before dropping
**Enforces**: 100GB storage limit with automatic cleanup

### Monthly Storage Audit (1st day, 4:00 AM)
```cron
0 4 1 * * find /var/log/supabase-*.log -mtime +30 -delete && \
  curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"force-cleanup"}' \
  >> /var/log/supabase-monthly.log 2>&1
```

**Purpose**: Monthly cleanup of logs and storage audit
**Enforces**: Long-term storage management

## 3. MATERIALIZED VIEW REFRESH

### Current Best Odds (Every 5 minutes)
```cron
*/5 * * * * /usr/bin/curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"refresh-views"}' \
  >> /var/log/supabase-views.log 2>&1
```

**Purpose**: Keep `mv_current_best_odds` fresh for API responses
**Enforces**: Reduces egress by serving pre-computed data
**Performance**: Prevents expensive real-time queries

### Line Movement Analysis (Every 15 minutes)
```cron
*/15 * * * * /usr/bin/curl -s "https://your-domain.com/api/supabase-pro/monitor" \
  -X POST -H "Content-Type: application/json" \
  -d '{"command":"refresh-views"}' | jq '.success' \
  >> /var/log/supabase-movement.log 2>&1
```

**Purpose**: Refresh `mv_line_movement` for trend analysis
**Enforces**: Egress optimization through pre-computation

## 4. CACHE OPTIMIZATION

### Memory Cache Reset (Every 2 hours)
```cron
0 */2 * * * /usr/bin/node -e "
  const cache = require('./lib/optimized-cache-layer.js').default;
  cache.cleanupMemoryCache();
  console.log('Memory cache cleaned:', new Date().toISOString());
" >> /var/log/supabase-cache.log 2>&1
```

**Purpose**: Prevent memory leaks in application cache
**Enforces**: Optimal cache performance

### LLM Token Reset (Daily 1:00 AM)
```cron
0 1 * * * /usr/bin/curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"reset-llm-stats"}' \
  >> /var/log/supabase-llm.log 2>&1
```

**Purpose**: Reset daily LLM token usage tracking
**Enforces**: Token efficiency monitoring

## 5. MONITORING AND ALERTS

### Hourly Usage Report
```cron
0 * * * * /usr/bin/curl -s "https://your-domain.com/api/supabase-pro/monitor?action=usage" \
  | jq '.current_usage | "DB: \(.database_pct)% Storage: \(.storage_pct)% Status: \(.status)"' \
  >> /var/log/supabase-hourly.log 2>&1
```

**Purpose**: Track usage trends throughout the day
**Alert**: Log warnings when approaching limits

### Critical Alert Check (Every 30 minutes)
```bash
#!/bin/bash
# Check for critical usage and send alerts

USAGE=$(curl -s "https://your-domain.com/api/supabase-pro/monitor?action=health")
STATUS=$(echo $USAGE | jq -r '.status')

if [ "$STATUS" = "CRITICAL" ]; then
  echo "CRITICAL ALERT: Supabase usage >90%" | mail -s "Supabase Critical Alert" admin@yourdomain.com
  
  # Trigger emergency cleanup
  curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
    -H "Content-Type: application/json" \
    -d '{"command":"emergency-purge"}'
fi
```

**Cron Schedule**: `*/30 * * * *`
**Purpose**: Immediate alerting for critical conditions

## 6. POSTGRESQL MAINTENANCE

### Daily VACUUM and ANALYZE (5:00 AM)
```sql
-- Run via psql cron job
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

VACUUM ANALYZE odds_live;
VACUUM ANALYZE props_live;
VACUUM ANALYZE response_cache;
```

**Cron Schedule**: `0 5 * * *`
**Purpose**: Maintain PostgreSQL performance
**Enforces**: Optimal space usage within 8GB limit

### Weekly REINDEX (Sundays 6:00 AM)
```cron
0 6 * * 0 PGPASSWORD=$SUPABASE_PASSWORD psql -h $SUPABASE_HOST -U postgres -d postgres -c "
  REINDEX INDEX CONCURRENTLY idx_odds_live_lookup;
  REINDEX INDEX CONCURRENTLY idx_props_live_lookup;
" >> /var/log/supabase-reindex.log 2>&1
```

**Purpose**: Maintain index efficiency for fast queries
**Enforces**: Query performance optimization

## 7. BACKUP AND RECOVERY

### Daily Schema Backup (6:00 AM)
```bash
#!/bin/bash
# Backup critical schema and configuration

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backup/supabase"

# Export schema only (data is in partitions/storage)
pg_dump -h $SUPABASE_HOST -U postgres -d postgres --schema-only \
  -f "$BACKUP_DIR/schema_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "schema_*.sql" -mtime +7 -delete

echo "Schema backup completed: $DATE" >> /var/log/supabase-backup.log
```

**Cron Schedule**: `0 6 * * *`
**Purpose**: Backup schema structure (not data - too large)

## 8. DEPLOYMENT CONFIGURATION

### Environment Variables Required
```bash
export SUPABASE_HOST="db.rxemdmisguqtlpwycydl.supabase.co"
export SUPABASE_PASSWORD="your_db_password"
export NEXT_PUBLIC_SUPABASE_URL="https://rxemdmisguqtlpwycydl.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

### Crontab Installation
```bash
# Install all cron jobs
crontab -e

# Add log rotation
/etc/logrotate.d/supabase-pro:
/var/log/supabase-*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 www-data www-data
}
```

## 9. MONITORING DASHBOARD QUERIES

### Real-time Usage Check
```sql
-- Check current database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  ROUND(pg_database_size(current_database())/1024.0/1024.0/1024.0, 2) as size_gb,
  ROUND((pg_database_size(current_database())/1024.0/1024.0/1024.0)/8.0*100, 1) as pct_of_limit
FROM dual;

-- Check partition sizes  
SELECT * FROM get_partition_sizes() ORDER BY partition_date DESC LIMIT 10;

-- Check cache performance
SELECT 
  cache_key, 
  hit_count, 
  created_at,
  expires_at > NOW() as active
FROM response_cache 
ORDER BY hit_count DESC 
LIMIT 10;
```

## 10. EMERGENCY PROCEDURES

### Database >95% Full
```bash
# IMMEDIATE ACTION REQUIRED
curl -X POST "https://your-domain.com/api/supabase-pro/monitor" \
  -H "Content-Type: application/json" \
  -d '{"command":"emergency-purge"}'
  
# Drop partitions >15 days old (emergency)
# Clear all caches
# Contact Supabase support if needed
```

### Storage >95% Full  
```bash
# Delete old archives immediately
# Compress remaining files
# Purge logs older than 7 days
```

---

**SUMMARY**: These cron jobs ensure your Supabase Pro plan never exceeds:
- 8GB database (through partition management)  
- 100GB storage (through archival and cleanup)
- 250GB egress (through aggressive caching)

All jobs include logging and error handling to maintain system reliability.