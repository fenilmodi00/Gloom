# Trending Ideas Remote Config — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Load trending ideas from a GitHub-hosted JSON file via a Zustand store, so admins can update content without app releases.

**Architecture:** Zustand store fetches JSON from GitHub raw URL on app launch, caches in AsyncStorage, falls back to hardcoded data on error. Follows existing `wardrobe.store.ts` pattern.

**Tech Stack:** Zustand v5, AsyncStorage, TypeScript strict mode, React Native

---

## Task 1: Create Zustand Store

**Files:**
- Create: `lib/store/trending.store.ts`

**Step 1: Create the store file**

```typescript
// lib/store/trending.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/lib/storage';
import type { TrendingSection } from '@/types/inspo';

// ─── Config ──────────────────────────────────────────────────────────────────

const TRENDING_JSON_URL =
  'https://raw.githubusercontent.com/OWNER/REPO/main/trending-ideas.json';

// Fallback data (current hardcoded sections)
const FALLBACK_SECTIONS: TrendingSection[] = [
  {
    id: 'leather-trench',
    title: 'Leather Trench',
    items: [
      { id: 'lt-1', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600' },
      { id: 'lt-2', imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600' },
      { id: 'lt-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600' },
      { id: 'lt-4', imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600' },
    ],
  },
  {
    id: 'lace-renaissance',
    title: 'Lace Renaissance',
    items: [
      { id: 'lr-1', imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600' },
      { id: 'lr-2', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600' },
      { id: 'lr-3', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600' },
      { id: 'lr-4', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600' },
    ],
  },
  {
    id: 'minimalist-whites',
    title: 'Minimalist Whites',
    items: [
      { id: 'mw-1', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
      { id: 'mw-2', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600' },
      { id: 'mw-3', imageUrl: 'https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600' },
      { id: 'mw-4', imageUrl: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600' },
    ],
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrendingState {
  sections: TrendingSection[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchSections: () => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTrendingStore = create<TrendingState>()(
  persist(
    (set) => ({
      sections: FALLBACK_SECTIONS,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchSections: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(TRENDING_JSON_URL);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (!data.sections || !Array.isArray(data.sections)) {
            throw new Error('Invalid JSON structure: missing sections array');
          }

          set({
            sections: data.sections,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err) {
          console.error('[TrendingStore] Fetch failed:', err);
          set({
            error: err instanceof Error ? err.message : 'Unknown error',
            isLoading: false,
            // Keep existing sections on error
          });
        }
      },
    }),
    {
      name: 'trending-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        sections: state.sections,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const useTrendingSections = () => useTrendingStore((s) => s.sections);
export const useTrendingLoading = () => useTrendingStore((s) => s.isLoading);
```

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: No new errors (pre-existing errors in other files are OK).

**Step 3: Commit**

```bash
git add lib/store/trending.store.ts
git commit -m "feat: add trending.store.ts for remote config fetching"
```

---

## Task 2: Create Sample JSON File

**Files:**
- Create: `trending-ideas.json` (project root, for reference/upload to GitHub)

**Step 1: Create the JSON file**

```json
{
  "version": 1,
  "updatedAt": "2026-03-26T10:00:00Z",
  "sections": [
    {
      "id": "leather-trench",
      "title": "Leather Trench",
      "items": [
        { "id": "lt-1", "imageUrl": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600", "outfitName": "Urban Edge" },
        { "id": "lt-2", "imageUrl": "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600", "outfitName": "City Layers" },
        { "id": "lt-3", "imageUrl": "https://images.unsplash.com/photo-1551028719-001579e1403f?w=600", "outfitName": "Street Chic" },
        { "id": "lt-4", "imageUrl": "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600", "outfitName": "Casual Cool" }
      ]
    },
    {
      "id": "lace-renaissance",
      "title": "Lace Renaissance",
      "items": [
        { "id": "lr-1", "imageUrl": "https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600", "outfitName": "Lace Detail" },
        { "id": "lr-2", "imageUrl": "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600", "outfitName": "Vintage Charm" },
        { "id": "lr-3", "imageUrl": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600", "outfitName": "Modern Lace" },
        { "id": "lr-4", "imageUrl": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600", "outfitName": "Elegant Flow" }
      ]
    },
    {
      "id": "minimalist-whites",
      "title": "Minimalist Whites",
      "items": [
        { "id": "mw-1", "imageUrl": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600", "outfitName": "Clean Lines" },
        { "id": "mw-2", "imageUrl": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600", "outfitName": "Pure White" },
        { "id": "mw-3", "imageUrl": "https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600", "outfitName": "Simple Luxe" },
        { "id": "mw-4", "imageUrl": "https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600", "outfitName": "Monochrome" }
      ]
    }
  ]
}
```

