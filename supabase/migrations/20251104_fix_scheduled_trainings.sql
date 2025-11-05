-- Drop and recreate scheduled_trainings table with correct structure
DROP TABLE IF EXISTS scheduled_trainings CASCADE;

CREATE TABLE scheduled_trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    notification_enabled BOOLEAN DEFAULT true,
    notification_minutes_before INTEGER DEFAULT 30,
    notification_id TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_trainings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    pol text;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'scheduled_trainings')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON scheduled_trainings', pol);
    END LOOP;
END $$;

-- Create policies
CREATE POLICY "Users can view own schedules" ON scheduled_trainings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules" ON scheduled_trainings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules" ON scheduled_trainings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules" ON scheduled_trainings
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON scheduled_trainings TO authenticated;
GRANT ALL ON scheduled_trainings TO service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_user_id ON scheduled_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_date ON scheduled_trainings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_completed ON scheduled_trainings(completed);