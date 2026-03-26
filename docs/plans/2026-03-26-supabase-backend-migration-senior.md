# Senior Backend Migration Plan: Mock Data → Supabase

> **Engineer:** Senior Backend (Supabase/PostgreSQL specialist)  
> **Date:** 2026-03-26  
> **Context:** India-first AI personal stylist app (StyleAI) - Phase 1

---

## Executive Summary

| Area | Current State | Target State |
|------|---------------|--------------|
| **Images** | ✅ 83 in Supabase Storage | ✅ Keep |
| **DB Rows** | 83 with placeholder user_id | ✅ Keep, populate tags |
| **Schema** | Missing 3 columns | ✅ Add with proper defaults |
| **RLS** | ❌ Disabled | ⚠️ Plan for production |
| **Types** | Mismatch with DB | ✅ Sync types |
| **Code** | Mock fallback | ✅ Remove |

---

## Architecture Decision: Testing vs Production

### Current: Single-User Testing Mode
```
user_id = "00000000-0000-0000-0000-000000000000" (placeholder)
```
- All 83 items belong to test user
- No auth required for testing
- Code supports multi-user (ready for production)

### Production: Multi-User Ready
- Real `user_id` from Supabase Auth
- RLS policies to isolate user data
- Per-user query filtering

---

## Phase 1: Database Schema (Senior-Level)

### 1.1 Migration: Add Missing Columns

**File:** `supabase/migrations/20260326_add_wardrobe_tags.sql`

```sql
-- ============================================================
-- Migration: Add Missing Tag Columns to wardrobe_items
-- ============================================================
-- Senior Note: Using text[] for Postgres array type
-- Default to empty array '{}' NOT NULL for consistency
-- ============================================================

-- Add columns with proper constraints
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS functional_tags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS silhouette_tags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}'::text[];

-- Ensure NOT NULL constraint (PostgreSQL best practice for arrays)
ALTER TABLE wardrobe_items 
ALTER COLUMN functional_tags SET DEFAULT '{}',
ALTER COLUMN silhouette_tags SET DEFAULT '{}',
ALTER COLUMN vibe_tags SET DEFAULT '{}';

-- Clean NULL values to empty arrays (belt and suspenders)
UPDATE wardrobe_items 
SET 
  functional_tags = COALESCE(functional_tags, '{}'::text[]),
  silhouette_tags = COALESCE(silhouette_tags, '{}'::text[]),
  vibe_tags = COALESCE(vibe_tags, '{}'::text[]),
  style_tags = COALESCE(style_tags, '{}'::text[]),
  colors = COALESCE(colors, '{}'::text[])
WHERE functional_tags IS NULL 
   OR silhouette_tags IS NULL 
   OR vibe_tags IS NULL
   OR style_tags IS NULL 
   OR colors IS NULL;
```

### 1.2 Indexes (Performance - Supabase Best Practice)

**File:** `supabase/migrations/20260326_add_wardrobe_indexes.sql`

```sql
-- ============================================================
-- Indexes for Query Performance
-- Senior Note: Only index what you query. Premature indexes = overhead.
-- ============================================================

-- Primary filter: user_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id 
ON wardrobe_items(user_id);

-- Secondary filter: category (wardrobe filtering)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category 
ON wardrobe_items(category);

-- Composite: user + category (most common combined query)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_category 
ON wardrobe_items(user_id, category);

-- Sort: created_at (displaying newest first)
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at 
ON wardrobe_items(created_at DESC);

-- Note: For 83 rows, indexes won't help much. 
-- Keep for production scale (1000+ items).
```

### 1.3 Row-Level Security (RLS) - Production Ready

**File:** `supabase/migrations/20260326_enable_rls_policies.sql`

```sql
-- ============================================================
-- Row-Level Security (Enable for Production)
-- Senior Note: Keep disabled for testing, enable for production
-- ============================================================

-- Enable RLS (uncomment when ready for multi-user)
-- ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
-- CREATE POLICY "Users can view own wardrobe_items" ON wardrobe_items
--   FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own items
-- CREATE POLICY "Users can insert own wardrobe_items" ON wardrobe_items
--   FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own items
-- CREATE POLICY "Users can update own wardrobe_items" ON wardrobe_items
--   FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own items
-- CREATE POLICY "Users can delete own wardrobe_items" ON wardrobe_items
--   FOR DELETE USING (auth.uid()::text = user_id);
```

---

## Phase 2: TypeScript Types (Type Safety)

### 2.1 Sync Database Types

**File:** `lib/supabase.ts` - Update `Database` type

```typescript
// ============================================================
// Senior Note: Types MUST match DB schema exactly
// Run: npx supabase gen types typescript > temp-types.ts
// ============================================================

export type Database = {
  public: {
    Tables: {
      wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          cutout_url: string | null;
          category: 'tops' | 'bottoms' | 'shoes' | 'accessories' | 
                     'outerwear' | 'fullbody' | 'bags';
          sub_category: string | null;
          colors: string[];
          style_tags: string[];
          occasion_tags: string[];
          functional_tags: string[];  // NEW
          silhouette_tags: string[]; // NEW
          vibe_tags: string[];       // NEW
          fabric_guess: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          cutout_url?: string | null;
          category: /* same as Row */;
          sub_category?: string | null;
          colors?: string[];
          style_tags?: string[];
          occasion_tags?: string[];
          functional_tags?: string[];  // NEW
          silhouette_tags?: string[];  // NEW
          vibe_tags?: string[];        // NEW
          fabric_guess?: string | null;
          created_at?: string;
        };
        Update: {
          /* same as Insert, all optional */
        };
      };
      // ... outfits and profiles (same pattern)
    };
  };
};
```

