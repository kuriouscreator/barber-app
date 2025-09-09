-- Add scheduled change fields to user_subscriptions table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS scheduled_plan_name TEXT,
ADD COLUMN IF NOT EXISTS scheduled_price_id TEXT,
ADD COLUMN IF NOT EXISTS scheduled_effective_date TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.user_subscriptions.scheduled_plan_name IS 'Name of the plan that will be activated at the scheduled effective date';
COMMENT ON COLUMN public.user_subscriptions.scheduled_price_id IS 'Stripe price ID of the plan that will be activated at the scheduled effective date';
COMMENT ON COLUMN public.user_subscriptions.scheduled_effective_date IS 'Date when the scheduled plan change will take effect';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_scheduled_effective_date 
ON public.user_subscriptions(scheduled_effective_date) 
WHERE scheduled_effective_date IS NOT NULL;
