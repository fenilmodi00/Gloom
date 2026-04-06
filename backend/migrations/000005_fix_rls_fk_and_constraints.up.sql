-- Migration: 000005_fix_rls_fk_and_constraints.up.sql
-- Enables RLS on core tables and adds FK constraints

-- ============================================
-- STEP 1: Enable RLS on profiles, wardrobe_items, outfits
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Add FK constraints for user_id references
-- ============================================

-- profiles.id -> auth.users(id) (id is the PK, references auth.users)
-- Use RESTRICT (not CASCADE) because id is the primary key
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- wardrobe_items.user_id -> auth.users(id)
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_user_id_fkey;
ALTER TABLE wardrobe_items ADD CONSTRAINT wardrobe_items_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- outfits.user_id -> auth.users(id)
ALTER TABLE outfits DROP CONSTRAINT IF EXISTS outfits_user_id_fkey;
ALTER TABLE outfits ADD CONSTRAINT outfits_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_model_images already has FK, but ensure cascade
ALTER TABLE user_model_images DROP CONSTRAINT IF EXISTS user_model_images_user_id_fkey;
ALTER TABLE user_model_images ADD CONSTRAINT user_model_images_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- STEP 3: Create RLS policies matching Go query patterns
-- ============================================

-- profiles: users can only see/manage their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- wardrobe_items: users can only manage their own items
CREATE POLICY "wardrobe_items_select_own" ON wardrobe_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wardrobe_items_insert_own" ON wardrobe_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wardrobe_items_update_own" ON wardrobe_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wardrobe_items_delete_own" ON wardrobe_items
    FOR DELETE USING (auth.uid() = user_id);

-- outfits: users can only manage their own outfits
CREATE POLICY "outfits_select_own" ON outfits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "outfits_insert_own" ON outfits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "outfits_update_own" ON outfits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "outfits_delete_own" ON outfits
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Fix processing_status constraint to include all values used in Go code
-- ============================================
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_processing_status_check;
ALTER TABLE wardrobe_items ADD CONSTRAINT wardrobe_items_processing_status_check 
CHECK (processing_status IN ('ready', 'pending', 'processing', 'completed', 'failed', 'analyzing', 'fallback'));
