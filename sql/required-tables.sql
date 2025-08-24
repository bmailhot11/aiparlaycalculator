-- Required Supabase tables for AI Parlay Calculator
-- Run these commands in your Supabase SQL editor

-- 1. Cache data table for odds caching
CREATE TABLE IF NOT EXISTS cache_data (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cache_data_key ON cache_data(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_data_expires ON cache_data(expires_at);

-- 2. Recommended bets table (create this first)
CREATE TABLE IF NOT EXISTS reco_bets (
    id SERIAL PRIMARY KEY,
    bet_type VARCHAR(20) NOT NULL, -- 'single', 'parlay2', 'parlay4'
    combined_odds VARCHAR(10),
    decimal_odds DECIMAL(10,3),
    edge_percentage DECIMAL(5,2),
    estimated_payout DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    result VARCHAR(10), -- 'win', 'loss', 'push', 'void', 'pending'
    actual_payout DECIMAL(10,2),
    stake DECIMAL(10,2) DEFAULT 100.00,
    created_day_local DATE,
    parlay_legs INTEGER DEFAULT 1,
    payout DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily recommendations table (create this after reco_bets)
CREATE TABLE IF NOT EXISTS daily_recos (
    id SERIAL PRIMARY KEY,
    reco_date DATE NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    single_bet_id INTEGER,
    parlay_2_id INTEGER,
    parlay_4_id INTEGER,
    no_bet_reason TEXT,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Individual bet legs table
CREATE TABLE IF NOT EXISTS reco_bet_legs (
    id SERIAL PRIMARY KEY,
    reco_bet_id INTEGER REFERENCES reco_bets(id) ON DELETE CASCADE,
    sport VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    commence_time TIMESTAMP WITH TIME ZONE,
    market_type VARCHAR(50) NOT NULL,
    selection VARCHAR(200) NOT NULL,
    best_sportsbook VARCHAR(50),
    best_odds VARCHAR(10),
    edge_percentage DECIMAL(5,2),
    result VARCHAR(10), -- 'win', 'loss', 'push', 'void', 'pending'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User profiles table (for premium tracking)
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP WITH TIME ZONE,
    total_picks_viewed INTEGER DEFAULT 0,
    last_seen_picks_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints (optional - run these after data is populated)
-- ALTER TABLE daily_recos 
--     ADD CONSTRAINT fk_daily_recos_single_bet 
--     FOREIGN KEY (single_bet_id) REFERENCES reco_bets(id);

-- ALTER TABLE daily_recos 
--     ADD CONSTRAINT fk_daily_recos_parlay_2 
--     FOREIGN KEY (parlay_2_id) REFERENCES reco_bets(id);

-- ALTER TABLE daily_recos 
--     ADD CONSTRAINT fk_daily_recos_parlay_4 
--     FOREIGN KEY (parlay_4_id) REFERENCES reco_bets(id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_daily_recos_date ON daily_recos(reco_date);
CREATE INDEX IF NOT EXISTS idx_reco_bets_created_day ON reco_bets(created_day_local);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_bet_id ON reco_bet_legs(reco_bet_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Views for easier querying
CREATE OR REPLACE VIEW v_daily_performance AS
SELECT 
    rb.created_day_local as date,
    COUNT(*) as bets_settled,
    SUM(CASE WHEN rb.result = 'win' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN rb.result = 'loss' THEN 1 ELSE 0 END) as losses,
    SUM(CASE WHEN rb.result = 'push' THEN 1 ELSE 0 END) as pushes,
    ROUND(
        (SUM(CASE WHEN rb.result = 'win' THEN 1 ELSE 0 END)::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 
        2
    ) as win_rate_pct,
    SUM(rb.stake) as total_staked,
    SUM(
        CASE rb.result
            WHEN 'win' THEN COALESCE(rb.payout, rb.stake * rb.decimal_odds) - rb.stake
            WHEN 'loss' THEN -rb.stake
            WHEN 'push' THEN 0
            WHEN 'void' THEN 0
            ELSE 0
        END
    ) as net_profit
FROM reco_bets rb
WHERE rb.result IN ('win', 'loss', 'push', 'void')
GROUP BY rb.created_day_local
ORDER BY rb.created_day_local DESC;

CREATE OR REPLACE VIEW v_cumulative_bankroll AS
SELECT 
    date,
    SUM(net_profit) OVER (ORDER BY date) as cumulative_pnl
FROM v_daily_performance
ORDER BY date;

-- Set up Row Level Security (RLS) if needed
ALTER TABLE cache_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_recos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reco_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reco_bet_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access on daily_recos" ON daily_recos
    FOR SELECT USING (true);

CREATE POLICY "Public read access on reco_bets" ON reco_bets
    FOR SELECT USING (true);

CREATE POLICY "Public read access on reco_bet_legs" ON reco_bet_legs
    FOR SELECT USING (true);

-- Cache data should only be accessible by service role
CREATE POLICY "Service role access on cache_data" ON cache_data
    USING (auth.role() = 'service_role');

-- User profiles should only be accessible by the user or service role
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON daily_recos TO anon;
GRANT SELECT ON reco_bets TO anon;
GRANT SELECT ON reco_bet_legs TO anon;
GRANT SELECT ON v_daily_performance TO anon;
GRANT SELECT ON v_cumulative_bankroll TO anon;

GRANT SELECT ON daily_recos TO authenticated;
GRANT SELECT ON reco_bets TO authenticated;
GRANT SELECT ON reco_bet_legs TO authenticated;
GRANT SELECT ON v_daily_performance TO authenticated;
GRANT SELECT ON v_cumulative_bankroll TO authenticated;

-- Clean up old cache data automatically
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM cache_data WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic cleanup (run this if you want automated cleanup)
-- SELECT cron.schedule('cleanup-cache', '*/15 * * * *', 'SELECT cleanup_expired_cache();');

-- 6. CLV (Closing Line Value) Tracking System
CREATE TABLE IF NOT EXISTS clv_bet_tracking (
    id SERIAL PRIMARY KEY,
    bet_id VARCHAR(50) NOT NULL, -- Unique identifier for this bet suggestion
    sport VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    selection VARCHAR(200) NOT NULL,
    game_id VARCHAR(100) NOT NULL, -- External game ID for tracking
    commence_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Opening line data (when we first suggest the bet)
    opening_odds_decimal DECIMAL(10,3) NOT NULL,
    opening_odds_american VARCHAR(10) NOT NULL,
    opening_sportsbook VARCHAR(50) NOT NULL,
    opening_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Closing line data (when game starts)
    closing_odds_decimal DECIMAL(10,3),
    closing_odds_american VARCHAR(10),
    closing_sportsbook VARCHAR(50),
    closing_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- CLV metrics
    clv_decimal DECIMAL(10,4), -- (closing_odds - opening_odds) / opening_odds
    clv_percent DECIMAL(7,3), -- CLV as percentage
    cents_clv INTEGER, -- CLV in American odds "cents" (e.g., +150 to +160 = 10 cents)
    
    -- Model performance data
    suggested_probability DECIMAL(5,4), -- Our model's estimated true probability
    opening_implied_prob DECIMAL(5,4), -- Implied probability from opening odds
    closing_implied_prob DECIMAL(5,4), -- Implied probability from closing odds
    ev_at_suggestion DECIMAL(8,4), -- Expected value when we suggested it
    kelly_size_suggested DECIMAL(6,3), -- Kelly criterion sizing we suggested
    
    -- Game result tracking
    game_result VARCHAR(20), -- 'win', 'loss', 'push', 'cancelled', 'pending'
    result_timestamp TIMESTAMP WITH TIME ZONE,
    actual_outcome_correct BOOLEAN, -- Did our prediction match the actual result?
    
    -- Metadata
    suggestion_source VARCHAR(50) DEFAULT 'ai_model', -- 'ai_model', 'user_slip', 'daily_pick'
    confidence_score INTEGER, -- 1-100 confidence in our suggestion
    model_version VARCHAR(20) DEFAULT 'v2.1',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CLV aggregate performance metrics
CREATE TABLE IF NOT EXISTS clv_performance_summary (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Volume metrics
    total_bets_tracked INTEGER DEFAULT 0,
    bets_with_closing_lines INTEGER DEFAULT 0,
    
    -- CLV performance
    avg_clv_decimal DECIMAL(8,4),
    avg_clv_percent DECIMAL(7,3),
    positive_clv_rate DECIMAL(5,2), -- % of bets with positive CLV
    
    -- CLV distribution
    clv_above_5pct INTEGER DEFAULT 0,
    clv_2_to_5pct INTEGER DEFAULT 0,
    clv_0_to_2pct INTEGER DEFAULT 0,
    clv_negative INTEGER DEFAULT 0,
    
    -- Model accuracy
    suggestions_settled INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    prediction_accuracy DECIMAL(5,2),
    
    -- Expected vs actual performance
    total_expected_value DECIMAL(10,3),
    total_actual_profit DECIMAL(10,2),
    ev_realization_rate DECIMAL(5,2), -- actual_profit / expected_value
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for CLV tracking performance
CREATE INDEX IF NOT EXISTS idx_clv_bet_tracking_game_id ON clv_bet_tracking(game_id);
CREATE INDEX IF NOT EXISTS idx_clv_bet_tracking_sport ON clv_bet_tracking(sport);
CREATE INDEX IF NOT EXISTS idx_clv_bet_tracking_commence_time ON clv_bet_tracking(commence_time);
CREATE INDEX IF NOT EXISTS idx_clv_bet_tracking_opening_timestamp ON clv_bet_tracking(opening_timestamp);
CREATE INDEX IF NOT EXISTS idx_clv_bet_tracking_suggestion_source ON clv_bet_tracking(suggestion_source);
CREATE INDEX IF NOT EXISTS idx_clv_performance_period ON clv_performance_summary(period_type, period_start, period_end);

-- Views for CLV analysis
CREATE OR REPLACE VIEW v_clv_recent_performance AS
SELECT 
    sport,
    suggestion_source,
    COUNT(*) as total_tracked,
    COUNT(CASE WHEN clv_decimal IS NOT NULL THEN 1 END) as with_closing_lines,
    ROUND(AVG(clv_percent), 2) as avg_clv_pct,
    ROUND(
        (COUNT(CASE WHEN clv_percent > 0 THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(CASE WHEN clv_percent IS NOT NULL THEN 1 END), 0)) * 100, 
        1
    ) as positive_clv_rate,
    COUNT(CASE WHEN game_result IN ('win', 'loss', 'push') THEN 1 END) as settled_bets,
    COUNT(CASE WHEN actual_outcome_correct = true THEN 1 END) as correct_predictions,
    ROUND(
        (COUNT(CASE WHEN actual_outcome_correct = true THEN 1 END)::DECIMAL /
         NULLIF(COUNT(CASE WHEN game_result IN ('win', 'loss', 'push') THEN 1 END), 0)) * 100,
        1
    ) as accuracy_pct
FROM clv_bet_tracking 
WHERE opening_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY sport, suggestion_source
ORDER BY total_tracked DESC;

CREATE OR REPLACE VIEW v_clv_model_performance AS
SELECT 
    DATE(opening_timestamp) as date,
    COUNT(*) as bets_suggested,
    COUNT(CASE WHEN clv_decimal IS NOT NULL THEN 1 END) as with_closing_data,
    ROUND(AVG(clv_percent), 2) as avg_clv_pct,
    COUNT(CASE WHEN clv_percent > 5 THEN 1 END) as strong_clv_count,
    COUNT(CASE WHEN clv_percent > 0 THEN 1 END) as positive_clv_count,
    ROUND(AVG(ev_at_suggestion), 4) as avg_suggested_ev,
    COUNT(CASE WHEN actual_outcome_correct = true THEN 1 END) as correct_predictions,
    COUNT(CASE WHEN game_result IN ('win', 'loss', 'push') THEN 1 END) as settled_bets
FROM clv_bet_tracking
WHERE opening_timestamp >= NOW() - INTERVAL '90 days'
GROUP BY DATE(opening_timestamp)
ORDER BY date DESC;

-- Add CLV tracking to existing bet tables
ALTER TABLE reco_bet_legs 
ADD COLUMN IF NOT EXISTS clv_tracking_id INTEGER REFERENCES clv_bet_tracking(id);

-- Functions for CLV calculation and updates
CREATE OR REPLACE FUNCTION calculate_clv_metrics(
    opening_decimal DECIMAL, 
    closing_decimal DECIMAL
)
RETURNS TABLE(
    clv_decimal_result DECIMAL(10,4),
    clv_percent_result DECIMAL(7,3),
    cents_clv_result INTEGER
) AS $$
BEGIN
    RETURN QUERY SELECT 
        ROUND((closing_decimal - opening_decimal) / opening_decimal, 4) as clv_decimal_result,
        ROUND(((closing_decimal - opening_decimal) / opening_decimal) * 100, 3) as clv_percent_result,
        CASE 
            WHEN opening_decimal >= 2.0 AND closing_decimal >= 2.0 THEN
                -- Both positive American odds
                ROUND(((closing_decimal - 1) * 100) - ((opening_decimal - 1) * 100))::INTEGER
            WHEN opening_decimal < 2.0 AND closing_decimal < 2.0 THEN
                -- Both negative American odds  
                ROUND((100 / (opening_decimal - 1)) - (100 / (closing_decimal - 1)))::INTEGER
            ELSE
                -- Mixed positive/negative - calculate difference in American odds
                ROUND(
                    CASE WHEN closing_decimal >= 2.0 THEN (closing_decimal - 1) * 100 
                         ELSE -100 / (closing_decimal - 1) END -
                    CASE WHEN opening_decimal >= 2.0 THEN (opening_decimal - 1) * 100 
                         ELSE -100 / (opening_decimal - 1) END
                )::INTEGER
        END as cents_clv_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update closing lines and calculate CLV
CREATE OR REPLACE FUNCTION update_closing_line(
    tracking_id INTEGER,
    closing_decimal DECIMAL,
    closing_american VARCHAR(10),
    closing_book VARCHAR(50)
)
RETURNS void AS $$
DECLARE
    opening_decimal DECIMAL;
    clv_metrics RECORD;
BEGIN
    -- Get opening odds
    SELECT opening_odds_decimal INTO opening_decimal 
    FROM clv_bet_tracking 
    WHERE id = tracking_id;
    
    -- Calculate CLV metrics
    SELECT * INTO clv_metrics FROM calculate_clv_metrics(opening_decimal, closing_decimal);
    
    -- Update the tracking record
    UPDATE clv_bet_tracking SET
        closing_odds_decimal = closing_decimal,
        closing_odds_american = closing_american,
        closing_sportsbook = closing_book,
        closing_timestamp = NOW(),
        clv_decimal = clv_metrics.clv_decimal_result,
        clv_percent = clv_metrics.clv_percent_result,
        cents_clv = clv_metrics.cents_clv_result,
        closing_implied_prob = ROUND(1.0 / closing_decimal, 4),
        updated_at = NOW()
    WHERE id = tracking_id;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for CLV tables
ALTER TABLE clv_bet_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE clv_performance_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on clv_bet_tracking" ON clv_bet_tracking
    FOR SELECT USING (true);

CREATE POLICY "Public read access on clv_performance_summary" ON clv_performance_summary
    FOR SELECT USING (true);

-- Grant permissions for CLV views
GRANT SELECT ON v_clv_recent_performance TO anon;
GRANT SELECT ON v_clv_model_performance TO anon;
GRANT SELECT ON v_clv_recent_performance TO authenticated;
GRANT SELECT ON v_clv_model_performance TO authenticated;