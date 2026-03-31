-- Remove the processing_status constraint
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_processing_status_check;
