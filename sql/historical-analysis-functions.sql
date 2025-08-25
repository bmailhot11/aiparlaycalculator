-- Historical Analysis SQL Functions for Betting Edge Detection
-- These functions identify profitable patterns from historical betting data

-- Function: analyze_underdog_performance
-- Returns teams that consistently outperform as underdogs
CREATE OR REPLACE FUNCTION analyze_underdog_performance(
  p_sport TEXT,
  p_days_back INTEGER DEFAULT 365
)
RETURNS TABLE (
  team_name TEXT,
  underdog_games INTEGER,
  wins INTEGER,
  win_percentage DECIMAL,
  avg_underdog_odds DECIMAL,
  total_roi DECIMAL,
  roi_percentage DECIMAL,
  avg_line_move DECIMAL,
  sample_quality DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH underdog_results AS (
    SELECT 
      rb.home_team as team,
      COUNT(*) as games,
      SUM(CASE WHEN rb.result = 'win' THEN 1 ELSE 0 END) as wins,
      AVG(rb.decimal_odds) as avg_odds,
      -- Calculate ROI: (Total Payout - Total Stakes) / Total Stakes
      (SUM(CASE WHEN rb.result = 'win' THEN rb.decimal_odds ELSE 0 END) - COUNT(*)) / COUNT(*) as roi,
      AVG(CASE WHEN od.closing_odds IS NOT NULL 
          THEN (od.closing_odds - rb.decimal_odds) / rb.decimal_odds 
          ELSE 0 END) as avg_line_movement
    FROM reco_bet_legs rb
    LEFT JOIN odds_data od ON rb.game_id = od.game_key 
      AND rb.market_type = od.market 
      AND rb.selection = od.outcome
    WHERE rb.sport = p_sport
      AND rb.decimal_odds > 2.0  -- Only underdogs (implied prob < 50%)
      AND rb.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND rb.result IN ('win', 'loss')  -- Exclude pending/void
    GROUP BY rb.home_team
    
    UNION ALL
    
    SELECT 
      rb.away_team as team,
      COUNT(*) as games,
      SUM(CASE WHEN rb.result = 'win' THEN 1 ELSE 0 END) as wins,
      AVG(rb.decimal_odds) as avg_odds,
      (SUM(CASE WHEN rb.result = 'win' THEN rb.decimal_odds ELSE 0 END) - COUNT(*)) / COUNT(*) as roi,
      AVG(CASE WHEN od.closing_odds IS NOT NULL 
          THEN (od.closing_odds - rb.decimal_odds) / rb.decimal_odds 
          ELSE 0 END) as avg_line_movement
    FROM reco_bet_legs rb
    LEFT JOIN odds_data od ON rb.game_id = od.game_key
    WHERE rb.sport = p_sport
      AND rb.decimal_odds > 2.0
      AND rb.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
      AND rb.result IN ('win', 'loss')
    GROUP BY rb.away_team
  ),
  team_totals AS (
    SELECT 
      team,
      SUM(games) as total_games,
      SUM(wins) as total_wins,
      AVG(avg_odds) as weighted_avg_odds,
      AVG(roi) as avg_roi,
      AVG(avg_line_movement) as avg_movement
    FROM underdog_results
    GROUP BY team
    HAVING SUM(games) >= 5  -- Minimum 5 underdog games for statistical significance
  )
  SELECT 
    tt.team,
    tt.total_games::INTEGER,
    tt.total_wins::INTEGER,
    (tt.total_wins::DECIMAL / tt.total_games * 100) as win_pct,
    tt.weighted_avg_odds,
    tt.avg_roi * 100 as total_roi,
    tt.avg_roi * 100 as roi_pct,
    tt.avg_movement,
    -- Quality score based on sample size and consistency
    LEAST(tt.total_games / 20.0, 1.0) * 
    (1.0 - ABS(tt.avg_roi - 0.1)) as quality_score
  FROM team_totals tt
  WHERE tt.avg_roi > -0.15  -- Filter out teams with terrible performance
  ORDER BY tt.avg_roi DESC, tt.total_games DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: analyze_situational_performance  
-- Returns performance in specific betting situations
CREATE OR REPLACE FUNCTION analyze_situational_performance(
  p_sport TEXT,
  p_situation TEXT,
  p_days_back INTEGER DEFAULT 180
)
RETURNS TABLE (
  situation_type TEXT,
  total_bets INTEGER,
  wins INTEGER,
  win_rate DECIMAL,
  avg_odds DECIMAL,
  roi_percentage DECIMAL,
  confidence_score DECIMAL
) AS $$
DECLARE
  sql_query TEXT;
BEGIN
  -- Build dynamic query based on situation
  sql_query := FORMAT('
    SELECT 
      %L as situation_type,
      COUNT(*)::INTEGER as total_bets,
      SUM(CASE WHEN result = ''win'' THEN 1 ELSE 0 END)::INTEGER as wins,
      AVG(CASE WHEN result = ''win'' THEN 1.0 ELSE 0.0 END) * 100 as win_rate,
      AVG(decimal_odds) as avg_odds,
      ((SUM(CASE WHEN result = ''win'' THEN decimal_odds ELSE 0 END) - COUNT(*)) / COUNT(*)) * 100 as roi_pct,
      LEAST(COUNT(*) / 15.0, 1.0) as confidence
    FROM reco_bet_legs rb
    LEFT JOIN game_situations gs ON rb.game_id = gs.game_key
    WHERE rb.sport = %L
      AND rb.created_at >= NOW() - INTERVAL ''%s days''
      AND rb.result IN (''win'', ''loss'')
      AND (%s)
  ', p_situation, p_sport, p_days_back, p_situation);

  RETURN QUERY EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql;

-- Function: get_team_recent_performance
-- Get recent performance metrics for a specific team
CREATE OR REPLACE FUNCTION get_team_recent_performance(
  p_team TEXT,
  p_sport TEXT,
  p_games_back INTEGER DEFAULT 10
)
RETURNS TABLE (
  team_name TEXT,
  recent_games INTEGER,
  wins INTEGER,
  losses INTEGER,
  pushes INTEGER,
  win_percentage DECIMAL,
  avg_line_move DECIMAL,
  cover_rate_spread DECIMAL,
  over_rate_totals DECIMAL,
  momentum_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_performance AS (
    SELECT 
      rb.result,
      rb.market_type,
      rb.decimal_odds,
      rb.created_at,
      CASE WHEN od.closing_odds IS NOT NULL 
           THEN (od.closing_odds - rb.decimal_odds) / rb.decimal_odds 
           ELSE 0 END as line_movement,
      ROW_NUMBER() OVER (ORDER BY rb.created_at DESC) as game_rank
    FROM reco_bet_legs rb
    LEFT JOIN odds_data od ON rb.game_id = od.game_key
    WHERE (rb.home_team = p_team OR rb.away_team = p_team)
      AND rb.sport = p_sport
      AND rb.result IN ('win', 'loss', 'push')
    ORDER BY rb.created_at DESC
    LIMIT p_games_back
  )
  SELECT 
    p_team,
    COUNT(*)::INTEGER,
    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END)::INTEGER,
    SUM(CASE WHEN result = 'push' THEN 1 ELSE 0 END)::INTEGER,
    AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) * 100,
    AVG(line_movement),
    AVG(CASE WHEN market_type = 'spreads' AND result = 'win' THEN 1.0 ELSE 0.0 END) * 100,
    AVG(CASE WHEN market_type = 'totals' AND result = 'win' AND decimal_odds > 1.9 THEN 1.0 ELSE 0.0 END) * 100,
    -- Momentum score: weight recent games more heavily
    SUM(CASE WHEN result = 'win' THEN (p_games_back - game_rank + 1) ELSE 0 END) / 
    SUM(p_games_back - game_rank + 1) * 100
  FROM recent_performance;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_team_performance 
  ON reco_bet_legs(sport, home_team, away_team, decimal_odds, result, created_at);

CREATE INDEX IF NOT EXISTS idx_odds_data_game_market 
  ON odds_data(game_key, market, outcome, closing_odds) 
  WHERE closing_odds IS NOT NULL;