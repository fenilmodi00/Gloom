-- Add CHECK constraint for processing_status to allow 'pending', 'processing', 'completed', 'failed'
-- First drop existing constraint if it exists (might have been added manually)
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_processing_status_check;

-- Add constraint with all valid processing statuses
ALTER TABLE wardrobe_items 
ADD CONSTRAINT wardrobe_items_processing_status_check 
CHECK (processing_status IN ('ready', 'pending', 'processing', 'completed', 'failed'));

-- Update any existing 'ready' items to maintain consistency
-- (no data migration needed as 'ready' is already valid)
