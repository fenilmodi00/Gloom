-- Migration: 000007_optimize_indexes.down.sql
-- Reverts the index optimizations

-- ============================================
-- STEP 1: Re-add the indexes that were dropped
-- ============================================

-- Re-add idx_wardrobe_items_user_id (was made redundant by composite index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);

-- Re-add idx_outfits_user_id (was made redundant by composite indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);

-- Re-add idx_outfits_created_at (was made redundant by composite indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_created_at ON outfits(created_at DESC);

-- ============================================
-- STEP 2: Remove the new composite indexes
-- ============================================

-- Remove the new user_id + created_at indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_user_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_user_created_at;

-- Note: We don't drop the other composite indexes from migration 000006
-- (idx_wardrobe_items_user_category, idx_outfits_user_occasion, idx_outfits_user_vibe, idx_wardrobe_items_processing)
-- as they are still useful and should remain.