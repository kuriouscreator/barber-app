-- Setup Barber Profile for Single-Barber App
-- Run this ONCE when setting up the app for the first time
-- This creates the single barber that all customers will be assigned to

-- First, let's check if a barber profile already exists
SELECT * FROM profiles WHERE role = 'barber';

-- Create the barber profile if it doesn't exist
-- This uses a fixed UUID that will be consistent across the app
INSERT INTO profiles (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111', -- Fixed UUID for the barber
  'barber@demo.com',
  'Mike''s Barbershop',
  'barber',
  '+1 (555) 123-4567',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- Verify the barber profile was created/updated
SELECT * FROM profiles WHERE role = 'barber';

-- Optional: Create a trigger to automatically assign new customers to this barber
-- (This is just for documentation - the app logic handles this)
