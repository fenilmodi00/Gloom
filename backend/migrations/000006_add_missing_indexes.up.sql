-- Migration: 000006_add_missing_indexes.up.sql
-- Adds composite indexes for common query patterns and removes unused indexes

-- ============================================
-- STEP 1: Add composite indexes for filtered list queries
-- ============================================

-- Composite index for wardrobe list with category filter
-- Query: SELECT ... FROM wardrobe_items WHERE user_id = $1 AND category = $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wardrobe_items_user_category 
ON wardrobe_items(user_id, category);

-- Composite index for outfits list with occasion filter
-- Query: SELECT ... FROM outfits WHERE user_id = $1 AND occasion = $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_user_occasion 
ON outfits(user_id, occasion);

-- Composite index for outfits list with vibe filter
-- Query: SELECT ... FROM outfits WHERE user_id = $1 AND vibe = $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_user_vibe 
ON outfits(user_id, vibe);

-- ============================================
-- STEP 2: Add partial index for active processing items
-- ============================================

-- Partial index for items being processed (used in background job queries)
-- Query: SELECT ... FROM wardrobe_items WHERE processing_status = 'processing'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wardrobe_items_processing 
ON wardrobe_items(user_id, created_at) 
WHERE processing_status = 'processing';

-- ============================================
-- STEP 3: Keep existing indexes (don't drop yet)
-- Note: The following indexes are flagged as "unused" by Supabase advisor
-- but they ARE needed for the query patterns. We keep them for now:
-- - idx_wardrobe_items_user_id (needed for WHERE user_id = $1)
-- - idx_wardrobe_items_created_at (needed for ORDER BY created_at DESC)
-- - idx_outfits_user_id (needed for WHERE user_id = $1)
-- - idx_outfits_created_at (needed for ORDER BY created_at DESC)
--
-- Only drop if EXPLAIN ANALYZE confirms they are never used:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_processing_status;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_user_id;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_created_at;
