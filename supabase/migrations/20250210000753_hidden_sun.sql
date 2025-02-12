-- Add cooldown tracking for confirmations
ALTER TABLE marker_confirmations
ADD COLUMN IF NOT EXISTS cooldown_expires timestamptz;

-- Create index for confirmed_from and confirmed_at without predicate
CREATE INDEX IF NOT EXISTS idx_marker_confirmations_cooldown 
ON marker_confirmations(confirmed_from, confirmed_at);

-- Update handle_marker_confirmation function with cooldown period
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text
)
RETURNS void AS $$
DECLARE
  last_confirmation timestamptz;
  cooldown_period interval := '5 minutes'::interval;
BEGIN
  -- Check when this IP last confirmed any marker
  SELECT MAX(confirmed_at)
  INTO last_confirmation
  FROM marker_confirmations
  WHERE confirmed_from = in_user_ip;
  
  -- If there's a recent confirmation within cooldown period, reject
  IF last_confirmation IS NOT NULL AND 
     last_confirmation > CURRENT_TIMESTAMP - cooldown_period THEN
    RAISE EXCEPTION 'Please wait 5 minutes between confirmations';
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

-- Create function to clean up old confirmations
CREATE OR REPLACE FUNCTION cleanup_old_confirmations()
RETURNS void AS $$
BEGIN
  DELETE FROM marker_confirmations
  WHERE confirmed_at < CURRENT_TIMESTAMP - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON marker_confirmations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_marker_confirmation(uuid, boolean, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_confirmations() TO anon, authenticated;