-- Fix category column: ensure all items have valid, non-null category
-- 1. Update existing NULL categories to 'tops' as a safe default
UPDATE wardrobe_items SET category = 'tops' WHERE category IS NULL;

-- 2. Add NOT NULL constraint (if not already present)
ALTER TABLE wardrobe_items ALTER COLUMN category SET NOT NULL;

-- 3. Add CHECK constraint to enforce valid category values
ALTER TABLE wardrobe_items ADD CONSTRAINT valid_category_check 
CHECK (category IN ('tops', 'bottoms', 'fullbody', 'outerwear', 'shoes', 'bags', 'accessories'));
