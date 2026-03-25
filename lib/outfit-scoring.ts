/**
 * Outfit Scoring Utility
 *
 * Tag-based scoring algorithm for outfit compatibility.
 * Calculates compatibility scores between items based on their tags.
 */

import type { WardrobeItem } from '@/types/wardrobe';
import { STYLE_TO_VIBE, COLOR_COMBINATIONS } from '@/lib/mock-wardrobe';
import type { OutfitStyle } from '@/lib/store/outfit-builder.store';

/**
 * Scoring weights for different tag categories
 * Total = 100
 */
export interface ScoringWeights {
  style: number;
  vibe: number;
  occasion: number;
  functional: number;
  silhouette: number;
  color: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  style: 30,
  vibe: 20,
  occasion: 15,
  functional: 20,
  silhouette: 10,
  color: 5,
};

/**
 * Calculate style compatibility score between two items
 * Matching style_tags = 100, else 0
 */
function calculateStyleScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const styleOverlap = item1.style_tags.filter((tag) => item2.style_tags.includes(tag)).length;
  return styleOverlap > 0 ? 100 : 0;
}

/**
 * Calculate vibe compatibility score between two items
 * Matching vibe_tags = 100, else 0
 */
function calculateVibeScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const vibeOverlap = item1.vibe_tags.filter((tag) => item2.vibe_tags.includes(tag)).length;
  return vibeOverlap > 0 ? 100 : 0;
}

/**
 * Calculate occasion compatibility score between two items
 * Overlapping occasion_tags = 100, else 0
 */
function calculateOccasionScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const occasionOverlap = item1.occasion_tags.filter((tag) => item2.occasion_tags.includes(tag)).length;
  return occasionOverlap > 0 ? 100 : 0;
}

/**
 * Calculate functional layering compatibility score
 * base_layer + outer_layer = 100, two outer_layer = 0, else 50
 */
function calculateFunctionalScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const func1 = item1.functional_tags[0];
  const func2 = item2.functional_tags[0];

  if (!func1 && !func2) return 50; // neutral if neither has functional tags
  if (!func1 || !func2) return 50; // neutral if one is missing

  // base_layer + outer_layer = good combo
  if ((func1 === 'base_layer' && func2 === 'outer_layer') ||
      (func1 === 'outer_layer' && func2 === 'base_layer')) {
    return 100;
  }

  // two outer_layer = bad (can't layer two outer pieces)
  if (func1 === 'outer_layer' && func2 === 'outer_layer') {
    return 0;
  }

  return 50; // neutral default
}

/**
 * Calculate silhouette balance score
 * slim_fit + relaxed_fit = 100, same silhouette = 30, else 50
 */
function calculateSilhouetteScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const sil1 = item1.silhouette_tags[0];
  const sil2 = item2.silhouette_tags[0];

  if (!sil1 || !sil2) return 50; // neutral if either is missing

  // Complementary silhouettes
  if ((sil1 === 'slim_fit' && sil2 === 'relaxed_fit') ||
      (sil1 === 'relaxed_fit' && sil2 === 'slim_fit')) {
    return 100;
  }

  // slim_fit + oversized or regular + flowy also work
  if ((sil1 === 'slim_fit' && sil2 === 'oversized') ||
      (sil1 === 'oversized' && sil2 === 'slim_fit')) {
    return 80;
  }

  if ((sil1 === 'regular_fit' && sil2 === 'flowy') ||
      (sil1 === 'flowy' && sil2 === 'regular_fit')) {
    return 80;
  }

  // Same silhouette not ideal
  if (sil1 === sil2) {
    return 30;
  }

  return 50; // neutral default
}

/**
 * Calculate color harmony score
 * Check if colors are in COLOR_COMBINATIONS
 */
function calculateColorScore(item1: WardrobeItem, item2: WardrobeItem): number {
  const colors1 = item1.colors || [];
  const colors2 = item2.colors || [];

  if (colors1.length === 0 || colors2.length === 0) return 70; // neutral if no colors

  // Check all combinations of colors from both items
  for (const c1 of colors1) {
    for (const c2 of colors2) {
      // Check if this pair is in COLOR_COMBINATIONS
      const isValidCombo = COLOR_COMBINATIONS.some(
        (combo) => (combo.includes(c1) && combo.includes(c2))
      );
      if (isValidCombo) {
        return 100;
      }
    }
  }

  // Not in known good combinations, but not necessarily bad
  return 50;
}

