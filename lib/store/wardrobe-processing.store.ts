import { create } from 'zustand';
import { supabase } from '../supabase';
import { useWardrobeStore } from './wardrobe.store';
import { showToast } from '../../components/shared/Toast';
import type { ProcessingStatus } from '@/types/wardrobe';
import type { WardrobeItem } from '@/types';

interface ProcessingItem {
  itemId: string;
  status: ProcessingStatus;
  cutoutUrl: string | null;
  pollAttempts: number;
  pollInterval: ReturnType<typeof setInterval> | null;
}

interface WardrobeProcessingState {
  processingItems: Record<string, ProcessingItem>;

  // Actions
  startProcessing: (itemId: string) => void;
  updateStatus: (itemId: string, status: ProcessingStatus) => void;
  onProcessingComplete: (itemId: string, cutoutUrl: string) => void;
  onProcessingFailed: (itemId: string, error: Error) => void;
  getProcessingStatus: (itemId: string) => ProcessingStatus | undefined;
  getProcessingQueue: () => string[];
  isPolling: (itemId: string) => boolean;
  clearAll: () => void;
}

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 5000;

export const useWardrobeProcessingStore = create<WardrobeProcessingState>((set, get) => ({
  processingItems: {},

  startProcessing: (itemId: string) => {
    set((state) => ({
      processingItems: {
        ...state.processingItems,
        [itemId]: {
          itemId,
          status: 'pending',
          cutoutUrl: null,
          pollAttempts: 0,
          pollInterval: null,
        },
      },
    }));
    showToast({ type: 'info', message: 'Processing image in background...' });
    startPolling(itemId);
  },

  updateStatus: (itemId: string, status: ProcessingStatus) => {
    set((state) => {
      const item = state.processingItems[itemId];
      if (!item) return state;
      return {
        processingItems: {
          ...state.processingItems,
          [itemId]: {
            ...item,
            status,
          },
        },
      };
    });
  },

  onProcessingComplete: (itemId: string, cutoutUrl: string) => {
    stopPolling(itemId);

    // Update wardrobe store with cutout URL
    const wardrobeState = useWardrobeStore.getState();
    const updatedItems = wardrobeState.items.map((item) =>
      item.id === itemId
        ? { ...item, cutout_url: cutoutUrl, processing_status: 'completed' as const }
        : item
    );
    wardrobeState.setItems(updatedItems as WardrobeItem[]);

    set((state) => {
      const item = state.processingItems[itemId];
      if (!item) return state;
      return {
        processingItems: {
          ...state.processingItems,
          [itemId]: {
            ...item,
            status: 'completed',
            cutoutUrl,
          },
        },
      };
    });
    showToast({ type: 'success', message: 'Image processed successfully' });
  },

  onProcessingFailed: (itemId: string, error: Error) => {
    stopPolling(itemId);

    // Determine if this is a fallback scenario (from polling timeout)
    const isFallback = error.message === 'Processing timeout' || error.message === 'Processing fell back to original';
    const status: ProcessingStatus = isFallback ? 'fallback' : 'failed';

    // Update wardrobe store with fallback/failed status
    const wardrobeState = useWardrobeStore.getState();
    const updatedItems = wardrobeState.items.map((item) =>
      item.id === itemId
        ? { ...item, processing_status: status }
        : item
    );
    wardrobeState.setItems(updatedItems as WardrobeItem[]);

    set((state) => {
      const item = state.processingItems[itemId];
      if (!item) return state;
      return {
        processingItems: {
          ...state.processingItems,
          [itemId]: {
            ...item,
            status,
          },
        },
      };
    });
    showToast({ type: 'warning', message: 'Using original image (processing unavailable)' });
  },

  getProcessingStatus: (itemId: string) => {
    return get().processingItems[itemId]?.status;
  },

  getProcessingQueue: () => {
    return Object.keys(get().processingItems);
  },

  isPolling: (itemId: string) => {
    return get().processingItems[itemId]?.pollInterval !== null;
  },

  clearAll: () => {
    // Clear all polling intervals
    const { processingItems } = get();
    Object.values(processingItems).forEach((item) => {
      if (item.pollInterval) clearInterval(item.pollInterval);
    });
    set({ processingItems: {} });
  },
}));

// Start polling for processing status
function startPolling(itemId: string) {
  const interval = setInterval(async () => {
    const state = useWardrobeProcessingStore.getState();
    const item = state.processingItems[itemId];

    if (!item || item.pollAttempts >= MAX_POLL_ATTEMPTS) {
      stopPolling(itemId);
      if (item?.pollAttempts >= MAX_POLL_ATTEMPTS) {
        state.onProcessingFailed(itemId, new Error('Processing timeout'));
      }
      return;
    }

    // Increment poll attempts
    useWardrobeProcessingStore.setState((prevState) => ({
      processingItems: {
        ...prevState.processingItems,
        [itemId]: {
          ...prevState.processingItems[itemId],
          pollAttempts: (prevState.processingItems[itemId]?.pollAttempts || 0) + 1,
        },
      },
    }));

    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('processing_status, cutout_url')
        .eq('id', itemId)
        .single();

      if (error) {
        // Keep current status on error, continue polling
        return;
      }

      if (data.processing_status === 'completed' && data.cutout_url) {
        stopPolling(itemId);
        state.onProcessingComplete(itemId, data.cutout_url);
      } else if (data.processing_status === 'failed') {
        stopPolling(itemId);
        state.onProcessingFailed(itemId, new Error('Processing failed'));
      } else if (data.processing_status === 'fallback') {
        stopPolling(itemId);
        state.onProcessingFailed(itemId, new Error('Processing fell back to original'));
      } else {
        // Update status to current processing state
        state.updateStatus(itemId, data.processing_status as ProcessingStatus);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, POLL_INTERVAL_MS);

  // Store the interval reference
  useWardrobeProcessingStore.setState((state) => ({
    processingItems: {
      ...state.processingItems,
      [itemId]: {
        ...state.processingItems[itemId],
        pollInterval: interval,
      },
    },
  }));
}

function stopPolling(itemId: string) {
  const state = useWardrobeProcessingStore.getState();
  const item = state.processingItems[itemId];

  if (item?.pollInterval) {
    clearInterval(item.pollInterval);
  }

  useWardrobeProcessingStore.setState((prevState) => ({
    processingItems: {
      ...prevState.processingItems,
      [itemId]: {
        ...prevState.processingItems[itemId],
        pollInterval: null,
      },
    },
  }));
}
