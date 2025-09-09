-- Add sample services to the database
-- Run this in your Supabase SQL Editor to populate the services table

-- First, let's get the barber user ID
-- Replace 'barber@demo.com' with your actual barber email
DO $$
DECLARE
    barber_user_id UUID;
BEGIN
    -- Get the barber user ID
    SELECT id INTO barber_user_id 
    FROM auth.users 
    WHERE email = 'barber@demo.com';
    
    IF barber_user_id IS NOT NULL THEN
        -- Insert sample services
        INSERT INTO services (barber_id, name, description, duration_minutes, price, is_active) VALUES
        (barber_user_id, 'Classic Haircut', 'Traditional haircut with scissors and clippers', 30, 25.00, true),
        (barber_user_id, 'Premium Package', 'Haircut + beard trim + styling', 45, 40.00, true),
        (barber_user_id, 'Beard Trim', 'Professional beard trimming and shaping', 20, 15.00, true),
        (barber_user_id, 'Hair Styling', 'Hair styling and finishing', 15, 10.00, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample services added for barber: %', barber_user_id;
    ELSE
        RAISE NOTICE 'Barber user not found. Please check the email address.';
    END IF;
END $$;

-- Verify the services were added
SELECT 
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.is_active,
    p.email as barber_email
FROM services s
JOIN profiles p ON s.barber_id = p.id
WHERE s.is_active = true
ORDER BY s.name;
