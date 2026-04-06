import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Category, WardrobeItem, WardrobeItemInput } from '../../types';
import { zustandAsyncStorage } from '../storage';
import { useAuthStore } from './auth.store';
import { supabase } from '../supabase';
import { uuidv4 } from '../utils/uuid';

interface RNFile {
  uri: string;
  name: string;
  type: string;
}

// Extend FormData for React Native file uploads
declare global {
  interface FormData {
    append(name: string, value: RNFile): void;
  }
}

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
  updateItemTags: (id: string, tags: any) => Promise<void>;
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

      // Upload to temporary bucket via backend proxy (bypasses Supabase DNS block)
      // Get image info
      const fileExt = itemInput.image_url?.toString().split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      const userId = user?.id || 'dev-user';
      const tempFilePath = `${userId}/temp/${fileName}`;

      // Upload via backend relay (no direct Supabase contact from phone)
      const formData = new FormData();
      
    // Use standard React Native file object format instead of fetching a blob
    formData.append('file', {
      uri: itemInput.image_url as string,
      name: fileName,
      type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
    } as RNFile);
      
      formData.append('bucket', 'wardrobe-temp');
      formData.append('path', tempFilePath);

      const uploadResponse = await fetch(`${backendUrl}/api/v1/wardrobe/upload`, {
        method: 'POST',
        headers: {
          ...(session ? { 'Authorization': `Bearer ${session}` } : {}),
          // Note: FormData handles its own Content-Type with boundary
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to temporary storage');
      }

      const { data: uploadData } = await uploadResponse.json();
      const tempUrl = uploadData.url;

      // Add item with processing status set to 'processing'
      const addItemResponse = await fetch(`${backendUrl}/api/v1/wardrobe`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image_url: tempUrl,
          cutout_url: null, // Will be set after background removal
          category: itemInput.category || null, // No default, wait for Gemini
          sub_category: itemInput.sub_category,
          colors: itemInput.colors,
          style_tags: itemInput.style_tags,
          occasion_tags: itemInput.occasion_tags,
          vibe_tags: itemInput.vibe_tags,
          functional_tags: itemInput.functional_tags,
          silhouette_tags: itemInput.silhouette_tags,
          fabric_guess: itemInput.fabric_guess,
          processing_status: itemInput.processing_status || 'processing', // Set status
        }),
      });

      if (!addItemResponse.ok) {
        const errorData = await addItemResponse.json();
        throw new Error(errorData.error?.message || 'Failed to add item');
      }

      const { data: newItem } = await addItemResponse.json();

      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false
      }));

      // Start polling for processing completion
      // In a real app, this would be handled by a background service or websocket
      // For now, we'll return the item and let the UI handle polling
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

       updateItemTags: async (id: string, tags: any) => {
         const { user, session } = useAuthStore.getState();
         if (!user && !__DEV__) return;

         try {
           const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
           const headers: Record<string, string> = { 'Content-Type': 'application/json' };
           if (session) headers['Authorization'] = `Bearer ${session}`;

           const response = await fetch(`${backendUrl}/api/v1/wardrobe/${id}`, {
             method: 'PATCH',
             headers,
             body: JSON.stringify({
               category: tags.category,
               sub_category: tags.sub_category,
               colors: tags.colors,
               style_tags: tags.style_tags,
               occasion_tags: tags.occasion_tags,
               vibe_tags: tags.vibe_tags,
               functional_tags: tags.functional_tags,
               silhouette_tags: tags.silhouette_tags,
               fabric_guess: tags.fabric_guess,
               processing_status: 'ready',
             }),
           });

           if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error?.message || 'Failed to update item tags');
           }

           // Update local state
           set((state) => ({
             items: state.items.map(item =>
               item.id === id
                 ? {
                     ...item,
                     category: tags.category,
                     sub_category: tags.sub_category,
                     colors: tags.colors,
                     style_tags: tags.style_tags,
                     occasion_tags: tags.occasion_tags,
                     vibe_tags: tags.vibe_tags,
                     functional_tags: tags.functional_tags,
                     silhouette_tags: tags.silhouette_tags,
                     fabric_guess: tags.fabric_guess,
                     processing_status: 'completed',
                   }
                 : item
             ),
           }));
         } catch (error) {
           console.error('Error updating item tags:', error);
           throw error;
         }
       },

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
          // Get image info
          const fileExt = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
          const fileName = `${uuidv4()}.${fileExt}`;
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

          const { data: presignData } = await presignResponse.json();
          const { url, path } = presignData;

    // Upload to signed URL using FormData to handle local URI properly
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
    } as RNFile);

          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: formData, // Some storage providers prefer raw body, but RN prefers FormData for local URIs
          });

          // Fallback: If PUT with FormData fails, try the raw fetch which might work if it's a specific storage API
          // Note: Most signed URLs for S3/Supabase expect the raw binary, 
          // but fetching binary from local URI in RN is exactly what's failing.
          // Let's try the XHR way for base64/blob if needed, but andoid fetch(file://) is the main culprit.
          
    if (!uploadResponse.ok) {
      // If it failed, let's try the more robust XHR method to get a blob for the PUT request
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new TypeError('Network request failed to get local blob'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const retryResponse = await fetch(url, {
        method: 'PUT',
        body: blob,
      });

            if (!retryResponse.ok) {
              throw new Error('Failed to upload image to storage');
            }
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
