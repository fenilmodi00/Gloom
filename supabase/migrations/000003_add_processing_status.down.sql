-- Remove processing_status column from wardrobe_items table
ALTER TABLE wardrobe_items
DROP CONSTRAINT IF EXISTS processing_status_check;

ALTER TABLE wardrobe_items
DROP COLUMN IF EXISTS processing_status;