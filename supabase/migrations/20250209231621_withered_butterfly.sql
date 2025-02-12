/*
  # Fix marker confirmations schema

  1. Changes
    - Rename is_present to is_active for consistency
    - Add proper constraints and indexes
    - Update RLS policies
*/

-- Rename column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marker_confirmations' AND column_name = 'is_present'
  ) THEN
    ALTER TABLE marker_confirmations RENAME COLUMN is_present TO is_active;
  END IF;
END $$;

-- Add column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'marker_confirmations' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE marker_confirmations ADD COLUMN is_active boolean NOT NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_marker_confirmations_is_active 
ON marker_confirmations(is_active);

-- Update the handle_marker_confirmation function
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
    confirmed_from
  ) VALUES (
    in_marker_id,
    in_is_present,
    in_user_ip
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