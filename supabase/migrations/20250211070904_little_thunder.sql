-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;

-- Create new storage policies with proper permissions
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (true);

CREATE POLICY "Public Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (true);

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;