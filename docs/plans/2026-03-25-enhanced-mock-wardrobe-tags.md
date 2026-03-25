# Enhanced Mock Wardrobe Tags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full tag taxonomy (style, occasion, functional, silhouette, vibe) to mock wardrobe data for MVP development and database planning.

**Architecture:** Hybrid approach (Option C) — structured tags now, embeddings later. Extend existing WardrobeItem type with 3 new tag arrays. Update mock-wardrobe.ts with smart category-aware tag assignment instead of random generation.

**Tech Stack:** TypeScript, React Native, Expo

---

## Files to Modify

| File | Action |
|------|--------|
| `types/wardrobe.ts` | Extend WardrobeItem interface |
| `lib/mock-wardrobe.ts` | Add tag constants, smart profiles, update generators |

---

## Task 1: Extend WardrobeItem Type

**Files:**
- Modify: `types/wardrobe.ts:3-15`

**Step 1: Read current type definition**
Run: `cat types/wardrobe.ts`
Verify: Current interface has `style_tags` and `occasion_tags`

**Step 2: Add three new tag fields to interface**

```typescript
// types/wardrobe.ts - UPDATE INTERFACE
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
  functional_tags: string[];  // NEW
  silhouette_tags: string[];  // NEW
  vibe_tags: string[];        // NEW
  fabric_guess: string | null;
  created_at: string;
}

// ALSO UPDATE WardrobeItemInput
export interface WardrobeItemInput {
  image_url?: string | number;
  cutout_url?: (string | number) | null;
  category: Category;
  sub_category?: string | null;
  colors?: string[];
  style_tags?: string[];
  occasion_tags?: string[];
  functional_tags?: string[];  // NEW
  silhouette_tags?: string[];  // NEW
  vibe_tags?: string[];        // NEW
  fabric_guess?: string | null;
}
```

**Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors (fields are optional in Input, required in Item)

**Step 4: Commit**
```bash
git add types/wardrobe.ts
git commit -m "feat: add functional, silhouette, vibe tags to WardrobeItem"
```

---

## Task 2: Add Tag Taxonomy Constants

**Files:**
- Modify: `lib/mock-wardrobe.ts:91-124`

**Step 1: Read current constants section**
Run: `cat lib/mock-wardrobe.ts | head -n 125`
Verify: Lines 91-124 have existing STYLE_TAGS, COLORS_AVAILABLE, OCCASION_TAGS

**Step 2: Replace and expand tag constants**

```typescript
// lib/mock-wardrobe.ts - REPLACE LINES 91-124

// Style Tags (expanded from research taxonomy)
const STYLE_TAGS = [
  'casual',
  'streetwear',
  'old_money',
  'minimalist',
  'bohemian',
  'dark_academia',
  'cottagecore',
  'y2k',
  'athleisure',
  'gorpcore',
] as const;

// Color options (unchanged)
const COLORS_AVAILABLE = [
  'white',
  'black',
  'navy',
  'beige',
  'gray',
  'brown',
  'olive',
  'cream',
];

// Occasion Tags (expanded)
const OCCASION_TAGS = [
  'daytime',
  'night_out',
  'work',
  'weekend',
  'party',
  'date_night',
  'casual_friday',
  'beach',
  'travel',
] as const;

// NEW: Functional Tags
const FUNCTIONAL_TAGS = [
  'layering_staple',
  'statement_piece',
  'base_layer',
  'outer_layer',
  'transitional',
  'four_season',
  'summer_only',
  'winter_only',
] as const;

// NEW: Silhouette Tags
const SILHOUETTE_TAGS = [
  'slim_fit',
  'regular_fit',
  'relaxed_fit',
  'oversized',
  'cropped',
  'fitted',
  'flowy',
] as const;

// NEW: Vibe/Era Tags
const VIBE_TAGS = [
  'timeless',
  'trend_aware',
  '90s_revival',
  'modern_classic',
  'vintage_inspired',
  'ahead_of_curve',
] as const;
```

