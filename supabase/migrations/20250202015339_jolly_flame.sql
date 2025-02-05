/*
  # Add event time support

  1. Changes
    - Ensures event_time column exists
    - Adds check constraint for event markers
    - Creates index for event_time queries
    - Adds validation for coordinates

  2. Security
    - Maintains existing RLS policies
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

-- Add check constraints for valid coordinates if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_latitude'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT valid_latitude
      CHECK (latitude >= -90 AND latitude <= 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_longitude'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT valid_longitude
      CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;

-- Create composite index for coordinates if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_coordinates 
ON markers(latitude, longitude);