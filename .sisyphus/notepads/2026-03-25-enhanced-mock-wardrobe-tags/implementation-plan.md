# Implementation Plan: Integrate Enhanced Tags into Outfit Builder

## Overview
The outfit builder currently uses random selection for outfit combinations and ignores the newly added tag taxonomy (functional, silhouette, vibe). This plan outlines steps to integrate tags for smart outfit suggestions.

## Phase 1: Fix TypeScript Category Mismatch (Critical)

### Step 1.1: Define Mapping Functions
Create a new utility file `lib/outfit-mapping.ts` or add to existing store.

```typescript
import type { Category, WardrobeItem } from '@/types/wardrobe';
import type { OutfitSelection } from '@/lib/store/outfit-builder.store';

// Map WardrobeItem.category to OutfitSelection slot
export function categoryToSlot(category: Category): keyof OutfitSelection {
  switch (category) {
    case 'tops':
    case 'outerwear':
      return 'upper';
    case 'bottoms':
      return 'lower';
    case 'fullbody':
      return 'dress';
    case 'shoes':
      return 'shoes';
    case 'bags':
      return 'bag';
    case 'accessories':
      return 'accessory';
    default:
      // Should never happen
      return 'upper';
  }
}

// Inverse mapping for grouping items by slot
export function slotToCategories(slot: keyof OutfitSelection): Category[] {
  switch (slot) {
    case 'upper':
      return ['tops', 'outerwear'];
    case 'lower':
      return ['bottoms'];
    case 'dress':
      return ['fullbody'];
    case 'shoes':
      return ['shoes'];
    case 'bag':
      return ['bags'];
    case 'accessory':
      return ['accessories'];
    default:
      return [];
  }
}
```

### Step 1.2: Update OutfitBuilderStore
Modify `lib/store/outfit-builder.store.ts`:

1. Replace direct indexing of `selectedItems[item.category]` with mapping.
2. Update `generateCombinations` to group items by slot using mapping.
3. Ensure all Category comparisons use proper mapping.

### Step 1.3: Update OutfitBoard Mapping
Ensure OutfitBoard's mapping aligns with our new mapping (it already does: upper→top, lower→bottom, etc.). No changes needed.

## Phase 2: Implement Tag-Based Scoring Algorithm

### Step 2.1: Create Tag Scoring Utility
Create `lib/outfit-scoring.ts`:

