/*
  # Add event time to markers

  1. Changes
    - Add `event_time` column to `markers` table for storing event dates/times
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' AND column_name = 'event_time'
  ) THEN
    ALTER TABLE markers ADD COLUMN event_time timestamptz;
  END IF;
END $$;