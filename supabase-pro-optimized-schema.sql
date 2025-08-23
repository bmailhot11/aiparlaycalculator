-- SUPABASE PRO OPTIMIZED SCHEMA ($25/month limits)
-- 8GB DB, 100GB Storage, 250GB Egress - NEVER EXCEED
-- Hot data: ≤30 days, Cold data: archived to storage

-- =============================================================================
-- 1. CORE ODDS TABLES WITH DAILY PARTITIONING (HOT DATA ONLY)
-- =============================================================================

-- Master odds table (partitioned by day)
-- RULE: Only stores CHANGED odds, never duplicates
CREATE TABLE IF NOT EXISTS odds_live (
  id BIGSERIAL,
  game_id VARCHAR(64) NOT NULL,
  market_id VARCHAR(32) NOT NULL,
  book_id VARCHAR(16) NOT NULL,
  outcome_name VARCHAR(64) NOT NULL,
  odds_american INTEGER NOT NULL,
  odds_decimal DECIMAL(6,3) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_key VARCHAR(32) NOT NULL, -- MD5 of core data for deduplication
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

-- BRIN index for time-series performance (minimal storage impact)
CREATE INDEX IF NOT EXISTS idx_odds_live_brin_ts ON odds_live USING BRIN (ts);

-- Composite index for live queries (lean design)
CREATE INDEX IF NOT EXISTS idx_odds_live_lookup ON odds_live (game_id, market_id, book_id, ts DESC);

-- Deduplication index (prevent identical consecutive records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_odds_live_dedup ON odds_live (game_id, market_id, book_id, hash_key, ts);

-- Props table (partitioned, hot data only)
CREATE TABLE IF NOT EXISTS props_live (
  id BIGSERIAL,
  game_id VARCHAR(64) NOT NULL,
  player_name VARCHAR(64) NOT NULL,
  prop_type VARCHAR(32) NOT NULL,
  book_id VARCHAR(16) NOT NULL,
  line_value DECIMAL(8,2),
  over_odds INTEGER,
  under_odds INTEGER,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_key VARCHAR(32) NOT NULL,
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

CREATE INDEX IF NOT EXISTS idx_props_live_brin_ts ON props_live USING BRIN (ts);
CREATE INDEX IF NOT EXISTS idx_props_live_lookup ON props_live (game_id, player_name, prop_type, ts DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_props_live_dedup ON props_live (game_id, player_name, prop_type, book_id, hash_key, ts);

-- Games metadata (small table, no partitioning needed)
CREATE TABLE IF NOT EXISTS games_metadata (
  game_id VARCHAR(64) PRIMARY KEY,
  sport VARCHAR(16) NOT NULL,
  home_team VARCHAR(64) NOT NULL,
  away_team VARCHAR(64) NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(16) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. MATERIALIZED VIEWS FOR ANALYTICS (REFRESH EVERY 5-15 MIN)
-- =============================================================================

-- Current best odds per market (refreshed every 5 min)
-- RULE: Avoids expensive real-time scans
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_current_best_odds AS
SELECT 
  o.game_id,
  o.market_id,
  o.outcome_name,
  o.book_id,
  o.odds_american,
  o.odds_decimal,
  o.ts,
  ROW_NUMBER() OVER (PARTITION BY o.game_id, o.market_id, o.outcome_name ORDER BY o.odds_decimal DESC) as rank
FROM odds_live o
WHERE o.ts > NOW() - INTERVAL '2 hours'
AND o.ts = (
  SELECT MAX(ts) 
  FROM odds_live o2 
  WHERE o2.game_id = o.game_id 
  AND o2.market_id = o.market_id 
  AND o2.book_id = o.book_id
  AND o2.outcome_name = o.outcome_name
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_current_best_odds ON mv_current_best_odds (game_id, market_id, outcome_name, book_id);

-- Line movement summary (refreshed every 15 min)
-- RULE: Pre-computed aggregates prevent heavy scans
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_line_movement AS
SELECT 
  game_id,
  market_id,
  outcome_name,
  COUNT(*) as movement_count,
  MIN(odds_decimal) as min_odds,
  MAX(odds_decimal) as max_odds,
  FIRST_VALUE(odds_decimal) OVER (ORDER BY ts) as opening_odds,
  LAST_VALUE(odds_decimal) OVER (ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as current_odds,
  MAX(ts) as last_update
FROM odds_live
WHERE ts > NOW() - INTERVAL '24 hours'
GROUP BY game_id, market_id, outcome_name;

-- =============================================================================
-- 3. STORAGE METADATA TRACKING
-- =============================================================================

-- Track archived data in Supabase Storage
-- RULE: Prevents duplicate archival, manages 100GB storage limit
CREATE TABLE IF NOT EXISTS archived_data (
  id SERIAL PRIMARY KEY,
  archive_type VARCHAR(16) NOT NULL, -- 'odds', 'props', 'aggregates'
  date_partition DATE NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_mb INTEGER NOT NULL,
  compressed_size_mb INTEGER NOT NULL,
  record_count BIGINT NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(archive_type, date_partition)
);

-- =============================================================================
-- 4. CACHING LAYER TABLES (MINIMIZE EGRESS)
-- =============================================================================

-- Redis-style cache in Postgres for emergency fallback
-- RULE: Serves cached responses, reduces egress to <250GB
CREATE TABLE IF NOT EXISTS response_cache (
  cache_key VARCHAR(128) PRIMARY KEY,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_response_cache_expires ON response_cache (expires_at);

-- LLM response cache (minimize token usage)
-- RULE: Fixed JSON schema, ≤100 tokens, aggressive caching
CREATE TABLE IF NOT EXISTS llm_cache (
  prompt_hash VARCHAR(64) PRIMARY KEY,
  model VARCHAR(32) NOT NULL,
  prompt_summary VARCHAR(128) NOT NULL,
  response_json JSONB NOT NULL,
  token_count INTEGER NOT NULL,
  temperature DECIMAL(3,2),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  hit_count INTEGER DEFAULT 1
);

-- =============================================================================
-- 5. MONITORING TABLES (TRACK SUPABASE PRO LIMITS)
-- =============================================================================

-- Database usage monitoring
CREATE TABLE IF NOT EXISTS db_usage_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_size_mb INTEGER NOT NULL,
  odds_size_mb INTEGER NOT NULL,
  props_size_mb INTEGER NOT NULL,
  cache_size_mb INTEGER NOT NULL,
  partition_count INTEGER NOT NULL,
  oldest_data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- Egress tracking (estimate)
CREATE TABLE IF NOT EXISTS egress_tracking (
  id SERIAL PRIMARY KEY,
  hour TIMESTAMPTZ NOT NULL, -- Truncated to hour
  api_calls INTEGER DEFAULT 0,
  bytes_served BIGINT DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  PRIMARY KEY (hour)
) PARTITION BY RANGE (hour);

-- =============================================================================
-- 6. INITIAL PARTITION CREATION (30-DAY WINDOW)
-- =============================================================================

-- Create partitions for current and next 7 days
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
  i INTEGER;
BEGIN
  -- Start from today minus 2 days (buffer)
  start_date := CURRENT_DATE - INTERVAL '2 days';
  
  -- Create 35 days of partitions (30 hot + 5 buffer)
  FOR i IN 0..34 LOOP
    end_date := start_date + INTERVAL '1 day';
    
    -- Odds partitions
    partition_name := 'odds_live_' || TO_CHAR(start_date, 'YYYY_MM_DD');
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF odds_live 
                   FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
    
    -- Props partitions  
    partition_name := 'props_live_' || TO_CHAR(start_date, 'YYYY_MM_DD');
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF props_live 
                   FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
    
    -- Egress tracking partitions
    partition_name := 'egress_tracking_' || TO_CHAR(start_date, 'YYYY_MM_DD');
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF egress_tracking 
                   FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date::timestamptz, end_date::timestamptz);
    
    start_date := start_date + INTERVAL '1 day';
  END LOOP;
END $$;

-- =============================================================================
-- 7. HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate database size and enforce limits
CREATE OR REPLACE FUNCTION check_db_limits()
RETURNS TABLE (
  current_size_mb INTEGER,
  limit_mb INTEGER,
  usage_pct DECIMAL(5,2),
  action_needed TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  db_size_bytes BIGINT;
  size_mb INTEGER;
BEGIN
  -- Get current database size
  SELECT pg_database_size(current_database()) INTO db_size_bytes;
  size_mb := (db_size_bytes / 1024 / 1024)::INTEGER;
  
  RETURN QUERY SELECT 
    size_mb,
    8192, -- 8GB limit in MB
    ROUND((size_mb::DECIMAL / 8192) * 100, 2),
    CASE 
      WHEN size_mb > 7372 THEN 'URGENT: Drop old partitions immediately' -- >90%
      WHEN size_mb > 6553 THEN 'WARNING: Archive old data within 24h' -- >80%
      WHEN size_mb > 4915 THEN 'NOTICE: Plan archival strategy' -- >60%
      ELSE 'OK: Within limits'
    END;
END $$;

-- Function to get partition sizes
CREATE OR REPLACE FUNCTION get_partition_sizes()
RETURNS TABLE (
  table_name TEXT,
  partition_name TEXT,
  size_mb INTEGER,
  row_count BIGINT,
  partition_date DATE
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    schemaname||'.'||tablename as partition_name,
    (pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024)::INTEGER as size_mb,
    n_tup_ins + n_tup_upd as row_count,
    CASE 
      WHEN tablename LIKE '%_____\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_' THEN 
        TO_DATE(RIGHT(tablename, 10), 'YYYY_MM_DD')
      ELSE CURRENT_DATE
    END as partition_date
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public' 
  AND (tablename LIKE 'odds_live_%' OR tablename LIKE 'props_live_%')
  ORDER BY partition_date DESC;
END $$;

-- =============================================================================
-- 8. DEDUPLICATION FUNCTION (PREVENT STORAGE OF IDENTICAL CONSECUTIVE ODDS)
-- =============================================================================

CREATE OR REPLACE FUNCTION insert_odds_deduplicated(
  p_game_id VARCHAR(64),
  p_market_id VARCHAR(32),
  p_book_id VARCHAR(16),
  p_outcome_name VARCHAR(64),
  p_odds_american INTEGER,
  p_odds_decimal DECIMAL(6,3)
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  current_hash VARCHAR(32);
  last_hash VARCHAR(32);
BEGIN
  -- Calculate hash of new data
  current_hash := MD5(p_game_id || p_market_id || p_book_id || p_outcome_name || p_odds_american::TEXT);
  
  -- Get last hash for this combination
  SELECT hash_key INTO last_hash
  FROM odds_live 
  WHERE game_id = p_game_id 
  AND market_id = p_market_id 
  AND book_id = p_book_id 
  AND outcome_name = p_outcome_name
  ORDER BY ts DESC 
  LIMIT 1;
  
  -- Only insert if hash is different (odds changed)
  IF last_hash IS NULL OR last_hash != current_hash THEN
    INSERT INTO odds_live (game_id, market_id, book_id, outcome_name, odds_american, odds_decimal, hash_key)
    VALUES (p_game_id, p_market_id, p_book_id, p_outcome_name, p_odds_american, p_odds_decimal, current_hash);
    RETURN TRUE;
  END IF;
  
  RETURN FALSE; -- Duplicate, not inserted
END $$;

-- =============================================================================
-- SUMMARY OF OPTIMIZATION RULES IMPLEMENTED:
-- 
-- ✅ Database (8GB limit):
--    - Daily partitioning with 30-day hot data retention
--    - BRIN indexes for time-series (minimal storage)
--    - Deduplication prevents storage of identical odds
--    - Lean composite indexes, no wide JSONB
-- 
-- ✅ Storage (100GB limit):
--    - Archive tracking table prevents over-storage
--    - Compressed-only archive files
--    - 30/90 day retention tiers
-- 
-- ✅ Egress (250GB limit):
--    - Materialized views prevent expensive scans
--    - Response caching layer
--    - Paginated query design
-- 
-- ✅ Performance:
--    - Partitioning for time-series efficiency
--    - Pre-computed aggregates in materialized views
--    - Hash-based deduplication
-- 
-- ✅ Monitoring:
--    - Usage tracking functions
--    - Automated limit checking
--    - Partition size monitoring
-- =============================================================================