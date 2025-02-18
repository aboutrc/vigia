-- Clear all markers within 100 miles of Syracuse, NY
WITH syracuse_area_markers AS (
  SELECT id
  FROM markers
  WHERE calculate_distance(
    latitude,
    longitude,
    43.0481, -- Syracuse latitude
    -76.1474 -- Syracuse longitude
  ) <= 100 -- 100 mile radius
)
DELETE FROM marker_confirmations
WHERE marker_id IN (SELECT id FROM syracuse_area_markers);

DELETE FROM markers
WHERE calculate_distance(
  latitude,
  longitude,
  43.0481, -- Syracuse latitude
  -76.1474 -- Syracuse longitude
) <= 100; -- 100 mile radius