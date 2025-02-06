-- Truncate recordings table
TRUNCATE TABLE recordings CASCADE;

-- Delete all objects in recordings bucket
DELETE FROM storage.objects 
WHERE bucket_id = 'recordings';