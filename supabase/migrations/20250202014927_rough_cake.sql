/*
  # Update markers table for Leaflet compatibility

  1. Changes
    - Add indexes for faster geospatial queries
    - Add check constraints for valid coordinates

  2. Security
    - No changes to RLS policies
*/

-- Add check constraints for valid coordinates
ALTER TABLE markers
ADD CONSTRAINT valid_latitude
  CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE markers
ADD CONSTRAINT valid_longitude
  CHECK (longitude >= -180 AND longitude <= 180);

-- Add composite index for coordinates
CREATE INDEX IF NOT EXISTS idx_markers_coordinates 
ON markers(latitude, longitude);