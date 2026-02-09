-- Migration: Fix Barber Appointments RLS Policies
-- Description: Tighten RLS policies to ensure barbers can only view/update their own appointments
-- Date: 2026-02-09

-- Drop existing policies that may be too permissive
DROP POLICY IF EXISTS "Barber can view assigned appointments" ON appointments;
DROP POLICY IF EXISTS "Barber can update assigned appointments" ON appointments;

-- Create strict policy for barbers to view only their own appointments
CREATE POLICY "Barber can view their appointments" ON appointments
  FOR SELECT
  USING (auth.uid() = barber_id);

-- Create strict policy for barbers to update only their own appointments
CREATE POLICY "Barber can update their appointments" ON appointments
  FOR UPDATE
  USING (auth.uid() = barber_id)
  WITH CHECK (auth.uid() = barber_id);

-- Add index for better query performance on barber appointments list
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date_status
  ON appointments(barber_id, appointment_date, status);

-- Add comment for documentation
COMMENT ON POLICY "Barber can view their appointments" ON appointments IS
  'Allows barbers to view only appointments where they are assigned as the barber';

COMMENT ON POLICY "Barber can update their appointments" ON appointments IS
  'Allows barbers to update only their own appointments (status changes, etc.)';