```typescript
import type { WardrobeItem } from '@/types/wardrobe';
import { STYLE_TO_VIBE } from '@/lib/mock-wardrobe';

interface ScoringWeights {
  style: number;
  vibe: number;
  occasion: number;
  functional: number;
  silhouette: number;
  color: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  style: 30,
  vibe: 20,
  occasion: 15,
  functional: 20,
  silhouette: 10,
  color: 5,
};

// Calculate compatibility score between two items (0-100)
export function calculateItemPairScore(
  item1: WardrobeItem,
  item2: WardrobeItem,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let totalScore = 0;
  let totalWeight = 0;

  // Style compatibility
  const styleOverlap = item1.style_tags.filter(tag => item2.style_tags.includes(tag)).length;
  const styleScore = styleOverlap > 0 ? 100 : 0;
  totalScore += styleScore * weights.style;
  totalWeight += weights.style;

  // Vibe compatibility
  const vibeOverlap = item1.vibe_tags.filter(tag => item2.vibe_tags.includes(tag)).length;
  const vibeScore = vibeOverlap > 0 ? 100 : 0;
  totalScore += vibeScore * weights.vibe;
  totalWeight += weights.vibe;

  // Occasion compatibility
  const occasionOverlap = item1.occasion_tags.filter(tag => item2.occasion_tags.includes(tag)).length;
  const occasionScore = occasionOverlap > 0 ? 100 : 0;
  totalScore += occasionScore * weights.occasion;
  totalWeight += weights.occasion;

  // Functional layering compatibility (simplified)
  // base_layer + outer_layer = good, two outer_layer = bad
  const func1 = item1.functional_tags[0];
  const func2 = item2.functional_tags[0];
  let functionalScore = 50; // neutral
  if (func1 === 'base_layer' && func2 === 'outer_layer') functionalScore = 100;
  if (func1 === 'outer_layer' && func2 === 'base_layer') functionalScore = 100;
  if (func1 === 'outer_layer' && func2 === 'outer_layer') functionalScore = 0;
  totalScore += functionalScore * weights.functional;
  totalWeight += weights.functional;

  // Silhouette balance (simplified)
  // slim_fit top + relaxed_fit bottom = good
  const sil1 = item1.silhouette_tags[0];
  const sil2 = item2.silhouette_tags[0];
  let silhouetteScore = 50;
  if (sil1 && sil2) {
    if (sil1 === 'slim_fit' && sil2 === 'relaxed_fit') silhouetteScore = 100;
    if (sil1 === 'relaxed_fit' && sil2 === 'slim_fit') silhouetteScore = 100;
    if (sil1 === sil2) silhouetteScore = 30; // same silhouette not ideal
  }
  totalScore += silhouetteScore * weights.silhouette;
  totalWeight += weights.silhouette;

  // Color harmony (simplified - check if colors are in COLOR_COMBINATIONS)
  // For now, assume any color combination is fine
  const colorScore = 70;
  totalScore += colorScore * weights.color;
  totalWeight += weights.color;

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

// Calculate overall outfit score (average of all item pairs)
export function calculateOutfitScore(selection: OutfitSelection): number {
  const items = Object.values(selection).filter(Boolean) as WardrobeItem[];
  if (items.length < 2) return 0;
  
  let totalPairs = 0;
  let totalScore = 0;
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      totalScore += calculateItemPairScore(items[i], items[j]);
      totalPairs++;
    }
  }
  
  return totalPairs > 0 ? Math.round(totalScore / totalPairs) : 0;
}
```

### Step 2.2: Integrate Scoring into generateCombinations
Update `generateCombinations` in outfit-builder.store.ts:

1. Instead of random selection, filter items by selectedStyle (if any).
2. For each missing slot, select items that maximize overall outfit score.
3. Use scoring algorithm to compute matchScore.

### Step 2.3: Add Style Filtering
Add function to filter items by selectedStyle:

```typescript
function filterByStyle(items: WardrobeItem[], style: OutfitStyle | null): WardrobeItem[] {
  if (!style) return items;
  // Map outfit style to tag keywords
  const styleTagMap: Record<OutfitStyle, string[]> = {
    casual: ['casual', 'minimalist'],
    streetwear: ['streetwear', 'y2k'],
    formal: ['old_money', 'minimalist'],
    party: ['streetwear', 'y2k'],
    bohemian: ['bohemian', 'cottagecore'],
    sporty: ['athleisure', 'casual'],
  };
  const targetTags = styleTagMap[style] || [];
  return items.filter(item => 
    item.style_tags.some(tag => targetTags.includes(tag))
  );
}
```

## Phase 3: UI Enhancements (Optional)

### Step 3.1: Visual Tag Feedback
Add small tag indicators to OutfitCombinationCard to show why combination matches.

### Step 3.2: Real-time Compatibility Score
Update matchScore as items are selected, show percentage in SelectedItemsBar.

## Phase 4: Testing and Validation

### Step 4.1: Fix TypeScript Errors
Run `npx tsc --noEmit` and ensure no errors.

### Step 4.2: Manual Testing
Test outfit builder with mock data:
- Select different items and verify combinations use tag compatibility.
- Test style selection filtering.
- Verify color combinations work.

### Step 4.3: Edge Cases
- Empty categories
- Items missing tags (empty arrays)
- Single item selected
- All items same style

## Timeline Estimate
- Phase 1: 2-3 hours (critical fixes)
- Phase 2: 4-5 hours (scoring algorithm)
- Phase 3: 2 hours (optional UI)
- Phase 4: 2 hours (testing)

## Risks
1. Scoring algorithm may produce unexpected results; need iterative tuning.
2. Mapping outerwear to 'upper' may cause duplicate item types (shirt + jacket). Consider adding separate outerwear slot in future.
3. Performance impact of scoring algorithm on large item sets (should be fine for mock data).