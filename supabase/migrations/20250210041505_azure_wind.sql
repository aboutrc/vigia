-- Add function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision AS $$
DECLARE
  R double precision := 6371; -- Earth's radius in kilometers
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  lat1 := radians(lat1);
  lat2 := radians(lat2);

  -- Haversine formula
  a := sin(dlat/2)^2 + cos(lat1) * cos(lat2) * sin(dlon/2)^2;
  c := 2 * asin(sqrt(a));
  
  RETURN R * c; -- Distance in kilometers
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update handle_marker_confirmation function with distance check
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text,
  in_user_lat double precision DEFAULT NULL,
  in_user_lng double precision DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  last_confirmation timestamptz;
  cooldown_period interval := '30 seconds'::interval;
  marker_lat double precision;
  marker_lng double precision;
  max_distance double precision := 100; -- Maximum allowed distance in kilometers
  actual_distance double precision;
BEGIN
  -- Get marker location
  SELECT latitude, longitude
  INTO marker_lat, marker_lng
  FROM markers
  WHERE id = in_marker_id;

  -- Check distance if coordinates are provided
  IF in_user_lat IS NOT NULL AND in_user_lng IS NOT NULL THEN
    actual_distance := calculate_distance(
      in_user_lat, in_user_lng,
      marker_lat, marker_lng
    );

    IF actual_distance > max_distance THEN
      RAISE EXCEPTION 'You are too far from this marker to confirm its status (%.1f km away)', actual_distance;
    END IF;
  END IF;

  -- Check cooldown period
  SELECT MAX(confirmed_at)
  INTO last_confirmation
  FROM marker_confirmations
  WHERE confirmed_from = in_user_ip;
  
  IF last_confirmation IS NOT NULL AND 
     last_confirmation > CURRENT_TIMESTAMP - cooldown_period THEN
    RAISE EXCEPTION 'Please wait 30 seconds between confirmations';
  END IF;

  -- Record the confirmation
  INSERT INTO marker_confirmations (
    marker_id,
    is_active,
    confirmed_from,
    user_id,
    cooldown_expires
  ) VALUES (
    in_marker_id,
    in_is_present,
    in_user_ip,
    NULL,
    CURRENT_TIMESTAMP + cooldown_period
  );

  -- Update marker status
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
END;
$$ LANGUAGE plpgsql;