**Step 2: Validate JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('trending-ideas.json', 'utf8')); console.log('Valid JSON')"
```

Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add trending-ideas.json
git commit -m "chore: add sample trending-ideas.json for GitHub hosting"
```

---

## Task 3: Update InspoScreen to Use Store

**Files:**
- Modify: `app/(tabs)/inspo/index.tsx`

**Step 1: Add imports**

Add to the top of the file:

```typescript
import { useTrendingSections, useTrendingStore } from '@/lib/store/trending.store';
```

**Step 2: Replace hardcoded TRENDING_SECTIONS**

Remove the `TRENDING_SECTIONS` constant (lines 49-80) and replace with:

```typescript
// Trending sections now loaded from remote config via Zustand store
```

**Step 3: Add store usage in component**

Inside `InspoScreen`, add:

```typescript
const sections = useTrendingSections();
const { fetchSections } = useTrendingStore();

useEffect(() => {
  fetchSections();
}, []);
```

**Step 4: Pass sections to InspoBottomSheet**

Change line 178 from:

```typescript
sections={TRENDING_SECTIONS}
```

to:

```typescript
sections={sections}
```

**Step 5: Add useEffect import**

Make sure `useEffect` is imported from React (it may already be there).

**Step 6: Run type check**

```bash
npx tsc --noEmit
```

Expected: No new errors.

**Step 7: Test the app**

```bash
bun start
```

Expected: App loads, trending ideas display (from fallback initially, then from remote on second launch if GitHub URL is configured).

**Step 8: Commit**

```bash
git add app/\(tabs\)/inspo/index.tsx
git commit -m "feat: use trending.store for remote config in InspoScreen"
```

---

## Task 4: Remove MOCK_SECTIONS Fallback from TrendingGrid

**Files:**
- Modify: `components/inspo/TrendingGrid.tsx`

**Step 1: Remove MOCK_SECTIONS**

Delete lines 22-67 (the entire `MOCK_SECTIONS` constant).

**Step 2: Update the fallback logic**

Change lines 84-86 from:

```typescript
const displaySections = useMemo(() => {
  return sections && sections.length > 0 ? sections : MOCK_SECTIONS;
}, [sections]);
```

to:

```typescript
const displaySections = useMemo(() => {
  return sections && sections.length > 0 ? sections : [];
}, [sections]);
```

**Step 3: Add empty state**

Before the return statement, add a check:

```typescript
if (displaySections.length === 0) {
  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Trending Ideas</Text>
      <Text style={styles.emptyText}>No trending ideas available</Text>
    </View>
  );
}
```

Add the emptyText style:

```typescript
emptyText: {
  ...Typography.body,
  color: Colors.light.textSecondary,
  textAlign: 'center',
  marginTop: 40,
  marginHorizontal: 24,
},
```

**Step 4: Run type check**

```bash
npx tsc --noEmit
```

Expected: No new errors.

**Step 5: Commit**

```bash
git add components/inspo/TrendingGrid.tsx
git commit -m "refactor: remove MOCK_SECTIONS, use empty state for TrendingGrid"
```

---

## Task 5: Final Verification

**Step 1: Full type check**

```bash
npx tsc --noEmit
```

Expected: No new errors.

**Step 2: Run the app**

```bash
bun start
```

Expected: App loads, Inspo tab shows trending ideas from the store.

**Step 3: Test offline fallback**

1. Turn off network
2. Kill and restart app
3. Verify cached sections still display

**Step 4: Test first-launch fallback**

1. Clear app data / AsyncStorage
2. Turn off network
3. Launch app
4. Verify hardcoded fallback sections display

---

## Post-Implementation: GitHub Setup

After implementation, the admin needs to:

1. Create a GitHub repo (or use existing)
2. Upload `trending-ideas.json` to the repo
3. Update `TRENDING_JSON_URL` in `lib/store/trending.store.ts` with the correct raw URL
4. To update content: edit the JSON file in GitHub, commit to main branch
5. Users see new content on next app launch
