-- Simple script to add a test past appointment
-- Run this in your Supabase SQL editor

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
  credits_used
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'customer@demo.com'),
  (SELECT id FROM auth.users WHERE email = 'barber@demo.com'),
  'service-1',
  'Haircut & Beard Trim',
  45,
  60.00,
  CURRENT_DATE - INTERVAL '3 days',
  '14:30:00',
  'completed',
  'Please keep it professional',
  '123 Main St, San Francisco, CA',
  'Credit Card',
  1
);
