/*
  # Create body measurements tracking table

  1. New Tables
    - `body_measurements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `weight` (numeric, user's weight)
      - `arm_circumference` (numeric, arm size in cm)
      - `forearm_circumference` (numeric, forearm size in cm)
      - `wrist_circumference` (numeric, wrist size in cm)
      - `notes` (text, optional notes about the measurement)
      - `measured_at` (timestamptz, when the measurement was taken)
      - `created_at` (timestamptz, when record was created)

  2. Security
    - Enable RLS on `body_measurements` table
    - Add policies for users to manage their own measurements
*/

CREATE TABLE IF NOT EXISTS body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight numeric,
  arm_circumference numeric,
  forearm_circumference numeric,
  wrist_circumference numeric,
  notes text,
  measured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements"
  ON body_measurements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON body_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON body_measurements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON body_measurements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS body_measurements_user_id_idx ON body_measurements(user_id);
CREATE INDEX IF NOT EXISTS body_measurements_measured_at_idx ON body_measurements(measured_at DESC);
