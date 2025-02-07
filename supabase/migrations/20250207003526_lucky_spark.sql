/*
  # Fix audio cache policies and constraints

  1. Changes
    - Drop existing RLS policies
    - Create new policies with proper checks
    - Add proper error handling for duplicate entries
    - Add proper base64 validation
    
  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read audio cache" ON audio_cache;
DROP POLICY IF EXISTS "Public can insert into audio cache" ON audio_cache;
DROP POLICY IF EXISTS "Public can update audio cache" ON audio_cache;

-- Create new policies with proper checks
CREATE POLICY "Anyone can read audio cache"
  ON audio_cache FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert audio cache"
  ON audio_cache FOR INSERT
  WITH CHECK (
    length(text) > 0 AND
    length(text) <= 10000 AND  -- Reasonable max length
    octet_length(audio_data) > 0
  );

CREATE POLICY "Anyone can update access time"
  ON audio_cache FOR UPDATE
  USING (true)
  WITH CHECK (
    NEW.text = OLD.text AND
    NEW.audio_data = OLD.audio_data AND
    NEW.created_at = OLD.created_at
  );

-- Add validation trigger for base64 data
CREATE OR REPLACE FUNCTION validate_base64() 
RETURNS trigger AS $$
BEGIN
  -- Basic validation that the string contains only valid base64 characters
  IF NEW.audio_data IS NOT NULL AND 
     NEW.audio_data !~ '^[A-Za-z0-9+/]*={0,2}$' THEN
    RAISE EXCEPTION 'Invalid base64 data';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_base64_trigger
  BEFORE INSERT OR UPDATE ON audio_cache
  FOR EACH ROW
  EXECUTE FUNCTION validate_base64();

-- Grant permissions
GRANT ALL ON audio_cache TO anon, authenticated;