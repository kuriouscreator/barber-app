-- Create services table and add sample data
-- Run this in your Supabase SQL Editor

-- 1. Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for services
-- Users can view all active services
CREATE POLICY "Users can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Barbers can manage their own services
CREATE POLICY "Barbers can manage their services" ON services
  FOR ALL USING (auth.uid() = barber_id);

-- Service role can manage all services (for admin operations)
CREATE POLICY "Service role can manage services" ON services
  FOR ALL USING (true);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_barber_id ON services(barber_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);

-- 5. Add sample services
DO $$
DECLARE
    barber_user_id UUID;
BEGIN
    -- Get the barber user ID
    SELECT id INTO barber_user_id 
    FROM auth.users 
    WHERE email = 'barber@demo.com';
    
    IF barber_user_id IS NOT NULL THEN
        -- Insert sample services
        INSERT INTO services (barber_id, name, description, duration_minutes, price, is_active) VALUES
        (barber_user_id, 'Classic Haircut', 'Traditional haircut with scissors and clippers', 30, 25.00, true),
        (barber_user_id, 'Premium Package', 'Haircut + beard trim + styling', 45, 40.00, true),
        (barber_user_id, 'Beard Trim', 'Professional beard trimming and shaping', 20, 15.00, true),
        (barber_user_id, 'Hair Styling', 'Hair styling and finishing', 15, 10.00, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample services added for barber: %', barber_user_id;
    ELSE
        RAISE NOTICE 'Barber user not found. Please check the email address.';
    END IF;
END $$;

-- 6. Verify the services were added
SELECT 
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.is_active,
    p.email as barber_email
FROM services s
JOIN profiles p ON s.barber_id = p.id
WHERE s.is_active = true
ORDER BY s.name;
