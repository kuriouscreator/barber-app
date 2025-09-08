-- Complete App Setup for BarberCuts
-- Run this ONCE when setting up the app for the first time
-- This sets up the entire database schema and creates the barber profile

-- 1. Create profiles table (if not exists)
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

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Create the barber profile (the single barber for this app)
-- First, we need to create the barber user in auth.users, then create the profile
-- This will be done through the Supabase dashboard or by creating a user account

-- For now, let's create a profile for an existing barber user
-- You'll need to create a barber user account first (barber@demo.com / barber123)
-- Then this will create the profile for that user

-- Check if barber user exists and create profile
INSERT INTO profiles (id, email, full_name, role, phone, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'Mike''s Barbershop',
  'barber',
  '+1 (555) 123-4567',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'barber@demo.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  );

-- 5. Create appointments table (if not exists)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_duration INTEGER NOT NULL,
  service_price DECIMAL(10,2) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  special_requests TEXT,
  location TEXT,
  payment_method TEXT,
  credits_used INTEGER DEFAULT 1,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own appointments" ON appointments;
CREATE POLICY "Users can create own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Barber can view assigned appointments" ON appointments;
CREATE POLICY "Barber can view assigned appointments" ON appointments
  FOR SELECT USING (
    barber_id IN (
      SELECT id FROM profiles WHERE role = 'barber'
    )
  );

DROP POLICY IF EXISTS "Barber can update assigned appointments" ON appointments;
CREATE POLICY "Barber can update assigned appointments" ON appointments
  FOR UPDATE USING (
    barber_id IN (
      SELECT id FROM profiles WHERE role = 'barber'
    )
  );

-- 8. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer' -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON appointments;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. Verify setup
SELECT 'Setup complete! Barber profile:' as status;
SELECT * FROM profiles WHERE role = 'barber';

SELECT 'Appointments table created:' as status;
SELECT COUNT(*) as appointment_count FROM appointments;
