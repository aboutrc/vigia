/*
  # Add event time to markers table

  1. Changes
    - Add event_time column to markers table
    - Make it optional (NULL) since only event category markers need it
    - Add timestamp with timezone type for proper time handling

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
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