-- Drop storage policies for model corrosion images bucket
DROP POLICY IF EXISTS "Users can upload model images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own model images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own model images" ON storage.objects;

-- Drop storage bucket for model corrosion images
DELETE FROM storage.objects WHERE bucket_id = 'model-corrosion-images';
DELETE FROM storage.buckets WHERE id = 'model-corrosion-images';

-- Drop table user_model_images
DROP TABLE IF EXISTS user_model_images;