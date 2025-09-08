-- Quick setup for availability system
-- This will create the tables and insert default availability for the barber

-- Create barber availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS barber_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

-- Create schedule exceptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, date)
);

-- Enable RLS
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Barbers can manage their own availability" ON barber_availability;
CREATE POLICY "Barbers can manage their own availability" ON barber_availability
  FOR ALL USING (auth.uid() = barber_id);

DROP POLICY IF EXISTS "Anyone can view barber availability" ON barber_availability;
CREATE POLICY "Anyone can view barber availability" ON barber_availability
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Barbers can manage their own schedule exceptions" ON schedule_exceptions;
CREATE POLICY "Barbers can manage their own schedule exceptions" ON schedule_exceptions
  FOR ALL USING (auth.uid() = barber_id);

DROP POLICY IF EXISTS "Anyone can view schedule exceptions" ON schedule_exceptions;
CREATE POLICY "Anyone can view schedule exceptions" ON schedule_exceptions
  FOR SELECT USING (true);

-- Insert default availability for the barber (9 AM - 6 PM, Monday to Friday)
INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
SELECT 
  p.id,
  day_num,
  '09:00:00'::time,
  '18:00:00'::time,
  true
FROM profiles p
CROSS JOIN generate_series(1, 5) AS day_num -- Monday to Friday
WHERE p.role = 'barber'
ON CONFLICT (barber_id, day_of_week) DO NOTHING;

-- Insert weekend availability (10 AM - 4 PM, Saturday and Sunday)
INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
SELECT 
  p.id,
  day_num,
  '10:00:00'::time,
  '16:00:00'::time,
  true
FROM profiles p
CROSS JOIN generate_series(0, 6) AS day_num -- Sunday and Saturday
WHERE p.role = 'barber' AND day_num IN (0, 6) -- Sunday (0) and Saturday (6)
ON CONFLICT (barber_id, day_of_week) DO NOTHING;

-- Show what was created
SELECT 'Setup complete! Created availability for:' as message;
SELECT 
  p.email as barber_email,
  COUNT(ba.day_of_week) as days_configured
FROM profiles p
LEFT JOIN barber_availability ba ON p.id = ba.barber_id
WHERE p.role = 'barber'
GROUP BY p.email;
