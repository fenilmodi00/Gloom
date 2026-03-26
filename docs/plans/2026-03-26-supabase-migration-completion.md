# Supabase Migration Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining Supabase migration work by fixing wardrobe store connection, adding missing database columns, and resolving type mismatches.

**Architecture:** Fix critical bug (dev-user ID mismatch), add missing schema columns, update type definitions, resolve category type mismatch, and ensure proper dev bypass logic.

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Zustand, Expo Router

**Additional Issues Found:**
- Category type mismatch between database schema and TypeScript types
- TypeScript errors in mock-wardrobe.ts and wardrobe/index.tsx due to category mismatch
- Existing code uses 'tops'/'bottoms'/'fullbody'/'outerwear'/'bags'/'accessories' but TypeScript defines 'upper'/'lower'/'dress'/'shoes'/'bag'/'accessory'

---

## Task 1: Fix Dev-User ID Mismatch in Wardrobe Store

**Files:**
- Modify: `lib/store/wardrobe.store.ts:105` and `lib/store/wardrobe.store.ts:173`

**Step 1: Identify the issue**
- Current: Wardrobe store checks `user.id === 'dev-user'`
- Problem: Auth store sets user ID to `'00000000-0000-0000-0000-000000000000'`
- Effect: Dev bypass never triggers, causing Supabase queries to fail

**Step 2: Update dev bypass check**
Change line 105 from:
```typescript
if (!isSupabaseConfigured || user.id === 'dev-user') {
```
To:
```typescript
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
```

Change line 173 from:
```typescript
if (!isSupabaseConfigured || user.id === 'dev-user') {
```
To:
```typescript
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
```

**Step 3: Update dummy data user_id**
Change line 9 in DUMMY_WARDROBE_ITEMS from:
```typescript
user_id: 'dev-user',
```
To:
```typescript
user_id: '00000000-0000-0000-0000-000000000000',
```

**Step 4: Test the fix**
Run TypeScript check:
```bash
npx tsc --noEmit
```
Expected: No errors

**Step 5: Commit**
```bash
git add lib/store/wardrobe.store.ts
git commit -m "fix: Update dev-user ID to match auth store UUID"
```

---

## Task 2: Add Missing Database Columns

**Files:**
- Create: `supabase/migrations/002_add_missing_tag_columns.sql`

**Step 1: Create migration file**
```sql
-- Add missing tag columns to wardrobe_items table
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS functional_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS silhouette_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';

-- Ensure existing rows have empty arrays instead of NULL
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, '{}'),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, '{}')
WHERE functional_tags IS NULL OR silhouette_tags IS NULL OR vibe_tags IS NULL;
```

**Step 2: Verify migration syntax**
Check SQL syntax is valid (no external DB connection needed for this step)

**Step 3: Update documentation**
Add note about migration execution to README or comments

**Step 4: Commit**
```bash
git add supabase/migrations/002_add_missing_tag_columns.sql
git commit -m "feat: Add missing tag columns to wardrobe_items table"
```

---

## Task 3: Update TypeScript Type Definitions

**Files:**
- Modify: `lib/supabase.ts:59-91` (Database type definition)

**Step 1: Update wardrobe_items Row type**
Add to Row interface (around line 68):
```typescript
functional_tags: string[];
silhouette_tags: string[];
vibe_tags: string[];
```

**Step 2: Update wardrobe_items Insert type**
Add to Insert interface (around line 82):
```typescript
functional_tags?: string[];
silhouette_tags?: string[];
vibe_tags?: string[];
```

**Step 3: Update wardrobe_items Update type**
Add to Update interface (around line 96):
```typescript
functional_tags?: string[];
silhouette_tags?: string[];
vibe_tags?: string[];
```

**Step 4: Run TypeScript verification**
```bash
npx tsc --noEmit
```
Expected: No type errors

**Step 5: Commit**
```bash
git add lib/supabase.ts
git commit -m "types: Update Database type to include missing tag columns"
```

---

## Task 4: Fix Category Type Mismatch (CRITICAL)

**Files:**
- Modify: `supabase/migrations/001_initial_schema.sql:24-26`
- Modify: `types/wardrobe.ts:1` (Category type)

**Step 1: Identify the mismatch**
- Database schema uses: 'tops','bottoms','fullbody','outerwear','shoes','bags','accessories'
- TypeScript types use: 'upper', 'lower', 'dress', 'shoes', 'bag', 'accessory'
- This causes runtime errors when inserting/updating data

**Step 2: Update database schema to match TypeScript**
Modify the CHECK constraint in `supabase/migrations/001_initial_schema.sql`:
```sql
category text not null
  check (category in ('upper','lower','dress','shoes','bag','accessory')),
```

**Step 3: Update TypeScript types to match database (Alternative)**
OR modify `types/wardrobe.ts` line 1:
```typescript
export type Category = 'tops' | 'bottoms' | 'fullbody' | 'outerwear' | 'shoes' | 'bags' | 'accessories';
```

**Step 4: Choose approach**
- Option A: Update database to match TypeScript (cleaner for existing code)
- Option B: Update TypeScript to match database (cleaner for existing data)

