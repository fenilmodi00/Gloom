# StyleAI: Mock → Supabase Backend Migration (REVISED)

> **Date:** 2026-03-26  
> **Current Branch:** `feat/backend-go-fiber-scaffold-15737128253214473080`

---

## Current State Analysis

### What's Working

| Component | Status | Notes |
|-----------|--------|-------|
| **Go Backend** | ✅ Complete | Full backend in `backend/` |
| **DB Schema** | ✅ Has tables + indexes | 83 items in DB with placeholder user |
| **Images** | ✅ In Supabase Storage | 83 files |
| **Auth Store** | ⚠️ Has dev bypass | Sets user to UUID `'00000000-0000-0000-0000-000000000000'` |
| **Wardrobe Store** | ⚠️ Bug | Checks `'dev-user'` but auth uses UUID! |

### The Bug Found

```
auth.store.ts (line 62)     → sets user.id = '00000000-0000-0000-0000-000000000000'
wardrobe.store.ts (line 105) → checks user.id === 'dev-user' ❌ MISMATCH!
```

Also:
- `.env.local` has placeholder values → `isSupabaseConfigured = false`
- Store uses dummy items instead of real Supabase data

### Database Current State

```
Total: 83 items
- tops: 18
- bottoms: 8  
- shoes: 17
- accessories: 40

user_id: '00000000-0000-0000-0000-000000000000'

Missing columns: functional_tags, silhouette_tags, vibe_tags
```

---

## What Needs to Be Fixed

### Critical Issues (Must Fix)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **User ID mismatch** | Change wardrobe store to check for UUID, not 'dev-user' |
| 2 | **Env vars not set** | Add real Supabase URL/key to .env.local |
| 3 | **Missing DB columns** | Add `functional_tags`, `silhouette_tags`, `vibe_tags` |
| 4 | **Dummy data still used** | Remove DUMMY_WARDROBE_ITEMS fallback |

### Files to Modify

| File | Changes |
|------|---------|
| `.env.local` | Add real Supabase credentials |
| `lib/store/wardrobe.store.ts` | Fix user ID check, remove dummy items |
| `lib/store/outfit.store.ts` | Same fixes if needed |
| `backend/migrations/000002_*.sql` | Add missing columns |
| `app/(tabs)/wardrobe/index.tsx` | Remove mock fallback |
| `app/outfit-builder.tsx` | Remove mock fallback |

---

## REVISED PLAN - What's Actually Remaining

### Current State (Already Fixed by Team):
- ✅ User ID check now uses UUID `'00000000-0000-0000-0000-000000000000'`
- ✅ Auth bypass works correctly

### Still Needs Fixing:
| # | Issue | Location |
|---|-------|----------|
| 1 | **Dummy data still used** | `wardrobe.store.ts` line 217 - returns `DUMMY_WARDROBE_ITEMS` instead of querying Supabase |
| 2 | **DUMMY_WARDROBE_ITEMS array exists** | Lines 6-71 - should be removed |

---

## Remaining Work: Connect Wardrobe Store to Supabase

### Step 1: Remove Dummy Items Array

**File:** `lib/store/wardrobe.store.ts`

Remove lines 6-71 (the entire DUMMY_WARDROBE_ITEMS array).

### Step 2: Fix fetchItems to Always Query Supabase

**File:** `lib/store/wardrobe.store.ts` line 204-237

```typescript
// BEFORE (currently):
if (!isSupabaseConfigured || user.id === '00000000-0000-0000-0000-000000000000') {
  await new Promise(resolve => setTimeout(resolve, 500));
  set({ items: DUMMY_WARDROBE_ITEMS, isLoading: false });  // ❌ Still using dummy!
  return;
}

// AFTER (fix):
// Always query Supabase (dev user can still query with placeholder UUID)
try {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', user.id)  // Will query with placeholder UUID
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  set({ items: (data || []) as WardrobeItem[], isLoading: false });
} catch (error) {
  set({ error: error instanceof Error ? error.message : 'Failed to fetch', isLoading: false });
}
```

### Step 3: Remove Dev Bypass in addItem (if needed)

Lines 105-128: Currently has bypass that creates local items. Should use Supabase always.

### Step 4: Verify uploadImage Works

Line 244: Check if storage upload works with placeholder user.

---

## Files Changed for Remaining Work

| File | Change |
|------|--------|
| `lib/store/wardrobe.store.ts` | Remove DUMMY_WARDROBE_ITEMS, always use Supabase |

---

## Execution

```bash
# After changes:
npx tsc --noEmit

# Test:
# - App should show 83 items from DB (not 4 dummy)
# - Add item should persist to Supabase
# - Delete should work
```

---

## Revised Execution Plan

### Step 1: Fix .env.local

```bash
# Get these from your Supabase project:
# https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

EXPO_PUBLIC_SUPABASE_URL=https://owdserrhktdarvbtadwy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key
```

### Step 2: Fix Wardrobe Store User ID Check

**File:** `lib/store/wardrobe.store.ts`

```typescript
// BEFORE (bug):
if (!isSupabaseConfigured || user.id === 'dev-user') {
  set({ items: DUMMY_WARDROBE_ITEMS, isLoading: false });
  return;
}

// AFTER (fixed):
// Use placeholder user ID for single-user mode
const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000000';
const isDevMode = __DEV__ && !isSupabaseConfigured;
const isPlaceholderUser = user?.id === PLACEHOLDER_USER_ID;

if (isDevMode || isPlaceholderUser) {
  // Query Supabase with placeholder user ID
  // (don't use dummy items!)
}
```

### Step 3: Remove Dummy Items

**File:** `lib/store/wardrobe.store.ts`

