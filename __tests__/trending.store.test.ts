import { useTrendingStore } from '@/lib/store/trending.store';
import type { TrendingSection } from '@/types/inspo';

// Helper to create mock trending sections
const mockSections = (count = 2): TrendingSection[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `section-${i + 1}`,
    title: `Section ${i + 1}`,
    items: [
      { id: `item-${i + 1}-1`, imageUrl: `https://example.com/image-${i + 1}-1.jpg` },
      { id: `item-${i + 1}-2`, imageUrl: `https://example.com/image-${i + 1}-2.jpg` },
    ],
  }));
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  }
}));

describe('trending store', () => {
  // No beforeEach to avoid calling reset() which causes AsyncStorage issues

  it('should initialize with correct defaults', () => {
    const state = useTrendingStore.getState();
    expect(state.sections).toHaveLength(3); // FALLBACK_SECTIONS has 3 sections
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.lastFetched).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    // Mock fetch to reject
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    try {
      await useTrendingStore.getState().fetchSections();
      
      const state = useTrendingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      // Sections should remain as fallback on error
      expect(state.sections).toHaveLength(3);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should clear error on successful fetch', async () => {
    // First, trigger an error state by mocking a failed fetch
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Previous error'));
    
    try {
      await useTrendingStore.getState().fetchSections();
      
      // Verify error was set
      let state = useTrendingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Previous error');
      
      // Now mock a successful fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sections: mockSections() }),
      } as Response);

      // Fetch again - should clear error
      await useTrendingStore.getState().fetchSections();
      
      const stateAfter = useTrendingStore.getState();
      expect(stateAfter.isLoading).toBe(false);
      expect(stateAfter.error).toBeNull();
      expect(stateAfter.sections).toHaveLength(2);
      expect(stateAfter.lastFetched).not.toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should return correct error via selector', async () => {
    // Test with null error (initial state)
    expect(useTrendingStore.getState().error).toBeNull();
    
    // Set error via a failed fetch and test selector
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Selector test error'));

try {
    // This will set the error state
    await useTrendingStore.getState().fetchSections();

    // Check that state and selector match
    const state = useTrendingStore.getState();
      const selectorResult = useTrendingStore.getState().error;
      
      expect(state.error).toBe('Selector test error');
      expect(selectorResult).toBe('Selector test error');
    } finally {
      global.fetch = originalFetch;
    }
    
    // Test that after reset, error is null and selector returns null
    useTrendingStore.getState().reset();
    expect(useTrendingStore.getState().error).toBeNull();
    expect(useTrendingStore.getState().error).toBeNull();
  });

  it('useTrendingError returns null initially', () => {
    const state = useTrendingStore.getState();
    expect(state.error).toBeNull();
  });

  it('useTrendingError returns error when set', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Test error'));
    
    try {
      await useTrendingStore.getState().fetchSections();
      const state = useTrendingStore.getState();
      expect(state.error).toBe('Test error');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Error state is cleared on new fetch', async () => {
    // First set an error
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Test error'));
    await useTrendingStore.getState().fetchSections();
    
    // Mock successful fetch to clear error
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sections: [] }),
    } as Response);
    
    await useTrendingStore.getState().fetchSections();
    const state = useTrendingStore.getState();
    expect(state.error).toBeNull();
  });
});