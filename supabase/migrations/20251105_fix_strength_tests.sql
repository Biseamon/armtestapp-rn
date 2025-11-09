-- Drop and recreate strength_tests table with correct structure
DROP TABLE IF EXISTS strength_tests CASCADE;

CREATE TABLE strength_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    result_value DECIMAL(8,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DO $$ 
DECLARE
    pol text;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'strength_tests')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON strength_tests', pol);
    END LOOP;
END $$;

-- Create policies
CREATE POLICY "Users can view own tests" ON strength_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON strength_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON strength_tests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests" ON strength_tests
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON strength_tests TO authenticated;
GRANT ALL ON strength_tests TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_strength_tests_user_id ON strength_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_tests_created_at ON strength_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strength_tests_test_type ON strength_tests(test_type);