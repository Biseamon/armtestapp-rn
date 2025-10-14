/*
  # Add notification tracking to scheduled trainings

  1. Changes
    - Add `notification_id` column to track the expo notification identifier
    - This allows us to cancel/update notifications when trainings are modified

  2. Notes
    - Nullable because web platform doesn't support notifications
    - Can be updated when training is rescheduled
*/

ALTER TABLE scheduled_trainings 
ADD COLUMN IF NOT EXISTS notification_id text;
