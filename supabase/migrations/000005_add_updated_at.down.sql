-- Remove updated_at column
ALTER TABLE wardrobe_items DROP COLUMN IF EXISTS updated_at;

-- Remove processing status index
DROP INDEX IF EXISTS idx_wardrobe_items_processing_status;
