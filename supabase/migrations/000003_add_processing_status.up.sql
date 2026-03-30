-- Add processing_status column to wardrobe_items table
ALTER TABLE wardrobe_items 
  ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Note: CHECK already applied inline with the column, no separate constraint needed
