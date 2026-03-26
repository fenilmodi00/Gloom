import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WardrobeItem, WardrobeItemInput, Category } from '../../types';
import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from '../supabase';
import { zustandAsyncStorage } from '../storage';
import { useAuthStore } from './auth.store';

interface WardrobeState {
   items: WardrobeItem[];
   selectedCategory: Category | 'all';
   isLoading: boolean;
   isHydrated: boolean;
   error: string | null;
   
   // Actions
   setItems: (items: WardrobeItem[]) => void;
   setHydrated: (hydrated: boolean) => void;
   addItem: (item: WardrobeItemInput) => Promise<WardrobeItem>;
   removeItem: (id: string) => Promise<void>;
   setCategory: (category: Category | 'all') => void;
   setLoading: (isLoading: boolean) => void;
   setError: (error: string | null) => void;
   fetchItems: () => Promise<void>;
   uploadImage: (uri: string) => Promise<string>;
 }

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedCategory: 'all',
      isLoading: false,
      isHydrated: false,
      error: null,
      
      setItems: (items) => set({ items }),
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  
   addItem: async (itemInput: WardrobeItemInput) => {
     const { user } = useAuthStore.getState();
     if (!user) throw new Error('User not authenticated');
     
     set({ isLoading: true, error: null });
     
     // Always use Supabase, even with placeholder user ID
     try {
       const { data, error } = await supabase
         .from('wardrobe_items')
         .insert({
           user_id: user.id,
           image_url: itemInput.image_url as string,
           cutout_url: (itemInput.cutout_url as string) || null,
           category: itemInput.category as any,
           sub_category: itemInput.sub_category,
           colors: itemInput.colors || [],
           style_tags: itemInput.style_tags || [],
           occasion_tags: itemInput.occasion_tags || [],
           functional_tags: itemInput.functional_tags || [],
           silhouette_tags: itemInput.silhouette_tags || [],
           vibe_tags: itemInput.vibe_tags || [],
           fabric_guess: itemInput.fabric_guess,
         })
         .select()
         .single();
       
       if (error) throw error;
       
       const newItem = data as WardrobeItem;
       set((state) => ({ 
         items: [newItem, ...state.items],
         isLoading: false 
       }));
       
       return newItem;
     } catch (error) {
       set({ 
         error: error instanceof Error ? error.message : 'Failed to add item',
         isLoading: false 
       });
       throw error;
     }
   },
  
   removeItem: async (id: string) => {
     const { user } = useAuthStore.getState();
     if (!user) return;
 
     // Always use Supabase, even with placeholder user ID
     try {
       const { error } = await supabase
         .from('wardrobe_items')
         .delete()
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       set((state) => ({ 
         items: state.items.filter((item) => item.id !== id) 
       }));
     } catch (error) {
       console.error('Error deleting wardrobe item:', error);
       set({ error: error instanceof Error ? error.message : 'Failed to delete item' });
     }
   },
  
  setCategory: (selectedCategory) => set({ selectedCategory }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
   fetchItems: async () => {
     const { user } = useAuthStore.getState();
     if (!user) {
       set({ isLoading: false, error: 'User not authenticated' });
       return;
     }

     set({ isLoading: true, error: null });

     // Always use Supabase, even with placeholder user ID
     try {
       const { data, error } = await supabase
         .from('wardrobe_items')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });
       
       if (error) throw error;

       set({ items: (data || []) as WardrobeItem[], isLoading: false });
     } catch (error) {
       set({ 
         error: error instanceof Error ? error.message : 'Failed to fetch items',
         isLoading: false 
       });
     }
   },

    uploadImage: async (uri: string) => {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('User not authenticated');

      // Always use Supabase, even with placeholder user ID
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileExt = uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.WARDROBE_IMAGES)
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.WARDROBE_IMAGES)
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    },
    }),
    {
      name: 'wardrobe-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Selector hooks
export const useWardrobeItems = () => useWardrobeStore((state) => state.items);
export const useSelectedCategory = () => useWardrobeStore((state) => state.selectedCategory);
export const useWardrobeLoading = () => useWardrobeStore((state) => state.isLoading);
export const useWardrobeError = () => useWardrobeStore((state) => state.error);
export const useWardrobeHydrated = () => useWardrobeStore((state) => state.isHydrated);

export const useFilteredItems = () => {
  const items = useWardrobeStore((state) => state.items);
  const selectedCategory = useWardrobeStore((state) => state.selectedCategory);
  
  if (selectedCategory === 'all') return items;
  return items.filter((item) => item.category === selectedCategory);
};
