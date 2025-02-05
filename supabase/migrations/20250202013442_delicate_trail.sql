/*
  # Update marker schema for event time handling

  1. Changes
    - Add event_time column if it doesn't exist
    - Add index on event_time for better query performance
    - Add check constraint to ensure event_time is set for events
*/

DO $$ 
BEGIN
  -- Add event_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' AND column_name = 'event_time'
  ) THEN
    ALTER TABLE markers ADD COLUMN event_time timestamptz;
  END IF;

  -- Add check constraint to ensure event_time is set for events
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_time_required_for_events'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT event_time_required_for_events
      CHECK (
        (category = 'event' AND event_time IS NOT NULL) OR
        (category != 'event')
      );
  END IF;
END $$;

-- Create index on event_time if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_event_time ON markers(event_time);