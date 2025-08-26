-- Real Tracking System Schema for Bet Performance
-- This replaces mock data with actual bet result tracking

-- Table to store daily picks performance results
CREATE TABLE IF NOT EXISTS daily_picks_results (
  id SERIAL PRIMARY KEY,
  result_date DATE NOT NULL UNIQUE,
  
  -- Single Bet Results
  single_bet_result VARCHAR(10), -- 'win', 'loss', 'push', 'void', 'pending'
  single_bet_odds DECIMAL(10,3),
  single_bet_stake DECIMAL(10,2) DEFAULT 100.00,
  single_bet_payout DECIMAL(10,2) DEFAULT 0,
  single_bet_profit DECIMAL(10,2) DEFAULT 0,
  single_bet_edge DECIMAL(5,2),
  single_bet_sport VARCHAR(50),
  
  -- 2-Leg Parlay Results  
  parlay2_result VARCHAR(10),
  parlay2_odds DECIMAL(10,3),
  parlay2_stake DECIMAL(10,2) DEFAULT 50.00,
  parlay2_payout DECIMAL(10,2) DEFAULT 0,
  parlay2_profit DECIMAL(10,2) DEFAULT 0,
  parlay2_edge DECIMAL(5,2),
  parlay2_sports JSONB, -- Array of sports involved
  
  -- 4-Leg Parlay Results
  parlay4_result VARCHAR(10),
  parlay4_odds DECIMAL(10,3),
  parlay4_stake DECIMAL(10,2) DEFAULT 25.00,
  parlay4_payout DECIMAL(10,2) DEFAULT 0,
  parlay4_profit DECIMAL(10,2) DEFAULT 0,
  parlay4_edge DECIMAL(5,2),
  parlay4_sports JSONB,
  
  -- Daily Totals
  total_stake DECIMAL(10,2) DEFAULT 0,
  total_payout DECIMAL(10,2) DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0,
  day_roi DECIMAL(8,4) DEFAULT 0, -- Return on Investment for the day
  
  -- Settlement Info
  settled_bets INTEGER DEFAULT 0,
  pending_bets INTEGER DEFAULT 0,
  no_bet_day BOOLEAN DEFAULT FALSE,
  no_bet_reason TEXT,
  
  -- Metadata
  graded_at TIMESTAMP WITH TIME ZONE,
  manual_override BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store aggregate performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_date DATE NOT NULL UNIQUE,
  
  -- Cumulative Performance
  total_days INTEGER DEFAULT 0,
  betting_days INTEGER DEFAULT 0, -- Days with actual bets (excluding no-bet days)
  no_bet_days INTEGER DEFAULT 0,
  
  -- Win Rates
  single_win_rate DECIMAL(5,2) DEFAULT 0,
  parlay2_win_rate DECIMAL(5,2) DEFAULT 0,
  parlay4_win_rate DECIMAL(5,2) DEFAULT 0,
  overall_win_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Financial Performance
  total_staked DECIMAL(12,2) DEFAULT 0,
  total_returned DECIMAL(12,2) DEFAULT 0,
  total_profit DECIMAL(12,2) DEFAULT 0,
  overall_roi DECIMAL(8,4) DEFAULT 0,
  
  -- Rolling Averages (30-day)
  roi_30d DECIMAL(8,4) DEFAULT 0,
  win_rate_30d DECIMAL(5,2) DEFAULT 0,
  avg_daily_profit_30d DECIMAL(10,2) DEFAULT 0,
  
  -- Best/Worst Performance
  best_day_profit DECIMAL(10,2) DEFAULT 0,
  worst_day_profit DECIMAL(10,2) DEFAULT 0,
  longest_win_streak INTEGER DEFAULT 0,
  longest_loss_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  current_streak_type VARCHAR(10), -- 'win', 'loss', 'mixed'
  
  -- Edge Performance Tracking
  avg_edge_taken DECIMAL(5,2) DEFAULT 0,
  edge_conversion_rate DECIMAL(5,2) DEFAULT 0, -- How often positive edge converts to wins
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store individual leg settlement details for analysis
CREATE TABLE IF NOT EXISTS bet_leg_results (
  id SERIAL PRIMARY KEY,
  result_date DATE NOT NULL,
  leg_source VARCHAR(20) NOT NULL, -- 'single', 'parlay2', 'parlay4'
  leg_index INTEGER NOT NULL DEFAULT 0,
  
  -- Game Information
  sport VARCHAR(50) NOT NULL,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  game_start TIMESTAMP WITH TIME ZONE,
  
  -- Bet Details
  market_type VARCHAR(50) NOT NULL,
  selection VARCHAR(200) NOT NULL,
  recommended_odds DECIMAL(10,3),
  closing_odds DECIMAL(10,3), -- For CLV calculation
  
  -- Result
  result VARCHAR(10) NOT NULL, -- 'win', 'loss', 'push', 'void'
  home_score INTEGER,
  away_score INTEGER,
  total_score INTEGER,
  
  -- Performance Metrics
  closing_line_value DECIMAL(5,2), -- How much better/worse than closing
  edge_realized BOOLEAN, -- Did the expected edge materialize?
  
  -- Settlement
  settled_at TIMESTAMP WITH TIME ZONE,
  settlement_source VARCHAR(50), -- 'api_auto', 'manual', 'espn_scrape'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track AI-generated bet performance (extends existing system)
CREATE TABLE IF NOT EXISTS ai_bet_results (
  id SERIAL PRIMARY KEY,
  ai_bet_id UUID NOT NULL, -- References ai_generated_bets.id
  
  -- Settlement Results
  result VARCHAR(10) NOT NULL, -- 'win', 'loss', 'push', 'void', 'pending'
  actual_payout DECIMAL(10,2) DEFAULT 0,
  profit_loss DECIMAL(10,2) DEFAULT 0,
  
  -- Performance Analysis
  legs_won INTEGER DEFAULT 0,
  legs_lost INTEGER DEFAULT 0,
  legs_pushed INTEGER DEFAULT 0,
  legs_voided INTEGER DEFAULT 0,
  
  -- CLV Analysis
  avg_closing_line_value DECIMAL(5,2),
  best_leg_clv DECIMAL(5,2),
  worst_leg_clv DECIMAL(5,2),
  
  -- Settlement Info
  settled_at TIMESTAMP WITH TIME ZONE,
  settlement_method VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_picks_results_date ON daily_picks_results(result_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_bet_leg_results_date ON bet_leg_results(result_date);
CREATE INDEX IF NOT EXISTS idx_bet_leg_results_sport ON bet_leg_results(sport);
CREATE INDEX IF NOT EXISTS idx_ai_bet_results_bet_id ON ai_bet_results(ai_bet_id);

-- Function to automatically update performance metrics
CREATE OR REPLACE FUNCTION update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily metrics when daily_picks_results changes
  INSERT INTO performance_metrics (metric_date)
  VALUES (NEW.result_date)
  ON CONFLICT (metric_date) DO NOTHING;
  
  -- Trigger full metrics recalculation (will be done by scheduled job)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when results change
CREATE TRIGGER update_metrics_on_result_change
  AFTER INSERT OR UPDATE ON daily_picks_results
  FOR EACH ROW EXECUTE FUNCTION update_performance_metrics();

-- Function to calculate performance metrics (to be called by cron job)
CREATE OR REPLACE FUNCTION recalculate_performance_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Calculate metrics for target date based on all historical data up to that point
  WITH daily_stats AS (
    SELECT 
      COUNT(*) as total_days,
      COUNT(*) FILTER (WHERE NOT no_bet_day) as betting_days,
      COUNT(*) FILTER (WHERE no_bet_day) as no_bet_days,
      
      -- Win rates
      ROUND(AVG(CASE WHEN single_bet_result = 'win' THEN 100 ELSE 0 END), 2) as single_win_rate,
      ROUND(AVG(CASE WHEN parlay2_result = 'win' THEN 100 ELSE 0 END), 2) as parlay2_win_rate,  
      ROUND(AVG(CASE WHEN parlay4_result = 'win' THEN 100 ELSE 0 END), 2) as parlay4_win_rate,
      
      -- Financial metrics
      SUM(total_stake) as total_staked,
      SUM(total_payout) as total_returned,
      SUM(total_profit) as total_profit,
      
      -- Best/worst days
      MAX(total_profit) as best_day,
      MIN(total_profit) as worst_day,
      AVG(total_stake + total_payout + total_profit) FILTER (WHERE total_stake > 0) as avg_edge
      
    FROM daily_picks_results 
    WHERE result_date <= target_date
  )
  INSERT INTO performance_metrics (
    metric_date,
    total_days,
    betting_days, 
    no_bet_days,
    single_win_rate,
    parlay2_win_rate,
    parlay4_win_rate,
    total_staked,
    total_returned, 
    total_profit,
    overall_roi,
    best_day_profit,
    worst_day_profit,
    updated_at
  )
  SELECT 
    target_date,
    total_days,
    betting_days,
    no_bet_days,
    single_win_rate,
    parlay2_win_rate,
    parlay4_win_rate,
    total_staked,
    total_returned,
    total_profit,
    CASE 
      WHEN total_staked > 0 THEN ROUND((total_profit / total_staked * 100), 4)
      ELSE 0 
    END as overall_roi,
    best_day,
    worst_day,
    NOW()
  FROM daily_stats
  ON CONFLICT (metric_date) 
  DO UPDATE SET
    total_days = EXCLUDED.total_days,
    betting_days = EXCLUDED.betting_days,
    no_bet_days = EXCLUDED.no_bet_days,
    single_win_rate = EXCLUDED.single_win_rate,
    parlay2_win_rate = EXCLUDED.parlay2_win_rate,
    parlay4_win_rate = EXCLUDED.parlay4_win_rate,
    total_staked = EXCLUDED.total_staked,
    total_returned = EXCLUDED.total_returned,
    total_profit = EXCLUDED.total_profit,
    overall_roi = EXCLUDED.overall_roi,
    best_day_profit = EXCLUDED.best_day_profit,
    worst_day_profit = EXCLUDED.worst_day_profit,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;