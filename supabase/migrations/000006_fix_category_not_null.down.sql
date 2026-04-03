-- Reverse the category not null fix
-- 1. Remove CHECK constraint
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS valid_category_check;

-- 2. Remove NOT NULL constraint (allows NULL again)
ALTER TABLE wardrobe_items ALTER COLUMN category DROP NOT NULL;

-- Note: We do NOT revert the UPDATE that set NULL categories to 'tops'
-- That data change is considered a fix, not a reversible operation.
