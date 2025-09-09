-- Simple Fix for Appointment Service Relationships
-- This script handles existing policies and creates the appointment_summary view

-- 1. Add missing columns to appointments table (if they don't exist)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS service_duration INTEGER,
ADD COLUMN IF NOT EXISTS service_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS appointment_time TEXT,
ADD COLUMN IF NOT EXISTS cuts_used INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS review_photo_url TEXT;

-- 2. Update existing appointments to populate service details from services table
UPDATE appointments 
SET 
  service_name = s.name,
  service_duration = s.duration_minutes,
  service_price = s.price
FROM services s
WHERE appointments.service_id::text = s.id::text 
  AND (appointments.service_name IS NULL OR appointments.service_duration IS NULL OR appointments.service_price IS NULL);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date ON appointments(user_id, status, appointment_date);

-- 4. Drop and recreate RLS policies (ignore errors if they don't exist)
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
    DROP POLICY IF EXISTS "Barbers can update their appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can update their appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can delete their appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can view active services" ON services;
    DROP POLICY IF EXISTS "Barbers can manage their services" ON services;
    
    -- Create new policies
    CREATE POLICY "Users can view their appointments" ON appointments
      FOR SELECT USING (auth.uid() = user_id OR auth.uid() = barber_id);

    CREATE POLICY "Users can create appointments" ON appointments
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their appointments" ON appointments
      FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = barber_id);

    CREATE POLICY "Users can delete their appointments" ON appointments
      FOR DELETE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view active services" ON services
      FOR SELECT USING (is_active = true);

    CREATE POLICY "Barbers can manage their services" ON services
      FOR ALL USING (auth.uid() = barber_id);
      
    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- 5. Create the appointment_summary view
DROP VIEW IF EXISTS public.appointment_summary;
CREATE VIEW public.appointment_summary AS
SELECT 
  a.id,
  a.user_id,
  a.barber_id,
  a.service_id,
  COALESCE(a.service_name, s.name) as service_name,
  s.description as service_description,
  COALESCE(a.service_duration, s.duration_minutes) as service_duration,
  COALESCE(a.service_price, s.price) as service_price,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.special_requests,
  a.location,
  a.payment_method,
  a.cuts_used,
  a.rating,
  a.review_text,
  a.created_at,
  a.updated_at,
  p_customer.email as customer_email,
  p_barber.email as barber_email
FROM appointments a
LEFT JOIN services s ON a.service_id::text = s.id::text
LEFT JOIN profiles p_customer ON a.user_id::text = p_customer.id::text
LEFT JOIN profiles p_barber ON a.barber_id::text = p_barber.id::text;

-- 6. Grant access to the view
GRANT SELECT ON public.appointment_summary TO authenticated;

-- 7. Verify the setup
SELECT 
  'Appointment summary view created successfully' as status,
  COUNT(*) as total_appointments
FROM appointment_summary;

-- 8. Show sample data
SELECT 
  'Sample appointment data:' as info,
  id,
  service_name,
  service_duration,
  service_price,
  cuts_used,
  status
FROM appointment_summary
LIMIT 3;
