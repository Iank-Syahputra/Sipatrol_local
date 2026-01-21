-- ================
-- SiPatrol Database Schema Setup
-- ================

-- ================
-- 1. CLEAN-UP (OPTIONAL - Beware data loss)
-- =================
-- Remove comment below if you want to reset database from scratch

-- DROP TABLE IF EXISTS reports;
-- DROP TABLE IF EXISTS profiles;
-- DROP TABLE IF EXISTS units;
-- DROP TYPE IF EXISTS app_role;

-- 2. DATA TYPE SETUP (ENUM)
-- =====
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===============
-- 3. TABLE CREATION (MANDATORY ORDER)

-- A. Units Table (Parent 1: Has no FK)
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Profiles Table (Parent 2: Has FK to Units)
-- ID is Text because it takes string from Clerk
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role app_role DEFAULT 'security',
    assigned_unit_id UUID REFERENCES units (id) ON DELETE SET NULL,
    username TEXT UNIQUE,           -- For login
    phone_number TEXT,              -- For WA
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. Reports Table (Child: Has FK to Profiles & Units)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    image_path TEXT,
    notes TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    category_id UUID REFERENCES report_categories(id) ON DELETE SET NULL,
    location_id UUID REFERENCES unit_locations(id) ON DELETE SET NULL,
    captured_at TIMESTAMPTZ NOT NULL,
    is_offline_submission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS (ACTIVATE SECURITY)
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 5. CREATE POLICY (GROUND RULES)
-- =============================================

-- POLICY FOR UNITS
-- Delete old policy if exists to avoid duplicate error
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON units;

CREATE POLICY "Enable read access for authenticated users" ON units
FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- --- POLICY FOR PROFILES ---
DROP POLICY IF EXISTS "User can see own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can see all profiles" ON profiles;

CREATE POLICY "User can see own profile" ON profiles
FOR SELECT USING (
    (auth.jwt() ->> 'sub') = id
);

CREATE POLICY "Admin can see all profiles" ON profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
);

-- POLICY FOR REPORTS
DROP POLICY IF EXISTS "Security can insert own reports" ON reports;
DROP POLICY IF EXISTS "Security can view own reports" ON reports;
DROP POLICY IF EXISTS "Admin can view all reports" ON reports;

-- Security: Insert (Must use own ID)
CREATE POLICY "Security can insert own reports" ON reports
FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'sub') = user_id
);

-- Security: View own
CREATE POLICY "Security can view own reports" ON reports
FOR SELECT USING (
    (auth.jwt() ->> 'sub') = user_id
);

-- Admin: View all
CREATE POLICY "Admin can view all reports" ON reports
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = (auth.jwt() ->> 'sub')
        AND role = 'admin'
    )
);

-- Enable RLS for new tables
ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_locations ENABLE ROW LEVEL SECURITY;

-- Policies for report_categories
CREATE POLICY "Enable read access for authenticated users" ON report_categories
FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- Policies for unit_locations
CREATE POLICY "Enable read access for authenticated users" ON unit_locations
FOR SELECT USING (
    auth.role() = 'authenticated'
);

-- Insert sample units for testing
INSERT INTO units (name, district) VALUES
('PLN UP 1 Kendari', 'Kendari'),
('PLN UP 2 Kendari', 'Kendari'),
('PLN UP 3 Kendari', 'Kendari'),
('PLN UP 4 Kendari', 'Kendari'),
('PLN UP 5 Kendari', 'Kendari'),
('PLN UP 6 Kendari', 'Kendari'),
('PLN UP 7 Kendari', 'Kendari'),
('PLN UP 8 Kendari', 'Kendari'),
('PLN UP 9 Kendari', 'Kendari'),
('PLN UP 10 Kendari', 'Kendari'),
('PLN UP 11 Kendari', 'Kendari'),
('PLN UP 12 Kendari', 'Kendari'),
('PLN UP 13 Kendari', 'Kendari'),
('PLN UP 14 Kendari', 'Kendari'),
('PLN UP 15 Kendari', 'Kendari')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO report_categories (name, description) VALUES
('safe', 'Laporan aman/safe'),
('unsafe', 'Laporan tidak aman/unsafe'),
('maintenance_needed', 'Dibutuhkan pemeliharaan'),
('incident_report', 'Laporan insiden')
ON CONFLICT (name) DO NOTHING;

-- Insert default locations for all units
DO $$
DECLARE
    unit_record RECORD;
BEGIN
    FOR unit_record IN SELECT id, name FROM units LOOP
        INSERT INTO unit_locations (unit_id, name, description) VALUES
        (unit_record.id, 'Gerbang Utama', 'Pintu masuk utama area ' || unit_record.name),
        (unit_record.id, 'Ruang Kontrol', 'Ruang kendali utama ' || unit_record.name),
        (unit_record.id, 'Ruang Server', 'Ruang server ' || unit_record.name),
        (unit_record.id, 'Ruang Generator', 'Ruang generator ' || unit_record.name),
        (unit_record.id, 'Area Parkir', 'Area parkir ' || unit_record.name)
        ON CONFLICT (unit_id, name) DO NOTHING;
    END LOOP;
END $$;