### 2.2 TypeScript Type Export

**File:** `types/wardrobe.ts` - Ensure parity

```typescript
// Must match Database type exactly
export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string | number;
  cutout_url: (string | number) | null;
  category: Category;
  sub_category: string | null;
  colors: string[];
  style_tags: string[];
  occasion_tags: string[];
  functional_tags: string[];  // ADD
  silhouette_tags: string[]; // ADD
  vibe_tags: string[];       // ADD
  fabric_guess: string | null;
  created_at: string;
}
```

---

## Phase 3: Store Updates (Zustand + Supabase)

### 3.1 Wardrobe Store - Add Missing Tag Fields

**File:** `lib/store/wardrobe.store.ts`

```typescript
addItem: async (itemInput: WardrobeItemInput) => {
  const { user } = useAuthStore.getState();
  
  // For testing: use placeholder if no real user
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert({
      user_id: userId,
      image_url: itemInput.image_url,
      category: itemInput.category,
      sub_category: itemInput.sub_category,
      colors: itemInput.colors || [],
      style_tags: itemInput.style_tags || [],
      occasion_tags: itemInput.occasion_tags || [],
      // NEW: Include new tag fields
      functional_tags: itemInput.functional_tags || [],
      silhouette_tags: itemInput.silhouette_tags || [],
      vibe_tags: itemInput.vibe_tags || [],
      fabric_guess: itemInput.fabric_guess,
    })
    .select()
    .single();
  
  if (error) throw error;
  set((state) => ({ items: [data, ...state.items] }));
  return data as WardrobeItem;
},

fetchItems: async () => {
  const { user } = useAuthStore.getState();
  
  // For testing: use placeholder if no real user
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  
  set({ isLoading: true, error: null });
  
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)  // Filter by user
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    set({ items: data || [], isLoading: false });
  } catch (error) {
    set({ 
      error: error instanceof Error ? error.message : 'Failed to fetch',
      isLoading: false 
    });
  }
},
```

---

## Phase 4: Remove Mock Fallbacks

### 4.1 Wardrobe Screen

**File:** `app/(tabs)/wardrobe/index.tsx`

```typescript
// REMOVE this import:
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';

// CHANGE this line:
- return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
+ return storeItems; // Always use store (DB) data

// KEEP empty state handling:
if (storeItems.length === 0) {
  return <EmptyState />;
}
```

### 4.2 Outfit Builder

**File:** `app/outfit-builder.tsx`

```typescript
// REMOVE this import:
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';

// CHANGE fallback:
- return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
+ return storeItems;
```

---

## Phase 5: Error Handling & Empty States

### 5.1 Graceful Degradation

**File:** `lib/store/wardrobe.store.ts`

```typescript
fetchItems: async () => {
  const { user } = useAuthStore.getState();
  const userId = user?.id || '00000000-0000-0000-0000-000000000000';
  
  set({ isLoading: true, error: null });
  
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      // Log error but don't crash - show empty state
      console.error('Supabase fetch error:', error);
      set({ items: [], isLoading: false, error: null });
      return;
    }
    
    set({ items: data || [], isLoading: false });
  } catch (err) {
    // Network error or other - graceful fallback
    console.error('Fetch failed:', err);
    set({ items: [], isLoading: false, error: null });
  }
},
```

### 5.2 Loading/Empty States in UI

Ensure screens handle:
- Loading spinner while fetching
- Empty state with "Add your first item" CTA
- Error toast if fetch fails

---

## Execution Plan (Atomic Commits)

| # | Task | Command | Verification |
|---|------|---------|--------------|
| 1 | Add migration files | `supabase db push` | `SELECT * FROM wardrobe_items LIMIT 1` |
| 2 | Add indexes | Check `pg_indexes` | Query plan shows index scan |
| 3 | Update TypeScript types | `npx tsc --noEmit` | 0 errors |
| 4 | Update wardrobe store | `npx tsc --noEmit` | 0 errors |
| 5 | Remove mock fallback (wardrobe) | `grep -r mock-wardrobe` | 0 matches |
| 6 | Remove mock fallback (builder) | `grep -r mock-wardrobe` | 0 matches |
| 7 | Test end-to-end | Manual | 83 items show |
| 8 | Clean up mock file | Move to `__mocks__/` | Import works in tests only |

---

## Rollback Strategy

```bash
# If migration fails:
supabase db reset

# If types break:
git checkout lib/supabase.ts

# If store breaks:
git checkout lib/store/wardrobe.store.ts
```

---

## Post-Migration (Future Phases)

| Priority | Task | Effort |
|----------|------|--------|
| 1 | Enable RLS for production | Medium |
| 2 | Run Gemini on images → populate real tags | High |
| 3 | Add real Supabase Auth | Medium |
| 4 | Add user profile management | Medium |
| 5 | Production monitoring (Supabase Edge Functions) | Low |

---

## Key Senior Decisions

1. **Empty arrays over NULL** - PostgreSQL best practice: `DEFAULT '{}'` prevents NULL checks
2. **Placeholder user_id** - Enables testing now, real auth later
3. **Indexes now** - Cheap at 83 rows, valuable at 10K
4. **RLS commented** - Ready for production, not blocking testing
5. **Graceful errors** - Don't crash, show empty state

---

## References

- [Supabase Postgres Best Practices](file:///C:/Users/nasri/.config/opencode/skills/supabase-postgres-best-practices/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Array Functions](https://www.postgresql.org/docs/current/arrays.html)
