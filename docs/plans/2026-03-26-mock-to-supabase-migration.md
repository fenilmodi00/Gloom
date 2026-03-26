# Mock Data to Supabase Backend Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the StyleAI app from using local mock data to fully relying on Supabase backend database for wardrobe items and outfits.

**Architecture:** 
1. Update database schema to include missing tag columns
2. Migrate existing 83 wardrobe items with default tags
3. Update TypeScript types and Supabase client to match new schema
4. Remove mock data fallback patterns from stores and screens
5. Implement proper error handling for empty database states

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Zustand, Expo Router

---

### Task 1: Database Schema Migration - Add Missing Columns

**Files:**
- Create: `supabase/migrations/002_add_missing_tag_columns.sql`
- Modify: `lib/supabase.ts:51-64` (Database type definition)

**Step 1: Write the migration SQL**

```sql
-- Add missing tag columns to wardrobe_items table
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS functional_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS silhouette_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';

-- Create GIN indexes for array columns for efficient searching
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_functional_tags ON wardrobe_items USING GIN (functional_tags);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_silhouette_tags ON wardrobe_items USING GIN (silhouette_tags);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_vibe_tags ON wardrobe_items USING GIN (vibe_tags);
```

**Step 2: Update TypeScript types in supabase.ts**

Update the Database type definition to include the new fields in wardrobe_items:
- Add `functional_tags: string[]` to Row, Insert, Update interfaces
- Add `silhouette_tags: string[]` to Row, Insert, Update interfaces  
- Add `vibe_tags: string[]` to Row, Insert, Update interfaces

**Step 3: Run migration**

```bash
# Apply migration to Supabase
npx supabase db push
```

**Expected:** Migration succeeds, indexes created for performance.

---

### Task 2: Update Wardrobe Store to Include New Tags

**Files:**
- Modify: `lib/store/wardrobe.store.ts:31-58` (addItem method)

**Step 1: Update addItem method to include new tag fields**

Current `addItem` method is missing the new tag fields. Update the insert statement to include:
```typescript
functional_tags: itemInput.functional_tags || [],
silhouette_tags: itemInput.silhouette_tags || [],
vibe_tags: itemInput.vibe_tags || [],
```

**Step 2: Update WardrobeItemInput type if needed**

Check `types/wardrobe.ts:20-32` - the WardrobeItemInput interface already includes these fields, so no changes needed.

**Step 3: Test that new items can be created with tags**

Run a quick test to verify the store can create items with the new tag fields.

**Expected:** Store can create wardrobe items with functional_tags, silhouette_tags, and vibe_tags.

---

### Task 3: Migrate Existing Data with Default Tags

**Files:**
- Create: `supabase/migrations/003_migrate_existing_wardrobe_items.sql`

**Step 1: Create data migration script**

```sql
-- Update existing 83 wardrobe items with default tags based on category
-- This ensures existing data is compatible with new schema

-- Tops get default tags
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['layering_staple']),
  silhouette_tags = COALESCE(silhouette_tags, ARRAY['regular_fit']),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'tops' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Bottoms get default tags
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['base_layer']),
  silhouette_tags = COALESCE(silhouette_tags, ARRAY['regular_fit']),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'bottoms' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Shoes get default tags (empty for functional/silhouette as per mock data)
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, '{}'),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'shoes' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Accessories get default tags
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['statement_piece']),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'accessories' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Outerwear (if any)
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['outer_layer', 'layering_staple']),
  silhouette_tags = COALESCE(silhouette_tags, ARRAY['regular_fit']),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'outerwear' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Fullbody (if any)
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['statement_piece']),
  silhouette_tags = COALESCE(silhouette_tags, ARRAY['regular_fit']),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'fullbody' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');

-- Bags (if any)
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, ARRAY['statement_piece']),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, ARRAY['timeless'])
WHERE category = 'bags' AND (functional_tags IS NULL OR functional_tags = '{}' OR silhouette_tags IS NULL OR silhouette_tags = '{}' OR vibe_tags IS NULL OR vibe_tags = '{}');
```

**Step 2: Verify migration**

Run a count query to ensure all items have tags:
```sql
SELECT category, 
       COUNT(*) as total,
       COUNT(CASE WHEN functional_tags IS NOT NULL AND array_length(functional_tags, 1) > 0 THEN 1 END) as has_functional,
       COUNT(CASE WHEN silhouette_tags IS NOT NULL AND array_length(silhouette_tags, 1) > 0 THEN 1 END) as has_silhouette,
       COUNT(CASE WHEN vibe_tags IS NOT NULL AND array_length(vibe_tags, 1) > 0 THEN 1 END) as has_vibe
FROM wardrobe_items 
GROUP BY category;
```

**Expected:** All 83 existing items have appropriate default tags.

---

### Task 4: Remove Mock Data Fallback Pattern

**Files:**
- Modify: `app/(tabs)/wardrobe/index.tsx:6` (remove import)
- Modify: `app/(tabs)/wardrobe/index.tsx:114-116` (remove mock fallback)
- Modify: `app/outfit-builder.tsx:16` (remove import)
- Modify: `app/outfit-builder.tsx:34-37` (remove mock fallback)

**Step 1: Update wardrobe screen**

Remove:
```typescript
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
```

Change:
```typescript
// Use mock data if store is empty
const items = useMemo(() => {
  return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
}, [storeItems]);
```

To:
```typescript
// Use store items directly
const items = storeItems;
```

