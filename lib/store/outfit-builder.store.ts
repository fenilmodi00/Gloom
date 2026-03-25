/**
 * Outfit Builder Store
 *
 * Manages state for building outfits in the SelectItemsSheet.
 * Enforces one-item-per-category constraint.
 * Includes outfit combination generation for suggestion cards.
 */
import { create } from 'zustand';
import type { WardrobeItem, Category } from '@/types/wardrobe';
import { categoryToSlot, slotToCategories, OUTFIT_SLOTS, type OutfitSlot } from '@/lib/outfit-mapping';
import { 
  calculateItemPairScore, 
  calculateOutfitScore, 
  filterByStyle, 
  getBestMatchingItem 
} from '@/lib/outfit-scoring';

// Outfit style options
export type OutfitStyle = 'casual' | 'streetwear' | 'formal' | 'party' | 'bohemian' | 'sporty';

export const OUTFIT_STYLES: OutfitStyle[] = [
'casual',
'streetwear',
'formal',
'party',
'bohemian',
'sporty',
];

// Selection state: one item per category
export interface OutfitSelection {
upper?: WardrobeItem;
lower?: WardrobeItem;
dress?: WardrobeItem;
shoes?: WardrobeItem;
bag?: WardrobeItem;
accessory?: WardrobeItem;
}

// Outfit combination for suggestion cards
export interface OutfitCombination {
id: string;
selection: OutfitSelection;
matchScore: number; // 0-100
}

interface OutfitBuilderState {
  // Selection state
  selectedItems: OutfitSelection;

  // Sheet state
  isSheetOpen: boolean;
  activeCategory: OutfitSlot | null;

  // Style selection
  selectedStyle: OutfitStyle | null;

  // Combination suggestions
  combinations: OutfitCombination[];
  activeCombination: OutfitCombination | null;
  isCombinationSheetOpen: boolean;
  
  // Carousel state
  isCarouselOpen: boolean;
  activeCombinationIndex: number;

  // Actions
  toggleItem: (item: WardrobeItem) => void;
  removeItem: (slot: OutfitSlot) => void;
  removeSelection: (itemId: string) => void;
  clearSelection: () => void;
  setSheetOpen: (open: boolean) => void;
  setActiveCategory: (slot: OutfitSlot | null) => void;
  setSelectedStyle: (style: OutfitStyle | null) => void;
  generateCombinations: (allItems: WardrobeItem[]) => void;
  openCombinationSheet: (combination: OutfitCombination) => void;
  closeCombinationSheet: () => void;
  openCombinationCarousel: (index: number) => void;
  closeCombinationCarousel: () => void;
  setActiveCombinationIndex: (index: number) => void;

  // Computed
  getSelectedCount: () => number;
  getSelectedItem: (slot: OutfitSlot) => WardrobeItem | undefined;
  isSelected: (itemId: string) => boolean;
}

export const useOutfitBuilderStore = create<OutfitBuilderState>((set, get) => ({
  selectedItems: {},
  isSheetOpen: false,
  activeCategory: null,
  selectedStyle: null,
  combinations: [],
  activeCombination: null,
  isCombinationSheetOpen: false,
  isCarouselOpen: false,
  activeCombinationIndex: 0,

  toggleItem: (item: WardrobeItem) => {
    set((state) => {
      const slot = categoryToSlot(item.category);
      const currentSelected = state.selectedItems[slot];

      // If same item is selected, deselect it
      if (currentSelected?.id === item.id) {
        return {
          selectedItems: {
            ...state.selectedItems,
            [slot]: undefined,
          },
        };
      }

      // Otherwise, select the new item (replacing any previous selection)
      return {
        selectedItems: {
          ...state.selectedItems,
          [slot]: item,
        },
      };
    });
  },

  removeItem: (slot: OutfitSlot) => {
    set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [slot]: undefined,
      },
    }));
  },

  removeSelection: (itemId: string) => {
    set((state) => {
      // Find category of the item with the provided ID
      const category = (Object.keys(state.selectedItems) as Array<keyof OutfitSelection>).find(
        (key) => state.selectedItems[key]?.id === itemId
      );

      if (category) {
        return {
          selectedItems: {
            ...state.selectedItems,
            [category]: undefined,
          },
        };
      }
      return state;
    });
  },

clearSelection: () => {
set({ selectedItems: {}, selectedStyle: null, combinations: [] });
},

setSheetOpen: (open: boolean) => {
set({ isSheetOpen: open });
},

  setActiveCategory: (slot: OutfitSlot | null) => {
set({ activeCategory: slot });
},

setSelectedStyle: (style: OutfitStyle | null) => {
set({ selectedStyle: style });
},

