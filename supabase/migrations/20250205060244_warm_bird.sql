-- Create recordings table
CREATE TABLE recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_url text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Anyone can view recordings"
  ON recordings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert recordings"
  ON recordings FOR INSERT
  TO public
  WITH CHECK (true);

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('recordings', 'recordings', true);

-- Allow public access to recordings bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recordings');

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'recordings');