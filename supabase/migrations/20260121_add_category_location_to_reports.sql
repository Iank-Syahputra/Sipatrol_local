-- Add category and location columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES report_categories(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES unit_locations(id) ON DELETE SET NULL;

-- Create report_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS report_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unit_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS unit_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    floor_number INTEGER,
    building_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories if they don't exist
INSERT INTO report_categories (name, description) VALUES
('safe', 'Laporan aman/safe'),
('unsafe', 'Laporan tidak aman/unsafe'),
('maintenance_needed', 'Dibutuhkan pemeliharaan'),
('incident_report', 'Laporan insiden')
ON CONFLICT (name) DO NOTHING;

-- Insert default locations for all units if they don't exist
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