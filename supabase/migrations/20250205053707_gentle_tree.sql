/*
  # Clear markers data
  
  1. Changes
    - Truncate all marker-related tables to start fresh
    - Preserve table structure and constraints
    - Reset sequences
*/

-- Truncate tables in correct order due to foreign key constraints
TRUNCATE TABLE marker_confirmations CASCADE;
TRUNCATE TABLE marker_votes CASCADE;
TRUNCATE TABLE markers CASCADE;

-- Reset sequences if they exist
ALTER SEQUENCE IF EXISTS markers_id_seq RESTART;
ALTER SEQUENCE IF EXISTS marker_votes_id_seq RESTART;
ALTER SEQUENCE IF EXISTS marker_confirmations_id_seq RESTART;