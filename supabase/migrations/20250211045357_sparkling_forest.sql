-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view recordings" ON recordings;
DROP POLICY IF EXISTS "Anyone can insert recordings" ON recordings;

-- Create new policies for recordings table
CREATE POLICY "Public Access"
  ON recordings FOR SELECT
  USING (true);

CREATE POLICY "Public Insert"
  ON recordings FOR INSERT
  WITH CHECK (true);

-- Create audio-cache bucket if it doesn't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('recordings', 'recordings', true)
  ON CONFLICT (id) DO UPDATE
  SET public = true;
END $$;

-- Drop existing storage policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
END $$;

-- Create storage policies with public access
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings');

CREATE POLICY "Public Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings');

CREATE POLICY "Public Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'recordings');

CREATE POLICY "Public Delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings');

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
GRANT ALL ON recordings TO anon, authenticated;