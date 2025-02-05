-- First, temporarily disable the event_time constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'event_time_required_for_events'
  ) THEN
    ALTER TABLE markers DROP CONSTRAINT event_time_required_for_events;
  END IF;
END $$;

-- Temporarily disable the category constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'markers_category_check'
  ) THEN
    ALTER TABLE markers DROP CONSTRAINT markers_category_check;
  END IF;
END $$;

-- Update any invalid categories to 'ice' and ensure event_time is NULL
UPDATE markers 
SET 
  category = CASE 
    WHEN category NOT IN ('ice', 'police') THEN 'ice'
    ELSE category
  END,
  event_time = NULL;

-- Add the category constraint
ALTER TABLE markers 
ADD CONSTRAINT markers_category_check 
CHECK (category IN ('ice', 'police'));

-- Add back the event_time constraint
ALTER TABLE markers 
ADD CONSTRAINT event_time_required_for_events
CHECK (
  (category = 'event' AND event_time IS NOT NULL) OR
  (category != 'event')
);

-- Add index for category lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_markers_category ON markers(category);