/**
 * Calculate compatibility score between two items (0-100)
 * Uses weighted scoring across all tag categories
 */
export function calculateItemPairScore(
  item1: WardrobeItem,
  item2: WardrobeItem,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let totalScore = 0;
  let totalWeight = 0;

  // Style compatibility
  const styleScore = calculateStyleScore(item1, item2);
  totalScore += styleScore * weights.style;
  totalWeight += weights.style;

  // Vibe compatibility
  const vibeScore = calculateVibeScore(item1, item2);
  totalScore += vibeScore * weights.vibe;
  totalWeight += weights.vibe;

  // Occasion compatibility
  const occasionScore = calculateOccasionScore(item1, item2);
  totalScore += occasionScore * weights.occasion;
  totalWeight += weights.occasion;

  // Functional layering compatibility
  const functionalScore = calculateFunctionalScore(item1, item2);
  totalScore += functionalScore * weights.functional;
  totalWeight += weights.functional;

  // Silhouette balance
  const silhouetteScore = calculateSilhouetteScore(item1, item2);
  totalScore += silhouetteScore * weights.silhouette;
  totalWeight += weights.silhouette;

  // Color harmony
  const colorScore = calculateColorScore(item1, item2);
  totalScore += colorScore * weights.color;
  totalWeight += weights.color;

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Calculate overall outfit score (average of all item pairs in selection)
 */
export function calculateOutfitScore(
  selection: { [key: string]: WardrobeItem | undefined }
): number {
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

/**
 * Map outfit style to tag keywords for filtering
 */
const STYLE_TAG_MAP: Record<OutfitStyle, string[]> = {
  casual: ['casual', 'minimalist'],
  streetwear: ['streetwear', 'y2k'],
  formal: ['old_money', 'minimalist'],
  party: ['streetwear', 'y2k'],
  bohemian: ['bohemian', 'cottagecore'],
  sporty: ['athleisure', 'casual'],
};

/**
 * Filter items by selected style
 * Returns items that have tags matching the style
 */
export function filterByStyle(items: WardrobeItem[], style: OutfitStyle | null): WardrobeItem[] {
  if (!style) return items;

  const targetTags = STYLE_TAG_MAP[style] || [];
  if (targetTags.length === 0) return items;

  return items.filter((item) =>
    item.style_tags.some((tag) => targetTags.includes(tag))
  );
}

/**
 * Get items that complement an existing selection for a specific slot
 * Uses scoring to find best matching item
 */
export function getBestMatchingItem(
  availableItems: WardrobeItem[],
  currentSelection: { [key: string]: WardrobeItem | undefined }
): WardrobeItem | null {
  if (availableItems.length === 0) return null;
  if (Object.values(currentSelection).filter(Boolean).length === 0) {
    // No items selected yet, return random
    return availableItems[Math.floor(Math.random() * availableItems.length)];
  }

  // Calculate scores for all available items
  const itemScores = availableItems.map((item) => {
    let totalScore = 0;
    let count = 0;
    const selectedItems = Object.values(currentSelection).filter(Boolean) as WardrobeItem[];
    
    for (const selected of selectedItems) {
      totalScore += calculateItemPairScore(item, selected);
      count++;
    }
    
    return {
      item,
      score: count > 0 ? totalScore / count : 0,
    };
  });

  // Sort by score descending
  itemScores.sort((a, b) => b.score - a.score);

  // Take top 3 candidates (or fewer if available)
  const topCandidates = itemScores.slice(0, Math.min(3, itemScores.length));
  
  // Randomly select one from the top candidates
  const randomIndex = Math.floor(Math.random() * topCandidates.length);
  return topCandidates[randomIndex].item;
}

/**
 * Style tag map for external use
 */
export { STYLE_TAG_MAP };