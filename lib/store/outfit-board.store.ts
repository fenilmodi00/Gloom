/**
 * Outfit Board Store
 *
 * Manages state for the OutfitBoard component.
 * Tracks clothing items in 4 slots: top, bottom, shoes, accessory.
 */
import { create } from 'zustand';

export type SlotKey = 'top' | 'bottom' | 'shoes' | 'accessory';

export interface ClothingItem {
  id: string;
  uri: string | number; // remote URL or local file require resource ID
  name?: string;
  category?: string;
}

type OutfitSlots = Record<SlotKey, ClothingItem | null>;

interface OutfitBoardState {
  slots: OutfitSlots;
  setSlot: (slot: SlotKey, item: ClothingItem | null) => void;
  clearSlot: (slot: SlotKey) => void;
  clearAll: () => void;
}

const initialSlots: OutfitSlots = {
  top: null,
  bottom: null,
  shoes: null,
  accessory: null,
};

export const useOutfitBoardStore = create<OutfitBoardState>((set) => ({
  slots: initialSlots,

  setSlot: (slot, item) =>
    set((state) => ({
      slots: {
        ...state.slots,
        [slot]: item,
      },
    })),

  clearSlot: (slot) =>
    set((state) => ({
      slots: {
        ...state.slots,
        [slot]: null,
      },
    })),

  clearAll: () => set({ slots: initialSlots }),
}));

// Selector hooks for optimized re-renders
export const useOutfitSlots = () => useOutfitBoardStore((state) => state.slots);

export const useSlotItem = (slot: SlotKey) =>
  useOutfitBoardStore((state) => state.slots[slot]);
