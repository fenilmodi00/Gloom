-- Add updated_at column for transaction safety tracking
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create index for faster processing status queries on pending/processing items
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_processing_status 
ON wardrobe_items(processing_status) 
WHERE processing_status != 'completed';
