-- Add NOT NULL constraints to critical fields
DO $$ 
BEGIN
  -- Set NOT NULL constraints if not already set
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' 
    AND column_name = 'title' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE markers ALTER COLUMN title SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' 
    AND column_name = 'description' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE markers ALTER COLUMN description SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' 
    AND column_name = 'category' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE markers ALTER COLUMN category SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' 
    AND column_name = 'latitude' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE markers ALTER COLUMN latitude SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markers' 
    AND column_name = 'longitude' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE markers ALTER COLUMN longitude SET NOT NULL;
  END IF;
END $$;

-- Add validation constraints with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'title_not_empty'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT title_not_empty 
      CHECK (length(trim(title)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'description_not_empty'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT description_not_empty 
      CHECK (length(trim(description)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'title_max_length'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT title_max_length 
      CHECK (length(title) <= 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'description_max_length'
  ) THEN
    ALTER TABLE markers ADD CONSTRAINT description_max_length 
      CHECK (length(description) <= 2000);
  END IF;
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger with existence check
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_markers_updated_at'
  ) THEN
    CREATE TRIGGER update_markers_updated_at
      BEFORE UPDATE ON markers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add indexes with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_markers_title_description'
  ) THEN
    CREATE INDEX idx_markers_title_description 
      ON markers USING gin(to_tsvector('english', title || ' ' || description));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_markers_category_created'
  ) THEN
    CREATE INDEX idx_markers_category_created 
      ON markers(category, created_at DESC);
  END IF;
END $$;

-- Update RLS policies with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'markers' 
    AND policyname = 'Public can view active markers'
  ) THEN
    CREATE POLICY "Public can view active markers"
      ON markers FOR SELECT
      USING (
        CASE 
          WHEN category = 'hazard' THEN active = true
          ELSE true
        END
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'markers' 
    AND policyname = 'No marker deletion'
  ) THEN
    CREATE POLICY "No marker deletion"
      ON markers FOR DELETE
      TO authenticated
      USING (false);
  END IF;
END $$;

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