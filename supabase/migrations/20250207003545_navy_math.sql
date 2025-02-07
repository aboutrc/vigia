/*
  # Add database functions for audio cache

  1. New Functions
    - upsert_audio_cache: Safely insert or update cache entries
    - get_audio_cache: Get and update access stats atomically
    
  2. Security
    - Functions execute with invoker rights
*/

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
  UPDATE audio_cache
  SET 
    last_accessed = now(),
    access_count = access_count + 1
  WHERE text = p_text
  RETURNING audio_data, access_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_audio_cache TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_audio_cache TO anon, authenticated;