# Database Setup Guide

## 🚨 Error Fix: "Cannot coerce the result to a single JSON object"

This error occurs because the `profiles` table doesn't exist in your Supabase database yet. Here's how to fix it:

## 🔧 Quick Fix

### Step 1: Run the Database Setup Script

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `setup-database.sql`**
4. **Click "Run"**

This will:
- ✅ Create the `profiles` table
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create profiles for your existing test users
- ✅ Set up avatar storage bucket
- ✅ Create automatic profile creation for new users

### Step 2: Verify the Setup

After running the script, you should see output like:

```
Profiles Table | record_count
customer@demo.com | Test Customer | customer
barber@demo.com | Test Barber | barber
```

### Step 3: Test Your App

1. **Restart your app:**
   ```bash
   npx expo start
   ```

2. **Sign in with your test users:**
   - `customer@demo.com` / `customer123`
   - `barber@demo.com` / `barber123`

3. **The error should be gone!**

## 🛠️ What the Script Does

### 1. Creates Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'barber')) DEFAULT 'customer',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Sets Up Security
- Enables Row Level Security (RLS)
- Creates policies so users can only access their own profiles
- Sets up avatar storage with proper permissions

### 3. Creates Test User Profiles
- Automatically creates profiles for your existing test users
- Sets the correct roles (customer/barber)

### 4. Sets Up Avatar Storage
- Creates `avatars` storage bucket
- Sets up policies for avatar uploads

### 5. Auto-Profile Creation
- Creates a trigger that automatically creates a profile when a new user signs up
- No more manual profile creation needed!

## 🔍 Troubleshooting

### If you still get errors:

1. **Check if the script ran successfully:**
   ```sql
   SELECT * FROM profiles;
   ```

2. **Verify your test users exist:**
   ```sql
   SELECT id, email FROM auth.users WHERE email IN ('customer@demo.com', 'barber@demo.com');
   ```

3. **Check storage bucket:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'avatars';
   ```

### If profiles still don't exist:

1. **Manually create profiles:**
   ```sql
   INSERT INTO profiles (id, email, full_name, role)
   SELECT 
     au.id,
     au.email,
     au.email,
     CASE WHEN au.email = 'barber@demo.com' THEN 'barber' ELSE 'customer' END
   FROM auth.users au
   WHERE au.email IN ('customer@demo.com', 'barber@demo.com');
   ```

## 🎯 Next Steps

After running the setup script:

1. ✅ **Test authentication** - Sign in with test users
2. ✅ **Test role-based navigation** - Verify customer vs barber screens
3. ✅ **Test avatar upload** - Try uploading an avatar in profile
4. ✅ **Test new user signup** - Create a new account to test auto-profile creation

The app should now work perfectly with Supabase! 🎉
