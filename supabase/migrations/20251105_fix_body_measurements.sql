-- Drop and recreate body_measurements table with correct structure
DROP TABLE IF EXISTS body_measurements CASCADE;

CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weight DECIMAL(6,2),
    arm_circumference DECIMAL(6,2),
    forearm_circumference DECIMAL(6,2),
    wrist_circumference DECIMAL(6,2),
    notes TEXT,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    pol text;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'body_measurements')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON body_measurements', pol);
    END LOOP;
END $$;

-- Create policies
CREATE POLICY "Users can view own measurements" ON body_measurements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements" ON body_measurements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements" ON body_measurements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements" ON body_measurements
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON body_measurements TO authenticated;
GRANT ALL ON body_measurements TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_measured_at ON body_measurements(measured_at DESC);