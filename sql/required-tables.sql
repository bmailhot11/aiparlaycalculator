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