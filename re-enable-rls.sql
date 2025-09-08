-- Re-enable RLS After Testing
-- Run this when you're done testing to restore security

-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Re-create the proper RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    role = 'barber'  -- Allow anyone to view barber profiles
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Appointments policies
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

-- Verify RLS is re-enabled
SELECT 'RLS Status (should be enabled):' as status;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'appointments');
