/*
  # Fix event time handling

  1. Changes
    - Drop existing event_time constraints and recreate them properly
    - Add proper validation for event_time field
    - Update RLS policies to handle event_time

  2. Security
    - Maintain existing RLS policies
    - Add proper validation for event_time field
*/

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_time_required_for_events'
  ) THEN
    ALTER TABLE markers DROP CONSTRAINT event_time_required_for_events;
  END IF;
END $$;

-- Add proper event_time constraint
ALTER TABLE markers
ADD CONSTRAINT event_time_required_for_events
CHECK (
  (category = 'event' AND event_time IS NOT NULL) OR
  (category != 'event' AND event_time IS NULL)
);

-- Add validation for event_time to ensure it's not in the past for new events
ALTER TABLE markers
ADD CONSTRAINT event_time_future
CHECK (
  category != 'event' OR
  event_time >= CURRENT_TIMESTAMP
);

-- Create index on event_time if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_event_time 
ON markers(event_time)
WHERE category = 'event';

-- Update RLS policies to handle event_time
CREATE POLICY "Users can update event time on own markers"
  ON markers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (
      category != 'event' OR
      event_time >= CURRENT_TIMESTAMP
    )
  );