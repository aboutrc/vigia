/*
  # Add news management system

  1. New Tables
    - `news_items`
      - `id` (uuid, primary key)
      - `date` (date)
      - `title` (jsonb for multilingual support)
      - `content` (jsonb for multilingual support)
      - `order` (integer for display order)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `news_items` table
    - Add policies for public read access
*/

-- Create news_items table
CREATE TABLE news_items (
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

-- Create policies
CREATE POLICY "Public can read news items"
  ON news_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert news items"
  ON news_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update news items"
  ON news_items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete news items"
  ON news_items FOR DELETE
  USING (true);

-- Create indexes
CREATE INDEX idx_news_items_order ON news_items("order");
CREATE INDEX idx_news_items_date ON news_items(date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_news_items_updated_at
  BEFORE UPDATE ON news_items
  FOR EACH ROW
  EXECUTE FUNCTION update_news_items_updated_at();