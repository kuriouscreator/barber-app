-- Add 'appointment_rescheduled' to the activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'appointment_rescheduled';
