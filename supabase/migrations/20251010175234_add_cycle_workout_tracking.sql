/*
  # Add Cycle Workout Tracking

  ## Overview
  This migration adds functionality to track the number of workouts per cycle
  for premium limit enforcement (3 workouts per cycle for free users).

  ## Changes

  ### Views
  - Create `cycle_workout_counts` view that counts workouts per cycle
  
  ## Notes
  - This view will be used to enforce the 3-training limit for free users
  - Premium users can add unlimited trainings to a cycle
*/

-- Create a view to count workouts per cycle
CREATE OR REPLACE VIEW cycle_workout_counts AS
SELECT 
  c.id as cycle_id,
  c.user_id,
  c.name as cycle_name,
  COUNT(w.id) as workout_count
FROM cycles c
LEFT JOIN workouts w ON w.cycle_id = c.id
GROUP BY c.id, c.user_id, c.name;

-- Grant access to authenticated users
GRANT SELECT ON cycle_workout_counts TO authenticated;
