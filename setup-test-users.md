# Test Users Setup Guide

## 🧪 Quick Test User Creation

### Option 1: Dashboard Method (Fastest)

1. **Go to Supabase Dashboard**
   - Navigate to Authentication > Users
   - Click "Add user"

2. **Create Customer User:**
   ```
   Email: customer@demo.com
   Password: customer123
   ```

3. **Create Barber User:**
   ```
   Email: barber@demo.com
   Password: barber123
   ```

4. **Set User Roles:**
   - Go to SQL Editor
   - Run this query:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'barber')) DEFAULT 'customer',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Insert profiles for your test users
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Test User'),
  CASE 
    WHEN au.email = 'barber@demo.com' THEN 'barber'
    ELSE 'customer'
  END
FROM auth.users au
WHERE au.email IN ('customer@demo.com', 'barber@demo.com')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;
```

### Option 2: App Sign-Up Method

1. **Start your app:**
   ```bash
   npx expo start
   ```

2. **Create users through the app:**
   - Use the SignInScreen
   - Sign up with both email addresses
   - Use the SQL query above to set roles

### Option 3: SQL Script Method

1. **Copy the contents of `create-test-users.sql`**
2. **Paste into Supabase SQL Editor**
3. **Run the script**

## 🔍 Verify Your Test Users

After creating users, verify they exist:

```sql
-- Check users in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email IN ('customer@demo.com', 'barber@demo.com');

-- Check profiles
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email IN ('customer@demo.com', 'barber@demo.com');
```

## 🧪 Test Authentication

1. **Start your app:**
   ```bash
   npx expo start
   ```

2. **Test customer login:**
   - Email: `customer@demo.com`
   - Password: `customer123`

3. **Test barber login:**
   - Email: `barber@demo.com`
   - Password: `barber123`

4. **Verify role-based navigation:**
   - Customer should see: Home, Book, Appointments, Profile
   - Barber should see: Home, Schedule, Services, Profile

## 🎯 Test Scenarios

### Customer Tests:
- [ ] Sign in with customer credentials
- [ ] View customer dashboard
- [ ] Book an appointment
- [ ] View appointments
- [ ] Upload avatar in profile

### Barber Tests:
- [ ] Sign in with barber credentials
- [ ] View barber dashboard
- [ ] Access weekly schedule
- [ ] View services management
- [ ] Upload avatar in profile

## 🔧 Troubleshooting

### User Not Found:
- Check if user exists in Authentication > Users
- Verify email spelling
- Check if user is confirmed

### Role Not Working:
- Verify profile exists in profiles table
- Check role value ('customer' or 'barber')
- Ensure RLS policies are set up

### Authentication Issues:
- Check Supabase project URL and key
- Verify .env file is set up correctly
- Check network connectivity
