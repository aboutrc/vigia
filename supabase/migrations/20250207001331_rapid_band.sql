/*
  # Fix storage permissions and initialization

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

-- Create new storage policies with more permissive rules
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING (true);

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (true);

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated and anon roles
GRANT ALL ON storage.objects TO authenticated, anon;
GRANT ALL ON storage.buckets TO authenticated, anon;