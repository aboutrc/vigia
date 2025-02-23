-- Create news-images bucket
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('news-images', 'news-images', true)
  ON CONFLICT (id) DO UPDATE
  SET public = true;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
END $$;

-- Create storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-images');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'news-images');

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'news-images');

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'news-images');

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;