```typescript
// REMOVE this entire array:
const DUMMY_WARDROBE_ITEMS: WardrobeItem[] = [
  { id: '1', user_id: 'dev-user', ... },
  // ... all 4 dummy items
];
```

### Step 4: Add Missing DB Columns

**File:** `backend/migrations/000002_add_wardrobe_tags.sql`

```sql
-- Add missing tag columns to wardrobe_items
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS functional_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS silhouette_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';

-- Clean NULL values
UPDATE wardrobe_items SET
  functional_tags = COALESCE(functional_tags, '{}'),
  silhouette_tags = COALESCE(silhouette_tags, '{}'),
  vibe_tags = COALESCE(vibe_tags, '{}')
WHERE functional_tags IS NULL OR silhouette_tags IS NULL OR vibe_tags IS NULL;
```

**Run:**
```bash
cd backend && make db-migrate
# OR
psql $DATABASE_URL -f migrations/000002_add_wardrobe_tags.sql
```

---

### Task 2: Update TypeScript Database Types

**File:** `lib/supabase.ts`

```typescript
export type Database = {
  public: {
    Tables: {
      wardrobe_items: {
        Row: {
          // ... existing fields ...
          functional_tags: string[];  // ADD
          silhouette_tags: string[]; // ADD
          vibe_tags: string[];       // ADD
        };
        Insert: {
          // ... existing fields ...
          functional_tags?: string[];
          silhouette_tags?: string[];
          vibe_tags?: string[];
        };
        Update: {
          functional_tags?: string[];
          silhouette_tags?: string[];
          vibe_tags?: string[];
        };
      };
    };
  };
};
```

---

### Task 3: Fix Wardrobe Store for Placeholder User

**File:** `lib/store/wardrobe.store.ts`

```typescript
// Get current user OR use placeholder for dev mode
const getCurrentUserId = (): string => {
  const { user } = useAuthStore.getState();
  
  // Use placeholder in dev mode (when no real auth)
  if (__DEV__ && !user) {
    return '00000000-0000-0000-0000-000000000000';
  }
  
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

fetchItems: async () => {
  set({ isLoading: true, error: null });
  
  try {
    const userId = getCurrentUserId();  // Use helper
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)  // Filter by placeholder user
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ items: (data || []) as WardrobeItem[], isLoading: false });
  } catch (error) {
    set({ error: error instanceof Error ? error.message : 'Failed to fetch', isLoading: false });
  }
},
```

---

### Task 4: Update Outfit Store for Placeholder User

**File:** `lib/store/outfit.store.ts`

```typescript
// Add helper similar to wardrobe.store.ts
const getCurrentUserId = (): string => {
  const { user } = useAuthStore.getState();
  if (__DEV__ && !user) return '00000000-0000-0000-0000-000000000000';
  if (!user?.id) throw new Error('User not authenticated');
  return user.id;
};

fetchOutfits: async () => {
  set({ isLoading: true, error: null });
  
  try {
    const userId = getCurrentUserId();  // Use helper
    
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ outfits: (data as Outfit[]) ?? [], isLoading: false });
  } catch (error: any) {
    set({ error: error.message, isLoading: false });
  }
},
```

---

### Task 5: Remove Mock Data Fallbacks

**File:** `app/(tabs)/wardrobe/index.tsx`

```typescript
// REMOVE this import:
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';

// CHANGE this line:
- return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
+ return storeItems;  // Always use store (DB) data
```

**File:** `app/outfit-builder.tsx`

```typescript
// REMOVE this import:
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';

// CHANGE this line:
- return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
+ return storeItems;
```

---

### Task 6: Add Optional Tables (Future)

**File:** `backend/migrations/000003_add_favorites_and_feedback.sql`

```sql
-- Favorites table for bookmarking
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    item_id UUID,
    outfit_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit feedback for AI improvement
CREATE TABLE IF NOT EXISTS outfit_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    outfit_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    liked BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_id ON outfit_feedback(user_id);
```

---

## Verification

```bash
# 1. Check DB columns exist
psql $DATABASE_URL -c "\d wardrobe_items"

# 2. Type check
npx tsc --noEmit

# 3. Verify no mock imports
grep -r "getMockWardrobeItems" --include="*.ts" --include="*.tsx" .

# 4. Run app and check:
#    - 83 items load from DB
#    - Add item works
#    - Delete item works
```

---

## Atomic Commits

| # | Commit Message |
|---|----------------|
| 1 | `db: Add functional_tags, silhouette_tags, vibe_tags columns` |
| 2 | `types: Update Database type with new tag columns` |
| 3 | `feat: Handle placeholder user in wardrobe store` |
| 4 | `feat: Handle placeholder user in outfit store` |
| 5 | `refactor: Remove mock data fallback from wardrobe screen` |
| 6 | `refactor: Remove mock data fallback from outfit builder` |
| 7 | `db: Add favorites and outfit_feedback tables` |

---

## Future: Enable Real Auth

When ready for production multi-user:

1. **Remove dev bypass** in `auth.store.ts`:
```typescript
// Delete lines 38-70 (dev bypass logic)
```

2. **Enable RLS**:
```sql
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own items" ON wardrobe_items 
  FOR SELECT USING (auth.uid()::text = user_id);
```

3. **Update stores** to remove placeholder fallback:
```typescript
const getCurrentUserId = (): string => {
  const { user } = useAuthStore.getState();
  if (!user?.id) throw new Error('User not authenticated');
  return user.id;
};
```

---

## Summary

| Phase | Effort | Status |
|-------|--------|--------|
| DB Schema | Low | Add 3 columns |
| Types | Low | Sync with DB |
| Auth | Already done | Placeholder user |
| Stores | Medium | Add placeholder handling |
| Remove Mocks | Low | 2 files |
| Future Tables | Optional | 2 tables |

**Total: ~6 tasks, 1-2 hours**
