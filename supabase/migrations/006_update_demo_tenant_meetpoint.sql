-- ===========================================
-- Update Demo Tenant to MeetPoint
-- ===========================================
-- Run this to update existing demo tenant to meetpoint.pro domain

UPDATE tenants
SET
    name = 'MeetPoint',
    slug = 'meetpoint',
    domain = 'meetpoint.pro'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Update admin email
UPDATE users
SET
    email = 'admin@meetpoint.pro',
    full_name = 'MeetPoint Admin'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Update test user email
UPDATE users
SET
    email = 'user@meetpoint.pro',
    full_name = 'Test User'
WHERE id = '00000000-0000-0000-0000-000000000003';
