/*
  # Add index for event time

  1. Changes
    - Add index on `event_time` column for better query performance on event listings
*/

CREATE INDEX IF NOT EXISTS idx_markers_event_time ON markers(event_time);