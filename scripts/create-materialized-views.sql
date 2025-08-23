-- CREATE AND VERIFY MATERIALIZED VIEWS FOR SUPABASE PRO
-- Run this in your Supabase SQL editor or via psql

-- =============================================================================
-- 1. CURRENT BEST ODDS MATERIALIZED VIEW (REFRESH EVERY 5 MIN)
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS mv_current_best_odds;

-- Create optimized current best odds view
CREATE MATERIALIZED VIEW mv_current_best_odds AS
SELECT DISTINCT ON (o.game_id, o.market_id, o.outcome_name)
  o.game_id,
  o.market_id,
  o.outcome_name,
  o.book_id,
  o.odds_american,
  o.odds_decimal,
  o.ts,
  g.home_team,
  g.away_team,
  g.sport,
  g.commence_time,
  -- Calculate implied probability and EV hints
  CASE 
    WHEN o.odds_american > 0 THEN 100.0 / (o.odds_american + 100.0)
    ELSE ABS(o.odds_american) / (ABS(o.odds_american) + 100.0)
  END as implied_probability,
  -- Add market efficiency score
  COUNT(*) OVER (PARTITION BY o.game_id, o.market_id, o.outcome_name) as book_count
FROM odds_live o
JOIN games_metadata g ON o.game_id = g.game_id
WHERE o.ts > NOW() - INTERVAL '2 hours'
  AND g.commence_time > NOW() - INTERVAL '12 hours'  -- Only active/recent games
  AND o.ts = (
    -- Get latest odds for each book/market combination
    SELECT MAX(ts) 
    FROM odds_live o2 
    WHERE o2.game_id = o.game_id 
    AND o2.market_id = o.market_id 
    AND o2.book_id = o.book_id
    AND o2.outcome_name = o.outcome_name
  )
ORDER BY o.game_id, o.market_id, o.outcome_name, o.odds_decimal DESC;

-- Create indexes for fast lookups
CREATE UNIQUE INDEX idx_mv_current_best_odds_unique 
ON mv_current_best_odds (game_id, market_id, outcome_name, book_id);

CREATE INDEX idx_mv_current_best_odds_sport 
ON mv_current_best_odds (sport);

CREATE INDEX idx_mv_current_best_odds_commence 
ON mv_current_best_odds (commence_time);

-- =============================================================================
-- 2. LINE MOVEMENT ANALYSIS MATERIALIZED VIEW (REFRESH EVERY 15 MIN)
-- =============================================================================

-- Drop existing view if exists  
DROP MATERIALIZED VIEW IF EXISTS mv_line_movement;

