/*
  # Fix storage permissions and initialization

  1. Storage Setup
    - Create recordings bucket if it doesn't exist
    - Enable public access to recordings bucket
    - Add proper RLS policies
  
  2. Security
    - Allow anonymous access to recordings bucket
    - Enable public uploads and downloads
*/

-- Create recordings bucket if it doesn't exist
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('recordings', 'recordings', true)
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

-- Create new storage policies with proper USING clauses
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

-- Enable RLS on objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;