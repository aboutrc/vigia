-- Add insert policy for audio_cache table
CREATE POLICY "Public can insert into audio cache"
  ON audio_cache FOR INSERT
  TO public
  WITH CHECK (true);

-- Add update policy for audio cache
CREATE POLICY "Public can update audio cache"
  ON audio_cache FOR UPDATE
  TO public
  USING (true);

-- Grant necessary permissions to public roles
GRANT ALL ON audio_cache TO anon, authenticated;