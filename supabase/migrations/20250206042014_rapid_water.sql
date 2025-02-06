/*
  # Clear recordings data
  
  1. Changes
    - Truncate recordings table
    - Delete all objects in recordings storage bucket
*/

-- Truncate recordings table
TRUNCATE TABLE recordings CASCADE;

-- Delete all objects in recordings bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'recordings';