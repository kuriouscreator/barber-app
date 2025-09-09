-- Fix common subscription issues
-- Run these queries in your Supabase SQL Editor

-- 1. Clear all scheduled changes (if they're causing issues)
UPDATE user_subscriptions 
SET 
  scheduled_plan_name = NULL,
  scheduled_price_id = NULL,
  scheduled_effective_date = NULL,
  updated_at = NOW()
WHERE scheduled_plan_name IS NOT NULL;

-- 2. Remove duplicate subscriptions (keep only the most recent)
WITH ranked_subscriptions AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM user_subscriptions
)
DELETE FROM user_subscriptions 
WHERE (user_id, updated_at) IN (
  SELECT user_id, updated_at 
  FROM ranked_subscriptions 
  WHERE rn > 1
);

-- 3. Fix any subscriptions with incorrect status
-- (Change 'canceled' to 'active' if the subscription should be active)
UPDATE user_subscriptions 
SET 
  status = 'active',
  updated_at = NOW()
WHERE status = 'canceled' 
AND current_period_end > NOW();

-- 4. Verify the fixes
SELECT 
  user_id,
  plan_name,
  stripe_price_id,
  status,
  scheduled_plan_name,
  updated_at
FROM user_subscriptions
ORDER BY updated_at DESC;
