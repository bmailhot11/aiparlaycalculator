-- =====================================================
-- Safe Supabase Migration (No Dollar Signs)
-- =====================================================

-- Add new columns to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bankroll_data JSONB DEFAULT '{"current": 1000, "deposits": [], "withdrawals": [], "history": []}',
ADD COLUMN IF NOT EXISTS betting_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS analytics_cache JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dashboard_settings JSONB DEFAULT '{"autoLogBets": false, "notifications": true, "publicProfile": false}',
ADD COLUMN IF NOT EXISTS last_ai_report JSONB,
ADD COLUMN IF NOT EXISTS last_ai_report_generated_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_last_ai_report_idx ON user_profiles(last_ai_report_generated_at);

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up any existing storage policies
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;

-- Create storage policies (run these separately if needed)
CREATE POLICY "Users can upload their own profile image" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile image" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile image" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  result JSON;
  betting_data JSONB;
  bankroll_data JSONB;
BEGIN
  SELECT betting_history, bankroll_data 
  INTO betting_data, bankroll_data
  FROM user_profiles 
  WHERE user_id = p_user_id;

  IF betting_data IS NULL THEN
    betting_data := ''[]''::jsonb;
  END IF;

  IF bankroll_data IS NULL THEN
    bankroll_data := ''{"current": 1000, "deposits": [], "withdrawals": [], "history": []}''::jsonb;
  END IF;

  -- Calculate stats from betting history
  WITH bet_stats AS (
    SELECT 
      jsonb_array_length(betting_data) as total_bets,
      COALESCE(
        (SELECT SUM((bet->>''profit'')::decimal) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>''result'' != ''pending''), 
        0
      ) as total_profit,
      COALESCE(
        (SELECT SUM((bet->>''stake'')::decimal) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>''result'' != ''pending''), 
        1
      ) as total_staked,
      COALESCE(
        (SELECT COUNT(*) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>''result'' = ''won''), 
        0
      ) as total_wins,
      COALESCE(
        (SELECT COUNT(*) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>''result'' != ''pending''), 
        1
      ) as settled_bets
  )
  SELECT json_build_object(
    ''totalBets'', total_bets,
    ''totalProfit'', total_profit,
    ''totalStaked'', total_staked,
    ''winRate'', CASE WHEN settled_bets > 0 THEN (total_wins::decimal / settled_bets * 100) ELSE 0 END,
    ''roi'', CASE WHEN total_staked > 0 THEN (total_profit / total_staked * 100) ELSE 0 END,
    ''currentBankroll'', (bankroll_data->>''current'')::decimal
  ) INTO result FROM bet_stats;

  RETURN result;
END;
';

-- Helper function to add bet to history
CREATE OR REPLACE FUNCTION add_bet_to_history(
  p_user_id UUID,
  p_bet_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS '
BEGIN
  UPDATE user_profiles 
  SET 
    betting_history = COALESCE(betting_history, ''[]''::jsonb) || jsonb_build_array(p_bet_data),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
';