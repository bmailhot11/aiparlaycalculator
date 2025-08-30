-- Add comprehensive subscription support with one-month free trial
-- This extends the existing user_profiles table with proper subscription tracking

-- Step 1: Add subscription columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'none', -- none, trialing, active, past_due, canceled, unpaid
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Step 2: Create subscription events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  event_type VARCHAR(50) NOT NULL, -- trial_start, subscription_created, payment_succeeded, payment_failed, canceled, etc.
  event_data JSONB DEFAULT '{}',
  stripe_event_id VARCHAR(100) UNIQUE, -- to prevent duplicate processing
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trial_end ON user_profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_event ON subscription_events(stripe_event_id);

-- Step 4: Create helper function to check if user has premium access
CREATE OR REPLACE FUNCTION user_has_premium_access(p_user_id VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user subscription info
  SELECT subscription_status, trial_end_date, current_period_end, canceled_at
  INTO user_record
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- If no record found, no access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is currently trialing and trial hasn't expired
  IF user_record.subscription_status = 'trialing' 
     AND user_record.trial_end_date > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has active subscription
  IF user_record.subscription_status = 'active' 
     AND user_record.current_period_end > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- All other cases: no access
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to start free trial
CREATE OR REPLACE FUNCTION start_free_trial(p_user_id VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
  trial_duration INTERVAL := '1 month';
  trial_start TIMESTAMP WITH TIME ZONE := NOW();
  trial_end TIMESTAMP WITH TIME ZONE := NOW() + trial_duration;
BEGIN
  -- Update user profile to start trial
  UPDATE user_profiles 
  SET 
    subscription_status = 'trialing',
    trial_start_date = trial_start,
    trial_end_date = trial_end,
    is_premium = TRUE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the trial start event
  INSERT INTO subscription_events (user_id, event_type, event_data)
  VALUES (
    p_user_id, 
    'trial_started', 
    jsonb_build_object(
      'trial_start', trial_start,
      'trial_end', trial_end,
      'source', 'manual'
    )
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to start trial for user %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to update subscription from webhook
CREATE OR REPLACE FUNCTION update_subscription_from_webhook(
  p_user_id VARCHAR(100),
  p_stripe_customer_id VARCHAR(100),
  p_stripe_subscription_id VARCHAR(100),
  p_status VARCHAR(50),
  p_current_period_start TIMESTAMP WITH TIME ZONE,
  p_current_period_end TIMESTAMP WITH TIME ZONE,
  p_trial_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_canceled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_cancel_at_period_end BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user subscription data
  UPDATE user_profiles 
  SET 
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_status = p_status,
    current_period_start = p_current_period_start,
    current_period_end = p_current_period_end,
    trial_start_date = COALESCE(p_trial_start, trial_start_date),
    trial_end_date = COALESCE(p_trial_end, trial_end_date),
    canceled_at = p_canceled_at,
    cancel_at_period_end = p_cancel_at_period_end,
    is_premium = CASE 
      WHEN p_status IN ('trialing', 'active') THEN TRUE
      ELSE FALSE
    END,
    premium_expires_at = CASE
      WHEN p_status = 'trialing' AND p_trial_end IS NOT NULL THEN p_trial_end
      WHEN p_status = 'active' THEN p_current_period_end
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update subscription for user %: %', p_user_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create a view for easy subscription status checking
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  user_id,
  email,
  subscription_status,
  user_has_premium_access(user_id) AS has_premium_access,
  trial_start_date,
  trial_end_date,
  current_period_start,
  current_period_end,
  canceled_at,
  cancel_at_period_end,
  CASE 
    WHEN subscription_status = 'trialing' AND trial_end_date > NOW() THEN 
      EXTRACT(EPOCH FROM (trial_end_date - NOW()))::INT
    WHEN subscription_status = 'active' AND current_period_end > NOW() THEN 
      EXTRACT(EPOCH FROM (current_period_end - NOW()))::INT
    ELSE 0
  END AS seconds_remaining,
  CASE 
    WHEN subscription_status = 'trialing' THEN 'Free Trial'
    WHEN subscription_status = 'active' THEN 'Premium'
    WHEN subscription_status = 'canceled' AND current_period_end > NOW() THEN 'Canceled (Active Until End)'
    WHEN subscription_status = 'past_due' THEN 'Payment Issue'
    ELSE 'No Access'
  END AS status_display
FROM user_profiles;

-- Step 8: Create RLS policies for new tables
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR SELECT USING (user_id = (SELECT auth.uid()::TEXT));

-- Step 9: Grant necessary permissions
GRANT SELECT ON user_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_premium_access(VARCHAR) TO authenticated;

-- Step 10: Comments for documentation
COMMENT ON COLUMN user_profiles.subscription_status IS 'Current subscription status: none, trialing, active, past_due, canceled, unpaid';
COMMENT ON COLUMN user_profiles.trial_start_date IS 'When the free trial started (if applicable)';
COMMENT ON COLUMN user_profiles.trial_end_date IS 'When the free trial ends/ended (if applicable)';
COMMENT ON FUNCTION user_has_premium_access(VARCHAR) IS 'Returns TRUE if user currently has premium access (either trial or active subscription)';
COMMENT ON FUNCTION start_free_trial(VARCHAR) IS 'Starts a one-month free trial for the specified user';
COMMENT ON FUNCTION update_subscription_from_webhook(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, BOOLEAN) IS 'Updates user subscription data from Stripe webhooks';

-- Step 11: Create some useful queries for monitoring (commented out for safety)
/*
-- Check current trial users
SELECT user_id, email, trial_start_date, trial_end_date, 
       EXTRACT(DAYS FROM (trial_end_date - NOW())) AS days_remaining
FROM user_profiles 
WHERE subscription_status = 'trialing' 
  AND trial_end_date > NOW()
ORDER BY trial_end_date ASC;

-- Check subscription distribution
SELECT subscription_status, COUNT(*) as count
FROM user_profiles 
GROUP BY subscription_status
ORDER BY count DESC;

-- Check users whose trials are expiring soon (next 7 days)
SELECT user_id, email, trial_end_date,
       EXTRACT(DAYS FROM (trial_end_date - NOW())) AS days_remaining
FROM user_profiles 
WHERE subscription_status = 'trialing' 
  AND trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY trial_end_date ASC;
*/

-- Migration complete!
-- The user_profiles table now supports:
-- - Stripe customer and subscription IDs
-- - Trial period tracking
-- - Comprehensive subscription status management
-- - Helper functions for premium access checking
-- - Audit trail via subscription_events table