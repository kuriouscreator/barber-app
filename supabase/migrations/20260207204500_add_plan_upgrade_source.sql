-- Add 'plan_upgrade' to the allowed sources for reward_points
ALTER TABLE reward_points
DROP CONSTRAINT IF EXISTS reward_points_source_check;

ALTER TABLE reward_points
ADD CONSTRAINT reward_points_source_check
CHECK (source IN ('monthly_loyalty', 'referral', 'anniversary', 'signup_bonus', 'manual', 'plan_upgrade'));
