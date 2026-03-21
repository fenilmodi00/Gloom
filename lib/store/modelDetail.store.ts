import { create } from 'zustand';
import type { ModelCard, OutfitItem } from '@/types/inspo';

interface ModelDetailState {
  selectedModel: ModelCard | null;
  clothItems: OutfitItem[];
  
  // Actions
  openModelDetail: (model: ModelCard, clothItems: OutfitItem[]) => void;
  closeModelDetail: () => void;
}

// NOTE: This store is intentionally NOT persisted.
// Modal state should reset on app restart for a clean UX.
export const useModelDetailStore = create<ModelDetailState>((set) => ({
  selectedModel: null,
  clothItems: [],

  openModelDetail: (model, clothItems) =>
    set({
      selectedModel: model,
      clothItems,
    }),

  closeModelDetail: () =>
    set({
      selectedModel: null,
      clothItems: [],
    }),
}));

// Selector hooks
export const useSelectedModel = () => useModelDetailStore((state) => state.selectedModel);
export const useClothItems = () => useModelDetailStore((state) => state.clothItems);
export const useIsModelDetailOpen = () => useModelDetailStore((state) => state.selectedModel !== null);
