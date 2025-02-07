/*
  # Add audio cache table

  1. New Tables
    - `audio_cache`
      - `id` (uuid, primary key)
      - `text` (text, unique) - The text that was converted to speech
      - `audio_data` (bytea) - The audio data blob
      - `created_at` (timestamptz)
      - `last_accessed` (timestamptz)
      - `access_count` (integer)

  2. Security
    - Enable RLS on `audio_cache` table
    - Add policy for public read access
*/

-- Create audio_cache table
CREATE TABLE audio_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text UNIQUE NOT NULL,
  audio_data bytea NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  CONSTRAINT text_not_empty CHECK (length(trim(text)) > 0)
);

-- Enable RLS
ALTER TABLE audio_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read audio cache"
  ON audio_cache FOR SELECT
  TO public
  USING (true);

-- Create index for text lookups
CREATE INDEX idx_audio_cache_text ON audio_cache(text);

-- Create function to update last_accessed and access_count
CREATE OR REPLACE FUNCTION update_audio_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.access_count = OLD.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updates
CREATE TRIGGER update_audio_cache_access_trigger
  BEFORE UPDATE ON audio_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_cache_access();