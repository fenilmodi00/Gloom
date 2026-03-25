import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@/lib/mock-wardrobe', () => {
  return {
    COLOR_COMBINATIONS: [
      ['white', 'black'],
      ['red', 'blue'],
      ['black', 'green']
    ],
    STYLE_TO_VIBE: {
      casual: ['minimalist']
    },
    getMockWardrobeItemsWithAssets: jest.fn(() => []),
    getMockWardrobeItems: jest.fn(() => []),
    getLocalAssetUri: jest.fn(() => 'mock-asset-uri'),
    MOCK_ASSETS: {
      top: [],
      bottom: [],
      shoes: [],
      accessories: []
    }
  };
});

import {
  calculateItemPairScore,
  calculateOutfitScore,
  filterByStyle,
  getBestMatchingItem,
  buildTagIndex,
  clearTagIndex,
  clearPairScoreCache,
} from '@/lib/outfit-scoring';

import { createMockItem } from './fixtures/wardrobe-items';

describe('Outfit Scoring', () => {
  beforeEach(() => {
    clearPairScoreCache();
    clearTagIndex();
  });

  describe('calculateItemPairScore', () => {
    it('should calculate high score for highly matching items', () => {
      const item1 = createMockItem({
        id: 'item1',
        style_tags: ['casual'],
        vibe_tags: ['minimalist'],
        occasion_tags: ['casual'],
        functional_tags: ['base_layer'],
        silhouette_tags: ['slim_fit'],
        colors: ['white'],
      });
      const item2 = createMockItem({
        id: 'item2',
        style_tags: ['casual'],
        vibe_tags: ['minimalist'],
        occasion_tags: ['casual'],
        functional_tags: ['outer_layer'],
        silhouette_tags: ['relaxed_fit'],
        colors: ['black'],
      });

      const score = calculateItemPairScore(item1, item2);
      expect(score).toBeGreaterThan(80);

      // Verify memoization
      const scoreAgain = calculateItemPairScore(item1, item2);
      expect(scoreAgain).toBe(score);
    });

    it('should handle missing tags gracefully (neutral scores)', () => {
      const item1 = createMockItem({
        style_tags: [],
        vibe_tags: [],
        occasion_tags: [],
        functional_tags: [],
        silhouette_tags: [],
        colors: [],
      });
      const item2 = createMockItem({
        style_tags: [],
        vibe_tags: [],
        occasion_tags: [],
        functional_tags: [],
        silhouette_tags: [],
        colors: [],
      });

      const score = calculateItemPairScore(item1, item2);
      expect(score).toBe(19);
    });
  });

  describe('filterByStyle', () => {
    it('should filter items by mapped style tags using inverted index', () => {
      const casualItem = createMockItem({ id: 'c1', style_tags: ['casual'] });
      const formalItem = createMockItem({ id: 'f1', style_tags: ['old_money'] });
      const items = [casualItem, formalItem];

      buildTagIndex(items);

      const filtered = filterByStyle(items, 'casual');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(casualItem.id);
    });

    it('should return all items if style is null', () => {
      const items = [createMockItem(), createMockItem()];
      const filtered = filterByStyle(items, null);
      expect(filtered).toHaveLength(2);
    });

    it('should return empty array if no matching tags', () => {
      const items = [createMockItem({ style_tags: ['goth'] })];
      const filtered = filterByStyle(items, 'casual');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('getBestMatchingItem', () => {
    it('should return null when input array is empty', () => {
      const best = getBestMatchingItem([], { top: createMockItem() });
      expect(best).toBeNull();
    });

    it('should select best item based on randomized top K selection', () => {
      const selected = createMockItem({ style_tags: ['casual'], functional_tags: ['base_layer'] });

      const perfectMatch = createMockItem({
        style_tags: ['casual'],
        vibe_tags: selected.vibe_tags,
        occasion_tags: selected.occasion_tags,
        functional_tags: ['outer_layer']
      });
      const okMatch = createMockItem({ style_tags: ['formal'] });

      const items = [okMatch, perfectMatch];

      const originalRandom = Math.random;
      Math.random = () => 0; // Always pick first element

      const deterministicBest = getBestMatchingItem(items, { top: selected });
      expect(deterministicBest!.id).toBe(perfectMatch.id);

      Math.random = originalRandom;
    });
  });

  describe('calculateOutfitScore', () => {
    it('should calculate average pair score for an outfit', () => {
      const item1 = createMockItem();
      const item2 = createMockItem();
      const score = calculateOutfitScore({ top: item1, bottom: item2 });
      expect(typeof score).toBe('number');
    });

    it('should return 0 for insufficient items', () => {
      const item1 = createMockItem();
      const score = calculateOutfitScore({ top: item1 });
      expect(score).toBe(0);
    });
  });
});
