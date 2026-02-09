-- Migration: Add Walk-In Appointment Support
-- Description: Allows barbers to manually add walk-in customers to their schedule
-- without requiring the customer to have an account

-- Step 1: Add new columns to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS appointment_type TEXT
    CHECK (appointment_type IN ('booking', 'walk_in'))
    DEFAULT 'booking';

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Step 2: Make user_id nullable to support walk-ins without accounts
ALTER TABLE appointments
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add constraint to ensure data integrity
-- Walk-ins must have customer_name, bookings must have user_id
ALTER TABLE appointments
  ADD CONSTRAINT appointment_type_data_integrity
  CHECK (
    (appointment_type = 'booking' AND user_id IS NOT NULL) OR
    (appointment_type = 'walk_in' AND customer_name IS NOT NULL)
  );

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);

-- Step 5: Update existing RLS policies and add new ones for walk-ins

-- Allow barbers to insert walk-in appointments
CREATE POLICY "Barbers can insert walk-in appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() = barber_id AND
    appointment_type = 'walk_in' AND
    user_id IS NULL
  );

-- Allow barbers to delete their walk-in appointments
CREATE POLICY "Barbers can delete walk-in appointments" ON appointments
  FOR DELETE
  USING (
    auth.uid() = barber_id AND
    appointment_type = 'walk_in'
  );

-- Allow barbers to update their walk-in appointments
CREATE POLICY "Barbers can update walk-in appointments" ON appointments
  FOR UPDATE
  USING (
    auth.uid() = barber_id AND
    appointment_type = 'walk_in'
  )
  WITH CHECK (
    auth.uid() = barber_id AND
    appointment_type = 'walk_in'
  );

-- Step 6: Update existing data to set appointment_type
-- All existing appointments are bookings (they have user_id)
UPDATE appointments
SET appointment_type = 'booking'
WHERE appointment_type IS NULL AND user_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN appointments.appointment_type IS 'Type of appointment: booking (online) or walk_in (created by barber)';
COMMENT ON COLUMN appointments.customer_name IS 'Customer name for walk-in appointments without user accounts';
COMMENT ON COLUMN appointments.customer_phone IS 'Optional phone number for walk-in customers';
