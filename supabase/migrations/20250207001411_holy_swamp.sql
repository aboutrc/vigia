/*
  # Final storage permissions fix

  1. Storage Setup
    - Create recordings bucket if it doesn't exist
    - Enable public access to recordings bucket
    - Add proper RLS policies
  
  2. Security
    - Allow anonymous access to recordings bucket
    - Enable public uploads and downloads
    - Fix RLS policy issues
*/

-- Create recordings bucket if it doesn't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('recordings', 'recordings', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- Create new storage policies with public access
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

-- Grant necessary permissions to public roles
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;