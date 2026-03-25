CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    body_photo_url TEXT,
    skin_tone TEXT,
    style_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wardrobe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    cutout_url TEXT,
    category TEXT NOT NULL,
    sub_category TEXT,
    colors TEXT[] DEFAULT '{}',
    style_tags TEXT[] DEFAULT '{}',
    occasion_tags TEXT[] DEFAULT '{}',
    fabric_guess TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outfits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_ids TEXT[] NOT NULL DEFAULT '{}',
    occasion TEXT,
    vibe TEXT,
    color_reasoning TEXT,
    ai_score DOUBLE PRECISION DEFAULT 0.8,
    cover_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at ON wardrobe_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON outfits(created_at DESC);
