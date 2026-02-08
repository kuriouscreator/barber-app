-- Add interval field to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS interval TEXT CHECK (interval IN ('month', 'year'));

-- Update existing subscriptions based on plan_catalog
UPDATE user_subscriptions us
SET interval = pc.interval
FROM plan_catalog pc
WHERE us.stripe_price_id = pc.stripe_price_id
  AND us.interval IS NULL;
