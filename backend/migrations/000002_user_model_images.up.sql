CREATE TABLE IF NOT EXISTS user_model_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    outfit_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_model_images_user_id ON user_model_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_model_images_outfit_id ON user_model_images(outfit_id);
