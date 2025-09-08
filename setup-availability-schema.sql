-- Create barber availability table
CREATE TABLE IF NOT EXISTS barber_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

-- Create schedule exceptions table
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

-- Enable RLS on both tables
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for barber_availability
CREATE POLICY "Barbers can manage their own availability" ON barber_availability
  FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Anyone can view barber availability" ON barber_availability
  FOR SELECT USING (true);

-- RLS policies for schedule_exceptions
CREATE POLICY "Barbers can manage their own schedule exceptions" ON schedule_exceptions
  FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Anyone can view schedule exceptions" ON schedule_exceptions
  FOR SELECT USING (true);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_barber_availability_updated_at 
  BEFORE UPDATE ON barber_availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_exceptions_updated_at 
  BEFORE UPDATE ON schedule_exceptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
