-- Create user_model_images table
CREATE TABLE user_model_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  model_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_model_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own images
CREATE POLICY "Users can view own images" ON user_model_images
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own images
CREATE POLICY "Users can insert own images" ON user_model_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own images
CREATE POLICY "Users can delete own images" ON user_model_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster user queries
CREATE INDEX idx_user_model_images_user_id ON user_model_images(user_id);
CREATE INDEX idx_user_model_images_created_at ON user_model_images(created_at DESC);