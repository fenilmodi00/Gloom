import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { TrendingSection } from '@/types/inspo';

// ─── Config ──────────────────────────────────────────────────────────────────

const TRENDING_CONFIG_BUCKET = 'trending-config';
const TRENDING_CONFIG_FILE = 'trending-ideas.json';
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

// Fallback data (current hardcoded sections)
const FALLBACK_SECTIONS: TrendingSection[] = [
  {
    id: 'leather-trench',
    title: 'Leather Trench',
    items: [
      { id: 'lt-1', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600' },
      { id: 'lt-2', imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600' },
      { id: 'lt-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600' },
      { id: 'lt-4', imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600' },
    ],
  },
  {
    id: 'lace-renaissance',
    title: 'Lace Renaissance',
    items: [
      { id: 'lr-1', imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600' },
      { id: 'lr-2', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600' },
      { id: 'lr-3', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600' },
      { id: 'lr-4', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600' },
    ],
  },
  {
    id: 'minimalist-whites',
    title: 'Minimalist Whites',
    items: [
      { id: 'mw-1', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
      { id: 'mw-2', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600' },
      { id: 'mw-3', imageUrl: 'https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600' },
      { id: 'mw-4', imageUrl: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600' },
    ],
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrendingState {
  sections: TrendingSection[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchSections: () => Promise<void>;
  reset: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTrendingStore = create<TrendingState>()(
  persist(
    (set, get) => ({
      sections: FALLBACK_SECTIONS,
      isLoading: false,
      error: null,
      lastFetched: null,

fetchSections: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get public URL and fetch directly (more reliable in React Native)
      const urlResult = supabase.storage
        .from(TRENDING_CONFIG_BUCKET)
        .getPublicUrl(TRENDING_CONFIG_FILE);

      const publicUrl = urlResult.data?.publicUrl;
      if (!publicUrl) {
        throw new Error('No public URL returned');
      }

      // Fetch the JSON directly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(publicUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

if (!data.sections || !Array.isArray(data.sections)) {
throw new Error('Invalid JSON structure: missing sections array');
}

set({
sections: data.sections,
isLoading: false,
lastFetched: Date.now(),
});
} catch (err) {
console.error('[TrendingStore] Fetch failed:', err);
set({
error: err instanceof Error ? err.message : 'Unknown error',
isLoading: false,
// Keep existing sections on error
});
}
      },

      reset: () => {
        set({
          sections: FALLBACK_SECTIONS,
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),
    {
      name: 'trending-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        sections: state.sections,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

// ─── Selectors ───────────────────────────────────────────────────────────────

export const useTrendingSections = () => useTrendingStore((s) => s.sections);
export const useTrendingLoading = () => useTrendingStore((s) => s.isLoading);
export const useTrendingError = () => useTrendingStore((s) => s.error);
