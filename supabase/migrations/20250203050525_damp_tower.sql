/*
  # Add support for anonymous markers

  1. Changes
    - Make user_id nullable in markers table
    - Update RLS policies to allow public access
    - Add public access policies for markers table
    
  2. Security
    - Enable public access for marker creation
    - Maintain read-only access for marker_votes and marker_confirmations
*/

-- Make user_id nullable in markers table
ALTER TABLE markers ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies for markers
DROP POLICY IF EXISTS "Users can insert own markers" ON markers;
DROP POLICY IF EXISTS "Users can update own markers" ON markers;
DROP POLICY IF EXISTS "Users can delete own markers" ON markers;
DROP POLICY IF EXISTS "Public can view active markers" ON markers;

-- Create new policies for public access
CREATE POLICY "Anyone can insert markers"
  ON markers FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can update their own markers
CREATE POLICY "Authenticated users can update own markers"
  ON markers FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE false
    END
  );

-- Add index for user_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_markers_user_id_nullable ON markers(user_id)
WHERE user_id IS NOT NULL;