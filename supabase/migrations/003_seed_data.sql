-- ===========================================
-- SILENTBOX CLOUD - Seed Data
-- ===========================================
-- Demo tenant and sample data for development

-- ===========================================
-- CREATE DEMO TENANT
-- ===========================================
INSERT INTO tenants (id, name, slug, domain, primary_color, payment_providers, default_currency, default_timezone, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Silentbox Demo',
    'demo',
    'demo.silentbox.cloud',
    '#4F46E5',
    ARRAY['przelewy24', 'monobank'],
    'PLN',
    'Europe/Warsaw',
    '{
        "features": {
            "googleCalendar": true,
            "pushNotifications": true,
            "reviews": true
        },
        "booking": {
            "minDurationMinutes": 15,
            "maxDurationMinutes": 480,
            "advanceBookingDays": 30,
            "cancellationGracePeriodHours": 1
        }
    }'::jsonb
);

-- ===========================================
-- CREATE DEMO ADMIN USER
-- ===========================================
-- Password: demo123 (hashed with bcrypt)
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, credits, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.silentbox.cloud',
    '$2b$10$OXSiJDrpkIlxTChJQ6RR1u0OG4dRo6Ib.lxCQIcjFGY5IcTfrer6i', -- demo123
    'Demo Admin',
    'admin',
    1000.00,
    true
);

-- ===========================================
-- CREATE DEMO REGULAR USER
-- ===========================================
INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, credits, email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'user@demo.silentbox.cloud',
    '$2b$10$OXSiJDrpkIlxTChJQ6RR1u0OG4dRo6Ib.lxCQIcjFGY5IcTfrer6i', -- demo123
    'Demo User',
    'user',
    100.00,
    true
);

-- ===========================================
-- CREATE DEMO LOCATIONS
-- ===========================================
INSERT INTO locations (id, tenant_id, name, slug, description, address, city, country, latitude, longitude, timezone, amenities, opening_hours)
VALUES
(
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Warsaw Central Station',
    'warsaw-central',
    'Premium work booths at Warsaw Central Station, perfect for business travelers.',
    'Aleje Jerozolimskie 54',
    'Warsaw',
    'Poland',
    52.2297,
    21.0122,
    'Europe/Warsaw',
    ARRAY['wifi', 'power_outlet', 'air_conditioning', 'soundproof'],
    '{
        "monday": {"open": "06:00", "close": "22:00"},
        "tuesday": {"open": "06:00", "close": "22:00"},
        "wednesday": {"open": "06:00", "close": "22:00"},
        "thursday": {"open": "06:00", "close": "22:00"},
        "friday": {"open": "06:00", "close": "22:00"},
        "saturday": {"open": "08:00", "close": "20:00"},
        "sunday": {"open": "08:00", "close": "20:00"}
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Kyiv Gulliver Mall',
    'kyiv-gulliver',
    'Modern work spaces in the heart of Kyiv business district.',
    'Sportyvna Square 1A',
    'Kyiv',
    'Ukraine',
    50.4385,
    30.5228,
    'Europe/Kyiv',
    ARRAY['wifi', 'power_outlet', 'air_conditioning', 'usb_charger'],
    '{
        "monday": {"open": "09:00", "close": "21:00"},
        "tuesday": {"open": "09:00", "close": "21:00"},
        "wednesday": {"open": "09:00", "close": "21:00"},
        "thursday": {"open": "09:00", "close": "21:00"},
        "friday": {"open": "09:00", "close": "21:00"},
        "saturday": {"open": "10:00", "close": "20:00"},
        "sunday": {"open": "10:00", "close": "20:00"}
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'Krakow Airport',
    'krakow-airport',
    'Quiet work booths in Krakow Airport departure area.',
    'ul. Kapitana Mieczysława Medweckiego 1',
    'Krakow',
    'Poland',
    50.0777,
    19.7848,
    'Europe/Warsaw',
    ARRAY['wifi', 'power_outlet', 'air_conditioning', 'monitor', 'keyboard'],
    '{
        "monday": {"open": "05:00", "close": "23:00"},
        "tuesday": {"open": "05:00", "close": "23:00"},
        "wednesday": {"open": "05:00", "close": "23:00"},
        "thursday": {"open": "05:00", "close": "23:00"},
        "friday": {"open": "05:00", "close": "23:00"},
        "saturday": {"open": "05:00", "close": "23:00"},
        "sunday": {"open": "05:00", "close": "23:00"}
    }'::jsonb
);

