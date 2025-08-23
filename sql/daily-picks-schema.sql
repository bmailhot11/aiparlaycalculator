-- Daily Picks System Database Schema

-- Table for daily recommendations (one record per day)
CREATE TABLE IF NOT EXISTS daily_recos (
  id SERIAL PRIMARY KEY,
  reco_date DATE NOT NULL UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, published, graded
  single_bet_id INTEGER,
  parlay_2_id INTEGER,
  parlay_4_id INTEGER,
  no_bet_reason TEXT, -- explanation if no qualifying edges found
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for individual bet recommendations
CREATE TABLE IF NOT EXISTS reco_bets (
  id SERIAL PRIMARY KEY,
  daily_reco_id INTEGER NOT NULL REFERENCES daily_recos(id) ON DELETE CASCADE,
  bet_type VARCHAR(10) NOT NULL, -- 'single', 'parlay2', 'parlay4'
  total_legs INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, settled, voided
  
  -- Odds and Edge Information
  combined_odds DECIMAL(10,3), -- American odds format
  decimal_odds DECIMAL(10,6),
  fair_odds DECIMAL(10,6),
  edge_percentage DECIMAL(5,2),
  estimated_payout DECIMAL(10,2),
  
  -- Settlement Information
  result VARCHAR(10), -- 'win', 'loss', 'push', 'void'
  gross_return DECIMAL(10,2) DEFAULT 0,
  net_pnl DECIMAL(10,2) DEFAULT 0,
  clv_percentage DECIMAL(5,2), -- closing line value
  settled_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for individual legs within bets
CREATE TABLE IF NOT EXISTS reco_bet_legs (
  id SERIAL PRIMARY KEY,
  reco_bet_id INTEGER NOT NULL REFERENCES reco_bets(id) ON DELETE CASCADE,
  leg_index INTEGER NOT NULL, -- 0 for single, 0-1 for 2-leg, 0-3 for 4-leg
  
  -- Game Information
  sport VARCHAR(20) NOT NULL,
  game_id VARCHAR(100) NOT NULL, -- external API game ID
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  commence_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Bet Information
  market_type VARCHAR(50) NOT NULL, -- 'h2h', 'totals', 'spreads'
  selection VARCHAR(200) NOT NULL, -- e.g. "Lakers", "Over 215.5", "Lakers -4.5"
  selection_key VARCHAR(100), -- normalized selection identifier
  
  -- Sportsbook and Odds
  best_sportsbook VARCHAR(50) NOT NULL,
  best_odds DECIMAL(10,3) NOT NULL, -- American odds
  decimal_odds DECIMAL(10,6) NOT NULL,
  
  -- Fair Value Calculation
  pinnacle_odds DECIMAL(10,3), -- Pinnacle anchor odds
  fair_odds DECIMAL(10,6) NOT NULL,
  edge_percentage DECIMAL(5,2) NOT NULL,
  no_vig_probability DECIMAL(8,6),
  
  -- Settlement
  result VARCHAR(10), -- 'win', 'loss', 'push', 'void'
  closing_odds DECIMAL(10,3), -- closing line for CLV calculation
  clv_percentage DECIMAL(5,2),
  settled_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for settlement results and external data
CREATE TABLE IF NOT EXISTS reco_settlements (
  id SERIAL PRIMARY KEY,
  reco_bet_leg_id INTEGER NOT NULL REFERENCES reco_bet_legs(id) ON DELETE CASCADE,
  
  -- Game Result Data
  home_score INTEGER,
  away_score INTEGER,
  total_score INTEGER,
  game_status VARCHAR(20), -- 'final', 'postponed', 'cancelled'
  
  -- Settlement Logic
  settlement_logic TEXT, -- explanation of how result was determined
  manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  
  settled_by VARCHAR(50), -- 'auto', 'manual', system user
  settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for daily KPI tracking
CREATE TABLE IF NOT EXISTS reco_daily_kpis (
  id SERIAL PRIMARY KEY,
  kpi_date DATE NOT NULL UNIQUE,
  
  -- Daily Results
  single_pnl DECIMAL(10,2) DEFAULT 0,
  parlay_2_pnl DECIMAL(10,2) DEFAULT 0,
  parlay_4_pnl DECIMAL(10,2) DEFAULT 0,
  total_daily_pnl DECIMAL(10,2) DEFAULT 0,
  
  -- Running Totals (updated nightly)
  total_bets_placed INTEGER DEFAULT 0,
  total_bets_won INTEGER DEFAULT 0,
  total_bets_lost INTEGER DEFAULT 0,
  total_bets_pushed INTEGER DEFAULT 0,
  total_bets_voided INTEGER DEFAULT 0,
  
  cumulative_pnl DECIMAL(10,2) DEFAULT 0,
  total_roi_percentage DECIMAL(5,2) DEFAULT 0,
  hit_rate_percentage DECIMAL(5,2) DEFAULT 0,
  clv_beat_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- 30-day rolling metrics
  roi_30d DECIMAL(5,2) DEFAULT 0,
  hit_rate_30d DECIMAL(5,2) DEFAULT 0,
  clv_beat_30d DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  no_bet_days_count INTEGER DEFAULT 0,
  avg_edge_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced user profiles for premium access
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL UNIQUE, -- from auth system
  email VARCHAR(255),
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification Preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  daily_picks_email BOOLEAN DEFAULT TRUE,
  results_email BOOLEAN DEFAULT FALSE,
  
  -- Usage Tracking
  last_seen_picks_date DATE,
  total_picks_viewed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_recos_date ON daily_recos(reco_date);
CREATE INDEX IF NOT EXISTS idx_daily_recos_status ON daily_recos(status);
CREATE INDEX IF NOT EXISTS idx_reco_bets_daily_reco_id ON reco_bets(daily_reco_id);
CREATE INDEX IF NOT EXISTS idx_reco_bets_status ON reco_bets(status);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_bet_id ON reco_bet_legs(reco_bet_id);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_game_id ON reco_bet_legs(game_id);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_commence_time ON reco_bet_legs(commence_time);
CREATE INDEX IF NOT EXISTS idx_reco_settlements_leg_id ON reco_settlements(reco_bet_leg_id);
CREATE INDEX IF NOT EXISTS idx_reco_daily_kpis_date ON reco_daily_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_premium ON user_profiles(is_premium);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_daily_recos_updated_at BEFORE UPDATE ON daily_recos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reco_bets_updated_at BEFORE UPDATE ON reco_bets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reco_bet_legs_updated_at BEFORE UPDATE ON reco_bet_legs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reco_daily_kpis_updated_at BEFORE UPDATE ON reco_daily_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial KPI record for today
INSERT INTO reco_daily_kpis (kpi_date) 
VALUES (CURRENT_DATE) 
ON CONFLICT (kpi_date) DO NOTHING;