import { useOutfitBuilderStore } from '@/lib/store/outfit-builder.store';
import { createMockItem } from './fixtures/wardrobe-items';

describe('Outfit Builder Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useOutfitBuilderStore.setState({
      selectedItems: {},
      selectedStyle: null,
      combinations: [],
      isSheetOpen: false,
      activeCategory: null,
      activeCombination: null,
      isCombinationSheetOpen: false,
      isCarouselOpen: false,
      activeCombinationIndex: 0,
    });
  });

  describe('toggleItem', () => {
    it('should select an item when no item is selected for the slot', () => {
      const store = useOutfitBuilderStore.getState();
      const item = createMockItem({ category: 'tops', id: 'top-1' });

      store.toggleItem(item);

      const newState = useOutfitBuilderStore.getState();
      // tops map to 'upper' slot
      expect(newState.selectedItems.upper).toBeDefined();
      expect(newState.selectedItems.upper?.id).toBe('top-1');
    });

    it('should replace an item when a different item is selected for the slot', () => {
      const store = useOutfitBuilderStore.getState();
      const item1 = createMockItem({ category: 'tops', id: 'top-1' });
      const item2 = createMockItem({ category: 'tops', id: 'top-2' });

      store.toggleItem(item1);
      useOutfitBuilderStore.getState().toggleItem(item2);

      const newState = useOutfitBuilderStore.getState();
      expect(newState.selectedItems.upper?.id).toBe('top-2');
    });

    it('should deselect an item when the same item is selected for the slot', () => {
      const store = useOutfitBuilderStore.getState();
      const item = createMockItem({ category: 'tops', id: 'top-1' });

      store.toggleItem(item); // Select
      useOutfitBuilderStore.getState().toggleItem(item); // Deselect

      const newState = useOutfitBuilderStore.getState();
      expect(newState.selectedItems.upper).toBeUndefined();
    });
  });

  describe('removeItem, removeSelection, clearSelection', () => {
    it('should remove an item from a specific slot', () => {
      const store = useOutfitBuilderStore.getState();
      const top = createMockItem({ category: 'tops', id: 'top-1' });
      const bottom = createMockItem({ category: 'bottoms', id: 'bottom-1' });

      store.toggleItem(top);
      useOutfitBuilderStore.getState().toggleItem(bottom);
      useOutfitBuilderStore.getState().removeItem('upper');

      const newState = useOutfitBuilderStore.getState();
      expect(newState.selectedItems.upper).toBeUndefined();
      expect(newState.selectedItems.lower).toBeDefined(); // Still there
    });

    it('should remove an item by its ID', () => {
      const store = useOutfitBuilderStore.getState();
      const top = createMockItem({ category: 'tops', id: 'top-1' });

      store.toggleItem(top);
      useOutfitBuilderStore.getState().removeSelection('top-1');

      const newState = useOutfitBuilderStore.getState();
      expect(newState.selectedItems.upper).toBeUndefined();
    });

    it('should completely clear all selections', () => {
      const store = useOutfitBuilderStore.getState();
      const top = createMockItem({ category: 'tops', id: 'top-1' });

      store.toggleItem(top);
      useOutfitBuilderStore.getState().setSelectedStyle('casual');
      useOutfitBuilderStore.getState().clearSelection();

      const newState = useOutfitBuilderStore.getState();
      expect(newState.selectedItems).toEqual({});
      expect(newState.selectedStyle).toBeNull();
      expect(newState.combinations).toEqual([]);
    });
  });

  describe('Style and Combinations', () => {
    it('should set selected style', () => {
      const store = useOutfitBuilderStore.getState();
      store.setSelectedStyle('casual');
      expect(useOutfitBuilderStore.getState().selectedStyle).toBe('casual');
    });

    it('should not generate combinations if no items are selected', () => {
      const store = useOutfitBuilderStore.getState();
      store.generateCombinations([createMockItem()]);
      expect(useOutfitBuilderStore.getState().combinations).toEqual([]);
    });

    it('should generate combinations correctly based on selected items', () => {
      const store = useOutfitBuilderStore.getState();
      const top = createMockItem({ category: 'tops', id: 'top-1' });
      const bottom = createMockItem({ category: 'bottoms', id: 'bottom-1' });
      const shoes = createMockItem({ category: 'shoes', id: 'shoes-1' });

      store.toggleItem(top);
      useOutfitBuilderStore.getState().generateCombinations([top, bottom, shoes]);

      const newState = useOutfitBuilderStore.getState();
      // Ensure combinations were generated
      expect(newState.combinations.length).toBeGreaterThan(0);

      // Each combination should have the initially selected top
      newState.combinations.forEach(combo => {
        expect(combo.selection.upper?.id).toBe('top-1');
      });
    });
  });
});
