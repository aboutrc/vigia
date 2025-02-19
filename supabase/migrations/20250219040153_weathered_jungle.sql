/*
  # Clear news items table
  
  1. Changes
    - Truncates the news_items table to remove all existing entries
    - Ensures table exists before truncating
*/

-- Create news_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title jsonb NOT NULL,
  content jsonb NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT title_format CHECK (
    jsonb_typeof(title->'en') = 'string' AND
    jsonb_typeof(title->'es') = 'string'
  ),
  CONSTRAINT content_format CHECK (
    jsonb_typeof(content->'en') = 'string' AND
    jsonb_typeof(content->'es') = 'string'
  )
);

-- Enable RLS
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_items' 
    AND policyname = 'Public can read news items'
  ) THEN
    CREATE POLICY "Public can read news items"
      ON news_items FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_items' 
    AND policyname = 'Anyone can insert news items'
  ) THEN
    CREATE POLICY "Anyone can insert news items"
      ON news_items FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_items' 
    AND policyname = 'Anyone can update news items'
  ) THEN
    CREATE POLICY "Anyone can update news items"
      ON news_items FOR UPDATE
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_items' 
    AND policyname = 'Anyone can delete news items'
  ) THEN
    CREATE POLICY "Anyone can delete news items"
      ON news_items FOR DELETE
      USING (true);
  END IF;
END $$;

-- Truncate the table
TRUNCATE TABLE news_items CASCADE;