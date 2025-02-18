/*
  # Clear test markers around Syracuse

  1. Changes
    - Removes all markers within 100 miles of Syracuse, NY
    - Uses existing calculate_distance function
    - Preserves marker history for audit purposes by setting active = false
  
  2. Notes
    - Syracuse coordinates: 43.0481° N, 76.1474° W
    - 100 mile radius specified
    - Marks markers as inactive rather than deleting them
*/

-- Update markers within 100 miles of Syracuse to be inactive
UPDATE markers
SET 
  active = false,
  last_status_change = NOW()
WHERE 
  calculate_distance(
    latitude,
    longitude,
    43.0481, -- Syracuse latitude
    -76.1474 -- Syracuse longitude
  ) <= 100; -- 100 mile radius