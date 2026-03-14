import { create } from 'zustand';
import type { WardrobeItem, WardrobeItemInput, Category } from '../../types';
import { supabase } from '../supabase';
import { useAuthStore } from './auth.store';

interface WardrobeState {
  items: WardrobeItem[];
  selectedCategory: Category | 'all';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setItems: (items: WardrobeItem[]) => void;
  addItem: (item: WardrobeItemInput) => Promise<WardrobeItem>;
  deleteItem: (id: string) => void;
  removeItem: (id: string) => void;
  setCategory: (category: Category | 'all') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchItems: () => Promise<void>;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  selectedCategory: 'all',
  isLoading: false,
  error: null,
  
  setItems: (items) => set({ items }),
  
  addItem: async (itemInput: WardrobeItemInput) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert({
        user_id: user.id,
        image_url: itemInput.image_url,
        category: itemInput.category,
        sub_category: itemInput.sub_category,
        colors: itemInput.colors || [],
        style_tags: itemInput.style_tags || [],
        occasion_tags: itemInput.occasion_tags || [],
        fabric_guess: itemInput.fabric_guess,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    set((state) => ({ items: [data, ...state.items] }));
    return data as WardrobeItem;
  },
  
  deleteItem: (id) => 
    set((state) => ({ 
      items: state.items.filter((item) => item.id !== id) 
    })),
  
  removeItem: (id) => 
    set((state) => ({ 
      items: state.items.filter((item) => item.id !== id) 
    })),
  
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
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
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
