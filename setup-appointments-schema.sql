-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  service_duration INTEGER NOT NULL, -- in minutes
  service_price DECIMAL(10,2) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  special_requests TEXT,
  location TEXT,
  payment_method TEXT,
  credits_used INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own appointments
CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments (for reviews, cancellation)
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own appointments (for cancellation)
CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Barbers can view appointments assigned to them
CREATE POLICY "Barbers can view assigned appointments" ON appointments
  FOR SELECT USING (auth.uid() = barber_id);

-- Barbers can update appointments assigned to them (for status changes)
CREATE POLICY "Barbers can update assigned appointments" ON appointments
  FOR UPDATE USING (auth.uid() = barber_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample appointments for testing
INSERT INTO appointments (
  user_id,
  barber_id,
  service_id,
  service_name,
  service_duration,
  service_price,
  appointment_date,
  appointment_time,
  status,
  special_requests,
  location,
  payment_method,
  credits_used,
  rating,
  review_text,
  review_photo_url
) VALUES 
-- Customer appointments
(
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-1',
  'Haircut & Beard Trim',
  45,
  60.00,
  CURRENT_DATE + INTERVAL '2 days',
  '10:30:00',
  'scheduled',
  'Please keep it professional',
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  NULL,
  NULL,
  NULL
),
(
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-2',
  'Haircut Only',
  30,
  40.00,
  CURRENT_DATE + INTERVAL '1 week',
  '14:00:00',
  'scheduled',
  NULL,
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  NULL,
  NULL,
  NULL
),
-- Past appointment with review
(
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-1',
  'Haircut & Beard Trim',
  45,
  60.00,
  CURRENT_DATE - INTERVAL '1 week',
  '11:00:00',
  'completed',
  'Great service!',
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  5,
  'Excellent haircut and beard trim. Very professional and clean.',
  NULL
),
-- Another past appointment
(
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-3',
  'Beard Trim Only',
  20,
  25.00,
  CURRENT_DATE - INTERVAL '2 weeks',
  '15:30:00',
  'completed',
  NULL,
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  4,
  'Good beard trim, will come back.',
  NULL
);

-- Create a view for appointment details with user and barber info
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.*,
  u.email as user_email,
  pu.full_name as user_name,
  b.email as barber_email,
  pb.full_name as barber_name
FROM appointments a
LEFT JOIN auth.users u ON a.user_id = u.id
LEFT JOIN profiles pu ON a.user_id = pu.id
LEFT JOIN auth.users b ON a.barber_id = b.id
LEFT JOIN profiles pb ON a.barber_id = pb.id;

-- Grant access to the view
GRANT SELECT ON appointment_details TO authenticated;
