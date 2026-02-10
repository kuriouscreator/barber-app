-- Add onboarding and shop info fields to profiles table
-- This enables barber onboarding flow tracking and shop information storage

-- Add onboarding tracking fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add shop/business information fields for barbers
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_address TEXT,
  ADD COLUMN IF NOT EXISTS shop_city TEXT,
  ADD COLUMN IF NOT EXISTS shop_state TEXT,
  ADD COLUMN IF NOT EXISTS shop_zip TEXT,
  ADD COLUMN IF NOT EXISTS shop_phone TEXT;

-- Add comments for clarity
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether barber has completed initial onboarding';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in onboarding process (0=not started, 1=business info, 2=services, 3=schedule, 4=complete)';
COMMENT ON COLUMN profiles.shop_name IS 'Business/shop name for barbers';
COMMENT ON COLUMN profiles.shop_address IS 'Street address of barbershop';
COMMENT ON COLUMN profiles.shop_city IS 'City where barbershop is located';
COMMENT ON COLUMN profiles.shop_state IS 'State/province of barbershop';
COMMENT ON COLUMN profiles.shop_zip IS 'Postal/ZIP code of barbershop';
COMMENT ON COLUMN profiles.shop_phone IS 'Business phone number (separate from personal phone)';

-- Create index for faster onboarding status checks
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_role_onboarding ON profiles(role, onboarding_completed);