**Recommended: Option A** - Update database to match TypeScript types, as this maintains consistency with existing UI code.

**Step 5: Update category names in dummy data**
Update `DUMMY_WARDROBE_ITEMS` in wardrobe.store.ts to use consistent categories

**Step 6: Test and commit**
```bash
npx tsc --noEmit
git add supabase/migrations/001_initial_schema.sql types/wardrobe.ts lib/store/wardrobe.store.ts
git commit -m "fix: Align database category types with TypeScript definitions"
```

---

## Task 5: Add Dev Bypass to Outfit Store (Optional)

**Files:**
- Modify: `lib/store/outfit.store.ts`

**Step 1: Add Supabase configuration check**
Add import at top:
```typescript
import { isSupabaseConfigured } from '../supabase';
```

**Step 2: Add dev bypass to fetchOutfits**
Wrap the Supabase query in fetchOutfits (around line 29):
```typescript
// Dev Bypass
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
  set({ outfits: [], isLoading: false });
  return;
}
```

**Step 3: Add dev bypass to saveOutfit**
Wrap the Supabase insert in saveOutfit (around line 52):
```typescript
// Dev Bypass
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
  const dummyOutfit: Outfit = {
    id: Math.random().toString(36).substring(7),
    user_id: user.id,
    ...outfitInput,
    created_at: new Date().toISOString(),
  };
  set((state) => ({
    outfits: [dummyOutfit, ...state.outfits],
    isLoading: false,
  }));
  return dummyOutfit;
}
```

**Step 4: Add dev bypass to removeOutfit**
Wrap the Supabase delete in removeOutfit (around line 74):
```typescript
// Dev Bypass
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
  set((state) => ({
    outfits: state.outfits.filter((o) => o.id !== id),
    isLoading: false,
  }));
  return;
}
```

**Step 5: Test and commit**
```bash
npx tsc --noEmit
git add lib/store/outfit.store.ts
git commit -m "feat: Add dev bypass logic to outfit store"
```

---

## Task 6: Environment Configuration Verification

**Files:**
- Create: `.env.example` (if not exists)
- Update: README.md or create SETUP.md

**Step 1: Create environment variable template**
Create `.env.example` with:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Development Mode (set to 'true' to bypass auth)
EXPO_DEV_BYPASS_AUTH=false
```

**Step 2: Document setup process**
Add to existing docs or create SETUP.md:
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials from Supabase dashboard
3. For development, can leave blank to use dummy client
4. Run `npx supabase db push` to apply migrations

**Step 3: Commit**
```bash
git add .env.example
git commit -m "docs: Add environment configuration template"
```

---

## Task 6: Environment Configuration Verification

**Files:**
- Create: `.env.example` (if not exists)
- Update: README.md or create SETUP.md

**Step 1: Create environment variable template**
Create `.env.example` with:
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Development Mode (set to 'true' to bypass auth)
EXPO_DEV_BYPASS_AUTH=false
```

**Step 2: Document setup process**
Add to existing docs or create SETUP.md:
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials from Supabase dashboard
3. For development, can leave blank to use dummy client
4. Run `npx supabase db push` to apply migrations

**Step 3: Commit**
```bash
git add .env.example
git commit -m "docs: Add environment configuration template"
```

---

## Verification Checklist

After all tasks complete:

1. **TypeScript compilation:**
   ```bash
   npx tsc --noEmit
   ```
   Expected: No errors (should fix existing category type errors)

2. **Store functionality test:**
   - Wardrobe store loads dummy data in dev mode
   - Add/delete operations work in dev mode
   - Supabase queries would work with real credentials

3. **Database schema:**
   - Migration adds missing columns
   - Existing data preserved with empty arrays
   - Category types match between DB and TypeScript

4. **Code consistency:**
   - All stores use same dev user ID (`00000000-0000-0000-0000-000000000000`)
   - Type definitions match database schema
   - Dev bypass logic consistent across stores
   - Category names consistent throughout codebase

5. **Existing errors resolved:**
   - No more `Type '"tops"' is not assignable to type 'Category'` errors
   - No more category mismatch errors in mock-wardrobe.ts and wardrobe/index.tsx

---

## Success Criteria

1. ✅ Wardrobe store correctly identifies dev user
2. ✅ Database has all required tag columns
3. ✅ TypeScript types match database schema
4. ✅ Dev mode works without Supabase credentials
5. ✅ Production mode ready with proper Supabase setup
6. ✅ All stores have consistent dev bypass logic
7. ✅ Documentation updated for new developers

---

## Next Steps After Completion

1. **Test with real Supabase credentials:**
   - Configure `.env.local` with real project URL and anon key
   - Run `npx supabase db push` to apply migrations
   - Verify app connects and fetches/creates data

2. **Data population:**
   - Use existing 83 items in DB with placeholder UUID
   - Optionally run Gemini to generate proper tags
   - Consider data migration script for real users

3. **Production readiness:**
   - Add proper auth flow (remove dev bypass)
   - Implement Row Level Security policies
   - Add proper error handling for network issues

---

**Plan complete and ready for implementation.**