-- Drop the old training_cycles table if it exists
DROP TABLE IF EXISTS training_cycles CASCADE;

-- Ensure cycles table exists with correct structure
CREATE TABLE IF NOT EXISTS cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    cycle_type TEXT NOT NULL DEFAULT 'strength',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on cycles
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on cycles
DO $$ 
DECLARE
    pol text;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'cycles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON cycles', pol);
    END LOOP;
END $$;

-- Create policies for cycles
CREATE POLICY "Users can view own cycles" ON cycles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles" ON cycles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles" ON cycles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles" ON cycles
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing foreign key constraint on workouts
ALTER TABLE workouts 
DROP CONSTRAINT IF EXISTS workouts_cycle_id_fkey;

-- Add correct foreign key constraint pointing to 'cycles' table
ALTER TABLE workouts 
ADD CONSTRAINT workouts_cycle_id_fkey 
FOREIGN KEY (cycle_id) 
REFERENCES cycles(id) 
ON DELETE SET NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cycles TO authenticated;
GRANT ALL ON cycles TO service_role;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_cycles_user_id ON cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_cycles_active ON cycles(is_active);
CREATE INDEX IF NOT EXISTS idx_workouts_cycle_id ON workouts(cycle_id);