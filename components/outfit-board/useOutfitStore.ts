import { create } from 'zustand';

export type SlotKey = 'top' | 'bottom' | 'shoes' | 'accessory';

export interface ClothingItem {
  id: string;
  uri: string; // remote URL or local file URI
  name?: string;
  category?: string;
}

export type OutfitSlots = Record<SlotKey, ClothingItem | null>;

interface OutfitStoreState extends OutfitSlots {
  setSlot: (slot: SlotKey, item: ClothingItem | null) => void;
  clearSlot: (slot: SlotKey) => void;
  clearAll: () => void;
}

export const useOutfitStore = create<OutfitStoreState>((set) => ({
  top: null,
  bottom: null,
  shoes: null,
  accessory: null,

  setSlot: (slot, item) => set((state) => ({ ...state, [slot]: item })),
  clearSlot: (slot) => set((state) => ({ ...state, [slot]: null })),
  clearAll: () => set({ top: null, bottom: null, shoes: null, accessory: null }),
}));
