# Revised: Mock Data to Supabase Backend Migration Plan (TDD-Oriented)

> **Context:** Single-user testing with placeholder `user_id`. Images already in Supabase Storage. Need simplest path to real data.

**Goal:** Migrate from mock data to Supabase with minimal changes, focusing on testing and atomic commits.

**Architecture:** 
1. Single migration file for schema changes
2. Simple data population (not complex defaults)
3. TDD: Write tests before each change
4. Atomic commits per task

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Zustand, Expo Router

---

## Phase 1: Schema & Types (3 commits)

### Task 1: Write Tests for Schema Changes
**TDD First:** Create test file to verify schema expectations.

**Files:**
- Create: `__tests__/supabase-schema.test.ts`

**Test Cases:**
1. `wardrobe_items` table exists with required columns
2. `style_tags` and `colors` columns accept arrays
3. New columns (`functional_tags`, `silhouette_tags`, `vibe_tags`) exist
4. `user_id` column accepts UUID

**Expected:** Tests fail (schema doesn't exist yet).

**Commit:** `test: Add schema verification tests for Supabase migration`

---

### Task 2: Create Single Migration File
**Files:**
- Create: `supabase/migrations/002_add_missing_columns_and_defaults.sql`

**SQL:**
```sql
-- Add missing tag columns to wardrobe_items table
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS functional_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS silhouette_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';

-- Ensure style_tags and colors columns exist (should already exist)
ALTER TABLE wardrobe_items 
ALTER COLUMN style_tags SET DEFAULT '{}',
ALTER COLUMN colors SET DEFAULT '{}';

-- Update existing rows with empty arrays where NULL
UPDATE wardrobe_items 
SET 
  style_tags = COALESCE(style_tags, '{}'),
  colors = COALESCE(colors, '{}'),
  functional_tags = COALESCE(functional_tags, '{}'),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, '{}')
WHERE style_tags IS NULL OR colors IS NULL OR functional_tags IS NULL OR silhouette_tags IS NULL OR vibe_tags IS NULL;

-- Simple indexes (only for production, skip for test env)
-- CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
```

**Run migration:**
```bash
npx supabase db push
```

**Expected:** Migration succeeds, tests pass.

**Commit:** `feat: Add missing tag columns with empty defaults to wardrobe_items`

---

### Task 3: Update TypeScript Types
**Files:**
- Modify: `lib/supabase.ts:51-91` (Database type definition)

**Changes:**
1. Add `functional_tags`, `silhouette_tags`, `vibe_tags` to Row/Insert/Update
2. Ensure `style_tags` and `colors` are typed as `string[]`

**Verification:**
```bash
npx tsc --noEmit
```

**Expected:** No type errors.

**Commit:** `types: Update Supabase Database type to include all tag columns`

---

## Phase 2: Data Population (2 commits)

### Task 4: Write Tests for Data Population
**TDD First:** Create test file for data migration.

**Files:**
- Create: `__tests__/wardrobe-data-migration.test.ts`

**Test Cases:**
1. All 83 items have non-null tag arrays (not empty strings)
2. `user_id` is placeholder UUID for all items
3. `image_url` is valid Supabase Storage URL
4. No items have NULL in any tag column

**Expected:** Tests fail (data not migrated yet).

**Commit:** `test: Add data migration verification tests`

---

### Task 5: Simple Data Population
**Files:**
- Create: `supabase/migrations/003_populate_default_tags.sql`

**SQL (Simpler than original):**
```sql
-- Simple defaults: just ensure arrays are empty, not NULL
-- No category-specific tags (overkill for testing)

UPDATE wardrobe_items 
SET 
  style_tags = CASE 
    WHEN style_tags IS NULL OR array_length(style_tags, 1) IS NULL THEN '{}'
    ELSE style_tags 
  END,
  colors = CASE 
    WHEN colors IS NULL OR array_length(colors, 1) IS NULL THEN '{}'
    ELSE colors 
  END,
  functional_tags = CASE 
    WHEN functional_tags IS NULL OR array_length(functional_tags, 1) IS NULL THEN '{}'
    ELSE functional_tags 
  END,
  silhouette_tags = CASE 
    WHEN silhouette_tags IS NULL OR array_length(silhouette_tags, 1) IS NULL THEN '{}'
    ELSE silhouette_tags 
  END,
  vibe_tags = CASE 
    WHEN vibe_tags IS NULL OR array_length(vibe_tags, 1) IS NULL THEN '{}'
    ELSE vibe_tags 
  END
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

**Run migration:**
```bash
npx supabase db push
```

**Expected:** Tests pass, all items have empty arrays.

**Commit:** `data: Populate empty tag arrays for existing wardrobe items`

---

## Phase 3: Code Updates (3 commits)

### Task 6: Write Tests for Store Updates
**TDD First:** Create test for wardrobe store.

**Files:**
- Create: `__tests__/wardrobe-store.test.ts`

**Test Cases:**
1. Store fetches items with placeholder `user_id`
2. Store handles empty arrays for tags
3. Store can add items with all tag fields

**Expected:** Tests fail (store not updated).

**Commit:** `test: Add wardrobe store Supabase integration tests`

---

### Task 7: Update Wardrobe Store
**Files:**
- Modify: `lib/store/wardrobe.store.ts:31-58` (addItem method)

**Changes:**
1. Add new tag fields to insert statement
2. Ensure queries filter by placeholder `user_id`

**Verification:**
```bash
npx tsc --noEmit
```

**Expected:** Tests pass.

**Commit:** `feat: Update wardrobe store to include new tag fields`

---

### Task 8: Remove Mock Data Fallbacks
**Files:**
- Modify: `app/(tabs)/wardrobe/index.tsx` (remove mock import and fallback)
- Modify: `app/outfit-builder.tsx` (remove mock import and fallback)

**Changes:**
1. Remove `import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';`
2. Change fallback logic: `storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets()` → `storeItems`
3. Keep empty state handling

**Verification:**
```bash
npx tsc --noEmit
# Grep to ensure no mock imports remain
grep -r "mock-wardrobe" --include="*.ts" --include="*.tsx" .
```

**Expected:** No mock data references.

**Commit:** `refactor: Remove mock data fallback patterns from screens`

---

## Phase 4: Testing & Cleanup (2 commits)

### Task 9: End-to-End Test
**Files:**
- Create: `__tests__/e2e-wardrobe-migration.test.ts` (optional)

**Manual Testing Checklist:**
1. App loads without errors
2. Wardrobe screen shows 83 items from Supabase
3. Each item has image, name, category (tags may be empty)
4. Add new item works (camera/gallery)
5. Delete item works
6. Outfit builder shows items

**Commit:** `test: Add end-to-end migration verification tests`

---

### Task 10: Clean Up
**Files:**
- Consider: Delete or move `lib/mock-wardrobe.ts` to `__mocks__/`

**Changes:**
1. Move mock file to test utilities if needed
2. Update AGENTS.md to note migration complete

**Commit:** `chore: Clean up mock data files after successful migration`

---

## Atomic Commit Strategy

Each task = 1 atomic commit. Total: **10 commits maximum**.

**Commit Order:**
1. `test: Add schema verification tests`
2. `feat: Add missing tag columns`
3. `types: Update Supabase Database type`
4. `test: Add data migration tests`
5. `data: Populate empty tag arrays`
6. `test: Add wardrobe store tests`
7. `feat: Update wardrobe store`
8. `refactor: Remove mock data fallbacks`
9. `test: Add e2e tests`
10. `chore: Clean up mock files`

**Rollback Safety:**
- Each commit is reversible
- Schema changes are backward compatible (add columns only)
- Data changes only affect test user

---

## Simplified Success Criteria

1. ✅ All 83 items load from Supabase (not mock)
2. ✅ No NULL values in tag columns (empty arrays OK)
3. ✅ TypeScript compiles without errors
4. ✅ App functions with real data (add/delete items)
5. ✅ No mock data imports in production code
6. ✅ Each commit passes tests before moving to next

---

## Key Improvements Over Original Plan

1. **TDD-Oriented:** Tests before each change
2. **Simpler Data Migration:** Empty arrays instead of complex defaults
3. **Single Migration File:** Instead of multiple files
4. **Atomic Commits:** Clear rollback points
5. **Focus on Testing Context:** Placeholder user_id, skip complex indexes
6. **Addresses All Questions:** Auth bypass, data migration, schema mismatch, simplest path

---

## Next Steps After This Plan

1. Run Gemini on existing images to generate real tags (future)
2. Add proper auth when ready for multi-user
3. Populate meaningful style_tags/colors for better outfit suggestions
4. Add production indexes when scaling