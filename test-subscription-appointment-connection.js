// Test script to verify subscription and appointment connection
// Run this in your Supabase SQL Editor to test the new functions

-- 1. First, let's check if we have any test users with subscriptions
SELECT 
  us.user_id,
  us.plan_name,
  us.cuts_included,
  us.cuts_used,
  us.status,
  us.current_period_start,
  us.current_period_end
FROM user_subscriptions us
WHERE us.status IN ('active', 'trialing')
LIMIT 5;

-- 2. Check if we have any appointments
SELECT 
  a.id,
  a.user_id,
  a.status,
  a.appointment_date,
  a.cuts_used
FROM appointments a
WHERE a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date DESC
LIMIT 5;

-- 3. Test the remaining cuts function for a specific user
-- Replace 'YOUR_USER_ID' with an actual user ID from step 1
/*
SELECT public.get_user_remaining_cuts('YOUR_USER_ID'::UUID) as remaining_cuts;
*/

-- 4. Test the can book function for a specific user
-- Replace 'YOUR_USER_ID' with an actual user ID from step 1
/*
SELECT public.can_user_book_appointment('YOUR_USER_ID'::UUID) as can_book;
*/

-- 5. Check the subscription status view
SELECT * FROM public.user_subscription_status LIMIT 5;

-- 6. Test appointment cancellation (replace with actual appointment ID)
-- This will only work if the appointment exists and belongs to the user
/*
SELECT public.handle_appointment_cancellation('APPOINTMENT_ID'::UUID, 'USER_ID'::UUID) as cuts_restored;
*/

-- 7. Create a test appointment to verify the trigger works
-- This will fail if the user has no remaining cuts
/*
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
  cuts_used
) VALUES (
  'USER_ID'::UUID,
  'BARBER_ID'::UUID,
  'test-service',
  'Test Service',
  30,
  25.00,
  CURRENT_DATE + INTERVAL '7 days',
  '10:00:00',
  'scheduled',
  1
);
*/

console.log('Test script ready. Uncomment the sections you want to test with actual user/appointment IDs.');
