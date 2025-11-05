-- Check if cycles table exists and fix it if needed
DROP TABLE IF EXISTS cycles CASCADE;

CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cycle_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own cycles" ON cycles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles" ON cycles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles" ON cycles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles" ON cycles
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cycles TO authenticated;