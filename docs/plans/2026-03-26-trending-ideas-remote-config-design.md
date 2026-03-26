# Trending Ideas Remote Config — Design Document

**Date:** 2026-03-26
**Status:** Approved
**Author:** Sisyphus (AI)

---

## Problem

The "Trending Ideas" section on the Inspo tab currently uses hardcoded static data (`TRENDING_SECTIONS` in `app/(tabs)/inspo/index.tsx`). Any content change requires a new app build and user update.

**Goal:** Allow admins to update trending ideas content without app updates. Users see new items on next app launch.

---

## Approach

**Zustand Store + GitHub JSON File**

- Store trending sections in a JSON file hosted on a GitHub repo
- App fetches the JSON on launch via a Zustand store
- Cache in AsyncStorage for offline/fallback
- Admin edits the JSON file directly in GitHub

**Why this approach:**
- Zero extra infrastructure (no Supabase table, no admin panel)
- Version-controlled changes (git history)
- Consistent with existing Zustand store patterns
- Simple to implement and maintain

---

## JSON File Structure

Hosted at: `https://raw.githubusercontent.com/<owner>/<repo>/main/trending-ideas.json`

```json
{
  "version": 1,
  "updatedAt": "2026-03-26T10:00:00Z",
  "sections": [
    {
      "id": "leather-trench",
      "title": "Leather Trench",
      "items": [
        {
          "id": "lt-1",
          "imageUrl": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
          "outfitName": "Urban Edge"
        }
      ]
    }
  ]
}
```

**Fields:**
- `version` — Schema version (for future migrations)
- `updatedAt` — Optional, for display/debugging
- `sections` — Array of `TrendingSection` objects (matches existing type)

---

## Zustand Store Design

**File:** `lib/store/trending.store.ts`

```typescript
interface TrendingState {
  sections: TrendingSection[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchSections: () => Promise<void>;
}
```

**Behavior:**
1. On store init → load cached sections from AsyncStorage
2. On `fetchSections()` call → fetch from GitHub URL
3. On success → update sections + cache in AsyncStorage
4. On error → keep existing sections, log error

**Selector hooks:**
- `useTrendingSections()` → returns `sections`
- `useTrendingLoading()` → returns `isLoading`

---

## Caching Strategy

| Layer | Storage | Purpose |
|-------|---------|---------|
| Memory | Zustand state | Fast access during session |
| Persistent | AsyncStorage | Survives app restart |
| Fallback | Hardcoded constant | First launch, no cache |

**Flow:**
```
App Launch
  → Load from AsyncStorage (instant)
  → Fetch from GitHub (async)
  → On success: update state + AsyncStorage
  → On error: keep current state
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network offline | Use cached sections (silent) |
| Fetch fails (404, 500) | Use cached sections + log error |
| Invalid JSON | Use cached sections + log error |
| First launch, no cache | Use hardcoded fallback |

No error toasts or user-facing errors — silent fallback to cached/fallback data.

---

## Integration with InspoScreen

**Changes to `app/(tabs)/inspo/index.tsx`:**

```typescript
// Replace hardcoded TRENDING_SECTIONS
const sections = useTrendingSections();
const { fetchSections } = useTrendingStore();

useEffect(() => {
  fetchSections();
}, []);

// Pass to InspoBottomSheet
<InspoBottomSheet sections={sections} ... />
```

**Changes to `components/inspo/TrendingGrid.tsx`:**
- Remove `MOCK_SECTIONS` fallback (store provides the fallback now)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/store/trending.store.ts` | Create | Zustand store for trending sections |
| `app/(tabs)/inspo/index.tsx` | Modify | Use store instead of hardcoded data |
| `components/inspo/TrendingGrid.tsx` | Modify | Remove MOCK_SECTIONS fallback |
| `trending-ideas.json` | Create | Sample JSON file for GitHub repo |

---

## Future Enhancements (Out of Scope)

- Pull-to-refresh
- Auto-refresh on app foreground
- Admin panel UI
- A/B testing different sections per user
- Analytics on trending item views
