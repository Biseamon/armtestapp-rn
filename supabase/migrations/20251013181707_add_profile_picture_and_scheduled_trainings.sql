/*
  # Add Profile Picture and Scheduled Trainings

  1. Changes to profiles table
    - Add `avatar_url` column for profile picture storage

  2. New Tables
    - `scheduled_trainings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `scheduled_date` (date)
      - `scheduled_time` (time)
      - `notification_enabled` (boolean)
      - `notification_minutes_before` (integer)
      - `completed` (boolean)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on scheduled_trainings
    - Add policies for CRUD operations
*/

-- Add avatar_url to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Create scheduled_trainings table
CREATE TABLE IF NOT EXISTS scheduled_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  notification_enabled boolean DEFAULT true,
  notification_minutes_before integer DEFAULT 30,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled trainings"
  ON scheduled_trainings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled trainings"
  ON scheduled_trainings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled trainings"
  ON scheduled_trainings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled trainings"
  ON scheduled_trainings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_user_id ON scheduled_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_trainings_date ON scheduled_trainings(scheduled_date);
