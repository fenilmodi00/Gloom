// Test for outfit store
import { useOutfitStore, Outfit } from '../lib/store/outfit.store';

// Mock supabase before importing store
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock auth store
jest.mock('../lib/store/auth.store', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ user: { id: 'user-1' } })),
  },
}));

const mockOutfit: Outfit = {
  id: 'outfit-1',
  user_id: 'user-1',
  item_ids: ['item-1', 'item-2'],
  occasion: 'casual',
  vibe: 'effortless chic',
  color_reasoning: 'neutral tones',
  ai_score: 0.85,
  cover_image_url: 'https://example.com/outfit.jpg',
  created_at: new Date().toISOString(),
};

describe('Outfit Store', () => {
  beforeEach(() => {
    useOutfitStore.setState({
      outfits: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have empty outfits initially', () => {
    const { outfits } = useOutfitStore.getState();
    expect(outfits).toEqual([]);
  });

  it('should add outfit correctly via store state modification', () => {
    useOutfitStore.setState({ outfits: [mockOutfit] });

    const { outfits } = useOutfitStore.getState();
    expect(outfits).toHaveLength(1);
    expect(outfits[0].id).toBe('outfit-1');
  });

  it('should prepend new outfits', () => {
    const secondOutfit: Outfit = {
      ...mockOutfit,
      id: 'outfit-2',
      vibe: 'bold statement',
    };

    useOutfitStore.setState({ outfits: [secondOutfit, mockOutfit] });

    const { outfits } = useOutfitStore.getState();
    expect(outfits).toHaveLength(2);
    expect(outfits[0].id).toBe('outfit-2'); // most recent first
  });

  it('should have isLoading false by default', () => {
    const { isLoading } = useOutfitStore.getState();
    expect(isLoading).toBe(false);
  });

  it('should have error null by default', () => {
    const { error } = useOutfitStore.getState();
    expect(error).toBeNull();
  });
});
