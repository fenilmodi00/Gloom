import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuthStore } from './auth.store';

export interface Outfit {
  id: string;
  user_id: string;
  item_ids: string[];
  occasion: string;
  vibe: string;
  color_reasoning: string;
  ai_score: number;
  cover_image_url: string | null;
  created_at: string;
}

interface OutfitState {
  outfits: Outfit[];
  isLoading: boolean;
  error: string | null;
  fetchOutfits: () => Promise<void>;
  addOutfit: (outfit: Outfit) => void;
  saveOutfit: (outfit: Omit<Outfit, 'id' | 'created_at'>) => Promise<Outfit | null>;
}

export const useOutfitStore = create<OutfitState>((set) => ({
  outfits: [],
  isLoading: false,
  error: null,

  fetchOutfits: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ isLoading: false, error: 'User not authenticated' });
      return;
    }
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ outfits: (data as Outfit[]) ?? [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addOutfit: (outfit: Outfit) => {
    set((state) => ({
      outfits: [outfit, ...state.outfits],
    }));
  },

  saveOutfit: async (outfit) => {
    try {
      set({ isLoading: true, error: null });
      const { data, error } = await supabase
        .from('outfits')
        .insert([outfit])
        .select()
        .single();

      if (error) throw error;

      const newOutfit = data as Outfit;
      set((state) => ({
        outfits: [newOutfit, ...state.outfits],
        isLoading: false,
      }));
      return newOutfit;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },
}));
