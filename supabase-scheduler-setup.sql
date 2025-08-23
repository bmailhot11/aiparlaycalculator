-- Additional Supabase table for scheduler usage tracking
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS scheduler_stats (
  id SERIAL PRIMARY KEY,
  month VARCHAR(7) UNIQUE NOT NULL, -- Format: "2025-08"
  monthly_usage BIGINT DEFAULT 0,
  daily_usage BIGINT DEFAULT 0,
  quota_target BIGINT DEFAULT 4850000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scheduler_stats_month ON scheduler_stats(month);

-- Insert current month record if it doesn't exist
INSERT INTO scheduler_stats (month, monthly_usage, daily_usage, quota_target)
VALUES (
  TO_CHAR(NOW(), 'YYYY-MM'),
  0,
  0,
  4850000
) ON CONFLICT (month) DO NOTHING;

-- Create a view for easy quota monitoring
CREATE OR REPLACE VIEW quota_dashboard AS
SELECT 
  month,
  monthly_usage,
  quota_target,
  ROUND((monthly_usage::DECIMAL / quota_target) * 100, 2) as usage_percentage,
  quota_target - monthly_usage as remaining_quota,
  daily_usage,
  ROUND(quota_target::DECIMAL / EXTRACT(DAY FROM DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'), 0) as daily_target,
  ROUND((daily_usage::DECIMAL / (quota_target::DECIMAL / 30)) * 100, 2) as daily_efficiency,
  updated_at
FROM scheduler_stats 
WHERE month = TO_CHAR(NOW(), 'YYYY-MM');