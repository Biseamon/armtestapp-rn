-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRAINING CYCLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE training_cycles ENABLE ROW LEVEL SECURITY;

-- Policies for training_cycles
CREATE POLICY "Users can view own cycles" ON training_cycles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles" ON training_cycles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles" ON training_cycles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles" ON training_cycles
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- WORKOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES training_cycles(id) ON DELETE SET NULL,
    workout_type TEXT NOT NULL,
    duration_minutes INTEGER,
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policies for workouts
CREATE POLICY "Users can view own workouts" ON workouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EXERCISES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    weight_lbs DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Policies for exercises (access through workout ownership)
CREATE POLICY "Users can view own exercises" ON exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = exercises.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own exercises" ON exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = exercises.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own exercises" ON exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = exercises.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own exercises" ON exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workouts 
            WHERE workouts.id = exercises.workout_id 
            AND workouts.user_id = auth.uid()
        )
    );

-- ============================================
-- SCHEDULED TRAININGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES training_cycles(id) ON DELETE CASCADE,
    scheduled_date TIMESTAMPTZ NOT NULL,
    workout_type TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    notification_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scheduled_trainings ENABLE ROW LEVEL SECURITY;

-- Policies for scheduled_trainings
CREATE POLICY "Users can view own schedules" ON scheduled_trainings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules" ON scheduled_trainings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules" ON scheduled_trainings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules" ON scheduled_trainings
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- BODY MEASUREMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight DECIMAL(10,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(10,2),
    forearm_left DECIMAL(10,2),
    forearm_right DECIMAL(10,2),
    bicep_left DECIMAL(10,2),
    bicep_right DECIMAL(10,2),
    chest DECIMAL(10,2),
    waist DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- Policies for body_measurements
CREATE POLICY "Users can view own measurements" ON body_measurements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements" ON body_measurements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements" ON body_measurements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements" ON body_measurements
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    deadline DATE,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policies for goals
CREATE POLICY "Users can view own goals" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STRENGTH TESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS strength_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_type TEXT NOT NULL,
    result NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE strength_tests ENABLE ROW LEVEL SECURITY;

-- Policies for strength_tests
CREATE POLICY "Users can view own tests" ON strength_tests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tests" ON strength_tests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tests" ON strength_tests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tests" ON strength_tests
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_cycle_id ON workouts(cycle_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_training_cycles_user_id ON training_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_user_id ON scheduled_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_tests_user_id ON strength_tests(user_id);