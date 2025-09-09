-- Test the cut tracking system
-- Run these queries in your Supabase SQL Editor to verify everything works

-- 1. Check current subscription status
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

-- 2. Check current appointments
SELECT 
  a.id,
  a.user_id,
  a.status,
  a.appointment_date,
  a.cuts_used,
  a.created_at
FROM appointments a
WHERE a.user_id = '154fd463-0717-44ac-8b14-c160ebfc6f97' -- Replace with your user ID
ORDER BY a.appointment_date DESC;

-- 3. Test the new cut tracking functions
SELECT 
  public.get_user_remaining_cuts('154fd463-0717-44ac-8b14-c160ebfc6f97'::UUID) as remaining_cuts,
  public.can_user_book_appointment('154fd463-0717-44ac-8b14-c160ebfc6f97'::UUID) as can_book;

-- 4. Check the subscription status view
SELECT * FROM public.user_subscription_status 
WHERE user_id = '154fd463-0717-44ac-8b14-c160ebfc6f97';

-- 5. If you have an appointment, test cancellation
-- Replace with actual appointment ID
/*
SELECT public.handle_appointment_cancellation(
  'APPOINTMENT_ID'::UUID, 
  '154fd463-0717-44ac-8b14-c160ebfc6f97'::UUID
) as cuts_restored;
*/

-- 6. Verify the trigger works by trying to create an appointment when no cuts available
-- This should fail if you have 0 cuts remaining
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
  '154fd463-0717-44ac-8b14-c160ebfc6f97'::UUID,
  '7d26e322-955c-4e7c-a108-260dd69c0b8f'::UUID,
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
