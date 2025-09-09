-- Test the subscription-appointment connection functions
-- Run these queries in your Supabase SQL Editor

-- 1. Check if we have any users with active subscriptions
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

-- 3. Test the subscription status view
SELECT * FROM public.user_subscription_status LIMIT 5;

-- 4. If you have a user with an active subscription, test the remaining cuts function
-- Replace 'YOUR_USER_ID' with an actual user ID from step 1
/*
SELECT public.get_user_remaining_cuts('YOUR_USER_ID'::UUID) as remaining_cuts;
*/

-- 5. Test the can book function for a specific user
-- Replace 'YOUR_USER_ID' with an actual user ID from step 1
/*
SELECT public.can_user_book_appointment('YOUR_USER_ID'::UUID) as can_book;
*/
