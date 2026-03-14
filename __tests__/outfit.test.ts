// Test for outfit store
import { useOutfitStore } from '../lib/store/outfit.store';

// Mock supabase before importing store
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('Outfit Store', () => {
  beforeEach(() => {
    useOutfitStore.setState({
      outfits: [],
      isGenerating: false,
      error: null,
    });
  });

  it('should have empty outfits initially', () => {
    const { outfits } = useOutfitStore.getState();
    expect(outfits).toEqual([]);
  });

  it('should add outfit correctly', () => {
    const mockOutfit = {
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
    
    useOutfitStore.getState().setOutfits([mockOutfit]);
    
    const { outfits } = useOutfitStore.getState();
    expect(outfits).toHaveLength(1);
    expect(outfits[0].id).toBe('outfit-1');
  });

  it('should set generating state correctly', () => {
    useOutfitStore.getState().setGenerating(true);
    
    const { isGenerating } = useOutfitStore.getState();
    expect(isGenerating).toBe(true);
  });

  it('should set error correctly', () => {
    useOutfitStore.getState().setError('Test error');
    
    const { error } = useOutfitStore.getState();
    expect(error).toBe('Test error');
  });

  it('should clear error when cleared', () => {
    useOutfitStore.getState().setError('Test error');
    useOutfitStore.getState().setError(null);
    
    const { error } = useOutfitStore.getState();
    expect(error).toBeNull();
  });
});
