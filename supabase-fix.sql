-- Fix for existing Supabase tables
-- Copy and paste this into Supabase SQL Editor

-- Add missing column to reco_bet_legs table
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS reco_bet_id INTEGER;

-- Add missing columns to reco_bets if they don't exist
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS bet_type VARCHAR(20);
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS combined_odds VARCHAR(10);
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS edge_percentage DECIMAL(5,2);
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS estimated_payout DECIMAL(10,2);
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE reco_bets ADD COLUMN IF NOT EXISTS actual_payout DECIMAL(10,2);

-- Add missing columns to reco_bet_legs if they don't exist
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS sport VARCHAR(50);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS home_team VARCHAR(100);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS away_team VARCHAR(100);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS commence_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS market_type VARCHAR(50);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS selection VARCHAR(200);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS best_sportsbook VARCHAR(50);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS best_odds VARCHAR(10);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS edge_percentage DECIMAL(5,2);
ALTER TABLE reco_bet_legs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create foreign key relationship
ALTER TABLE reco_bet_legs 
ADD CONSTRAINT fk_reco_bet_legs_reco_bet 
FOREIGN KEY (reco_bet_id) REFERENCES reco_bets(id) ON DELETE CASCADE;

-- Update existing data to populate new columns from old ones where possible
UPDATE reco_bet_legs SET 
    sport = league,
    market_type = market,
    selection = selection,
    best_odds = odds_american
WHERE sport IS NULL;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_reco_bet_id ON reco_bet_legs(reco_bet_id);

-- Grant permissions for the missing tables/columns
GRANT SELECT ON reco_bet_legs TO anon;
GRANT SELECT ON reco_bet_legs TO authenticated;