**Step 2: Update outfit builder screen**

Remove:
```typescript
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
```

Change:
```typescript
// Use mock data if store is empty
const items = useMemo(() => {
  return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
}, [storeItems]);
```

To:
```typescript
// Use store items directly
const items = storeItems;
```

**Step 3: Handle empty state gracefully**

The existing empty state handling in both screens should remain. When items.length === 0, show EmptyState component with appropriate message.

**Expected:** No more mock data imports or fallback patterns.

---

### Task 5: Update Empty State Handling

**Files:**
- Modify: `app/(tabs)/wardrobe/index.tsx:239-265` (empty state)
- Modify: `components/shared/EmptyState.tsx` (if needed)

**Step 1: Improve empty state messaging**

Current empty state shows "Your closet is empty" which is appropriate for production. No changes needed to EmptyState component.

**Step 2: Ensure proper loading states**

The current code shows `LoadingOverlay` when `isLoading && items.length === 0`. This is good for initial load. When items load successfully but are empty, it shows EmptyState.

**Step 3: Test empty state flow**

1. User logs in for first time
2. Wardrobe store shows loading
3. If no items in DB, shows EmptyState with "Add item" button
4. User can add items via camera/gallery

**Expected:** Proper empty state handling without mock data.

---

### Task 6: Verify Outfits Table Schema

**Files:**
- Review: `supabase/migrations/001_initial_schema.sql:38-52`
- Review: `lib/store/outfit.store.ts` (no changes needed)

**Step 1: Analyze outfits table schema**

Current schema has:
- `item_ids uuid[]` - stores array of wardrobe item IDs
- `occasion`, `vibe`, `color_reasoning` - text fields
- `ai_score` - float
- `cover_image_url` - text

This schema is appropriate for storing AI-generated outfits. No missing columns.

**Step 2: Check TypeScript types match**

The `Outfit` interface in `outfit.store.ts` matches the database schema.

**Step 3: Consider future enhancements**

Potential future additions:
- `style_tags` array for outfit styling
- `is_public` boolean for sharing
- `rating` number for user feedback

But current schema is sufficient for Phase 1.

**Expected:** Outfits table schema is complete for current needs.

---

### Task 7: Update TypeScript Types to Match Database

**Files:**
- Modify: `types/wardrobe.ts` (already correct)
- Modify: `lib/supabase.ts:51-91` (Database type)

**Step 1: Verify WardrobeItem type**

`types/wardrobe.ts` already includes:
```typescript
functional_tags: string[];
silhouette_tags: string[];
vibe_tags: string[];
```

**Step 2: Update Database type in supabase.ts**

Update the Database type to include the new fields in wardrobe_items Table definition.

**Step 3: Ensure type consistency**

Run TypeScript compiler to check for any type mismatches:
```bash
npx tsc --noEmit
```

**Expected:** All TypeScript types match database schema.

---

### Task 8: Remove Mock Data File (Optional)

**Files:**
- Consider deleting: `lib/mock-wardrobe.ts`
- Or keep for reference/testing

**Step 1: Assess if mock file is still needed**

Options:
1. **Delete**: Remove entirely since we're fully migrated
2. **Keep for testing**: Use in test environments
3. **Keep for reference**: Keep as documentation of tag logic

**Step 2: If keeping, move to test utilities**

Move to `__mocks__/wardrobe.mock.ts` for test usage only.

**Step 3: Update any remaining references**

Search for any remaining imports of mock-wardrobe:
```bash
grep -r "mock-wardrobe" --include="*.ts" --include="*.tsx" .
```

**Expected:** No production code depends on mock data.

---

### Task 9: Test Migration End-to-End

**Files:**
- Test: Manual testing of all flows
- Optional: Create test files

**Step 1: Test wardrobe flow**

1. Launch app
2. Verify items load from Supabase (no mock fallback)
3. Add new item via camera/gallery
4. Verify item appears in list with tags
5. Delete item, verify it's removed

**Step 2: Test outfit builder flow**

1. Open outfit builder
2. Select items from wardrobe
3. Verify combinations work with real data
4. Generate outfit suggestion

**Step 3: Test empty state**

1. Create new test user
2. Verify empty state shows correctly
3. Add first item
4. Verify transition from empty to populated

**Expected:** All functionality works with Supabase data only.

---

### Task 10: Clean Up and Documentation

**Files:**
- Modify: `AGENTS.md` (if needed)
- Optional: Create migration guide

**Step 1: Update documentation**

Update any documentation that references mock data usage.

**Step 2: Create rollback plan**

Document how to revert if issues arise:
1. Re-add mock imports
2. Restore fallback patterns
3. Revert database migration

**Step 3: Performance monitoring**

Monitor Supabase query performance after migration:
- Check index usage
- Monitor query times
- Set up alerts for slow queries

**Expected:** Clean migration with proper documentation.

---

## Migration Rollback Plan

If issues arise, revert in this order:

1. **Code rollback**: Re-add mock imports and fallback patterns
2. **Database rollback**: New columns can stay (backward compatible)
3. **Store rollback**: Restore original addItem without new tags

## Success Criteria

1. ✅ All 83 existing wardrobe items have proper tags
2. ✅ No mock data imports in production code
3. ✅ Empty states show correctly for new users
4. ✅ TypeScript compiles without errors
5. ✅ All existing functionality preserved
6. ✅ Performance maintained or improved with indexes