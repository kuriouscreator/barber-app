-- Fix Appointment Service Relationships and Cut Tracking
-- This script ensures proper connections between appointments, services, and cut tracking

-- 1. First, let's check and fix the appointments table structure
-- The current schema uses customer_id but the service uses user_id
-- Let's add user_id column and ensure proper relationships

-- Add user_id column if it doesn't exist (for compatibility with the service)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add service_name, service_duration, service_price columns if they don't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS service_duration INTEGER,
ADD COLUMN IF NOT EXISTS service_price DECIMAL(10,2);

-- Add appointment_time column if it doesn't exist (separate from appointment_date)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS appointment_time TEXT;

-- Add cuts_used column if it doesn't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cuts_used INTEGER DEFAULT 1;

-- Add other missing columns that the service expects
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS review_photo_url TEXT;

-- 2. Update existing appointments to populate user_id from customer_id (if customer_id exists)
-- First check if customer_id column exists, if not, we'll handle it differently
DO $$
BEGIN
    -- Check if customer_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'customer_id'
        AND table_schema = 'public'
    ) THEN
        -- Update existing appointments to populate user_id from customer_id
        UPDATE appointments 
        SET user_id = customer_id 
        WHERE user_id IS NULL AND customer_id IS NOT NULL;
        
        RAISE NOTICE 'Updated user_id from customer_id for existing appointments';
    ELSE
        RAISE NOTICE 'customer_id column does not exist, skipping user_id population';
    END IF;
END $$;

-- 3. Update existing appointments to populate service details from services table
UPDATE appointments 
SET 
  service_name = s.name,
  service_duration = s.duration_minutes,
  service_price = s.price
FROM services s
WHERE appointments.service_id::text = s.id::text 
  AND (appointments.service_name IS NULL OR appointments.service_duration IS NULL OR appointments.service_price IS NULL);

-- 4. Ensure proper foreign key relationships
-- Drop existing foreign key if it exists and recreate with proper name
DO $$
BEGIN
    -- Drop customer_id foreign key if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_customer_id_fkey'
        AND table_name = 'appointments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_customer_id_fkey;
        RAISE NOTICE 'Dropped appointments_customer_id_fkey constraint';
    END IF;
    
    -- Drop user_id foreign key if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'appointments_user_id_fkey'
        AND table_name = 'appointments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_user_id_fkey;
        RAISE NOTICE 'Dropped existing appointments_user_id_fkey constraint';
    END IF;
END $$;

-- Add proper foreign key for user_id
ALTER TABLE appointments 
ADD CONSTRAINT appointments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date ON appointments(user_id, status, appointment_date);

-- 6. Update RLS policies to work with user_id
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
DROP POLICY IF EXISTS "Barbers can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their appointments" ON appointments;

-- Create new policies that work with user_id
CREATE POLICY "Users can view their appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = barber_id);

CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = barber_id);

CREATE POLICY "Users can delete their appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Ensure the services table has proper RLS policies
DROP POLICY IF EXISTS "Users can view all services" ON services;
DROP POLICY IF EXISTS "Barbers can manage their services" ON services;

CREATE POLICY "Users can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Barbers can manage their services" ON services
  FOR ALL USING (auth.uid() = barber_id);

-- 8. Create a function to get appointment with service details
CREATE OR REPLACE FUNCTION public.get_appointment_with_service_details(
  p_appointment_id UUID
)
RETURNS TABLE (
  appointment_id UUID,
  user_id UUID,
  barber_id UUID,
  service_id UUID,
  service_name TEXT,
  service_description TEXT,
  service_duration INTEGER,
  service_price DECIMAL(10,2),
  appointment_date DATE,
  appointment_time TEXT,
  status TEXT,
  special_requests TEXT,
  location TEXT,
  payment_method TEXT,
  cuts_used INTEGER,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    a.user_id,
    a.barber_id,
    a.service_id,
    COALESCE(a.service_name, s.name) as service_name,
    s.description as service_description,
    COALESCE(a.service_duration, s.duration_minutes) as service_duration,
    COALESCE(a.service_price, s.price) as service_price,
    a.appointment_date::DATE as appointment_date,
    a.appointment_time,
    a.status,
    a.special_requests,
    a.location,
    a.payment_method,
    a.cuts_used,
    a.rating,
    a.review_text,
    a.created_at,
    a.updated_at
  FROM appointments a
  LEFT JOIN services s ON a.service_id::text = s.id::text
  WHERE a.id = p_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_appointment_with_service_details(UUID) TO authenticated;

-- 10. Create a view for appointment summary with service details
CREATE OR REPLACE VIEW public.appointment_summary AS
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

-- Grant access to the view
GRANT SELECT ON public.appointment_summary TO authenticated;

-- 11. Verify the setup
SELECT 
  'Appointments table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. Test the relationships
SELECT 
  'Sample appointment with service details:' as info,
  a.id,
  a.service_name,
  a.service_duration,
  a.service_price,
  a.cuts_used,
  s.name as service_table_name,
  s.duration_minutes as service_table_duration,
  s.price as service_table_price
FROM appointments a
LEFT JOIN services s ON a.service_id = s.id
LIMIT 5;
