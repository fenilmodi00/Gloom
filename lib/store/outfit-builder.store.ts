/**
 * Outfit Builder Store
 *
 * Manages state for building outfits in the SelectItemsSheet.
 * Enforces one-item-per-category constraint.
 * Includes outfit combination generation for suggestion cards.
 */
import { create } from 'zustand';
import type { WardrobeItem, Category } from '@/types/wardrobe';

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
  activeCategory: Category | null;

  // Style selection
  selectedStyle: OutfitStyle | null;

  // Combination suggestions
  combinations: OutfitCombination[];
  activeCombination: OutfitCombination | null;
  isCombinationSheetOpen: boolean;

  // Actions
  toggleItem: (item: WardrobeItem) => void;
  removeItem: (category: Category) => void;
  removeSelection: (itemId: string) => void;
  clearSelection: () => void;
  setSheetOpen: (open: boolean) => void;
  setActiveCategory: (category: Category | null) => void;
  setSelectedStyle: (style: OutfitStyle | null) => void;
  generateCombinations: (allItems: WardrobeItem[]) => void;
  openCombinationSheet: (combination: OutfitCombination) => void;
  closeCombinationSheet: () => void;

  // Computed
  getSelectedCount: () => number;
  getSelectedItem: (category: Category) => WardrobeItem | undefined;
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

  toggleItem: (item: WardrobeItem) => {
    set((state) => {
      const currentSelected = state.selectedItems[item.category];

      // If same item is selected, deselect it
      if (currentSelected?.id === item.id) {
        return {
          selectedItems: {
            ...state.selectedItems,
            [item.category]: undefined,
          },
        };
      }

      // Otherwise, select the new item (replacing any previous selection)
      return {
        selectedItems: {
          ...state.selectedItems,
          [item.category]: item,
        },
      };
    });
  },

  removeItem: (category: Category) => {
    set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [category]: undefined,
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

setActiveCategory: (category: Category | null) => {
set({ activeCategory: category });
},

setSelectedStyle: (style: OutfitStyle | null) => {
set({ selectedStyle: style });
},

// Generate outfit combinations from available items
// Creates multiple suggestions based on selected items + random completions
generateCombinations: (allItems: WardrobeItem[]) => {
const { selectedItems } = get();
const selectedArray = Object.values(selectedItems).filter(Boolean) as WardrobeItem[];

// Need at least 1 selected item to generate combinations
if (selectedArray.length === 0) {
set({ combinations: [] });
return;
}

// Group all items by category
const itemsByCategory: Record<Category, WardrobeItem[]> = {
upper: [],
lower: [],
dress: [],
shoes: [],
bag: [],
accessory: [],
};

allItems.forEach((item) => {
if (itemsByCategory[item.category]) {
itemsByCategory[item.category].push(item);
}
});

// Generate combinations
const newCombinations: OutfitCombination[] = [];
const combinationCount = Math.min(5, 10); // Generate 5 combinations max

for (let i = 0; i < combinationCount; i++) {
const combination: OutfitSelection = { ...selectedItems };
let matchScore = 100;

// Fill missing slots with random items
const slots: Category[] = ['upper', 'lower', 'dress', 'shoes', 'bag', 'accessory'];

slots.forEach((category) => {
// If dress is selected, skip upper and lower
if (category === 'upper' || category === 'lower') {
if (combination.dress) {
return;
}
}

// Skip if already selected
if (combination[category]) {
return;
}

// Pick random item from category
const categoryItems = itemsByCategory[category];
if (categoryItems && categoryItems.length > 0) {
const randomIndex = Math.floor(Math.random() * categoryItems.length);
combination[category] = categoryItems[randomIndex];
matchScore -= 5; // Penalty for each auto-filled slot
}
});

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
matchScore: Math.max(50, matchScore), // Minimum 50% match
});
}
}

set({ combinations: newCombinations });
},

openCombinationSheet: (combination: OutfitCombination) => {
set({ activeCombination: combination, isCombinationSheetOpen: true });
},

closeCombinationSheet: () => {
set({ isCombinationSheetOpen: false, activeCombination: null });
},

getSelectedCount: () => {
const state = get();
return Object.values(state.selectedItems).filter(Boolean).length;
},

getSelectedItem: (category: Category) => {
return get().selectedItems[category];
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
