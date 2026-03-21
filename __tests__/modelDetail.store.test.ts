// Test for modelDetail store — modal state management
import { useModelDetailStore } from '@/lib/store/modelDetail.store';
import type { ModelCard, OutfitItem } from '@/types/inspo';

// Helper to create a ModelCard mock
const mockModelCard = (overrides: Partial<ModelCard> = {}): ModelCard => ({
  id: 'model-1',
  imageUrl: 'https://example.com/model.jpg',
  name: 'Test Model',
  ...overrides,
});

// Helper to create an OutfitItem mock
const mockOutfitItem = (overrides: Partial<OutfitItem> = {}): OutfitItem => ({
  image: { uri: 'https://example.com/item.jpg' },
  label: 'Top',
  ...overrides,
});

describe('modelDetail store', () => {
  beforeEach(() => {
    // Clear the store before each test
    useModelDetailStore.getState().closeModelDetail();
  });

  it('should initialize with null model and empty clothItems', () => {
    const state = useModelDetailStore.getState();
    expect(state.selectedModel).toBeNull();
    expect(state.clothItems).toEqual([]);
  });

  it('should open model detail and set model and clothItems', () => {
    const model = mockModelCard();
    const clothItems: OutfitItem[] = [
      mockOutfitItem({ label: 'Top' }),
      mockOutfitItem({ label: 'Bottom' }),
    ];

    useModelDetailStore.getState().openModelDetail(model, clothItems);

    const state = useModelDetailStore.getState();
    expect(state.selectedModel).toEqual(model);
    expect(state.clothItems).toEqual(clothItems);
  });

  it('should close model detail and reset state', () => {
    const model = mockModelCard();
    const clothItems: OutfitItem[] = [mockOutfitItem()];

    // Open first
    useModelDetailStore.getState().openModelDetail(model, clothItems);
    expect(useModelDetailStore.getState().selectedModel).not.toBeNull();

    // Close
    useModelDetailStore.getState().closeModelDetail();

    const state = useModelDetailStore.getState();
    expect(state.selectedModel).toBeNull();
    expect(state.clothItems).toEqual([]);
  });

  it('should replace model when opening twice', () => {
    const model1 = mockModelCard({ id: 'model-1', name: 'Model 1' });
    const model2 = mockModelCard({ id: 'model-2', name: 'Model 2' });

    useModelDetailStore.getState().openModelDetail(model1, []);
    expect(useModelDetailStore.getState().selectedModel?.id).toBe('model-1');

    useModelDetailStore.getState().openModelDetail(model2, []);
    expect(useModelDetailStore.getState().selectedModel?.id).toBe('model-2');
    expect(useModelDetailStore.getState().selectedModel?.name).toBe('Model 2');
  });
});
