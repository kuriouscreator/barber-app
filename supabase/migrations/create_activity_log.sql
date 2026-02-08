-- Activity Log System Schema
-- This migration creates the activity logging system for tracking user events

-- Create activity type enum
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'appointment_completed',
    'appointment_confirmed',
    'appointment_cancelled',
    'reward_earned',
    'reward_redeemed',
    'membership_renewed',
    'membership_upgraded',
    'membership_cancelled',
    'referral_completed',
    'points_expired',
    'payment_successful',
    'payment_failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  icon_type VARCHAR(50),
  badge_text VARCHAR(50),
  badge_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created
  ON user_activities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_type
  ON user_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_user_activities_created
  ON user_activities(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activities"
  ON user_activities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update activities"
  ON user_activities FOR UPDATE
  USING (true);

-- Helper function to get recent activities
CREATE OR REPLACE FUNCTION get_recent_activities(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  activity_type activity_type,
  title VARCHAR(255),
  description TEXT,
  metadata JSONB,
  icon_type VARCHAR(50),
  badge_text VARCHAR(50),
  badge_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ua.id,
    ua.activity_type,
    ua.title,
    ua.description,
    ua.metadata,
    ua.icon_type,
    ua.badge_text,
    ua.badge_color,
    ua.created_at
  FROM user_activities ua
  WHERE ua.user_id = p_user_id
  ORDER BY ua.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get total activity count
CREATE OR REPLACE FUNCTION get_activity_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM user_activities
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

COMMENT ON TABLE user_activities IS 'User activity log tracking all key events';
COMMENT ON COLUMN user_activities.metadata IS 'Flexible JSON storage for activity-specific data';
COMMENT ON COLUMN user_activities.icon_type IS 'Icon identifier for UI display (e.g., checkmark, gift, calendar)';
COMMENT ON COLUMN user_activities.badge_text IS 'Optional badge text to display (e.g., +150, Review, Auto)';
COMMENT ON COLUMN user_activities.badge_color IS 'Badge color scheme (e.g., purple, blue, orange, green)';