**Step 3: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "feat: add full tag taxonomy constants for mock data"
```

---

## Task 3: Add Category-Aware Tag Profiles

**Files:**
- Modify: `lib/mock-wardrobe.ts` (add after tag constants)

**Step 1: Add TAG_PROFILES constant**

```typescript
// lib/mock-wardrobe.ts - ADD AFTER VIBE_TAGS

/**
 * Category-aware tag profiles for realistic mock data
 * Items from each category get appropriate functional/silhouette tags
 */
const TAG_PROFILES: Record<Category, {
  functional: string[];
  silhouette: string[];
  styles: string[];
}> = {
  tops: {
    functional: ['layering_staple', 'base_layer', 'transitional'],
    silhouette: ['slim_fit', 'regular_fit', 'relaxed_fit', 'oversized'],
    styles: ['casual', 'minimalist', 'old_money', 'streetwear'],
  },
  bottoms: {
    functional: ['base_layer', 'four_season'],
    silhouette: ['slim_fit', 'regular_fit', 'relaxed_fit', 'cropped'],
    styles: ['casual', 'minimalist', 'streetwear'],
  },
  shoes: {
    functional: [], // Shoes rarely have functional tags
    silhouette: ['slim_fit', 'regular_fit'],
    styles: ['casual', 'classic', 'streetwear'],
  },
  accessories: {
    functional: ['statement_piece'],
    silhouette: [], // Accessories don't have silhouette
    styles: ['classic', 'minimalist', 'bohemian'],
  },
  outerwear: {
    functional: ['outer_layer', 'layering_staple', 'winter_only', 'transitional'],
    silhouette: ['regular_fit', 'relaxed_fit', 'oversized'],
    styles: ['casual', 'streetwear', 'gorpcore'],
  },
  fullbody: {
    functional: ['statement_piece', 'four_season'],
    silhouette: ['slim_fit', 'regular_fit', 'fitted', 'flowy'],
    styles: ['casual', 'bohemian', 'minimalist'],
  },
  bags: {
    functional: ['statement_piece'],
    silhouette: [],
    styles: ['casual', 'classic', 'minimalist'],
  },
};

/**
 * Color combinations that work well together
 */
const COLOR_COMBINATIONS: string[][] = [
  ['white', 'beige'],
  ['navy', 'white'],
  ['black', 'gray'],
  ['olive', 'cream'],
  ['brown', 'beige'],
  ['navy', 'beige'],
  ['black', 'white'],
  ['gray', 'olive'],
];

/**
 * Vibe tag associations by style
 */
const STYLE_TO_VIBE: Record<string, string[]> = {
  old_money: ['timeless', 'modern_classic'],
  streetwear: ['trend_aware', '90s_revival'],
  minimalist: ['timeless', 'modern_classic'],
  bohemian: ['vintage_inspired', 'ahead_of_curve'],
  dark_academia: ['vintage_inspired', 'timeless'],
  cottagecore: ['vintage_inspired', 'timeless'],
  y2k: ['90s_revival', 'trend_aware'],
  casual: ['timeless', 'modern_classic'],
  athleisure: ['trend_aware', 'modern_classic'],
  gorpcore: ['trend_aware', 'ahead_of_curve'],
};
```

**Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors (Category type imported at top)

**Step 3: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "feat: add category-aware tag profiles for smart mock data"
```

---

## Task 4: Update Mock Item Generator

**Files:**
- Modify: `lib/mock-wardrobe.ts:129-160` (getMockWardrobeItems function)

**Step 1: Replace getMockWardrobeItems function**

