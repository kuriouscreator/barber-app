-- Database Verification Script
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if profiles table exists
SELECT 
  'Profiles Table' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- 2. Check profiles table structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  'RLS Policies' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Check test user profiles
SELECT 
  'Test User Profiles' as info,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email IN ('customer@demo.com', 'barber@demo.com')
ORDER BY role;

-- 5. Check all users in auth
SELECT 
  'Auth Users' as info,
  id,
  email,
  created_at
FROM auth.users 
WHERE email IN ('customer@demo.com', 'barber@demo.com')
ORDER BY email;

-- 6. Check storage bucket
SELECT 
  'Storage Bucket' as info,
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- 7. Check storage policies
SELECT 
  'Storage Policies' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%avatar%';

-- 8. Summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as customers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'barber') as barbers,
  (SELECT COUNT(*) FROM auth.users WHERE email IN ('customer@demo.com', 'barber@demo.com')) as test_users;
