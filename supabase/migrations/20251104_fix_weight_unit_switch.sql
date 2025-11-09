-- Run this in Supabase SQL Editor

-- 1. Add result_unit to strength_tests table
ALTER TABLE strength_tests 
ADD COLUMN IF NOT EXISTS result_unit VARCHAR(3) DEFAULT 'lbs';

-- 2. Update existing strength_tests records to match user's preference
UPDATE strength_tests st
SET result_unit = (
  SELECT weight_unit FROM profiles WHERE id = st.user_id
)
WHERE result_unit = 'lbs';

-- 3. Add weight_unit to exercises table (the one linked to workouts)
-- Note: Your Exercise type is workout_id based, so this is workout_exercises
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(3) DEFAULT 'lbs';

-- 4. Update existing exercise records
UPDATE exercises e
SET weight_unit = (
  SELECT p.weight_unit 
  FROM workouts w
  JOIN profiles p ON w.user_id = p.id
  WHERE w.id = e.workout_id
)
WHERE weight_unit = 'lbs';

-- 5. Update body_measurements to track unit (if you want to track weight unit there)
ALTER TABLE body_measurements
ADD COLUMN IF NOT EXISTS weight_unit VARCHAR(3) DEFAULT 'lbs';

UPDATE body_measurements bm
SET weight_unit = (
  SELECT weight_unit FROM profiles WHERE id = bm.user_id
)
WHERE weight_unit = 'lbs';