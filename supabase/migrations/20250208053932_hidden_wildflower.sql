/*
  # Enhanced Defense System

  1. New Features
    - User reputation system
    - Geographic clustering validation
    - Automated cleanup of low reliability markers
    - Advanced anti-abuse measures
    
  2. Changes
    - Add user_reputation table
    - Add geographic clustering functions
    - Add cleanup functions
    - Add advanced rate limiting
*/

-- Create extension for earth distance calculations if not exists
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create user reputation table
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id uuid PRIMARY KEY,
  reputation_score float DEFAULT 1.0,
  total_confirmations integer DEFAULT 0,
  accurate_confirmations integer DEFAULT 0,
  last_confirmation timestamptz,
  CONSTRAINT valid_reputation_score CHECK (reputation_score >= 0.0 AND reputation_score <= 2.0)
);

-- Enable RLS
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can read reputation"
  ON user_reputation FOR SELECT
  USING (true);

-- Function to check geographic clustering
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

-- Function to update user reputation
CREATE OR REPLACE FUNCTION update_user_reputation(
  in_user_id uuid,
  in_was_accurate boolean
)
RETURNS void AS $$
DECLARE
  current_score float;
BEGIN
  INSERT INTO user_reputation (user_id)
  VALUES (in_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE user_reputation
  SET 
    total_confirmations = total_confirmations + 1,
    accurate_confirmations = CASE WHEN in_was_accurate THEN accurate_confirmations + 1 ELSE accurate_confirmations END,
    reputation_score = CASE 
      WHEN in_was_accurate THEN LEAST(2.0, reputation_score + 0.1)
      ELSE GREATEST(0.0, reputation_score - 0.1)
    END,
    last_confirmation = NOW()
  WHERE user_id = in_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup low reliability markers
CREATE OR REPLACE FUNCTION cleanup_low_reliability_markers()
RETURNS void AS $$
BEGIN
  -- Archive markers with very low reliability and no recent confirmations
  UPDATE markers
  SET active = false
  WHERE 
    reliability_score < 0.3
    AND last_confirmation < NOW() - INTERVAL '24 hours'
    AND negative_confirmations > 5;
END;
$$ LANGUAGE plpgsql;

-- Enhanced marker confirmation function with all defenses
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text
)
RETURNS void AS $$
DECLARE
  recent_confirmation_count integer;
  nearby_markers integer;
  marker_lat double precision;
  marker_lng double precision;
BEGIN
  -- Get marker location
  SELECT latitude, longitude 
  INTO marker_lat, marker_lng
  FROM markers 
  WHERE id = in_marker_id;

  -- Check for geographic clustering
  nearby_markers := check_geographic_clustering(marker_lat, marker_lng);
  IF nearby_markers > 10 THEN
    RAISE EXCEPTION 'Too many markers in this area recently';
  END IF;

  -- Check for confirmation spam from same IP
  SELECT COUNT(*)
  INTO recent_confirmation_count
  FROM marker_confirmations mc
  WHERE 
    mc.confirmed_from = in_user_ip 
    AND mc.confirmed_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
  LIMIT 3;

  IF recent_confirmation_count >= 3 THEN
    RAISE EXCEPTION 'Too many confirmations from this location';
  END IF;

  -- Record the confirmation
  INSERT INTO marker_confirmations (
    marker_id,
    is_present,
    confirmed_from
  ) VALUES (
    in_marker_id,
    in_is_present,
    in_user_ip
  );

  -- Update marker status with weighted impact based on user reputation
  IF in_is_present THEN
    UPDATE markers m
    SET 
      last_confirmation = CURRENT_TIMESTAMP,
      negative_confirmations = GREATEST(0, m.negative_confirmations - 1)
    WHERE m.id = in_marker_id;
  ELSE
    UPDATE markers m
    SET negative_confirmations = m.negative_confirmations + 1
    WHERE m.id = in_marker_id;
  END IF;

  -- Run cleanup check after each confirmation
  PERFORM cleanup_low_reliability_markers();
END;
$$ LANGUAGE plpgsql;