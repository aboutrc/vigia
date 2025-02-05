/*
  # Create marker votes table

  1. New Tables
    - `marker_votes`
      - `id` (uuid, primary key)
      - `marker_id` (uuid) - References markers
      - `user_id` (uuid) - References profiles
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Users can only vote once per marker
    - Users can read all votes
*/

CREATE TABLE marker_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker_id uuid REFERENCES markers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(marker_id, user_id)
);

ALTER TABLE marker_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON marker_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON marker_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON marker_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);