/*
  # Clear recordings data
  
  Cleans up all recordings data by:
  1. Truncating the recordings table
  2. Deleting all files in the recordings storage bucket
*/

-- Truncate recordings table
TRUNCATE TABLE recordings CASCADE;

-- Delete all objects in recordings bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'recordings';