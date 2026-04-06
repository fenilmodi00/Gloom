-- Migration: 000007_optimize_indexes.up.sql
-- Optimizes indexes based on query pattern analysis

-- ============================================
-- STEP 1: Add supporting indexes for common query patterns
-- ============================================

-- Index for wardrobe items: optimizes WHERE user_id = $1 ORDER BY created_at DESC
-- Also helps with WHERE user_id = $1 AND category = $2 ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wardrobe_items_user_created_at 
ON wardrobe_items(user_id, created_at DESC);

-- Index for outfits: optimizes WHERE user_id = $1 ORDER BY created_at DESC  
-- Also helps with WHERE user_id = $1 AND occasion = $2 ORDER BY created_at DESC
-- And WHERE user_id = $1 AND vibe = $2 ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outfits_user_created_at 
ON outfits(user_id, created_at DESC);

-- ============================================
-- STEP 2: Remove confirmed unused indexes
-- ============================================

-- idx_wardrobe_items_user_id: Made redundant by idx_wardrobe_items_user_category
-- (PostgreSQL can use leftmost prefix of composite index for user_id-only queries)
DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_user_id;

-- idx_outfits_user_id: Made redundant by idx_outfits_user_occasion and idx_outfits_user_vibe
DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_user_id;

-- idx_outfits_created_at: Made redundant by composite indexes for user_id-filtered queries
DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_created_at;

-- ============================================
-- STEP 3: Keep potentially useful indexes (verify before dropping in production)
-- ============================================

-- NOTE: The following indexes are flagged as "unused" by Supabase advisor but may be used:
-- - idx_wardrobe_items_processing_status: Possibly used by background jobs/workers
-- - idx_wardrobe_items_category: Not flagged, but verify usage
-- 
-- Before dropping in production, run EXPLAIN ANALYZE on representative queries
-- to confirm they are truly unused.

-- DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_processing_status;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_category;