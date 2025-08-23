#!/bin/bash
# Critical alert check script for Supabase Pro limits
# Called by cron every 30 minutes

DOMAIN=${DOMAIN:-"localhost:3000"}
ALERT_EMAIL=${ALERT_EMAIL:-"admin@yourdomain.com"}

echo "$(date): Checking critical usage conditions..."

# Get system health status
HEALTH_RESPONSE=$(curl -s "https://$DOMAIN/api/supabase-pro/monitor?action=health")
STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status')

echo "Current status: $STATUS"

if [ "$STATUS" = "CRITICAL" ]; then
    echo "🚨 CRITICAL ALERT: Supabase usage >90%"
    
    # Get detailed usage
    USAGE_RESPONSE=$(curl -s "https://$DOMAIN/api/supabase-pro/monitor?action=usage")
    DB_PCT=$(echo $USAGE_RESPONSE | jq -r '.current_usage.database_pct')
    STORAGE_PCT=$(echo $USAGE_RESPONSE | jq -r '.current_usage.storage_pct')
    
    ALERT_MESSAGE="CRITICAL ALERT: Supabase Pro Usage Emergency
    
Database: ${DB_PCT}%
Storage: ${STORAGE_PCT}%

Automatic emergency cleanup has been triggered.
Monitor: https://$DOMAIN/api/supabase-pro/monitor?action=usage

Time: $(date)"

    # Send alert (requires mail command to be configured)
    echo "$ALERT_MESSAGE" | mail -s "🚨 Supabase Critical Alert" $ALERT_EMAIL 2>/dev/null || echo "Mail not configured"
    
    # Trigger emergency cleanup
    echo "Triggering emergency cleanup..."
    curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" \
        -H "Content-Type: application/json" \
        -d '{"command":"emergency-purge"}' > /dev/null 2>&1

elif [ "$STATUS" = "WARNING" ]; then
    echo "⚠️  WARNING: Supabase usage >80% - monitoring closely"
    
else
    echo "✅ System healthy: $STATUS"
fi

echo "$(date): Alert check completed"