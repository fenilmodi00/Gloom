import { create } from 'zustand';
import { supabase } from '../supabase';
import { useAuthStore } from './auth.store';

import { Outfit, OutfitInput } from '@/types/outfit';

// Helper to get current user ID with dev mode fallback
const getCurrentUserId = (): string => {
  const { user } = useAuthStore.getState();
  
  // Use placeholder in dev mode (when no real auth)
  if (__DEV__ && !user) {
    return '00000000-0000-0000-0000-000000000000';
  }
  
  if (!user?.id) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

interface OutfitState {
  outfits: Outfit[];
  isLoading: boolean;
  error: string | null;
  fetchOutfits: () => Promise<void>;
  saveOutfit: (outfit: OutfitInput) => Promise<Outfit | null>;
  removeOutfit: (id: string) => Promise<void>;
}

export const useOutfitStore = create<OutfitState>((set) => ({
  outfits: [],
  isLoading: false,
  error: null,

   fetchOutfits: async () => {
     try {
       set({ isLoading: true, error: null });

       const userId = getCurrentUserId();

       const { data, error } = await supabase
         .from('outfits')
         .select('*')
         .eq('user_id', userId)
         .order('created_at', { ascending: false });

       if (error) throw error;
       set({ outfits: data as Outfit[], isLoading: false });
     } catch (error: any) {
       set({ error: error.message, isLoading: false });
     }
   },

   saveOutfit: async (outfitInput) => {
     try {
       set({ isLoading: true, error: null });
       const userId = getCurrentUserId();
       const { data, error } = await supabase
         .from('outfits')
         .insert([{ ...outfitInput, user_id: userId }])
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

   removeOutfit: async (id) => {
     try {
       set({ isLoading: true, error: null });
       const userId = getCurrentUserId();
       const { error } = await supabase
         .from('outfits')
         .delete()
         .eq('id', id)
         .eq('user_id', userId);

       if (error) throw error;

       set((state) => ({
         outfits: state.outfits.filter((o) => o.id !== id),
         isLoading: false,
       }));
     } catch (error: any) {
       set({ error: error.message, isLoading: false });
     }
   },
}));
