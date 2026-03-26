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
     
     try {
       const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
       const response = await fetch(`${backendUrl}/api/v1/wardrobe`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           // Authorization header omitted in dev, middleware handles it
         },
         body: JSON.stringify({
           image_url: itemInput.image_url,
           cutout_url: itemInput.cutout_url,
           category: itemInput.category,
           sub_category: itemInput.sub_category,
           colors: itemInput.colors,
           style_tags: itemInput.style_tags,
           occasion_tags: itemInput.occasion_tags,
           fabric_guess: itemInput.fabric_guess,
         }),
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error?.message || 'Failed to add item');
       }

       const { data: newItem } = await response.json();
       
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
 
     try {
       const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
       const response = await fetch(`${backendUrl}/api/v1/wardrobe/${id}`, {
         method: 'DELETE',
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error?.message || 'Failed to delete item');
       }
 
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

     try {
       const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
       const response = await fetch(`${backendUrl}/api/v1/wardrobe`);
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error?.message || 'Failed to fetch items');
       }

       const { data } = await response.json();
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
