-- Barber Notifications / Activity feed for barber dashboard
-- Notifications are created by triggers (appointments, profiles) and Stripe webhook.

-- Table
CREATE TABLE IF NOT EXISTS barber_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN (
    'appointment.booked',
    'appointment.canceled',
    'subscription.upgraded',
    'subscription.downgraded',
    'customer.signed_up'
  )),
  title TEXT NOT NULL,
  body TEXT NULL,
  entity_type TEXT NULL CHECK (entity_type IN ('appointment', 'subscription', 'customer')),
  entity_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ NULL,
  metadata JSONB NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_barber_notifications_barber_created
  ON barber_notifications(barber_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_barber_notifications_barber_read
  ON barber_notifications(barber_id, read_at);

-- RLS
ALTER TABLE barber_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbers can view their own notifications"
  ON barber_notifications FOR SELECT
  USING (auth.uid() = barber_id);

CREATE POLICY "Barbers can update read_at on their notifications"
  ON barber_notifications FOR UPDATE
  USING (auth.uid() = barber_id)
  WITH CHECK (auth.uid() = barber_id);

-- No INSERT policy for barbers; inserts are done by triggers (SECURITY DEFINER) or service role.

COMMENT ON TABLE barber_notifications IS 'Activity feed for barber dashboard; populated by triggers and Stripe webhook';

-- Enable Realtime for barber_notifications (client subscribes to INSERTs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'barber_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE barber_notifications;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Publication may not exist in all environments
END $$;

-- =============================================================================
-- Trigger: appointment booked (AFTER INSERT on appointments)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_barber_appointment_booked()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_display_name TEXT;
  time_label TEXT;
  meta JSONB;
BEGIN
  -- Resolve customer name: booking -> profiles.full_name, walk_in -> customer_name
  IF NEW.appointment_type = 'walk_in' OR NEW.user_id IS NULL THEN
    customer_display_name := COALESCE(NEW.customer_name, 'Walk-In Customer');
  ELSE
    SELECT COALESCE(full_name, 'Customer') INTO customer_display_name
    FROM profiles WHERE id = NEW.user_id LIMIT 1;
  END IF;

  -- Format time (HH24:MI -> 12h)
  time_label := to_char(
    (NEW.appointment_date || ' ' || COALESCE(NEW.appointment_time, '00:00'))::timestamp,
    'HH12:MI AM'
  );

  meta := jsonb_build_object(
    'customerName', customer_display_name,
    'startTime', NEW.appointment_time,
    'serviceName', COALESCE(NEW.service_name, '')
  );

  INSERT INTO barber_notifications (
    barber_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.barber_id,
    'appointment.booked',
    'New appointment booked',
    customer_display_name || ' • ' || time_label,
    'appointment',
    NEW.id::TEXT,
    meta
  );
  RETURN NEW;
END;
$$;

-- =============================================================================
-- Trigger: appointment canceled (AFTER UPDATE OF status on appointments)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_barber_appointment_canceled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_display_name TEXT;
  time_label TEXT;
  meta JSONB;
BEGIN
  IF NEW.status IS DISTINCT FROM 'cancelled' OR OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.appointment_type = 'walk_in' OR NEW.user_id IS NULL THEN
    customer_display_name := COALESCE(NEW.customer_name, 'Walk-In Customer');
  ELSE
    SELECT COALESCE(full_name, 'Customer') INTO customer_display_name
    FROM profiles WHERE id = NEW.user_id LIMIT 1;
  END IF;

  time_label := to_char(
    (NEW.appointment_date || ' ' || COALESCE(NEW.appointment_time, '00:00'))::timestamp,
    'HH12:MI AM'
  );

  meta := jsonb_build_object(
    'customerName', customer_display_name,
    'startTime', NEW.appointment_time,
    'serviceName', COALESCE(NEW.service_name, '')
  );

  INSERT INTO barber_notifications (
    barber_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.barber_id,
    'appointment.canceled',
    'Appointment canceled',
    customer_display_name || ' • ' || time_label,
    'appointment',
    NEW.id::TEXT,
    meta
  );
  RETURN NEW;
END;
$$;

-- =============================================================================
-- Trigger: new customer signed up (AFTER INSERT on profiles)
-- =============================================================================
CREATE OR REPLACE FUNCTION notify_barber_customer_signed_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bid UUID;
BEGIN
  -- Only for customer role (non-barber signups)
  IF NEW.role IS NULL OR NEW.role = 'barber' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO bid FROM profiles WHERE role = 'barber' LIMIT 1;
  IF bid IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO barber_notifications (
    barber_id,
    type,
    title,
    body,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    bid,
    'customer.signed_up',
    'New customer joined',
    COALESCE(NEW.full_name, 'New customer'),
    'customer',
    NEW.id::TEXT,
    jsonb_build_object('customerName', COALESCE(NEW.full_name, 'New customer'))
  );
  RETURN NEW;
END;
$$;

-- Attach triggers
DROP TRIGGER IF EXISTS barber_notify_appointment_booked ON appointments;
CREATE TRIGGER barber_notify_appointment_booked
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_barber_appointment_booked();

DROP TRIGGER IF EXISTS barber_notify_appointment_canceled ON appointments;
CREATE TRIGGER barber_notify_appointment_canceled
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_barber_appointment_canceled();

DROP TRIGGER IF EXISTS barber_notify_customer_signed_up ON profiles;
CREATE TRIGGER barber_notify_customer_signed_up
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_barber_customer_signed_up();
