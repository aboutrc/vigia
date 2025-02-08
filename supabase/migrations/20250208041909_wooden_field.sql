/*
  # Marker Defense System Phase 1
  
  1. New Fields
    - `reliability_score` - float between 0-1 indicating marker reliability
    - `last_confirmation` - timestamp of last positive confirmation
    - `negative_confirmations` - count of "not there" reports
    - `created_at` - when marker was created
    
  2. Functions
    - Automatic reliability score calculation based on time decay
    - Accelerated degradation on negative confirmations
    - Protection against rapid negative confirmation abuse
*/

-- Add new fields for marker defense system
ALTER TABLE markers
ADD COLUMN IF NOT EXISTS reliability_score float DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS last_confirmation timestamptz DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS negative_confirmations integer DEFAULT 0;

-- Create function to calculate reliability score
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
  
  -- Base reliability calculation (linear decay over 4 hours)
  -- After 4 hours, base reliability will be 0.2
  base_reliability := GREATEST(0.2, 1.0 - (hours_since_creation / 4.0) * 0.8);
  
  -- Time penalty based on last confirmation
  -- Reduces reliability if no recent confirmations
  time_penalty := LEAST(0.5, hours_since_confirmation / 8.0);
  
  -- Negative confirmation penalty
  -- Each negative confirmation reduces reliability by 10%, but never below 0.2
  negative_penalty := LEAST(0.8, negative_confirmations * 0.1);
  
  -- Calculate final reliability score
  RETURN GREATEST(0.2, base_reliability - time_penalty - negative_penalty);
END;
$$ LANGUAGE plpgsql;

-- Create function to update marker reliability
CREATE OR REPLACE FUNCTION update_marker_reliability()
RETURNS trigger AS $$
BEGIN
  NEW.reliability_score := calculate_marker_reliability(
    NEW.created_at,
    NEW.last_confirmation,
    NEW.negative_confirmations
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reliability score
CREATE TRIGGER update_marker_reliability_trigger
  BEFORE INSERT OR UPDATE ON markers
  FOR EACH ROW
  EXECUTE FUNCTION update_marker_reliability();

-- Create function to handle marker confirmations
CREATE OR REPLACE FUNCTION handle_marker_confirmation(
  marker_id uuid,
  is_present boolean,
  user_ip text
)
RETURNS void AS $$
DECLARE
  recent_confirmation_count integer;
BEGIN
  -- Check for confirmation spam from same IP
  SELECT COUNT(*)
  INTO recent_confirmation_count
  FROM marker_confirmations
  WHERE 
    marker_id = $1 
    AND confirmed_from = user_ip 
    AND confirmed_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
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
    marker_id,
    is_present,
    user_ip
  );

  -- Update marker status
  IF is_present THEN
    UPDATE markers
    SET 
      last_confirmation = CURRENT_TIMESTAMP,
      negative_confirmations = GREATEST(0, negative_confirmations - 1)
    WHERE id = marker_id;
  ELSE
    UPDATE markers
    SET negative_confirmations = negative_confirmations + 1
    WHERE id = marker_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add confirmed_from column to marker_confirmations
ALTER TABLE marker_confirmations
ADD COLUMN IF NOT EXISTS confirmed_from text;