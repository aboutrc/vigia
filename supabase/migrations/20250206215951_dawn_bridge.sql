/*
  # Add public_url column to recordings table
  
  1. Changes
    - Add public_url column to recordings table
    - Make recording_url NOT NULL
*/

-- Add public_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recordings' AND column_name = 'public_url'
  ) THEN
    ALTER TABLE recordings ADD COLUMN public_url text;
  END IF;
END $$;

-- Ensure recording_url is NOT NULL
ALTER TABLE recordings 
ALTER COLUMN recording_url SET NOT NULL;

-- Create index for public_url
CREATE INDEX IF NOT EXISTS idx_recordings_public_url 
ON recordings(public_url);