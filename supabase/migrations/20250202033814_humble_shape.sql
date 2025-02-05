/*
  # Fix marker persistence and add data validation

  1. Changes
    - Add NOT NULL constraints to critical marker fields
    - Add validation for title and description lengths
    - Add indexes for common queries
    - Update RLS policies for better data access control
    - Add trigger to automatically update timestamps

  2. Security
    - Ensure proper RLS policies for data access
    - Add validation constraints for data integrity
*/

-- Add NOT NULL constraints to critical fields
ALTER TABLE markers
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL,
ALTER COLUMN category SET NOT NULL,
ALTER COLUMN latitude SET NOT NULL,
ALTER COLUMN longitude SET NOT NULL;

-- Add validation constraints
ALTER TABLE markers
ADD CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
ADD CONSTRAINT description_not_empty CHECK (length(trim(description)) > 0),
ADD CONSTRAINT title_max_length CHECK (length(title) <= 200),
ADD CONSTRAINT description_max_length CHECK (length(description) <= 2000);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_markers_updated_at
    BEFORE UPDATE ON markers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_markers_title_description ON markers USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_markers_category_created ON markers(category, created_at DESC);

-- Update RLS policies to ensure proper data access
CREATE POLICY "Public can view active markers"
  ON markers FOR SELECT
  USING (
    CASE 
      WHEN category = 'hazard' THEN active = true
      ELSE true
    END
  );

-- Ensure markers can't be deleted once created
CREATE POLICY "No marker deletion"
  ON markers FOR DELETE
  TO authenticated
  USING (false);

-- Add function to clean up old resolved hazards
CREATE OR REPLACE FUNCTION cleanup_old_resolved_hazards()
RETURNS void AS $$
BEGIN
  UPDATE markers
  SET active = false
  WHERE 
    category = 'hazard' 
    AND active = true
    AND last_confirmed < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;