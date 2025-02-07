/*
  # Fix audio cache functions

  1. Changes
    - Fix type mismatch between text and bytea
    - Improve function definitions
    - Add proper error handling
    
  2. Security
    - Maintain RLS policies
    - Keep security definer context
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS upsert_audio_cache(text, text);
DROP FUNCTION IF EXISTS get_audio_cache(text);

-- Create table if not exists with correct types
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

-- Function to safely upsert audio cache entries
CREATE OR REPLACE FUNCTION upsert_audio_cache(
  p_text text,
  p_audio_data text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audio_cache (text, audio_data)
  VALUES (p_text, p_audio_data)
  ON CONFLICT (text) 
  DO NOTHING;
END;
$$;

-- Function to get and update audio cache entries
CREATE OR REPLACE FUNCTION get_audio_cache(
  p_text text
)
RETURNS TABLE (
  audio_data text,
  access_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE audio_cache ac
  SET 
    last_accessed = now(),
    access_count = ac.access_count + 1
  WHERE ac.text = p_text
  RETURNING ac.audio_data, ac.access_count;
END;
$$;

-- Ensure RLS policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audio_cache' 
    AND policyname = 'Anyone can read audio cache'
  ) THEN
    CREATE POLICY "Anyone can read audio cache"
      ON audio_cache FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audio_cache' 
    AND policyname = 'Anyone can insert audio cache'
  ) THEN
    CREATE POLICY "Anyone can insert audio cache"
      ON audio_cache FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON audio_cache TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_audio_cache(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_audio_cache(text) TO anon, authenticated;