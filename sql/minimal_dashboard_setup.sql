-- MINIMAL DASHBOARD SETUP - NO DOLLAR SIGNS AT ALL
-- Copy and paste this entire block into Supabase SQL Editor

-- Step 1: Add dashboard columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 300),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bankroll_data JSONB DEFAULT '{"current": 1000, "deposits": [], "withdrawals": [], "history": []}',
ADD COLUMN IF NOT EXISTS betting_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS analytics_cache JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dashboard_settings JSONB DEFAULT '{"autoLogBets": false, "notifications": true, "publicProfile": false}',
ADD COLUMN IF NOT EXISTS last_ai_report JSONB,
ADD COLUMN IF NOT EXISTS last_ai_report_generated_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add performance index
CREATE INDEX IF NOT EXISTS user_profiles_last_ai_report_idx ON user_profiles(last_ai_report_generated_at);

-- Step 3: Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Clean up any existing storage policies
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly viewable" ON storage.objects;

-- Step 5: Create basic storage policies
CREATE POLICY "Profile images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile image" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DONE! Your dashboard is now ready to use.