/*
  # Clear recordings and storage

  1. Changes
    - Clear all recordings from the recordings table
    - Delete all objects from the recordings storage bucket
*/

-- Truncate recordings table
TRUNCATE TABLE recordings CASCADE;

-- Delete all objects in recordings bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'recordings';