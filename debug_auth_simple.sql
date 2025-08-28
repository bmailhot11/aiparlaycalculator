-- Simple auth diagnostics
-- Run this in Supabase SQL Editor

-- 1. Check if we can access auth.users at all
SELECT 'auth.users table accessible' as status;

-- 2. Check auth configuration
SELECT 
    key,
    value
FROM auth.config
WHERE key IN ('external_google_enabled', 'external_google_client_id');

-- 3. Check recent auth activity (if any)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;