```typescript
// lib/mock-wardrobe.ts - REPLACE getMockWardrobeItems function

/**
 * Generate mock wardrobe items with smart category-aware tags
 */
export function getMockWardrobeItems(): WardrobeItem[] {
  const items: WardrobeItem[] = [];

  // Process each category
  for (const [folder, category] of Object.entries(FOLDER_TO_CATEGORY)) {
    const files = ASSET_FILES[folder as keyof typeof ASSET_FILES] || [];
    const profile = TAG_PROFILES[category];

    files.forEach((filename, index) => {
      const assetPath = `../assets/fashion_categorized/${folder}/${filename}`;

      // Get smart tags based on category
      const styleTag = profile.styles[index % profile.styles.length];
      const vibeTags = STYLE_TO_VIBE[styleTag] || ['timeless'];

      items.push({
        id: `mock-${category}-${index}`,
        user_id: 'mock-user',
        image_url: assetPath,
        cutout_url: null,
        category: category,
        sub_category: null,
        colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
        style_tags: [styleTag],
        occasion_tags: [OCCASION_TAGS[index % OCCASION_TAGS.length]],
        functional_tags: profile.functional.length > 0 
          ? [profile.functional[index % profile.functional.length]]
          : [],
        silhouette_tags: profile.silhouette.length > 0
          ? [profile.silhouette[index % profile.silhouette.length]]
          : [],
        vibe_tags: [vibeTags[index % vibeTags.length]],
        fabric_guess: null,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    });
  }

  return items;
}
```

**Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "feat: update mock generator with smart tag assignment"
```

---

## Task 5: Update getMockWardrobeItemsWithAssets

**Files:**
- Modify: `lib/mock-wardrobe.ts:227-299` (getMockWardrobeItemsWithAssets function)

**Step 1: Replace getMockWardrobeItemsWithAssets function**

```typescript
// lib/mock-wardrobe.ts - REPLACE getMockWardrobeItemsWithAssets function

/**
 * Generate mock items with proper require() assets and smart tags
 */
