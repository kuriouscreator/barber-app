-- Add a past appointment for testing the review system
-- This will create a completed appointment that can be reviewed

-- First, let's get the customer user ID
-- Replace 'customer@demo.com' with your actual customer email if different
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
  'service-1',
  'Haircut & Beard Trim',
  45,
  60.00,
  CURRENT_DATE - INTERVAL '3 days', -- 3 days ago
  '14:30:00',
  'completed', -- Mark as completed so it can be reviewed
  'Please keep it professional',
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- Verify the appointment was created
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
WHERE u.email = 'customer@demo.com'
ORDER BY a.created_at DESC
LIMIT 5;
