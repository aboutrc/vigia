/*
  # Fix audio cache table and policies

  1. Changes
    - Create audio_cache table with proper constraints
    - Add RLS policies with correct syntax
    - Add validation function for base64 data
    
  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create audio_cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text UNIQUE NOT NULL,
  audio_data text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  CONSTRAINT text_not_empty CHECK (length(trim(text)) > 0),
  CONSTRAINT text_max_length CHECK (length(text) <= 10000)
);

-- Enable RLS
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can read audio cache"
  ON audio_cache FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert audio cache"
  ON audio_cache FOR INSERT
  WITH CHECK (
    length(trim(text)) > 0 AND
    length(text) <= 10000 AND
    length(audio_data) > 0
  );

-- Function to validate base64 data
CREATE OR REPLACE FUNCTION is_base64(str text) 
RETURNS boolean AS $$
BEGIN
  RETURN str ~ '^[A-Za-z0-9+/]*={0,2}$';
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
CREATE OR REPLACE FUNCTION validate_audio_cache()
RETURNS trigger AS $$
BEGIN
  IF NOT is_base64(NEW.audio_data) THEN
    RAISE EXCEPTION 'Invalid base64 data';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_audio_cache_trigger
  BEFORE INSERT OR UPDATE ON audio_cache
  FOR EACH ROW
  EXECUTE FUNCTION validate_audio_cache();

-- Grant permissions
GRANT ALL ON audio_cache TO anon, authenticated;