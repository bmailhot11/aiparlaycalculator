-- User Profiles Table Schema for Supabase
-- This stores all user dashboard data including profile info, bets, and bankroll history

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile Information
  profile_image_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 300), -- 50 words ~= 300 chars
  display_name VARCHAR(100),
  
  -- Bankroll Data (stored as JSONB for flexibility)
  bankroll_data JSONB DEFAULT '{"current": 0, "deposits": [], "withdrawals": [], "history": []}',
  
  -- Betting History (stored as JSONB array)
  betting_history JSONB DEFAULT '[]',
  
  -- Analytics Cache (calculated metrics to avoid recalculation)
  analytics_cache JSONB DEFAULT '{}',
  
  -- Settings and Preferences
  dashboard_settings JSONB DEFAULT '{"autoLogBets": false, "notifications": true, "publicProfile": false}',
  
  -- AI Report Data
  last_ai_report JSONB,
  last_ai_report_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for profile images (run this in Supabase dashboard SQL editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for profile images
CREATE POLICY "Users can upload their own profile image" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own profile image" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

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

-- Sample data structure for betting_history JSONB:
/*
[
  {
    "id": 123456789,
    "date": "2025-01-15",
    "sport": "NFL",
    "market": "Moneyline", 
    "selection": "Chiefs ML",
    "odds": "+150",
    "stake": 50,
    "result": "won",
    "payout": 125,
    "profit": 75,
    "sportsbook": "DraftKings",
    "source": "manual", // "arbitrage", "middle_bet", "ai_parlay"
    "metadata": {
      "confidence": "High",
      "expectedValue": 5.2,
      "arbitrageId": "arb_123"
    }
  }
]
*/

-- Sample data structure for bankroll_data JSONB:
/*
{
  "current": 1000,
  "deposits": [
    {
      "id": 123456789,
      "date": "2025-01-15", 
      "amount": 500,
      "description": "Initial deposit",
      "balance": 1500
    }
  ],
  "withdrawals": [],
  "history": [
    {
      "date": "2025-01-15",
      "balance": 1000,
      "change": 0
    }
  ]
}
*/