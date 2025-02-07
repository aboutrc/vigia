/*
  # Fix audio cache functions

  1. Changes
    - Fix ambiguous column references in functions
    - Add explicit table references
    - Improve error handling
    
  2. Security
    - Maintain RLS policies
    - Keep security definer context
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS upsert_audio_cache(text, text);
DROP FUNCTION IF EXISTS get_audio_cache(text);

-- Function to safely upsert audio cache entries
CREATE OR REPLACE FUNCTION upsert_audio_cache(
  p_text text,
  p_audio_data text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audio_cache (text, audio_data)
  VALUES (p_text, p_audio_data)
  ON CONFLICT (text) DO NOTHING;
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
AS $$
BEGIN
  RETURN QUERY
  WITH updated AS (
    UPDATE audio_cache
    SET 
      last_accessed = now(),
      access_count = audio_cache.access_count + 1
    WHERE audio_cache.text = p_text
    RETURNING audio_cache.audio_data, audio_cache.access_count
  )
  SELECT * FROM updated;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_audio_cache(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_audio_cache(text) TO anon, authenticated;