-- Create line movement tracking view
CREATE MATERIALIZED VIEW mv_line_movement AS
SELECT 
  o.game_id,
  o.market_id,
  o.outcome_name,
  o.book_id,
  g.home_team,
  g.away_team,
  g.sport,
  -- Movement statistics
  COUNT(*) as movement_count,
  MIN(o.odds_decimal) as min_odds,
  MAX(o.odds_decimal) as max_odds,
  ROUND(AVG(o.odds_decimal), 3) as avg_odds,
  -- Opening vs current odds
  FIRST_VALUE(o.odds_decimal ORDER BY o.ts ASC) as opening_odds,
  FIRST_VALUE(o.odds_american ORDER BY o.ts ASC) as opening_american,
  LAST_VALUE(o.odds_decimal ORDER BY o.ts ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as current_odds,
  LAST_VALUE(o.odds_american ORDER BY o.ts ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as current_american,
  -- Calculate movement percentage
  ROUND(
    (LAST_VALUE(o.odds_decimal ORDER BY o.ts ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) - 
     FIRST_VALUE(o.odds_decimal ORDER BY o.ts ASC)) / 
    FIRST_VALUE(o.odds_decimal ORDER BY o.ts ASC) * 100, 2
  ) as movement_pct,
  -- Time tracking
  MIN(o.ts) as first_seen,
  MAX(o.ts) as last_update,
  EXTRACT(EPOCH FROM (MAX(o.ts) - MIN(o.ts))) / 3600.0 as hours_tracked,
  -- Movement velocity (% change per hour)
  CASE 
    WHEN EXTRACT(EPOCH FROM (MAX(o.ts) - MIN(o.ts))) > 0 THEN
      ROUND(
        (LAST_VALUE(o.odds_decimal ORDER BY o.ts ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) - 
         FIRST_VALUE(o.odds_decimal ORDER BY o.ts ASC)) / 
        FIRST_VALUE(o.odds_decimal ORDER BY o.ts ASC) * 100 / 
        (EXTRACT(EPOCH FROM (MAX(o.ts) - MIN(o.ts))) / 3600.0), 3
      )
    ELSE 0
  END as velocity_pct_per_hour
FROM odds_live o
JOIN games_metadata g ON o.game_id = g.game_id
WHERE o.ts > NOW() - INTERVAL '24 hours'
  AND g.commence_time > NOW() - INTERVAL '12 hours'
GROUP BY o.game_id, o.market_id, o.outcome_name, o.book_id, 
         g.home_team, g.away_team, g.sport
HAVING COUNT(*) > 1  -- Only include lines that have moved
ORDER BY ABS(movement_pct) DESC;

-- Create indexes for line movement queries
CREATE INDEX idx_mv_line_movement_game_market 
ON mv_line_movement (game_id, market_id);

CREATE INDEX idx_mv_line_movement_sport 
ON mv_line_movement (sport);

CREATE INDEX idx_mv_line_movement_movement 
ON mv_line_movement (movement_pct DESC);

CREATE INDEX idx_mv_line_movement_velocity 
ON mv_line_movement (velocity_pct_per_hour DESC);

-- =============================================================================
-- 3. PLAYER PROPS CURRENT BEST MATERIALIZED VIEW
-- =============================================================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS mv_current_best_props;

-- Create current best props view
CREATE MATERIALIZED VIEW mv_current_best_props AS
SELECT DISTINCT ON (p.game_id, p.player_name, p.prop_type)
  p.game_id,
  p.player_name,
  p.prop_type,
  p.book_id,
  p.line_value,
  p.over_odds,
  p.under_odds,
  p.ts,
  g.home_team,
  g.away_team,
  g.sport,
  g.commence_time,
  -- Calculate best over/under odds across books
  MAX(p.over_odds) OVER (PARTITION BY p.game_id, p.player_name, p.prop_type, p.line_value) as best_over_odds,
  MIN(p.under_odds) OVER (PARTITION BY p.game_id, p.player_name, p.prop_type, p.line_value) as best_under_odds,
  -- Count books offering this prop
  COUNT(*) OVER (PARTITION BY p.game_id, p.player_name, p.prop_type, p.line_value) as book_count
FROM props_live p
JOIN games_metadata g ON p.game_id = g.game_id
WHERE p.ts > NOW() - INTERVAL '2 hours'
  AND g.commence_time > NOW() - INTERVAL '12 hours'
  AND p.ts = (
    -- Get latest props for each book/player/prop combination
    SELECT MAX(ts) 
    FROM props_live p2 
    WHERE p2.game_id = p.game_id 
    AND p2.player_name = p.player_name 
    AND p2.prop_type = p.prop_type
    AND p2.book_id = p.book_id
  )
ORDER BY p.game_id, p.player_name, p.prop_type, p.ts DESC;

-- Create indexes for props view
CREATE UNIQUE INDEX idx_mv_current_best_props_unique 
ON mv_current_best_props (game_id, player_name, prop_type, book_id);

CREATE INDEX idx_mv_current_best_props_sport 
ON mv_current_best_props (sport);

CREATE INDEX idx_mv_current_best_props_player 
ON mv_current_best_props (player_name);

-- =============================================================================
-- 4. FUNCTIONS TO REFRESH VIEWS EFFICIENTLY
-- =============================================================================

-- Function to refresh a specific materialized view
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS TABLE (
  view_name_out TEXT,
  refresh_duration_ms INTEGER,
  row_count BIGINT,
  success BOOLEAN,
  error_message TEXT
) LANGUAGE plpgsql AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  row_count_val BIGINT;
  error_msg TEXT DEFAULT NULL;
BEGIN
  start_time := clock_timestamp();
  
  BEGIN
    -- Refresh the view
    EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', view_name);
    
    -- Get row count
    EXECUTE format('SELECT COUNT(*) FROM %I', view_name) INTO row_count_val;
    
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
      view_name,
      EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
      row_count_val,
      TRUE,
      error_msg;
      
  EXCEPTION WHEN OTHERS THEN
    end_time := clock_timestamp();
    error_msg := SQLERRM;
    
    RETURN QUERY SELECT 
      view_name,
      EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER,
      0::BIGINT,
      FALSE,
      error_msg;
  END;
END $$;

-- Function to refresh all views in sequence
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE (
  view_name TEXT,
  refresh_duration_ms INTEGER,
  row_count BIGINT,
  success BOOLEAN,
  error_message TEXT
) LANGUAGE plpgsql AS $$
BEGIN
  -- Refresh views in order of dependency
  RETURN QUERY SELECT * FROM refresh_materialized_view('mv_current_best_odds');
  RETURN QUERY SELECT * FROM refresh_materialized_view('mv_line_movement');
  RETURN QUERY SELECT * FROM refresh_materialized_view('mv_current_best_props');
END $$;

-- =============================================================================
-- 5. VERIFICATION QUERIES
-- =============================================================================

-- Check if views were created successfully
SELECT 
  schemaname,
  matviewname as view_name,
  hasindexes,
  ispopulated,
  definition
FROM pg_matviews 
WHERE matviewname IN ('mv_current_best_odds', 'mv_line_movement', 'mv_current_best_props')
ORDER BY matviewname;

-- Check view sizes and row counts
SELECT 
  schemaname||'.'||matviewname as view_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
  (SELECT COUNT(*) FROM pg_stat_user_tables WHERE relname = matviewname) as estimated_rows
FROM pg_matviews 
WHERE matviewname IN ('mv_current_best_odds', 'mv_line_movement', 'mv_current_best_props')
ORDER BY matviewname;

-- Test refresh function
SELECT * FROM refresh_all_materialized_views();

-- =============================================================================
-- SUMMARY
-- =============================================================================

-- The following materialized views have been created:
-- 
-- 1. mv_current_best_odds - Latest odds for all markets (refresh every 5 min)
-- 2. mv_line_movement - Line movement analysis with velocity tracking (refresh every 15 min)
-- 3. mv_current_best_props - Current best player prop odds (refresh every 5 min)
--
-- All views include:
-- - Proper indexing for fast lookups
-- - Game metadata joins
-- - Efficiency metrics (implied probability, book counts)
-- - Time-based filtering (only active games)
--
-- Use refresh_materialized_view('view_name') to manually refresh
-- Use refresh_all_materialized_views() to refresh all views
-- =============================================================================