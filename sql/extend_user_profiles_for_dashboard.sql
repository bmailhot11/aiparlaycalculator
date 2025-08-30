-- =====================================================
-- Extend existing user_profiles table for dashboard features
-- This adds columns for betting data, bankroll, and AI reports
-- WITHOUT breaking existing functionality
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

-- Update the existing trigger to handle new dashboard users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id, 
    email, 
    display_name, 
    first_name, 
    last_name, 
    avatar_url, 
    provider,
    bio,
    profile_image_url,
    bankroll_data,
    betting_history,
    analytics_cache,
    dashboard_settings
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.app_metadata->>'provider', 'email'),
    '', -- bio starts empty
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), -- use OAuth avatar as profile image
    '{"current": 1000, "deposits": [], "withdrawals": [], "history": []}', -- default bankroll
    '[]', -- empty betting history
    '{}', -- empty analytics cache
    '{"autoLogBets": false, "notifications": true, "publicProfile": false}' -- default settings
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    profile_image_url = COALESCE(user_profiles.profile_image_url, EXCLUDED.avatar_url),
    last_sign_in = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;
  
  -- Create new policies
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
END $$;

-- Add indexes for the new columns for better performance
CREATE INDEX IF NOT EXISTS user_profiles_last_ai_report_idx ON user_profiles(last_ai_report_generated_at);

-- Add helpful functions for dashboard operations

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
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
    betting_data := '[]'::jsonb;
  END IF;

  IF bankroll_data IS NULL THEN
    bankroll_data := '{"current": 1000, "deposits": [], "withdrawals": [], "history": []}'::jsonb;
  END IF;

  -- Calculate stats from betting history
  WITH bet_stats AS (
    SELECT 
      jsonb_array_length(betting_data) as total_bets,
      COALESCE(
        (SELECT SUM((bet->>'profit')::decimal) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>'result' != 'pending'), 
        0
      ) as total_profit,
      COALESCE(
        (SELECT SUM((bet->>'stake')::decimal) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>'result' != 'pending'), 
        1
      ) as total_staked,
      COALESCE(
        (SELECT COUNT(*) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>'result' = 'won'), 
        0
      ) as total_wins,
      COALESCE(
        (SELECT COUNT(*) 
         FROM jsonb_array_elements(betting_data) AS bet 
         WHERE bet->>'result' != 'pending'), 
        1
      ) as settled_bets
  )
  SELECT json_build_object(
    'totalBets', total_bets,
    'totalProfit', total_profit,
    'totalStaked', total_staked,
    'winRate', CASE WHEN settled_bets > 0 THEN (total_wins::decimal / settled_bets * 100) ELSE 0 END,
    'roi', CASE WHEN total_staked > 0 THEN (total_profit / total_staked * 100) ELSE 0 END,
    'currentBankroll', (bankroll_data->>'current')::decimal
  ) INTO result FROM bet_stats;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a bet to user's history
CREATE OR REPLACE FUNCTION add_bet_to_history(
  p_user_id UUID,
  p_bet_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    betting_history = COALESCE(betting_history, '[]'::jsonb) || jsonb_build_array(p_bet_data),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bankroll
CREATE OR REPLACE FUNCTION update_user_bankroll(
  p_user_id UUID,
  p_transaction JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  current_bankroll JSONB;
  new_balance DECIMAL;
  transaction_type TEXT;
BEGIN
  SELECT bankroll_data INTO current_bankroll 
  FROM user_profiles 
  WHERE user_id = p_user_id;

  transaction_type := p_transaction->>'type';
  
  IF transaction_type = 'deposit' THEN
    new_balance := (current_bankroll->>'current')::decimal + (p_transaction->>'amount')::decimal;
  ELSE
    new_balance := (current_bankroll->>'current')::decimal - (p_transaction->>'amount')::decimal;
  END IF;

  UPDATE user_profiles 
  SET 
    bankroll_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          current_bankroll,
          '{current}', 
          to_jsonb(new_balance)
        ),
        CASE WHEN transaction_type = 'deposit' THEN '{deposits}' ELSE '{withdrawals}' END,
        (current_bankroll -> CASE WHEN transaction_type = 'deposit' THEN 'deposits' ELSE 'withdrawals' END) || jsonb_build_array(p_transaction)
      ),
      '{history}',
      (current_bankroll -> 'history') || jsonb_build_array(
        jsonb_build_object(
          'date', p_transaction->>'date',
          'balance', new_balance,
          'change', CASE WHEN transaction_type = 'deposit' 
                      THEN (p_transaction->>'amount')::decimal 
                      ELSE -(p_transaction->>'amount')::decimal 
                    END
        )
      )
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Migration Complete!
-- 
-- Your existing user_profiles table now supports:
-- 1. Profile images and bios
-- 2. Complete betting history tracking
-- 3. Bankroll management with transaction history  
-- 4. AI report caching
-- 5. Dashboard settings and preferences
-- 6. Helper functions for common operations
-- 7. Storage bucket for profile images
--
-- All existing data is preserved!
-- =====================================================

-- Sample queries for testing:

-- Check the new structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- ORDER BY ordinal_position;

-- Test dashboard stats function
-- SELECT get_user_dashboard_stats('your-user-id-here');

-- Test adding a bet
-- SELECT add_bet_to_history('your-user-id', '{"id": 1, "sport": "NFL", "stake": 50, "result": "won", "profit": 25}');

-- Test updating bankroll  
-- SELECT update_user_bankroll('your-user-id', '{"type": "deposit", "amount": 500, "date": "2025-01-15", "description": "Initial deposit"}');