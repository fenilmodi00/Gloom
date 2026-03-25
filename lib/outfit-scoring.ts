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

// Memoization cache for pair scores
const pairScoreCache = new Map<string, number>();

/**
 * Generates a unique, order-independent cache key for an item pair
 */
function getPairCacheKey(item1Id: string, item2Id: string, weightsString: string): string {
  // Sort IDs so that (A, B) and (B, A) generate the same key
  const sortedIds = [item1Id, item2Id].sort();
  return `${sortedIds[0]}|${sortedIds[1]}|${weightsString}`;
}

/**
 * Clear the pair score cache (useful for testing or when user wardrobe changes substantially)
 */
export function clearPairScoreCache(): void {
  pairScoreCache.clear();
}

/**
 * Calculate compatibility score between two items (0-100)
 * Uses weighted scoring across all tag categories
 */
export function calculateItemPairScore(
  item1: WardrobeItem,
  item2: WardrobeItem,
  weights?: ScoringWeights
): number {
  const actualWeights = weights || {
    style: 30,
    vibe: 20,
    occasion: 15,
    functional: 20,
    silhouette: 10,
    color: 5,
  };

  const weightsString = JSON.stringify(actualWeights);
  const cacheKey = getPairCacheKey(item1.id, item2.id, weightsString);

  if (pairScoreCache.has(cacheKey)) {
    return pairScoreCache.get(cacheKey)!;
  }

  let totalScore = 0;
  let totalWeight = 0;

  // Style compatibility
  const styleScore = calculateStyleScore(item1, item2);
  totalScore += styleScore * actualWeights.style;
  totalWeight += actualWeights.style;

  // Vibe compatibility
  const vibeScore = calculateVibeScore(item1, item2);
  totalScore += vibeScore * actualWeights.vibe;
  totalWeight += actualWeights.vibe;

  // Occasion compatibility
  const occasionScore = calculateOccasionScore(item1, item2);
  totalScore += occasionScore * actualWeights.occasion;
  totalWeight += actualWeights.occasion;

  // Functional layering compatibility
  const functionalScore = calculateFunctionalScore(item1, item2);
  totalScore += functionalScore * actualWeights.functional;
  totalWeight += actualWeights.functional;

  // Silhouette balance
  const silhouetteScore = calculateSilhouetteScore(item1, item2);
  totalScore += silhouetteScore * actualWeights.silhouette;
  totalWeight += actualWeights.silhouette;

  // Color harmony
  const colorScore = calculateColorScore(item1, item2);
  totalScore += colorScore * actualWeights.color;
  totalWeight += actualWeights.color;

  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  pairScoreCache.set(cacheKey, finalScore);

  return finalScore;
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

// Inverted tag index for O(1) style lookups
const styleInvertedIndex = new Map<string, Set<string>>();
let isIndexBuilt = false;

/**
 * Build inverted index for fast item filtering by tag
 */
export function buildTagIndex(items: WardrobeItem[]): void {
  styleInvertedIndex.clear();

  items.forEach(item => {
    item.style_tags.forEach(tag => {
      if (!styleInvertedIndex.has(tag)) {
        styleInvertedIndex.set(tag, new Set());
      }
      styleInvertedIndex.get(tag)!.add(item.id);
    });
  });

  isIndexBuilt = true;
}

/**
 * Clear tag index (useful when wardrobe changes significantly)
 */
export function clearTagIndex(): void {
  styleInvertedIndex.clear();
  isIndexBuilt = false;
}

/**
 * Filter items by selected style using inverted index if built
 * Returns items that have tags matching the style
 */
export function filterByStyle(items: WardrobeItem[], style: OutfitStyle | null): WardrobeItem[] {
  if (!style) return items;

  const targetTags = STYLE_TAG_MAP[style] || [];
  if (targetTags.length === 0) return items;

  // If we haven't built the index yet or it's empty, build it
  if (!isIndexBuilt) {
    buildTagIndex(items);
  }

  // Use inverted index for O(1) item ID retrieval
  const matchingItemIds = new Set<string>();
  targetTags.forEach(tag => {
    const itemIdsForTag = styleInvertedIndex.get(tag);
    if (itemIdsForTag) {
      itemIdsForTag.forEach(id => matchingItemIds.add(id));
    }
  });

  // Return actual item objects that matched
  return items.filter(item => matchingItemIds.has(item.id));
}

// Simple fixed-size Priority Queue for top-K elements
// Optimized for finding the top N matches without full array sort
class TopKQueue<T> {
  private items: { item: T; score: number }[] = [];

  constructor(private readonly k: number) {}

  add(item: T, score: number) {
    // If queue isn't full, just add and sort
    if (this.items.length < this.k) {
      this.items.push({ item, score });
      this.items.sort((a, b) => b.score - a.score);
      return;
    }

    // If score is worse than our worst item, ignore
    if (score <= this.items[this.items.length - 1].score) return;

    // Otherwise, replace worst item and re-sort
    this.items[this.items.length - 1] = { item, score };
    this.items.sort((a, b) => b.score - a.score);
  }

  getTopItems(): T[] {
    return this.items.map(i => i.item);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Get items that complement an existing selection for a specific slot
 * Uses scoring to find best matching item, optimized with a Top-K priority queue
 * rather than sorting the entire array.
 */
export function getBestMatchingItem(
  availableItems: WardrobeItem[],
  currentSelection: { [key: string]: WardrobeItem | undefined },
  topK: number = 3
): WardrobeItem | null {
  if (availableItems.length === 0) return null;
  if (Object.values(currentSelection).filter(Boolean).length === 0) {
    // No items selected yet, return random
    return availableItems[Math.floor(Math.random() * availableItems.length)];
  }

  const selectedItems = Object.values(currentSelection).filter(Boolean) as WardrobeItem[];

  // Early pruning: use Priority Queue instead of mapping all then sorting all O(N log K) instead of O(N log N)
  const topMatches = new TopKQueue<WardrobeItem>(topK);

  for (const item of availableItems) {
    let totalScore = 0;
    
    // Calculate average pair score against current selection
    for (const selected of selectedItems) {
      totalScore += calculateItemPairScore(item, selected);
    }
    const avgScore = selectedItems.length > 0 ? totalScore / selectedItems.length : 0;
    
    // Add to Top-K queue
    topMatches.add(item, avgScore);
  }

  if (topMatches.isEmpty()) return null;

  // Take top K candidates
  const candidates = topMatches.getTopItems();
  
  // Randomly select one from the top candidates
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Style tag map for external use
 */
export { STYLE_TAG_MAP };

export const DEFAULT_WEIGHTS: ScoringWeights = {
  style: 30,
  vibe: 20,
  occasion: 15,
  functional: 20,
  silhouette: 10,
  color: 5,
};
