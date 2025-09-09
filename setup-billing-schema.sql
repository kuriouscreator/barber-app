-- Stripe Billing Integration Schema
-- Run these commands in your Supabase SQL Editor after the main database_schema.sql

-- Products/Plans are defined in Stripe. We mirror minimal plan info locally.
CREATE TABLE IF NOT EXISTS public.plan_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cuts_included_per_period INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month','year')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Supabase user -> Stripe customer
CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription state tracked per user (replaces the old subscriptions table)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','trialing','past_due','canceled','incomplete','unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cuts_included INTEGER NOT NULL,
  cuts_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plan_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (read own; admin broader if needed)
CREATE POLICY "users read own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users read plan catalog" ON plan_catalog
  FOR SELECT USING (true);

CREATE POLICY "users read own billing customer" ON billing_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for webhook handling (Edge Functions will use service role)
CREATE POLICY "service role can manage subscriptions" ON user_subscriptions
  FOR ALL USING (true);

CREATE POLICY "service role can manage billing customers" ON billing_customers
  FOR ALL USING (true);

CREATE POLICY "service role can manage plan catalog" ON plan_catalog
  FOR ALL USING (true);

-- Function to safely increment cuts_used
CREATE OR REPLACE FUNCTION public.increment_cuts_used(
  p_user_id UUID,
  p_appointment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_appointment RECORD;
BEGIN
  -- Get the appointment details
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id AND customer_id = p_user_id AND status = 'completed';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_start <= NOW()
    AND current_period_end >= NOW()
    AND cuts_used < cuts_included;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Increment cuts_used
  UPDATE user_subscriptions
  SET cuts_used = cuts_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_cuts_used(UUID, UUID) TO authenticated;

-- Sample plan data (you'll need to replace with actual Stripe Product/Price IDs)
INSERT INTO plan_catalog (stripe_product_id, stripe_price_id, name, cuts_included_per_period, interval) VALUES
  ('prod_basic', 'price_basic_monthly', 'Basic Plan', 4, 'month'),
  ('prod_premium', 'price_premium_monthly', 'Premium Plan', 8, 'month'),
  ('prod_vip', 'price_vip_monthly', 'VIP Plan', 12, 'month')
ON CONFLICT (stripe_price_id) DO NOTHING;
