DROP INDEX IF EXISTS idx_wardrobe_items_vibe_tags;
DROP INDEX IF EXISTS idx_wardrobe_items_processing_status;

ALTER TABLE wardrobe_items DROP COLUMN IF EXISTS functional_tags;
ALTER TABLE wardrobe_items DROP COLUMN IF EXISTS silhouette_tags;
ALTER TABLE wardrobe_items DROP COLUMN IF EXISTS vibe_tags;
ALTER TABLE wardrobe_items DROP COLUMN IF EXISTS processing_status;
