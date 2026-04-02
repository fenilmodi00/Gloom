import { useWardrobeProcessingStore } from '../lib/store/wardrobe-processing.store';
import { useWardrobeStore } from '../lib/store/wardrobe.store';
import { showToast } from '../components/shared/Toast';

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { processing_status: 'completed', cutout_url: 'https://example.com/cutout.png' }, error: null })),
        })),
      })),
    })),
  },
}));

// Get the mocked toast function from jest.setup.js
const mockShowToast = showToast as jest.Mock;

describe('Wardrobe Processing Store', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    useWardrobeProcessingStore.getState().clearAll();
    useWardrobeStore.getState().setItems([]);
  });

  describe('startProcessing', () => {
    it('should set item status to pending when processing starts', () => {
      const { startProcessing, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      expect(getProcessingStatus('item-1')).toBe('pending');
    });

    it('should add item to processing queue', () => {
      const { startProcessing, getProcessingQueue } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      expect(getProcessingQueue()).toContain('item-1');
    });
  });

  describe('status transitions', () => {
    it('should transition from pending to processing', () => {
      const { startProcessing, updateStatus, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      updateStatus('item-1', 'processing');
      expect(getProcessingStatus('item-1')).toBe('processing');
    });

    it('should transition from processing to completed', () => {
      const { startProcessing, onProcessingComplete, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingComplete('item-1', 'https://example.com/cutout.png');
      expect(getProcessingStatus('item-1')).toBe('completed');
    });

    it('should transition from processing to failed', () => {
      const { startProcessing, onProcessingFailed, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('rembg failed'));
      expect(getProcessingStatus('item-1')).toBe('failed');
    });
  });

  describe('polling', () => {
    it('should start polling when processing begins', () => {
      const { startProcessing, isPolling } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      expect(isPolling('item-1')).toBe(true);
    });

    it('should stop polling on completion', () => {
      const { startProcessing, onProcessingComplete, isPolling } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingComplete('item-1', 'https://example.com/cutout.png');
      expect(isPolling('item-1')).toBe(false);
    });

    it('should stop polling on failure', () => {
      const { startProcessing, onProcessingFailed, isPolling } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('timeout'));
      expect(isPolling('item-1')).toBe(false);
    });
  });

  describe('fallback behavior', () => {
    it('should set fallback status when processing timeout occurs', () => {
      const { startProcessing, onProcessingFailed, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('Processing timeout'));
      expect(getProcessingStatus('item-1')).toBe('fallback');
    });

    it('should set fallback status when processing fell back to original', () => {
      const { startProcessing, onProcessingFailed, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('Processing fell back to original'));
      expect(getProcessingStatus('item-1')).toBe('fallback');
    });

    it('should set failed status for other errors', () => {
      const { startProcessing, onProcessingFailed, getProcessingStatus } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('rembg unavailable'));
      expect(getProcessingStatus('item-1')).toBe('failed');
    });
  });

  describe('toast notifications', () => {
    it('should show info toast when processing starts', () => {
      const { startProcessing } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      // Verify toast was triggered
      expect(mockShowToast).toHaveBeenCalledWith({ type: 'info', message: 'Processing image in background...' });
    });

    it('should show success toast when processing completes', () => {
      const { startProcessing, onProcessingComplete } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingComplete('item-1', 'https://example.com/cutout.png');
      // Verify success toast was triggered
      expect(mockShowToast).toHaveBeenLastCalledWith({ type: 'success', message: 'Image processed successfully' });
    });

    it('should show warning toast when fallback occurs', () => {
      const { startProcessing, onProcessingFailed } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      onProcessingFailed('item-1', new Error('rembg unavailable'));
      // Verify warning toast was triggered
      expect(mockShowToast).toHaveBeenLastCalledWith({ type: 'warning', message: 'Using original image (processing unavailable)' });
    });
  });

  describe('clearAll', () => {
    it('should reset all processing state', () => {
      const { startProcessing, clearAll, getProcessingQueue } = useWardrobeProcessingStore.getState();
      startProcessing('item-1');
      clearAll();
      expect(getProcessingQueue()).toEqual([]);
    });
  });
});
