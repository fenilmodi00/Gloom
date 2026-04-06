-- Migration: 000005_fix_rls_fk_and_constraints.down.sql
-- Reverses all changes from 000005_fix_rls_fk_and_constraints.up.sql

-- ============================================
-- STEP 1: Revert processing_status constraint
-- ============================================
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_processing_status_check;
ALTER TABLE wardrobe_items ADD CONSTRAINT wardrobe_items_processing_status_check 
CHECK (processing_status IN ('ready', 'pending', 'processing', 'completed', 'failed'));

-- ============================================
-- STEP 2: Drop RLS policies
-- ============================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

DROP POLICY IF EXISTS "wardrobe_items_select_own" ON wardrobe_items;
DROP POLICY IF EXISTS "wardrobe_items_insert_own" ON wardrobe_items;
DROP POLICY IF EXISTS "wardrobe_items_update_own" ON wardrobe_items;
DROP POLICY IF EXISTS "wardrobe_items_delete_own" ON wardrobe_items;

DROP POLICY IF EXISTS "outfits_select_own" ON outfits;
DROP POLICY IF EXISTS "outfits_insert_own" ON outfits;
DROP POLICY IF EXISTS "outfits_update_own" ON outfits;
DROP POLICY IF EXISTS "outfits_delete_own" ON outfits;

-- ============================================
-- STEP 3: Drop FK constraints
-- ============================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_user_id_fkey;

ALTER TABLE outfits DROP CONSTRAINT IF EXISTS outfits_user_id_fkey;

ALTER TABLE user_model_images DROP CONSTRAINT IF EXISTS user_model_images_user_id_fkey;

-- ============================================
-- STEP 4: Disable RLS
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE outfits DISABLE ROW LEVEL SECURITY;
