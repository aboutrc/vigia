-- Add new fields for obstruction tracking
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

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_markers_active ON markers(active);
CREATE INDEX IF NOT EXISTS idx_markers_last_confirmed ON markers(last_confirmed);

-- Create marker_confirmations table
CREATE TABLE IF NOT EXISTS marker_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid REFERENCES markers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  confirmed_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL,
  UNIQUE(marker_id, user_id)
);

-- Enable RLS on marker_confirmations
ALTER TABLE marker_confirmations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for marker_confirmations with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marker_confirmations' 
    AND policyname = 'Anyone can view confirmations'
  ) THEN
    CREATE POLICY "Anyone can view confirmations"
      ON marker_confirmations FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marker_confirmations' 
    AND policyname = 'Users can confirm markers'
  ) THEN
    CREATE POLICY "Users can confirm markers"
      ON marker_confirmations FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'marker_confirmations' 
    AND policyname = 'Users can update their confirmations'
  ) THEN
    CREATE POLICY "Users can update their confirmations"
      ON marker_confirmations FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;