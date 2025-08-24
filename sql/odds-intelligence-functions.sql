-- Odds Intelligence SQL Functions for Supabase
-- These functions support line movement analysis and CLV calculations

-- Function: get_moneyline_series
-- Returns time series data for moneyline charts
CREATE OR REPLACE FUNCTION get_moneyline_series(p_game_key TEXT)
RETURNS TABLE (
  game_key TEXT,
  commence_time TIMESTAMPTZ,
  book TEXT,
  outcome TEXT,
  odds_decimal DECIMAL,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.game_key,
    v.commence_time,
    v.sportsbook as book,
    v.outcome,
    v.odds_decimal,
    v.recorded_at
  FROM v_odds_clean v
  WHERE v.market = 'moneyline'
    AND v.game_key = p_game_key
    AND v.outcome IN ('home','away','draw')
  ORDER BY v.recorded_at, v.sportsbook, v.outcome;
END;
$$ LANGUAGE plpgsql;

-- Function: get_spread_series  
-- Returns time series data for spread charts
CREATE OR REPLACE FUNCTION get_spread_series(p_game_key TEXT)
RETURNS TABLE (
  game_key TEXT,
  commence_time TIMESTAMPTZ,
  book TEXT,
  outcome TEXT,
  handicap DECIMAL,
  odds_decimal DECIMAL,
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.game_key,
    v.commence_time,
    v.sportsbook as book,
    v.outcome,
    v.point as handicap,
    v.odds_decimal,
    v.recorded_at
  FROM v_odds_clean v
  WHERE v.market = 'spread'
    AND v.game_key = p_game_key
  ORDER BY v.recorded_at, v.sportsbook, v.outcome, v.point;
END;
$$ LANGUAGE plpgsql;

-- Function: get_movement_anchors
-- Returns open and T-60 anchor points for movement calculations
CREATE OR REPLACE FUNCTION get_movement_anchors(
  p_game_key TEXT,
  p_market TEXT, 
  p_book TEXT,
  p_outcome TEXT
)
RETURNS TABLE (
  open_odds DECIMAL,
  open_ts TIMESTAMPTZ,
  t60_odds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered_odds AS (
    SELECT 
      v.odds_decimal,
      v.recorded_at,
      v.commence_time,
      ROW_NUMBER() OVER (ORDER BY v.recorded_at ASC) as rn_asc
    FROM v_odds_clean v
    WHERE v.game_key = p_game_key
      AND v.market = p_market
      AND v.sportsbook = p_book
      AND v.outcome = p_outcome
  ),
  anchors AS (
    SELECT 
      (SELECT odds_decimal FROM ordered_odds WHERE rn_asc = 1) as open_odds,
      (SELECT recorded_at FROM ordered_odds WHERE rn_asc = 1) as open_ts,
      (
        SELECT o.odds_decimal 
        FROM ordered_odds o
        WHERE o.recorded_at <= o.commence_time - INTERVAL '60 minutes'
        ORDER BY o.recorded_at DESC 
        LIMIT 1
      ) as t60_odds
    FROM ordered_odds
    LIMIT 1
  )
  SELECT a.open_odds, a.open_ts, a.t60_odds
  FROM anchors a;
END;
$$ LANGUAGE plpgsql;

-- Function: calculate_velocity
-- Calculates line movement velocity over last 120 minutes
CREATE OR REPLACE FUNCTION calculate_velocity(
  p_game_key TEXT,
  p_market TEXT,
  p_book TEXT, 
  p_outcome TEXT
)
RETURNS TABLE (velocity_probpts_per_hour DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      REGR_SLOPE(
        (1.0 / v.odds_decimal),
        EXTRACT(EPOCH FROM v.recorded_at) / 3600.0
      ), 
      0
    )::DECIMAL as velocity_probpts_per_hour
  FROM v_odds_clean v
  WHERE v.game_key = p_game_key
    AND v.market = p_market
    AND v.sportsbook = p_book
    AND v.outcome = p_outcome
    AND v.recorded_at >= v.commence_time - INTERVAL '120 minutes'
    AND v.recorded_at <= v.commence_time - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function: get_favorite_pressure_data
-- Returns data needed for favorite pressure calculation
CREATE OR REPLACE FUNCTION get_favorite_pressure_data(p_game_key TEXT)
RETURNS TABLE (
  outcome TEXT,
  open_odds DECIMAL,
  close_odds DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH game_data AS (
    SELECT DISTINCT
      v.outcome,
      FIRST_VALUE(v.odds_decimal) OVER (
        PARTITION BY v.outcome ORDER BY v.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) as open_odds,
      c.closing_odds as close_odds
    FROM v_odds_clean v
    LEFT JOIN v_closing_odds c ON (
      c.game_key = v.game_key AND
      c.market = v.market AND
      c.sportsbook = v.sportsbook AND
      c.outcome = v.outcome
    )
    WHERE v.game_key = p_game_key
      AND v.market = 'moneyline'
      AND v.sportsbook = 'pinnacle'
      AND v.outcome IN ('home', 'away')
  )
  SELECT DISTINCT
    gd.outcome,
    gd.open_odds,
    gd.close_odds
  FROM game_data gd
  WHERE gd.close_odds IS NOT NULL
    AND gd.open_odds IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: get_current_sharp_price
-- Gets the most recent sharp book price for EV comparison
CREATE OR REPLACE FUNCTION get_current_sharp_price(
  p_game_key TEXT,
  p_market TEXT,
  p_outcome TEXT,
  p_book TEXT DEFAULT 'pinnacle'
)
RETURNS TABLE (current_odds DECIMAL, recorded_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.odds_decimal as current_odds,
    v.recorded_at
  FROM v_odds_clean v
  WHERE v.game_key = p_game_key
    AND v.market = p_market
    AND v.sportsbook = p_book
    AND v.outcome = p_outcome
  ORDER BY v.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: get_consensus_price
-- Gets consensus price across multiple sportsbooks
CREATE OR REPLACE FUNCTION get_consensus_price(
  p_game_key TEXT,
  p_market TEXT,
  p_outcome TEXT
)
RETURNS TABLE (consensus_odds DECIMAL, book_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH latest_odds AS (
    SELECT DISTINCT ON (v.sportsbook)
      v.sportsbook,
      v.odds_decimal,
      v.recorded_at
    FROM v_odds_clean v
    WHERE v.game_key = p_game_key
      AND v.market = p_market
      AND v.outcome = p_outcome
    ORDER BY v.sportsbook, v.recorded_at DESC
  )
  SELECT 
    AVG(lo.odds_decimal)::DECIMAL as consensus_odds,
    COUNT(*)::INTEGER as book_count
  FROM latest_odds lo;
END;
$$ LANGUAGE plpgsql;

-- Function: calculate_cross_book_divergence
-- Calculates divergence between sharp and soft books
CREATE OR REPLACE FUNCTION calculate_cross_book_divergence(
  p_game_key TEXT,
  p_market TEXT,
  p_outcome TEXT,
  p_sharp_book TEXT DEFAULT 'pinnacle',
  p_soft_book TEXT DEFAULT 'draftkings'
)
RETURNS TABLE (
  sharp_prob DECIMAL,
  soft_prob DECIMAL,
  divergence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH book_prices AS (
    SELECT 
      v.sportsbook,
      v.odds_decimal,
      (1.0 / v.odds_decimal) as implied_prob
    FROM v_odds_clean v
    WHERE v.game_key = p_game_key
      AND v.market = p_market
      AND v.outcome = p_outcome
      AND v.sportsbook IN (p_sharp_book, p_soft_book)
    ORDER BY v.recorded_at DESC
    LIMIT 2
  )
  SELECT 
    (SELECT implied_prob FROM book_prices WHERE sportsbook = p_sharp_book) as sharp_prob,
    (SELECT implied_prob FROM book_prices WHERE sportsbook = p_soft_book) as soft_prob,
    (SELECT implied_prob FROM book_prices WHERE sportsbook = p_sharp_book) - 
    (SELECT implied_prob FROM book_prices WHERE sportsbook = p_soft_book) as divergence;
END;
$$ LANGUAGE plpgsql;

-- Function: get_line_movement_summary
-- Returns comprehensive line movement summary for a game
CREATE OR REPLACE FUNCTION get_line_movement_summary(
  p_game_key TEXT,
  p_market TEXT DEFAULT 'moneyline'
)
RETURNS TABLE (
  outcome TEXT,
  open_odds DECIMAL,
  current_odds DECIMAL,
  closing_odds DECIMAL,
  drift_open DECIMAL,
  drift_current DECIMAL,
  movement_direction TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH movement_data AS (
    SELECT 
      v.outcome,
      FIRST_VALUE(v.odds_decimal) OVER (
        PARTITION BY v.outcome ORDER BY v.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) as open_odds,
      LAST_VALUE(v.odds_decimal) OVER (
        PARTITION BY v.outcome ORDER BY v.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      ) as current_odds,
      c.closing_odds,
      (1.0 / FIRST_VALUE(v.odds_decimal) OVER (
        PARTITION BY v.outcome ORDER BY v.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      )) as p_open,
      (1.0 / LAST_VALUE(v.odds_decimal) OVER (
        PARTITION BY v.outcome ORDER BY v.recorded_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
      )) as p_current,
      (1.0 / c.closing_odds) as p_close
    FROM v_odds_clean v
    LEFT JOIN v_closing_odds c ON (
      c.game_key = v.game_key AND
      c.market = v.market AND
      c.outcome = v.outcome AND
      c.sportsbook = 'pinnacle'
    )
    WHERE v.game_key = p_game_key
      AND v.market = p_market
      AND v.sportsbook = 'pinnacle'
  ),
  summary AS (
    SELECT DISTINCT
      md.outcome,
      md.open_odds,
      md.current_odds,
      md.closing_odds,
      (COALESCE(md.p_close, md.p_current) - md.p_open) as drift_open,
      (md.p_current - md.p_open) as drift_current,
      CASE 
        WHEN (COALESCE(md.p_close, md.p_current) - md.p_open) > 0.01 THEN 'toward'
        WHEN (COALESCE(md.p_close, md.p_current) - md.p_open) < -0.01 THEN 'away'
        ELSE 'stable'
      END as movement_direction
    FROM movement_data md
  )
  SELECT 
    s.outcome,
    s.open_odds,
    s.current_odds,
    s.closing_odds,
    s.drift_open,
    s.drift_current,
    s.movement_direction
  FROM summary s;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_moneyline_series(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_spread_series(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_movement_anchors(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION calculate_velocity(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_favorite_pressure_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_current_sharp_price(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_consensus_price(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION calculate_cross_book_divergence(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_line_movement_summary(TEXT, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION get_moneyline_series(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_spread_series(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_movement_anchors(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_velocity(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_favorite_pressure_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_sharp_price(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_consensus_price(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_cross_book_divergence(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_line_movement_summary(TEXT, TEXT) TO authenticated;