-- Add a canceled appointment for testing the new canceled tab
-- This will create a canceled appointment that should appear in the canceled tab

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
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-2',
  'Beard Trim Only',
  30,
  25.00,
  CURRENT_DATE - INTERVAL '2 days', -- 2 days ago
  '10:00:00',
  'cancelled', -- Mark as cancelled
  'Customer had to cancel due to emergency',
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day' -- Updated when cancelled
);

-- Verify the canceled appointment was created
SELECT 
  a.id,
  a.service_name,
  a.appointment_date,
  a.appointment_time,
  a.status,
  u.email as customer_email,
  b.email as barber_email
FROM appointments a
JOIN auth.users u ON a.user_id = u.id
JOIN auth.users b ON a.barber_id = b.id
WHERE u.email = 'customer@demo.com' AND a.status = 'cancelled'
ORDER BY a.created_at DESC
LIMIT 5;
