-- Alter wardrobe_items table to add missing fields for Phase 1/2
ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS functional_tags TEXT[] DEFAULT '{}';
ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS silhouette_tags TEXT[] DEFAULT '{}';
ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE wardrobe_items ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready';

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_vibe_tags ON wardrobe_items USING GIN (vibe_tags);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_processing_status ON wardrobe_items(processing_status);
