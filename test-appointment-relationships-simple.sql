-- Simple Test for Appointment Service Relationships
-- This script tests the basic functionality without relying on views

-- 1. Check appointments table structure
SELECT 
  'Appointments table columns:' as test_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check services table structure
SELECT 
  'Services table columns:' as test_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Test service relationships
SELECT 
  'Service relationships test:' as test_name,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  s.price,
  s.is_active,
  p.email as barber_email
FROM services s
JOIN profiles p ON s.barber_id::text = p.id::text
WHERE s.is_active = true
ORDER BY s.name;

-- 4. Test appointment with service details (direct join)
SELECT 
  'Appointment with service details test:' as test_name,
  a.id as appointment_id,
  a.service_name,
  a.service_duration,
  a.service_price,
  a.cuts_used,
  a.status,
  s.name as service_table_name,
  s.duration_minutes as service_table_duration,
  s.price as service_table_price
FROM appointments a
LEFT JOIN services s ON a.service_id::text = s.id::text
ORDER BY a.created_at DESC
LIMIT 5;

-- 5. Test cut tracking functions
DO $$
DECLARE
    test_user_id UUID;
    remaining_cuts INTEGER;
    can_book BOOLEAN;
BEGIN
    -- Get a test user (customer)
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE email = 'customer@demo.com';
    
    IF test_user_id IS NOT NULL THEN
        -- Test get_user_remaining_cuts function
        SELECT public.get_user_remaining_cuts(test_user_id) INTO remaining_cuts;
        RAISE NOTICE 'User % has % cuts remaining', test_user_id, remaining_cuts;
        
        -- Test can_user_book_appointment function
        SELECT public.can_user_book_appointment(test_user_id) INTO can_book;
        RAISE NOTICE 'User % can book appointment: %', test_user_id, can_book;
    ELSE
        RAISE NOTICE 'Test user customer@demo.com not found';
    END IF;
END $$;

-- 6. Test subscription status view
SELECT 
  'Subscription status view test:' as test_name,
  user_id,
  plan_name,
  status,
  cuts_included,
  cuts_used,
  cuts_remaining,
  can_book,
  days_until_renewal
FROM user_subscription_status
LIMIT 5;

-- 7. Check for any data inconsistencies
SELECT 
  'Data consistency check:' as test_name,
  'Appointments without service_id' as issue,
  COUNT(*) as count
FROM appointments 
WHERE service_id IS NULL

UNION ALL

SELECT 
  'Data consistency check:' as test_name,
  'Appointments without service_name' as issue,
  COUNT(*) as count
FROM appointments 
WHERE service_name IS NULL

UNION ALL

SELECT 
  'Data consistency check:' as test_name,
  'Appointments without cuts_used' as issue,
  COUNT(*) as count
FROM appointments 
WHERE cuts_used IS NULL

UNION ALL

SELECT 
  'Data consistency check:' as test_name,
  'Services without barber_id' as issue,
  COUNT(*) as count
FROM services 
WHERE barber_id IS NULL;
