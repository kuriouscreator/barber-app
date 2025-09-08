-- Get the actual barber user ID to use in the app
-- Run this query to get the barber ID, then update the hardcoded "1" values in the app

SELECT 
  u.id as barber_user_id,
  u.email as barber_email,
  p.full_name as barber_name,
  'Use this ID: ' || u.id as instruction
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'barber@demo.com';

-- Also check if there are any appointments with this barber
SELECT 
  COUNT(*) as appointment_count,
  COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as reviews_count
FROM appointments 
WHERE barber_id = (SELECT id FROM auth.users WHERE email = 'barber@demo.com');
