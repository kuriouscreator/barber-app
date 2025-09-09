-- Clean up duplicate services
-- This script will keep only the first (oldest) service of each name and remove duplicates

-- First, let's see what we have
SELECT 
    name,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as service_ids
FROM services 
WHERE is_active = true
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- Delete duplicate services, keeping only the oldest one of each name
WITH duplicate_services AS (
    SELECT 
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM services 
    WHERE is_active = true
)
DELETE FROM services 
WHERE id IN (
    SELECT id 
    FROM duplicate_services 
    WHERE rn > 1
);

-- Verify the cleanup worked
SELECT 
    s.id,
    s.name,
    s.description,
    s.duration_minutes,
    s.price,
    s.is_active,
    s.created_at,
    p.email as barber_email
FROM services s
JOIN profiles p ON s.barber_id = p.id
WHERE s.is_active = true
ORDER BY s.name;

-- Show count of remaining services
SELECT 
    COUNT(*) as total_services,
    COUNT(DISTINCT name) as unique_service_names
FROM services 
WHERE is_active = true;
