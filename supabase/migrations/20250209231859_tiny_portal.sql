/*
  # Fix marker confirmations RLS policies

  1. Changes
    - Add proper RLS policies for public access
    - Enable RLS on marker_confirmations table
    - Grant necessary permissions
*/

-- Enable RLS
ALTER TABLE marker_confirmations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view confirmations" ON marker_confirmations;
DROP POLICY IF EXISTS "Anyone can insert confirmations" ON marker_confirmations;

-- Create new policies for public access
CREATE POLICY "Anyone can view confirmations"
  ON marker_confirmations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert confirmations"
  ON marker_confirmations FOR INSERT
  TO public
  WITH CHECK (true);

-- Grant necessary permissions to public roles
GRANT ALL ON marker_confirmations TO anon, authenticated;

-- Grant execute permission on the handle_marker_confirmation function
GRANT EXECUTE ON FUNCTION handle_marker_confirmation(uuid, boolean, text) TO anon, authenticated;