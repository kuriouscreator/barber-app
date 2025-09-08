-- Verify Test Users Setup
-- Run this in Supabase SQL Editor to check your test users

-- Check if users exist in auth.users
SELECT 
  'Auth Users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email IN ('customer@demo.com', 'barber@demo.com')
ORDER BY email;

-- Check if profiles exist
SELECT 
  'Profiles' as table_name,
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email IN ('customer@demo.com', 'barber@demo.com')
ORDER BY email;

-- Check if profiles table exists and has correct structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check RLS policies on profiles table
SELECT 
  'RLS Policies' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Summary
SELECT 
  'Summary' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
  COUNT(CASE WHEN role = 'barber' THEN 1 END) as barbers
FROM profiles 
WHERE email IN ('customer@demo.com', 'barber@demo.com');
