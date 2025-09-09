-- Debug SQL script to investigate subscription plan changes
-- Run this in your Supabase SQL Editor

-- 1. Check all subscription records
SELECT 
  user_id,
  plan_name,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  cuts_used,
  cuts_included,
  scheduled_plan_name,
  scheduled_price_id,
  scheduled_effective_date,
  created_at,
  updated_at
FROM user_subscriptions
ORDER BY updated_at DESC;

-- 2. Check for duplicate subscriptions
SELECT 
  user_id,
  COUNT(*) as subscription_count,
  STRING_AGG(plan_name, ', ') as plans,
  STRING_AGG(stripe_price_id, ', ') as price_ids
FROM user_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 3. Check for scheduled changes
SELECT 
  user_id,
  plan_name as current_plan,
  scheduled_plan_name,
  scheduled_price_id,
  scheduled_effective_date,
  CASE 
    WHEN scheduled_effective_date < NOW() THEN 'PAST DUE'
    WHEN scheduled_effective_date > NOW() THEN 'FUTURE'
    ELSE 'TODAY'
  END as schedule_status
FROM user_subscriptions
WHERE scheduled_plan_name IS NOT NULL
ORDER BY scheduled_effective_date;

-- 4. Check for recent updates (last 24 hours)
SELECT 
  user_id,
  plan_name,
  stripe_price_id,
  status,
  updated_at
FROM user_subscriptions
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- 5. Check billing customers table
SELECT 
  user_id,
  stripe_customer_id,
  created_at,
  updated_at
FROM billing_customers
ORDER BY updated_at DESC;

-- 6. Check plan catalog
SELECT 
  id,
  stripe_product_id,
  stripe_price_id,
  name,
  cuts_included_per_period,
  interval,
  active
FROM plan_catalog
ORDER BY name;