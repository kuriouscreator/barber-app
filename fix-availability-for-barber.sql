-- Fix availability for the specific barber ID
-- This will create availability records for the barber we found

-- First, let's make sure the barber profile exists
SELECT 'Checking barber profile...' as status;
SELECT id, email, full_name, role FROM profiles WHERE id = '7d26e322-955c-4e7c-a108-260dd69c0b8f';

-- Insert availability for Monday to Friday (9 AM - 6 PM)
INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
VALUES 
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 1, '09:00:00', '18:00:00', true), -- Monday
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 2, '09:00:00', '18:00:00', true), -- Tuesday
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 3, '09:00:00', '18:00:00', true), -- Wednesday
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 4, '09:00:00', '18:00:00', true), -- Thursday
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 5, '09:00:00', '18:00:00', true)  -- Friday
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_available = EXCLUDED.is_available;

-- Insert availability for Saturday and Sunday (10 AM - 4 PM)
INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
VALUES 
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 0, '10:00:00', '16:00:00', true), -- Sunday
  ('7d26e322-955c-4e7c-a108-260dd69c0b8f', 6, '10:00:00', '16:00:00', true)  -- Saturday
ON CONFLICT (barber_id, day_of_week) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_available = EXCLUDED.is_available;

-- Verify the records were created
SELECT 'Availability records created:' as status;
SELECT 
  day_of_week,
  CASE day_of_week 
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_name,
  start_time,
  end_time,
  is_available
FROM barber_availability 
WHERE barber_id = '7d26e322-955c-4e7c-a108-260dd69c0b8f'
ORDER BY day_of_week;
