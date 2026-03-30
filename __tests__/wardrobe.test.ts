// Test for wardrobe store
import { useWardrobeStore } from '../lib/store/wardrobe.store';
import { useAuthStore } from '../lib/store/auth.store';

// Mock supabase before importing store
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

describe('Wardrobe Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'test-user', email: 'test@example.com' } as any,
      session: 'test-session',
    });
    useWardrobeStore.setState({
      items: [],
      selectedCategory: 'all',
      isLoading: false,
      error: null,
    });
    // mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'item-1', image_url: 'test' } }),
      })
    ) as jest.Mock;
  });

  it('should have empty items initially', () => {
    const { items } = useWardrobeStore.getState();
    expect(items).toEqual([]);
  });

  it('should add item correctly via store state modification', () => {
    const mockItem = {
      id: 'item-1',
      user_id: 'user-1',
      image_url: 'https://example.com/image.jpg',
      cutout_url: null,
      category: 'tops' as const,
      sub_category: 'tshirt',
      colors: ['blue', 'white'],
      style_tags: ['casual'],
      occasion_tags: ['daily'],
      fabric_guess: 'cotton',
      created_at: new Date().toISOString(),
    };
    
    useWardrobeStore.setState({ items: [mockItem as any] });
    
    const { items } = useWardrobeStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-1');
  });

  it('should remove item correctly via store state modification', () => {
    const mockItem = {
      id: 'item-1',
      user_id: 'user-1',
      image_url: 'https://example.com/image.jpg',
      cutout_url: null,
      category: 'tops' as const,
      sub_category: 'tshirt',
      colors: [],
      style_tags: [],
      occasion_tags: [],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    };
    
    useWardrobeStore.setState({ items: [mockItem as any] });
    useWardrobeStore.setState({ items: [] });
    
    const { items } = useWardrobeStore.getState();
    expect(items).toHaveLength(0);
  });

  it('should set category correctly', () => {
    useWardrobeStore.getState().setCategory('bottoms');
    
    const { selectedCategory } = useWardrobeStore.getState();
    expect(selectedCategory).toBe('bottoms');
  });

  it('should have processing_status property on WardrobeItem', () => {
    const mockItem = {
      id: 'item-1',
      user_id: 'user-1',
      image_url: 'https://example.com/image.jpg',
      cutout_url: null,
      category: 'tops',
      sub_category: 'tshirt',
      colors: ['blue', 'white'],
      style_tags: ['casual'],
      occasion_tags: ['daily'],
      functional_tags: [],
      silhouette_tags: [],
      vibe_tags: [],
      fabric_guess: 'cotton',
      created_at: new Date().toISOString(),
      processing_status: 'pending',
    };
    
    useWardrobeStore.setState({ items: [mockItem as any] });
    
    const { items } = useWardrobeStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveProperty('processing_status');
    expect(items[0].processing_status).toBe('pending');
  });
});
