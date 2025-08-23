-- AI Bet Tracking System Database Schema
-- Extends the existing daily picks system to track user-generated AI bets

-- Table for AI-generated bets (parlays and improved slips)
CREATE TABLE IF NOT EXISTS ai_generated_bets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100), -- nullable for anonymous users
  bet_type VARCHAR(20) NOT NULL, -- 'ai_parlay', 'improved_slip', 'slip_analysis'
  
  -- Original Request Data
  source_type VARCHAR(20) NOT NULL, -- 'generated', 'uploaded', 'analyzed'
  original_data JSONB, -- original user input/uploaded slip data
  
  -- AI Generated Recommendations
  recommended_legs JSONB NOT NULL, -- array of bet legs with odds, selections, etc
  total_legs INTEGER NOT NULL,
  combined_odds DECIMAL(10,3), -- American odds format
  decimal_odds DECIMAL(10,6),
  stake_amount DECIMAL(10,2) DEFAULT 10.00, -- assumed $10 stake
  potential_payout DECIMAL(10,2),
  
  -- AI Analysis
  ai_reasoning TEXT,
  expected_value DECIMAL(5,2),
  confidence_score DECIMAL(5,2), -- AI confidence if available
  improvement_percentage DECIMAL(5,2), -- for improved slips
  
  -- User Interaction
  user_downloaded BOOLEAN DEFAULT FALSE,
  user_shared BOOLEAN DEFAULT FALSE,
  user_feedback VARCHAR(20), -- 'positive', 'negative', 'neutral'
  
  -- Settlement Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, settled, voided
  actual_result VARCHAR(20), -- 'win', 'loss', 'push', 'partial_win'
  actual_payout DECIMAL(10,2) DEFAULT 0,
  settlement_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- auto-expire old bets
  metadata JSONB DEFAULT '{}'
);

-- Table for individual legs within AI bets
CREATE TABLE IF NOT EXISTS ai_bet_legs (
  id SERIAL PRIMARY KEY,
  ai_bet_id INTEGER NOT NULL REFERENCES ai_generated_bets(id) ON DELETE CASCADE,
  leg_index INTEGER NOT NULL, -- 0-based index
  
  -- Game Information
  sport VARCHAR(20) NOT NULL,
  game_id VARCHAR(100), -- external API game ID if available
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  commence_time TIMESTAMP WITH TIME ZONE,
  
  -- Bet Information
  market_type VARCHAR(50) NOT NULL, -- 'h2h', 'totals', 'spreads', etc
  selection VARCHAR(200) NOT NULL,
  point DECIMAL(5,1), -- spread/total point if applicable
  
  -- Odds Information
  recommended_odds DECIMAL(10,3) NOT NULL, -- American odds
  decimal_odds DECIMAL(10,6) NOT NULL,
  sportsbook VARCHAR(50),
  
  -- Settlement
  result VARCHAR(10), -- 'win', 'loss', 'push', 'void'
  actual_score_home INTEGER,
  actual_score_away INTEGER,
  settlement_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Table for AI bet performance KPIs
CREATE TABLE IF NOT EXISTS ai_bet_kpis (
  id SERIAL PRIMARY KEY,
  kpi_date DATE NOT NULL,
  bet_type VARCHAR(20) NOT NULL, -- 'ai_parlay', 'improved_slip', 'all'
  
  -- Daily Stats
  total_bets_generated INTEGER DEFAULT 0,
  total_bets_downloaded INTEGER DEFAULT 0,
  total_bets_settled INTEGER DEFAULT 0,
  
  -- Performance Metrics
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  pushes INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Financial Metrics (assuming $10 stakes)
  total_stake DECIMAL(10,2) DEFAULT 0,
  total_payout DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- User Engagement
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  neutral_feedback INTEGER DEFAULT 0,
  
  -- Cumulative Totals (updated nightly)
  cumulative_bets INTEGER DEFAULT 0,
  cumulative_wins INTEGER DEFAULT 0,
  cumulative_profit DECIMAL(10,2) DEFAULT 0,
  cumulative_roi DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kpi_date, bet_type)
);

-- Table for user confidence tracking
CREATE TABLE IF NOT EXISTS user_ai_confidence (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  
  -- Personal Stats
  total_ai_bets_generated INTEGER DEFAULT 0,
  total_ai_bets_followed INTEGER DEFAULT 0, -- if they indicate they placed the bet
  personal_win_rate DECIMAL(5,2) DEFAULT 0,
  personal_roi DECIMAL(5,2) DEFAULT 0,
  
  -- Confidence Metrics
  confidence_level VARCHAR(20) DEFAULT 'new', -- new, building, confident, expert
  feedback_sentiment DECIMAL(3,2) DEFAULT 0, -- -1.0 to 1.0
  last_positive_result DATE,
  consecutive_wins INTEGER DEFAULT 0,
  consecutive_losses INTEGER DEFAULT 0,
  
  -- Engagement History
  favorite_bet_types JSONB DEFAULT '[]', -- preferred bet types
  avg_parlay_legs DECIMAL(3,1) DEFAULT 3,
  most_successful_sport VARCHAR(20),
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_bets_user_id ON ai_generated_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_bets_bet_type ON ai_generated_bets(bet_type);
CREATE INDEX IF NOT EXISTS idx_ai_generated_bets_status ON ai_generated_bets(status);
CREATE INDEX IF NOT EXISTS idx_ai_generated_bets_created_at ON ai_generated_bets(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_generated_bets_expires_at ON ai_generated_bets(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_bet_legs_ai_bet_id ON ai_bet_legs(ai_bet_id);
CREATE INDEX IF NOT EXISTS idx_ai_bet_legs_game_id ON ai_bet_legs(game_id);
CREATE INDEX IF NOT EXISTS idx_ai_bet_kpis_date_type ON ai_bet_kpis(kpi_date, bet_type);
CREATE INDEX IF NOT EXISTS idx_user_ai_confidence_user_id ON user_ai_confidence(user_id);

-- Functions for automatic timestamp updates
CREATE TRIGGER update_user_ai_confidence_updated_at 
  BEFORE UPDATE ON user_ai_confidence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial KPI records
INSERT INTO ai_bet_kpis (kpi_date, bet_type) 
VALUES 
  (CURRENT_DATE, 'ai_parlay'),
  (CURRENT_DATE, 'improved_slip'),
  (CURRENT_DATE, 'all')
ON CONFLICT (kpi_date, bet_type) DO NOTHING;

-- Function to clean up expired bets
CREATE OR REPLACE FUNCTION cleanup_expired_ai_bets()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_generated_bets 
  WHERE expires_at < NOW() AND status = 'pending';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-ai-bets', '0 2 * * *', 'SELECT cleanup_expired_ai_bets();');