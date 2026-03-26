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
    useWardrobeStore.setState({
      items: [],
      selectedCategory: 'all',
      isLoading: false,
      error: null,
    });
  });

  it('should have empty items initially', () => {
    const { items } = useWardrobeStore.getState();
    expect(items).toEqual([]);
  });

  it('should add item correctly', () => {
    useAuthStore.setState({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '',
        role: 'authenticated',
        updated_at: ''
      },
      session: 'fake-token'
    });

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
    
    // Mock the global fetch
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ data: mockItem })
    });

    return useWardrobeStore.getState().addItem(mockItem).then(() => {
      const { items } = useWardrobeStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-1');
    });
  });

  it('should remove item correctly', () => {
    useAuthStore.setState({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '',
        role: 'authenticated',
        updated_at: ''
      },
      session: 'fake-token'
    });

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
    
    // Mock the global fetch for addItem
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ data: mockItem })
    });

    return useWardrobeStore.getState().addItem(mockItem).then(() => {
      // Mock the global fetch for removeItem
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: mockItem })
      });

      return useWardrobeStore.getState().removeItem('item-1').then(() => {
        const { items } = useWardrobeStore.getState();
        expect(items).toHaveLength(0);
      });
    });
  });

  it('should set category correctly', () => {
    useWardrobeStore.getState().setCategory('bottoms');
    
    const { selectedCategory } = useWardrobeStore.getState();
    expect(selectedCategory).toBe('bottoms');
  });
});
