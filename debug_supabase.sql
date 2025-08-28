-- =====================================================
-- Supabase Database Diagnostics
-- Copy and paste this into your Supabase SQL Editor
-- =====================================================

-- 1. Check if user_profiles table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 2. Check if the trigger function exists
SELECT 
    routine_name, 
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Check if the trigger exists on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Check if there are any existing user_profiles records
SELECT COUNT(*) as total_user_profiles FROM user_profiles;

-- 6. Check if there are any auth.users
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- 7. Test the trigger function manually (this will show any errors)
-- Replace 'test-user-id' with an actual UUID if you want to test
/*
DO $$
BEGIN
    PERFORM handle_new_user();
    RAISE NOTICE 'Trigger function exists and is callable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in trigger function: %', SQLERRM;
END $$;
*/

-- =====================================================
-- Run this and paste the results back to me
-- =====================================================