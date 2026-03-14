import { create } from 'zustand';
import type { Outfit } from '../../types';
import { supabase } from '../supabase';

interface OutfitState {
  outfits: Outfit[];
  isGenerating: boolean;
  error: string | null;
  
  // Actions
  setOutfits: (outfits: Outfit[]) => void;
  addOutfit: (outfit: Outfit) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  fetchOutfits: (userId: string) => Promise<void>;
  generateOutfits: (userId: string, wardrobeItemIds: string[]) => Promise<void>;
}

export const useOutfitStore = create<OutfitState>((set) => ({
  outfits: [],
  isGenerating: false,
  error: null,
  
  setOutfits: (outfits) => set({ outfits }),
  
  addOutfit: (outfit) => 
    set((state) => ({ 
      outfits: [...state.outfits, outfit] 
    })),
  
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  setError: (error) => set({ error }),
  
  fetchOutfits: async (userId: string) => {
    set({ isGenerating: true, error: null });
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ outfits: data || [], isGenerating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch outfits',
        isGenerating: false 
      });
    }
  },
  
  generateOutfits: async (userId: string, _wardrobeItemIds: string[]) => {
    set({ isGenerating: true, error: null });
    // This is a stub - Gemini integration will be implemented in Task 30
    // For now, just set isGenerating to false
    set({ isGenerating: false });
  },
}));

// Selector hooks
export const useOutfits = () => useOutfitStore((state) => state.outfits);
export const useOutfitGenerating = () => useOutfitStore((state) => state.isGenerating);
export const useOutfitError = () => useOutfitStore((state) => state.error);
