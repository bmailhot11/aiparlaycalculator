-- Create missing tables for the tracking system

-- 1. Create reco_settlements table
CREATE TABLE IF NOT EXISTS public.reco_settlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reco_bet_leg_id UUID REFERENCES public.reco_bet_legs(id) ON DELETE CASCADE,
    home_score INTEGER,
    away_score INTEGER,
    total_score INTEGER,
    game_status TEXT,
    settlement_logic TEXT,
    settled_by TEXT DEFAULT 'auto',
    settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create reco_daily_kpis table
CREATE TABLE IF NOT EXISTS public.reco_daily_kpis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kpi_date DATE NOT NULL UNIQUE,
    single_pnl DECIMAL(10,2) DEFAULT 0,
    parlay_2_pnl DECIMAL(10,2) DEFAULT 0,
    parlay_4_pnl DECIMAL(10,2) DEFAULT 0,
    total_daily_pnl DECIMAL(10,2) DEFAULT 0,
    total_bets_placed INTEGER DEFAULT 0,
    total_bets_won INTEGER DEFAULT 0,
    total_bets_lost INTEGER DEFAULT 0,
    total_bets_pushed INTEGER DEFAULT 0,
    total_bets_voided INTEGER DEFAULT 0,
    cumulative_pnl DECIMAL(10,2) DEFAULT 0,
    total_roi_percentage DECIMAL(5,2) DEFAULT 0,
    hit_rate_percentage DECIMAL(5,2) DEFAULT 0,
    clv_beat_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reco_settlements_leg_id ON public.reco_settlements(reco_bet_leg_id);
CREATE INDEX IF NOT EXISTS idx_reco_daily_kpis_date ON public.reco_daily_kpis(kpi_date);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_bet_id ON public.reco_bet_legs(reco_bet_id);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_result ON public.reco_bet_legs(result);
CREATE INDEX IF NOT EXISTS idx_reco_bet_legs_commence_time ON public.reco_bet_legs(commence_time);