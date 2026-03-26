import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WardrobeItem, WardrobeItemInput, Category } from '../../types';
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
      const { user, session } = useAuthStore.getState();
      if (!user && !__DEV__) throw new Error('User not authenticated');
      
      set({ isLoading: true, error: null });
      
      try {
         const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
         const headers: Record<string, string> = { 'Content-Type': 'application/json' };
         if (session) headers['Authorization'] = `Bearer ${session}`;
         
         const response = await fetch(`${backendUrl}/api/v1/wardrobe`, {
           method: 'POST',
           headers,
           body: JSON.stringify({
            image_url: itemInput.image_url,
            cutout_url: itemInput.cutout_url,
            category: itemInput.category,
            sub_category: itemInput.sub_category,
            colors: itemInput.colors,
            style_tags: itemInput.style_tags,
            occasion_tags: itemInput.occasion_tags,
            vibe_tags: itemInput.vibe_tags,
            functional_tags: itemInput.functional_tags,
            silhouette_tags: itemInput.silhouette_tags,
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
      const { user, session } = useAuthStore.getState();
      if (!user && !__DEV__) return;
  
      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const headers: Record<string, string> = {};
        if (session) headers['Authorization'] = `Bearer ${session}`;
        
        const response = await fetch(`${backendUrl}/api/v1/wardrobe/${id}`, {
          method: 'DELETE',
          headers,
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
      const { user, session } = useAuthStore.getState();
      // In dev mode, allow request even without user (backend has dev bypass)
      if (!user && !__DEV__) {
        set({ isLoading: false, error: 'User not authenticated' });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const headers: Record<string, string> = {};
        if (session) {
          headers['Authorization'] = `Bearer ${session}`;
        }
        
        const response = await fetch(`${backendUrl}/api/v1/wardrobe`, { headers });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch items');
        }

        const json = await response.json();
        set({ items: (json.data || []) as WardrobeItem[], isLoading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch items',
          isLoading: false 
        });
      }
    },

    uploadImage: async (uri: string) => {
      const { user, session } = useAuthStore.getState();
      if (!user && !__DEV__) throw new Error('User not authenticated');

      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
        const fileExt = uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'dev-user'}/${fileName}`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session) headers['Authorization'] = `Bearer ${session}`;

        // Get presigned URL
        const presignResponse = await fetch(`${backendUrl}/api/v1/presigned-url`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bucket: 'wardrobe-images',
            path: filePath,
          }),
        });

        if (!presignResponse.ok) {
          const errorData = await presignResponse.json();
          throw new Error(errorData.error?.message || 'Failed to get presigned URL');
        }

        const { url, path } = await presignResponse.json();

        // Get image blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload to signed URL
        const uploadResponse = await fetch(url, {
          method: 'PUT',
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to storage');
        }

        // Construct public URL
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) throw new Error('Supabase URL not configured');

        return `${supabaseUrl}/storage/v1/object/public/wardrobe-images/${path}`;
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
