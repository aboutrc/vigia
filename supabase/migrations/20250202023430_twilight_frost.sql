/*
  # Enhance marker data persistence

  1. Changes
    - Add NOT NULL constraints to ensure required data is always present
    - Add text length constraints to prevent empty or overly long content
    - Add indexes to improve query performance
    - Update RLS policies to ensure proper data access

  2. Security
    - Strengthen RLS policies for marker access
    - Ensure proper user authorization for marker operations
*/

-- Add NOT NULL constraints and validations
ALTER TABLE markers
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL,
ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
ADD CONSTRAINT description_length CHECK (char_length(description) BETWEEN 1 AND 2000);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_markers_user_id ON markers(user_id);
CREATE INDEX IF NOT EXISTS idx_markers_category ON markers(category);
CREATE INDEX IF NOT EXISTS idx_markers_created_at ON markers(created_at);

-- Update RLS policies to ensure proper data access
CREATE POLICY "Public can view all markers"
  ON markers FOR SELECT
  USING (true);

CREATE POLICY "Users can only update their own markers"
  ON markers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);