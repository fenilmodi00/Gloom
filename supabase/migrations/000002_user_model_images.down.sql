-- Drop table user_model_images
DROP TABLE IF EXISTS user_model_images;

-- Drop storage bucket for model corrosion images
-- Note: Storage bucket deletion would typically be done via Supabase dashboard or CLI
-- For SQL, we would need to delete the bucket and clean up objects
-- Since we can't easily delete objects in SQL, we'll note this needs manual cleanup
-- DELETE FROM storage.objects WHERE bucket_id = 'model-corrosion-images';
-- DELETE FROM storage.buckets WHERE id = 'model-corrosion-images';