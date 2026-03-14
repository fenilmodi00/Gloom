import { create } from 'zustand';
import type { WardrobeItem, Category } from '../../types';
import { supabase } from '../supabase';

interface WardrobeState {
  items: WardrobeItem[];
  selectedCategory: Category | 'all';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setItems: (items: WardrobeItem[]) => void;
  addItem: (item: WardrobeItem) => void;
  removeItem: (id: string) => void;
  setCategory: (category: Category | 'all') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchItems: (userId: string) => Promise<void>;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  selectedCategory: 'all',
  isLoading: false,
  error: null,
  
  setItems: (items) => set({ items }),
  
  addItem: (item) => 
    set((state) => ({ 
      items: [...state.items, item] 
    })),
  
  removeItem: (id) => 
    set((state) => ({ 
      items: state.items.filter((item) => item.id !== id) 
    })),
  
  setCategory: (selectedCategory) => set({ selectedCategory }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  fetchItems: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ items: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        isLoading: false 
      });
    }
  },
}));

// Selector hooks
export const useWardrobeItems = () => useWardrobeStore((state) => state.items);
export const useSelectedCategory = () => useWardrobeStore((state) => state.selectedCategory);
export const useWardrobeLoading = () => useWardrobeStore((state) => state.isLoading);
export const useWardrobeError = () => useWardrobeStore((state) => state.error);

export const useFilteredItems = () => {
  const items = useWardrobeStore((state) => state.items);
  const selectedCategory = useWardrobeStore((state) => state.selectedCategory);
  
  if (selectedCategory === 'all') return items;
  return items.filter((item) => item.category === selectedCategory);
};
