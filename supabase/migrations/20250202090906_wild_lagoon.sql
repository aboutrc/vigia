/*
  # Add marker confirmations system

  1. New Fields
    - Add tracking fields to markers table:
      - active (boolean)
      - last_confirmed (timestamptz)
      - confirmations_count (integer)
      - last_status_change (timestamptz)

  2. New Table
    - marker_confirmations:
      - id (uuid, primary key)
      - marker_id (uuid, references markers)
      - user_id (uuid, references profiles)
      - confirmed_at (timestamptz)
      - is_active (boolean)

  3. Security
    - Enable RLS on marker_confirmations
    - Add policies for viewing and managing confirmations
*/

-- Add tracking fields to markers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' AND column_name = 'active'
  ) THEN
    ALTER TABLE markers 
      ADD COLUMN active boolean DEFAULT true,
      ADD COLUMN last_confirmed timestamptz DEFAULT now(),
      ADD COLUMN confirmations_count integer DEFAULT 1,
      ADD COLUMN last_status_change timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_markers_active ON markers(active);
CREATE INDEX IF NOT EXISTS idx_markers_last_confirmed ON markers(last_confirmed);

-- Create marker_confirmations table if it doesn't exist
CREATE TABLE IF NOT EXISTS marker_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid REFERENCES markers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  confirmed_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL,
  UNIQUE(marker_id, user_id)
);

-- Enable RLS on marker_confirmations if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'marker_confirmations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE marker_confirmations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add RLS policies with existence checks
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view confirmations" ON marker_confirmations;
  DROP POLICY IF EXISTS "Users can confirm markers" ON marker_confirmations;
  DROP POLICY IF EXISTS "Users can update their confirmations" ON marker_confirmations;
  
  -- Create new policies
  CREATE POLICY "Anyone can view confirmations"
    ON marker_confirmations FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can confirm markers"
    ON marker_confirmations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their confirmations"
    ON marker_confirmations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);
END $$;