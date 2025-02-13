-- Clear all existing markers and confirmations
TRUNCATE TABLE marker_confirmations CASCADE;
TRUNCATE TABLE markers CASCADE;

-- Verify marker category constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'markers_category_check'
  ) THEN
    ALTER TABLE markers 
    ADD CONSTRAINT markers_category_check 
    CHECK (category IN ('ice', 'police'));
  END IF;
END $$;

-- Ensure reliability score calculation is up to date
CREATE OR REPLACE FUNCTION calculate_marker_reliability(
  created_at timestamptz,
  last_confirmation timestamptz,
  negative_confirmations integer
) RETURNS float AS $$
DECLARE
  base_reliability float;
  time_penalty float;
  negative_penalty float;
  hours_since_creation float;
  hours_since_confirmation float;
BEGIN
  -- Calculate hours elapsed
  hours_since_creation := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 3600;
  hours_since_confirmation := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_confirmation)) / 3600;
  
  -- Base reliability starts at 1.0 and decays to 0.2 over 4 hours
  base_reliability := GREATEST(0.2, 1.0 - (hours_since_creation / 4.0) * 0.8);
  
  -- Time penalty based on last confirmation (up to 0.5 reduction over 8 hours)
  time_penalty := LEAST(0.5, hours_since_confirmation / 8.0);
  
  -- Negative confirmation penalty (0.1 reduction per negative, max 0.8)
  negative_penalty := LEAST(0.8, negative_confirmations * 0.1);
  
  -- Final score cannot go below 0.2
  RETURN GREATEST(0.2, base_reliability - time_penalty - negative_penalty);
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to cleanup inactive markers
CREATE OR REPLACE FUNCTION cleanup_inactive_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers that are:
  -- 1. Over 4 hours old with no confirmations
  -- 2. Have more than 5 negative confirmations
  -- 3. Have reliability score below 0.3
  UPDATE markers
  SET active = false
  WHERE 
    (created_at < NOW() - INTERVAL '4 hours' AND last_confirmation IS NULL)
    OR negative_confirmations > 5
    OR reliability_score < 0.3;
END;
$$ LANGUAGE plpgsql;

-- Ensure geographic clustering check is in place
CREATE OR REPLACE FUNCTION check_geographic_clustering(
  in_latitude double precision,
  in_longitude double precision,
  in_radius_km double precision DEFAULT 0.5
)
RETURNS integer AS $$
DECLARE
  nearby_count integer;
BEGIN
  SELECT COUNT(*)
  INTO nearby_count
  FROM markers m
  WHERE 
    m.created_at > NOW() - INTERVAL '1 hour'
    AND earth_distance(
      ll_to_earth(m.latitude, m.longitude),
      ll_to_earth(in_latitude, in_longitude)
    ) < (in_radius_km * 1000);
  
  RETURN nearby_count;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS policies are in place
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Anyone can view markers" ON markers;
  DROP POLICY IF EXISTS "Anyone can insert markers" ON markers;
  
  -- Create new policies
  CREATE POLICY "Anyone can view markers"
    ON markers FOR SELECT
    USING (active = true);

  CREATE POLICY "Anyone can insert markers"
    ON markers FOR INSERT
    WITH CHECK (true);
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markers_active_created ON markers(active, created_at);
CREATE INDEX IF NOT EXISTS idx_markers_reliability ON markers(reliability_score);
CREATE INDEX IF NOT EXISTS idx_markers_location ON markers USING gist (ll_to_earth(latitude, longitude));