-- ===========================================
-- CREATE DEMO BOOTHS
-- ===========================================
INSERT INTO booths (id, tenant_id, location_id, name, booth_number, capacity, price_per_15min, currency, amenities, status)
VALUES
-- Warsaw Central Station Booths
(
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Focus Pod 1',
    'WC-001',
    1,
    15.00,
    'PLN',
    ARRAY['desk', 'chair', 'power_outlet', 'usb_charger', 'led_light'],
    'available'
),
(
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Focus Pod 2',
    'WC-002',
    1,
    15.00,
    'PLN',
    ARRAY['desk', 'chair', 'power_outlet', 'usb_charger', 'led_light'],
    'available'
),
(
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000010',
    'Meeting Room 1',
    'WC-M01',
    4,
    40.00,
    'PLN',
    ARRAY['table', 'chairs', 'monitor', 'webcam', 'whiteboard'],
    'available'
),
-- Kyiv Gulliver Booths
(
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'Silent Box 1',
    'KG-001',
    1,
    150.00,
    'UAH',
    ARRAY['desk', 'chair', 'power_outlet', 'usb_charger'],
    'available'
),
(
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'Silent Box 2',
    'KG-002',
    1,
    150.00,
    'UAH',
    ARRAY['desk', 'chair', 'power_outlet', 'usb_charger'],
    'available'
),
-- Krakow Airport Booths
(
    '00000000-0000-0000-0000-000000000025',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000012',
    'Business Pod A',
    'KA-A01',
    1,
    20.00,
    'PLN',
    ARRAY['desk', 'chair', 'monitor', 'keyboard', 'webcam'],
    'available'
),
(
    '00000000-0000-0000-0000-000000000026',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000012',
    'Business Pod B',
    'KA-B01',
    1,
    20.00,
    'PLN',
    ARRAY['desk', 'chair', 'monitor', 'keyboard', 'webcam'],
    'available'
);

-- ===========================================
-- CREATE CREDIT PACKAGES
-- ===========================================
INSERT INTO credit_packages (tenant_id, name, description, credits, price, currency, bonus_credits, is_popular, sort_order)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Starter',
    '1 hour of booth time',
    60.00,
    55.00,
    'PLN',
    0,
    false,
    1
),
(
    '00000000-0000-0000-0000-000000000001',
    'Regular',
    '3 hours of booth time',
    180.00,
    150.00,
    'PLN',
    10.00,
    true,
    2
),
(
    '00000000-0000-0000-0000-000000000001',
    'Power User',
    '10 hours of booth time',
    600.00,
    450.00,
    'PLN',
    50.00,
    false,
    3
),
(
    '00000000-0000-0000-0000-000000000001',
    'Enterprise',
    '40 hours of booth time',
    2400.00,
    1600.00,
    'PLN',
    300.00,
    false,
    4
);

-- ===========================================
-- UKRAINIAN PRICING PACKAGES
-- ===========================================
INSERT INTO credit_packages (tenant_id, name, description, credits, price, currency, bonus_credits, is_popular, sort_order)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Стартовий',
    '1 година роботи',
    600.00,
    550.00,
    'UAH',
    0,
    false,
    10
),
(
    '00000000-0000-0000-0000-000000000001',
    'Стандартний',
    '3 години роботи',
    1800.00,
    1500.00,
    'UAH',
    100.00,
    true,
    11
),
(
    '00000000-0000-0000-0000-000000000001',
    'Про',
    '10 годин роботи',
    6000.00,
    4500.00,
    'UAH',
    500.00,
    false,
    12
);