export function getMockWardrobeItemsWithAssets(): WardrobeItem[] {
  const items: WardrobeItem[] = [];

  // Tops - mostly casual/minimalist with layering capability
  MOCK_ASSETS.top.forEach((asset, index) => {
    const styles = ['casual', 'minimalist', 'old_money', 'streetwear'];
    const style = styles[index % styles.length];
    const vibeTags = STYLE_TO_VIBE[style] || ['timeless'];

    items.push({
      id: `mock-tops-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'tops',
      sub_category: null,
      colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
      style_tags: [style],
      occasion_tags: ['daytime', 'casual_friday', 'work'][index % 3] ? ['daytime'] : ['work'],
      functional_tags: ['layering_staple'],
      silhouette_tags: [['slim_fit', 'regular_fit', 'oversized'][index % 3]],
      vibe_tags: [vibeTags[0]],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Bottoms - casual/minimalist with base layer
  MOCK_ASSETS.bottom.forEach((asset, index) => {
    items.push({
      id: `mock-bottoms-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'bottoms',
      sub_category: null,
      colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
      style_tags: [['casual', 'minimalist', 'streetwear'][index % 3]],
      occasion_tags: ['daytime'],
      functional_tags: ['base_layer'],
      silhouette_tags: [['slim_fit', 'regular_fit', 'cropped'][index % 3]],
      vibe_tags: ['timeless'],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Shoes - classic/casual
  MOCK_ASSETS.shoes.forEach((asset, index) => {
    items.push({
      id: `mock-shoes-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'shoes',
      sub_category: null,
      colors: [['brown', 'black'], ['white', 'cream'], ['navy', 'beige']][index % 3],
      style_tags: [['classic', 'casual', 'streetwear'][index % 3]],
      occasion_tags: ['daytime'],
      functional_tags: [], // Shoes don't have functional tags
      silhouette_tags: [], // Shoes don't use silhouette tags
      vibe_tags: [['timeless', 'modern_classic', 'trend_aware'][index % 3]],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Accessories - statement pieces
  MOCK_ASSETS.accessories.forEach((asset, index) => {
    items.push({
      id: `mock-accessories-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'accessories',
      sub_category: null,
      colors: [['black', 'gold'], ['brown', 'beige'], ['silver', 'white']][index % 3],
      style_tags: [['classic', 'minimalist', 'bohemian'][index % 3]],
      occasion_tags: ['daytime'],
      functional_tags: ['statement_piece'],
      silhouette_tags: [], // Accessories don't have silhouette
      vibe_tags: [['timeless', 'modern_classic', 'vintage_inspired'][index % 3]],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  return items;
}
```

**Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "feat: update getMockWardrobeItemsWithAssets with full tags"
```

---

## Task 6: Remove Old Helper Functions

**Files:**
- Modify: `lib/mock-wardrobe.ts` (remove getRandomColors and getRandomTags)

**Step 1: Remove deprecated helper functions**

```typescript
// lib/mock-wardrobe.ts - DELETE THESE FUNCTIONS (lines ~165-177)
// Remove getRandomColors() - replaced by COLOR_COMBINATIONS
// Remove getRandomTags() - replaced by smart tag assignment
```

**Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors (functions were internal, not exported)

**Step 3: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "refactor: remove deprecated random tag helpers"
```

---

## Task 7: Add Type Exports for Tag Constants

**Files:**
- Modify: `lib/mock-wardrobe.ts` (add exports at bottom)

**Step 1: Export tag constants for use in other components**

```typescript
// lib/mock-wardrobe.ts - ADD AT BOTTOM

// Export tag constants for use in StyleSelector, filtering, etc.
export {
  STYLE_TAGS,
  OCCASION_TAGS,
  FUNCTIONAL_TAGS,
  SILHOUETTE_TAGS,
  VIBE_TAGS,
  TAG_PROFILES,
  COLOR_COMBINATIONS,
  STYLE_TO_VIBE,
};
```

**Step 2: Run TypeScript check**
Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**
```bash
git add lib/mock-wardrobe.ts
git commit -m "feat: export tag constants for component use"
```

---

## Task 8: Verify Mock Data Generation

**Files:**
- None (verification only)

**Step 1: Create quick verification script**

```typescript
// Temporary test - delete after verification
import { getMockWardrobeItemsWithAssets } from './lib/mock-wardrobe';

const items = getMockWardrobeItemsWithAssets();
console.log('Total items:', items.length);
console.log('Sample item:', JSON.stringify(items[0], null, 2));

// Verify all new fields are populated
const sample = items[0];
console.log({
  hasFunctional: sample.functional_tags.length >= 0,
  hasSilhouette: sample.silhouette_tags.length >= 0,
  hasVibe: sample.vibe_tags.length >= 0,
});
```

**Step 2: Run in development**
Run: `bun start`
Expected: App starts without errors, mock data loads

**Step 3: Verify in wardrobe screen**
- Open app
- Navigate to Wardrobe tab
- Verify items display correctly
- Check console for any missing field warnings

---

## Acceptance Criteria

- [x] WardrobeItem interface has 3 new tag fields
- [x] All tag constants defined (5 categories)
- [x] TAG_PROFILES map for each category
- [x] COLOR_COMBINATIONS for realistic pairings
- [x] STYLE_TO_VIBE associations
- [x] getMockWardrobeItems updated with smart tags
- [x] getMockWardrobeItemsWithAssets updated with smart tags
- [x] Old random helpers removed
- [x] Tag constants exported
- [x] TypeScript passes with no errors (in modified files)
- [x] Mock data displays in app without errors

---

## Database Schema Preview (for planning)

```sql
-- Future Supabase table schema (not implementing now)
ALTER TABLE wardrobe_items 
ADD COLUMN functional_tags TEXT[] DEFAULT '{}',
ADD COLUMN silhouette_tags TEXT[] DEFAULT '{}',
ADD COLUMN vibe_tags TEXT[] DEFAULT '{}';

-- Create GIN indexes for array queries
CREATE INDEX idx_functional_tags ON wardrobe_items USING GIN(functional_tags);
CREATE INDEX idx_silhouette_tags ON wardrobe_items USING GIN(silhouette_tags);
CREATE INDEX idx_vibe_tags ON wardrobe_items USING GIN(vibe_tags);
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Type errors from new fields | Low | Fields added as arrays, defaults handled |
| Breaking existing components | Low | Existing tags unchanged, new fields additive |
| Mock data too uniform | Low | TAG_PROFILES provides variety per category |
