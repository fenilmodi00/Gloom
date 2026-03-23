/**
 * Outfit Builder Store
 * 
 * Manages state for building outfits in the SelectItemsSheet.
 * Enforces one-item-per-category constraint.
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

interface OutfitBuilderState {
  // Selection state
  selectedItems: OutfitSelection;
  
  // Sheet state
  isSheetOpen: boolean;
  activeCategory: Category | null;
  
  // Style selection
  selectedStyle: OutfitStyle | null;
  
  // Actions
  toggleItem: (item: WardrobeItem) => void;
  removeItem: (category: Category) => void;
  clearSelection: () => void;
  setSheetOpen: (open: boolean) => void;
  setActiveCategory: (category: Category | null) => void;
  setSelectedStyle: (style: OutfitStyle | null) => void;
  
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

  clearSelection: () => {
    set({ selectedItems: {}, selectedStyle: null });
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
