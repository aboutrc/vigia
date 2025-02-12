/*
  # Fix marker confirmations schema

  1. Changes
    - Make user_id column nullable
    - Update handle_marker_confirmation function
    - Add index for performance
*/

-- Make user_id nullable
ALTER TABLE marker_confirmations 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for nullable user_id
CREATE INDEX IF NOT EXISTS idx_marker_confirmations_user_id 
ON marker_confirmations(user_id)
WHERE user_id IS NOT NULL;

-- Update the handle_marker_confirmation function to handle null user_id
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  in_marker_id uuid,
  in_is_present boolean,
  in_user_ip text
)
RETURNS void AS $$
DECLARE
  recent_confirmation_count integer;
BEGIN
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
    is_active,
    confirmed_from,
    user_id
  ) VALUES (
    in_marker_id,
    in_is_present,
    in_user_ip,
    NULL  -- Allow null user_id for anonymous users
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

-- Grant necessary permissions
GRANT ALL ON marker_confirmations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION handle_marker_confirmation(uuid, boolean, text) TO anon, authenticated;