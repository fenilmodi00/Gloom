-- Migration: 000006_add_missing_indexes.down.sql
-- Reverses index additions

DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_user_category;
DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_user_occasion;
DROP INDEX CONCURRENTLY IF EXISTS idx_outfits_user_vibe;
DROP INDEX CONCURRENTLY IF EXISTS idx_wardrobe_items_processing;
