/*
  # Clear news items
  
  1. Changes
    - Truncates the news_items table to remove all existing entries
*/

-- Truncate news_items table
TRUNCATE TABLE news_items CASCADE;