// Generate outfit combinations from available items
// Creates multiple suggestions based on selected items + best matching completions
generateCombinations: (allItems: WardrobeItem[]) => {
  const { selectedItems, selectedStyle } = get();

  // Filter items by selected style if set
  let itemsToUse = allItems;
  if (selectedStyle) {
    itemsToUse = filterByStyle(allItems, selectedStyle);
  }

  const selectedArray = Object.values(selectedItems).filter(Boolean) as WardrobeItem[];

  // Need at least 1 selected item to generate combinations
  if (selectedArray.length === 0) {
    set({ combinations: [] });
    return;
  }

  // Group items by slot (using mapping from Category → slot)
  const itemsBySlot: Record<OutfitSlot, WardrobeItem[]> = {
    upper: [],
    lower: [],
    dress: [],
    shoes: [],
    bag: [],
    accessory: [],
  };

  itemsToUse.forEach((item) => {
    const slot = categoryToSlot(item.category);
    itemsBySlot[slot].push(item);
  });

  // Generate combinations
  const newCombinations: OutfitCombination[] = [];
  const combinationCount = 5; // Generate 5 combinations max

  for (let i = 0; i < combinationCount; i++) {
    const combination: OutfitSelection = { ...selectedItems };

    // Fill missing slots with best matching items in random order
    // Randomizing the order helps with diversity because the "best" item
    // for a slot depends on what's already in other slots.
    const missingSlots = OUTFIT_SLOTS.filter(slot => {
      // If dress is selected, skip upper and lower
      if (slot === 'upper' || slot === 'lower') {
        if (combination.dress) return false;
      }
      return !combination[slot];
    });

    // Shuffle missing slots
    const shuffledSlots = [...missingSlots].sort(() => Math.random() - 0.5);

    shuffledSlots.forEach((slot) => {
      // Get available items for this slot
      const slotItems = itemsBySlot[slot];
      if (slotItems && slotItems.length > 0) {
        // Use best matching item (which now has internal randomness)
        const bestItem = getBestMatchingItem(slotItems, combination as { [key: string]: WardrobeItem | undefined });
        if (bestItem) {
          combination[slot] = bestItem;
        }
      }
    });

    // Calculate real match score using scoring algorithm
    const matchScore = calculateOutfitScore(combination as { [key: string]: WardrobeItem | undefined });

    // Create unique ID for combination
    const id = Object.values(combination)
      .filter(Boolean)
      .map((item) => item?.id)
      .sort()
      .join('-');

    // Only add if not already in list
    if (!newCombinations.find((c) => c.id === id)) {
      newCombinations.push({
        id,
        selection: combination,
        matchScore: Math.max(30, matchScore), // Minimum 30% match
      });
    }
  }

  // Sort by match score descending
  newCombinations.sort((a, b) => b.matchScore - a.matchScore);

  set({ combinations: newCombinations });
},

openCombinationSheet: (combination: OutfitCombination) => {
set({ activeCombination: combination, isCombinationSheetOpen: true });
},

closeCombinationSheet: () => {
set({ isCombinationSheetOpen: false, activeCombination: null });
},

openCombinationCarousel: (index: number) => {
  set({ isCarouselOpen: true, activeCombinationIndex: index });
},

closeCombinationCarousel: () => {
  set({ isCarouselOpen: false });
},

setActiveCombinationIndex: (index: number) => {
  set({ activeCombinationIndex: index });
},

getSelectedCount: () => {
const state = get();
return Object.values(state.selectedItems).filter(Boolean).length;
},

getSelectedItem: (slot: OutfitSlot) => {
return get().selectedItems[slot];
},

isSelected: (itemId: string) => {
const state = get();
return Object.values(state.selectedItems).some(
(item) => item?.id === itemId
);
},
}));

// Selector hooks for optimized re-renders
export const useSelectedItems = () => 
  useOutfitBuilderStore((state) => state.selectedItems);

export const useIsSheetOpen = () => 
  useOutfitBuilderStore((state) => state.isSheetOpen);

export const useActiveCategory = () => 
  useOutfitBuilderStore((state) => state.activeCategory);

export const useSelectedCount = () => 
  useOutfitBuilderStore((state) => state.getSelectedCount());

// Get array of selected items (non-undefined)
export const useSelectedItemsArray = () => {
  const selectedItems = useOutfitBuilderStore((state) => state.selectedItems);
  return Object.values(selectedItems).filter(Boolean) as WardrobeItem[];
};

export const useSelectedStyle = () =>
useOutfitBuilderStore((state) => state.selectedStyle);

// Combination selectors
export const useCombinations = () =>
useOutfitBuilderStore((state) => state.combinations);

export const useActiveCombination = () =>
useOutfitBuilderStore((state) => state.activeCombination);

export const useIsCombinationSheetOpen = () =>
useOutfitBuilderStore((state) => state.isCombinationSheetOpen);

// Carousel selectors
export const useIsCarouselOpen = () =>
  useOutfitBuilderStore((state) => state.isCarouselOpen);

export const useActiveCombinationIndex = () =>
  useOutfitBuilderStore((state) => state.activeCombinationIndex);
