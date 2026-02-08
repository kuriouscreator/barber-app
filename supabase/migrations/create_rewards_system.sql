-- Rewards System Schema
-- This migration creates all tables needed for the points-based rewards system

-- Rewards points ledger (tracks all point transactions)
CREATE TABLE IF NOT EXISTS reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'redeemed', 'expired')) NOT NULL,
  source TEXT CHECK (source IN ('monthly_loyalty', 'referral', 'anniversary', 'signup_bonus', 'manual')) NOT NULL,
  description TEXT,
  reference_id UUID, -- links to subscription, referral, or reward redemption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Available rewards catalog
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT CHECK (category IN ('service', 'flexibility', 'product', 'experiential')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES rewards_catalog(id) NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')) DEFAULT 'pending',
  redemption_code VARCHAR(50) UNIQUE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID, -- optional link to booking
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User referral codes (one per user)
CREATE TABLE IF NOT EXISTS user_referral_codes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to profiles table for rewards tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_anniversary_reward TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_points_user_id ON reward_points(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_points_created_at ON reward_points(created_at);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Enable Row Level Security
ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_points
CREATE POLICY "Users can view their own points"
  ON reward_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert points"
  ON reward_points FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards_catalog
CREATE POLICY "Anyone can view active rewards"
  ON rewards_catalog FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage rewards catalog"
  ON rewards_catalog FOR ALL
  USING (true);

-- RLS Policies for reward_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON reward_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own redemptions"
  ON reward_redemptions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they're part of"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage referrals"
  ON referrals FOR ALL
  USING (true);

-- RLS Policies for user_referral_codes
CREATE POLICY "Users can view their own referral code"
  ON user_referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON user_referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate user's current points balance
CREATE OR REPLACE FUNCTION get_user_points_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    SUM(CASE
      WHEN transaction_type = 'earned' THEN points
      ELSE -points
    END),
    0
  )::INTEGER
  FROM reward_points
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code on user signup
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM user_referral_codes WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO user_referral_codes (user_id, referral_code)
  VALUES (NEW.id, new_code);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create referral code for new users
CREATE TRIGGER on_user_created_create_referral_code
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- Seed initial rewards catalog
INSERT INTO rewards_catalog (name, description, points_cost, category, is_active, terms) VALUES
  ('Free Beard Trim', 'Complimentary beard trim or lineup on your next visit', 1500, 'service', true, 'Valid for 90 days. Must be redeemed during appointment booking.'),
  ('Hot Towel Treatment', 'Premium hot towel service add-on', 1000, 'service', true, 'Can be added to any haircut service. Valid for 90 days.'),
  ('Priority Booking', 'Skip the waitlist for your next appointment', 2000, 'flexibility', true, 'One-time use. Book during peak hours without waiting.'),
  ('Guest Pass', 'Bring a friend for 50% off their cut', 2500, 'flexibility', true, 'Friend must be a new customer. Valid for 90 days.'),
  ('Scalp Massage', 'Relaxing scalp massage during your service', 800, 'service', true, 'Added to any haircut appointment.'),
  ('VIP Appointment', 'Extended time slot with premium setup', 3000, 'experiential', true, 'Includes extended service time and complimentary beverages.')
ON CONFLICT DO NOTHING;

-- Create a view for easy points balance lookup
CREATE OR REPLACE VIEW user_points_summary AS
SELECT
  p.id as user_id,
  p.email,
  p.full_name,
  COALESCE(get_user_points_balance(p.id), 0) as current_balance,
  p.total_points as lifetime_points,
  p.subscription_start_date,
  p.last_anniversary_reward
FROM profiles p;

COMMENT ON TABLE reward_points IS 'Ledger of all reward point transactions';
COMMENT ON TABLE rewards_catalog IS 'Available rewards that users can redeem';
COMMENT ON TABLE reward_redemptions IS 'Track user reward redemptions';
COMMENT ON TABLE referrals IS 'Track referral relationships and rewards';
COMMENT ON TABLE user_referral_codes IS 'Unique referral code for each user';
