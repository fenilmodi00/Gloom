# Wardrobe Screen — Skeleton Loading + Local Caching

**Date:** 2026-03-26  
**Status:** Approved  
**Approach:** Option A (Simple)

---

## Problem

- Wardrobe screen shows full-screen `LoadingOverlay` while fetching from Supabase
- User waits 500ms-2s seeing nothing
- Items fetched fresh on every app open (no persistence)

---

## Solution

### 1. Two-Layer Caching

| Layer | Storage | Purpose |
|-------|---------|---------|
| **L1 Cache** | Zustand Persist (AsyncStorage) | Instant load on app open |
| **L2 Remote** | Supabase | Source of truth, background refresh |

**Flow:**
```
App Opens
    ↓
Load from AsyncStorage (instant)
    ↓
Show cached items + skeleton shimmer on images
    ↓
Fetch from Supabase (background)
    ↓
Update store (images swap from skeleton → real)
```

---

## Components to Create/Modify

### 1. `lib/store/wardrobe.store.ts`

**Changes:**
- Add `persist` middleware (like `auth.store.ts`)
- Use `partialize` to only persist `items` array
- Add `isHydrated` state for tracking AsyncStorage load
- Modify `fetchItems()` to run in background after hydration

```typescript
interface WardrobeState {
  items: WardrobeItem[];
  selectedCategory: Category | 'all';
  isLoading: boolean;
  isHydrated: boolean;  // NEW: track AsyncStorage hydration
  error: string | null;
  
  // Actions
  setHydrated: (hydrated: boolean) => void;  // NEW
  fetchItems: () => Promise<void>;  // Modified
  // ... existing
}
```

### 2. `components/shared/WardrobeSkeleton.tsx` (NEW)

**Purpose:** Shimmer skeleton card matching wardrobe item dimensions

**Props:**
```typescript
interface WardrobeSkeletonProps {
  count?: number;  // number of skeleton cards to show
}
```

**Implementation:**
- Reuse existing `SkeletonImage.tsx` shimmer animation pattern
- Card dimensions: `width: 120, height: 150` (matching `CARD_WIDTH`, `CARD_HEIGHT`)
- Use `THEME.skeleton = '#EAE4DA'` background
- Horizontal layout for category sections

### 3. `app/(tabs)/wardrobe/index.tsx`

**Changes:**
- Remove full-screen `LoadingOverlay` condition (lines 236-238)
- Show cached items immediately with skeleton on images
- Only show skeleton cards if `!isHydrated` AND `items.length === 0`
- Continue background fetch regardless

**Logic:**
```typescript
// Before (current):
if (isLoading && items.length === 0) {
  return <LoadingOverlay message="Loading wardrobe..." />;
}

// After (new):
// Show cached items with skeleton shimmer on images
// Fetch happens in background
```

---

## Data Flow

### Fetch Strategy

```
useEffect(() => {
  // 1. Items already in store (from AsyncStorage) → show immediately
  // 2. Background fetch from Supabase
  // 3. Update store → images load without skeleton
  
  fetchItems();  // No longer blocks UI
}, []);
```

### Persist Strategy

```typescript
persist(
  (set, get) => ({
    items: [],
    isHydrated: false,
    // ...actions
  }),
  {
    name: 'wardrobe-storage',
    storage: createJSONStorage(() => zustandAsyncStorage),
    partialize: (state) => ({
      items: state.items,
      // NOT: selectedCategory, isLoading, error
    }),
    onRehydrateStorage: () => (state) => {
      state?.setHydrated(true);
    },
  }
)
```

---

## UI States

| State | Condition | UI |
|-------|-----------|-----|
| **First Launch** | `!isHydrated` AND `items.length === 0` | EmptyState component |
| **Cached + Loading** | `isHydrated` AND `isLoading` AND `items.length > 0` | Items with skeleton shimmer on images |
| **Cached + Done** | `isHydrated` AND `!isLoading` AND `items.length > 0` | Items with real images |
| **Error** | `error !== null` | Toast/error message |

---

## File Changes Summary

| File | Action |
|------|--------|
| `lib/store/wardrobe.store.ts` | Modify: add persist middleware |
| `components/shared/WardrobeSkeleton.tsx` | Create: new skeleton component |
| `app/(tabs)/wardrobe/index.tsx` | Modify: remove LoadingOverlay, use cache-first |

---

## Implementation Order

1. **WardrobeSkeleton component** — create reusable skeleton cards
2. **Wardrobe store persistence** — add Zustand persist with partialize
3. **Wardrobe screen** — update to use cache-first with skeleton

---

## Success Criteria

- [ ] App opens → wardrobe items appear immediately (from cache)
- [ ] Images show shimmer while loading from Supabase
- [ ] No full-screen LoadingOverlay on wardrobe tab
- [ ] Items persist across app restarts
- [ ] Background fetch doesn't block UI
