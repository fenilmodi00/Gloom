import { create } from 'zustand';
import { useAuthStore } from './auth.store';
import type { ModelImage } from '@/types/model-image';
import { STORAGE_BUCKETS } from '@/lib/supabase';

interface ModelImageState {
  images: ModelImage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchImages: () => Promise<void>;
  uploadImage: (uri: string, outfitId?: string) => Promise<ModelImage>;
  deleteImage: (id: string) => Promise<void>;

  // Internal
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useModelImageStore = create<ModelImageState>((set, get) => ({
  images: [],
  isLoading: false,
  error: null,

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  fetchImages: async () => {
    const { user, session } = useAuthStore.getState();
    if (!user || !session) return;

    set({ isLoading: true, error: null });

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/api/v1/model-images/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch model images');
      }

      const { data } = await response.json();
      set({ images: data || [] });
    } catch (error) {
      console.error('Error fetching model images:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadImage: async (uri: string, outfitId?: string) => {
    const { user, session } = useAuthStore.getState();
    if (!user || !session) throw new Error('User not authenticated');

    set({ isLoading: true, error: null });

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';

      // 1. Get presigned URL
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const filename = outfitId
        ? `${timestamp}_${outfitId}.${ext}`
        : `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`;
      const path = `${user.id}/${filename}`;

      const presignedResponse = await fetch(`${backendUrl}/api/v1/presigned-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: STORAGE_BUCKETS.MODEL_CORROSION_IMAGES,
          path,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { data: { url } } = await presignedResponse.json();

      // 2. Upload image blob
      const imgResponse = await fetch(uri);
      const blob = await imgResponse.blob();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to storage');
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Supabase URL not configured');

      const imageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.MODEL_CORROSION_IMAGES}/${path}`;

      // 3. Save to database
      const saveResponse = await fetch(`${backendUrl}/api/v1/model-images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          outfit_id: outfitId,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save model image record');
      }

      const { data: newImage } = await saveResponse.json();

      // Update local state
      set(state => ({
        images: [newImage, ...state.images],
      }));

      return newImage;
    } catch (error) {
      console.error('Error uploading model image:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteImage: async (id: string) => {
    const { session } = useAuthStore.getState();
    if (!session) throw new Error('Not authenticated');

    set({ isLoading: true, error: null });

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const response = await fetch(`${backendUrl}/api/v1/model-images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete model image');
      }

      set(state => ({
        images: state.images.filter(img => img.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting model image:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
