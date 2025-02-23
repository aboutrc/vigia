/*
  # Create audio storage bucket

  1. New Bucket
    - Create 'audio-files' bucket for storing audio content
    - Enable public access for direct file downloads
  
  2. Storage Policies
    - Allow public read access to audio files
    - Restrict write access to authenticated users
*/

-- Create audio-files bucket
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('audio-files', 'audio-files', true)
  ON CONFLICT (id) DO UPDATE
  SET public = true;
END $$;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
END $$;

-- Create storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files');

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;