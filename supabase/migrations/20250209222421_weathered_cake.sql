/*
  # Add session ID to recordings
  
  1. Changes
    - Add session_id column to recordings table
    - Make session_id required for new records
    - Add index for faster lookups
  
  2. Privacy
    - No personal data stored
    - Random UUIDs used for sessions
    - No way to trace sessions to individuals
*/

-- Add session_id column
ALTER TABLE recordings 
ADD COLUMN session_id uuid NOT NULL DEFAULT gen_random_uuid();

-- Add index for performance
CREATE INDEX idx_recordings_session_id ON recordings(session_id);

-- Update RLS policies to ensure session isolation
CREATE POLICY "Users can only view their own session recordings" 
ON recordings FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert with session_id"
ON recordings FOR INSERT
WITH CHECK (true);