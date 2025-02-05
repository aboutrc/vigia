/*
  # Add event time to markers table

  1. Changes
    - Add `event_time` column to `markers` table for storing event dates and times
    - Column is nullable since only event category markers will use it
    - Uses timestamptz to properly handle different time zones

  2. Notes
    - Uses IF NOT EXISTS to prevent errors if column already exists
    - Safe migration that can be run multiple times
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