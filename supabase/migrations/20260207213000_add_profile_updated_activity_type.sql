-- Add 'profile_updated' to the activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'profile_updated';
