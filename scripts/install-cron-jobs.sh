#!/bin/bash
# Install Supabase Pro monitoring cron jobs
# Run this script on your production server

echo "🔧 Installing Supabase Pro monitoring cron jobs..."

# Get the current directory (should be project root when run from scripts/)
PROJECT_ROOT=$(pwd)
DOMAIN=${DOMAIN:-"localhost:3000"}  # Replace with your actual domain

# Create log directory
mkdir -p /var/log/supabase-pro
chmod 755 /var/log/supabase-pro

echo "📝 Creating cron job entries..."

# Create temporary crontab file
CRON_FILE="/tmp/supabase-pro-cron"

cat > $CRON_FILE << EOF
# SUPABASE PRO MONITORING CRON JOBS
# Automated jobs to maintain 8GB DB / 100GB Storage / 250GB Egress limits

# Daily Partition Cleanup (2:00 AM)
0 2 * * * /usr/bin/curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" -H "Content-Type: application/json" -d '{"command":"force-cleanup"}' >> /var/log/supabase-pro/cleanup.log 2>&1

# Hourly Emergency Check (Every hour)  
0 * * * * /usr/bin/curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" -H "Content-Type: application/json" -d '{"command":"check-limits"}' >> /var/log/supabase-pro/limits.log 2>&1

# Weekly Deep Cleanup (Sundays 3:00 AM)
0 3 * * 0 /usr/bin/curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" -H "Content-Type: application/json" -d '{"command":"emergency-purge"}' >> /var/log/supabase-pro/weekly.log 2>&1

# Current Best Odds Refresh (Every 5 minutes)
*/5 * * * * /usr/bin/curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" -H "Content-Type: application/json" -d '{"command":"refresh-views"}' >> /var/log/supabase-pro/views.log 2>&1

# LLM Token Reset (Daily 1:00 AM)
0 1 * * * /usr/bin/curl -X POST "https://$DOMAIN/api/supabase-pro/monitor" -H "Content-Type: application/json" -d '{"command":"reset-llm-stats"}' >> /var/log/supabase-pro/llm.log 2>&1

# Hourly Usage Report
0 * * * * /usr/bin/curl -s "https://$DOMAIN/api/supabase-pro/monitor?action=usage" | jq '.current_usage | "DB: \(.database_pct)% Storage: \(.storage_pct)% Status: \(.status)"' >> /var/log/supabase-pro/hourly.log 2>&1

# Critical Alert Check (Every 30 minutes)
*/30 * * * * $PROJECT_ROOT/scripts/critical-alert-check.sh >> /var/log/supabase-pro/alerts.log 2>&1

EOF

# Install the cron jobs
echo "⚙️ Installing cron jobs..."
crontab $CRON_FILE

# Clean up temp file
rm $CRON_FILE

echo "✅ Cron jobs installed successfully!"
echo ""
echo "📊 Installed jobs:"
echo "  - Daily cleanup at 2:00 AM"
echo "  - Hourly limit checks"  
echo "  - Weekly deep cleanup on Sundays"
echo "  - Views refresh every 5 minutes"
echo "  - Critical alerts every 30 minutes"
echo ""
echo "📝 Logs will be written to /var/log/supabase-pro/"
echo ""
echo "🔍 Verify installation:"
echo "  crontab -l | grep supabase"
echo ""
echo "⚠️  IMPORTANT: Update DOMAIN variable to your production URL before running!"