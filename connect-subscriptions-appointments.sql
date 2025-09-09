-- Connect Subscriptions and Appointments System
-- This script implements proper cut tracking for appointments

-- 1. First, let's ensure we have the proper appointment table structure
-- The appointments table should track cuts_used for each appointment
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cuts_used INTEGER DEFAULT 1;

-- 2. Create a function to check if user can book an appointment
CREATE OR REPLACE FUNCTION public.can_user_book_appointment(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_upcoming_appointments INTEGER;
  v_cuts_remaining INTEGER;
BEGIN
  -- Get current active subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_start <= NOW()
    AND current_period_end >= NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE; -- No active subscription
  END IF;
  
  -- Count upcoming appointments (scheduled, not completed/cancelled)
  SELECT COUNT(*) INTO v_upcoming_appointments
  FROM appointments
  WHERE user_id = p_user_id
    AND status IN ('scheduled', 'confirmed')
    AND appointment_date >= CURRENT_DATE;
  
  -- Calculate cuts remaining
  v_cuts_remaining := v_subscription.cuts_included - v_subscription.cuts_used - v_upcoming_appointments;
  
  RETURN v_cuts_remaining > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a function to get remaining cuts for a user
CREATE OR REPLACE FUNCTION public.get_user_remaining_cuts(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_subscription RECORD;
  v_upcoming_appointments INTEGER;
  v_cuts_remaining INTEGER;
BEGIN
  -- Get current active subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_start <= NOW()
    AND current_period_end >= NOW();
  
  IF NOT FOUND THEN
    RETURN 0; -- No active subscription
  END IF;
  
  -- Count upcoming appointments (scheduled, not completed/cancelled)
  SELECT COUNT(*) INTO v_upcoming_appointments
  FROM appointments
  WHERE user_id = p_user_id
    AND status IN ('scheduled', 'confirmed')
    AND appointment_date >= CURRENT_DATE;
  
  -- Calculate cuts remaining
  v_cuts_remaining := v_subscription.cuts_included - v_subscription.cuts_used - v_upcoming_appointments;
  
  RETURN GREATEST(0, v_cuts_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to handle appointment cancellation (restore cuts)
CREATE OR REPLACE FUNCTION public.handle_appointment_cancellation(
  p_appointment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_appointment RECORD;
  v_subscription RECORD;
  v_days_until_renewal INTEGER;
  v_can_restore BOOLEAN := FALSE;
BEGIN
  -- Get appointment details
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id 
    AND user_id = p_user_id
    AND status IN ('scheduled', 'confirmed');
  
  IF NOT FOUND THEN
    RETURN FALSE; -- Appointment not found or not cancellable
  END IF;
  
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND current_period_start <= NOW()
    AND current_period_end >= NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE; -- No active subscription
  END IF;
  
  -- Calculate days until renewal
  v_days_until_renewal := (v_subscription.current_period_end::DATE - CURRENT_DATE::DATE);
  
  -- Only restore cuts if there are enough days left in the billing period
  -- (e.g., at least 7 days to allow for rebooking)
  IF v_days_until_renewal >= 7 THEN
    v_can_restore := TRUE;
  END IF;
  
  -- Update appointment status to cancelled
  UPDATE appointments
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN v_can_restore;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a trigger to automatically update cuts_used when appointment status changes
CREATE OR REPLACE FUNCTION public.update_cuts_on_appointment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_subscription RECORD;
  v_upcoming_count INTEGER;
  v_cuts_remaining INTEGER;
BEGIN
  -- Only process if this is an appointment status change
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW; -- No status change, nothing to do
  END IF;
  
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = NEW.user_id
    AND status IN ('active', 'trialing')
    AND current_period_start <= NOW()
    AND current_period_end >= NOW();
  
  IF NOT FOUND THEN
    RETURN NEW; -- No active subscription, nothing to do
  END IF;
  
  -- Count upcoming appointments after this change
  SELECT COUNT(*) INTO v_upcoming_count
  FROM appointments
  WHERE user_id = NEW.user_id
    AND status IN ('scheduled', 'confirmed')
    AND appointment_date >= CURRENT_DATE;
  
  -- Calculate cuts remaining
  v_cuts_remaining := v_subscription.cuts_included - v_subscription.cuts_used - v_upcoming_count;
  
  -- If cuts remaining would be negative, prevent the change
  IF v_cuts_remaining < 0 AND NEW.status IN ('scheduled', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot book appointment: insufficient cuts remaining. You have % cuts remaining.', v_cuts_remaining;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_cuts_on_appointment_change ON appointments;
CREATE TRIGGER trigger_update_cuts_on_appointment_change
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cuts_on_appointment_change();

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.can_user_book_appointment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_remaining_cuts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_appointment_cancellation(UUID, UUID) TO authenticated;

-- 7. Create a view for easy subscription status checking
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  us.user_id,
  us.plan_name,
  us.status,
  us.cuts_included,
  us.cuts_used,
  us.current_period_start,
  us.current_period_end,
  public.get_user_remaining_cuts(us.user_id) as cuts_remaining,
  public.can_user_book_appointment(us.user_id) as can_book,
  (us.current_period_end::DATE - CURRENT_DATE::DATE) as days_until_renewal
FROM user_subscriptions us
WHERE us.status IN ('active', 'trialing')
  AND us.current_period_start <= NOW()
  AND us.current_period_end >= NOW();

-- Grant access to the view
GRANT SELECT ON public.user_subscription_status TO authenticated;

-- 8. Add RLS policy for the view
ALTER VIEW public.user_subscription_status SET (security_invoker = true);

-- 9. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date 
ON appointments(user_id, status, appointment_date) 
WHERE status IN ('scheduled', 'confirmed');

-- 10. Update existing appointments to have cuts_used = 1 by default
UPDATE appointments 
SET cuts_used = 1 
WHERE cuts_used IS NULL OR cuts_used = 0;
