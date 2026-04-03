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
  channel: any | null;
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
  stopProcessing: (itemId: string) => void;
  clearAll: () => void;
}

const MAX_POLL_ATTEMPTS = 120;
const POLL_INTERVAL_MS = 2500;

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
          channel: null,
        },
      },
    }));
    showToast({ type: 'info', message: 'Processing image in background (may take up to 2 minutes)...' });
    startRealtimeSubscription(itemId);
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
    stopRealtimeSubscription(itemId);

    // Update wardrobe store with cutout URL using functional setState
    useWardrobeStore.setState((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, cutout_url: cutoutUrl, processing_status: 'completed' as const }
          : item
      ),
    }));

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
    stopRealtimeSubscription(itemId);

    // Determine if this is a fallback scenario (from polling timeout)
    const isFallback = error.message === 'Processing timeout' || error.message === 'Processing fell back to original';
    const status: ProcessingStatus = isFallback ? 'fallback' : 'failed';

    // Update wardrobe store with fallback/failed status using functional setState
    useWardrobeStore.setState((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, processing_status: status }
          : item
      ),
    }));

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
    const item = get().processingItems[itemId];
    return !!(item?.pollInterval || item?.channel);
  },

  stopProcessing: (itemId: string) => {
    stopPolling(itemId);
    stopRealtimeSubscription(itemId);
  },

  clearAll: () => {
    // Clear all polling intervals and channels
    const { processingItems } = get();
    Object.keys(processingItems).forEach((itemId) => {
      stopProcessing(itemId);
    });
    set({ processingItems: {} });
  },
}));

// Helper functions for Realtime and Polling

function startRealtimeSubscription(itemId: string) {
  const channel = supabase
    .channel(`wardrobe-item-${itemId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'wardrobe_items',
        filter: `id=eq.${itemId}`,
      },
      (payload) => {
        const newItem = payload.new;
        const status = newItem.processing_status;

        if (status === 'completed' && newItem.cutout_url) {
          useWardrobeProcessingStore.getState().onProcessingComplete(itemId, newItem.cutout_url);
        } else if (status === 'failed') {
          useWardrobeProcessingStore.getState().onProcessingFailed(itemId, new Error('Processing failed'));
        } else if (status === 'fallback') {
          useWardrobeProcessingStore.getState().onProcessingFailed(itemId, new Error('Processing fell back to original'));
        } else {
          useWardrobeProcessingStore.getState().updateStatus(itemId, status);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`Realtime failed for ${itemId}, falling back to polling`);
        startPolling(itemId);
      }
    });

  // Store the channel reference
  useWardrobeProcessingStore.setState((prevState) => ({
    processingItems: {
      ...prevState.processingItems,
      [itemId]: {
        ...prevState.processingItems[itemId],
        channel,
      },
    },
  }));

  // Also start a safety timeout that falls back to polling if no update after 15s
  setTimeout(() => {
    const currentState = useWardrobeProcessingStore.getState();
    const item = currentState.processingItems[itemId];
    if (item && item.status === 'pending' && !item.pollInterval) {
      console.log(`Safety trigger: falling back to polling for ${itemId}`);
      startPolling(itemId);
    }
  }, 15000);
}

function startPolling(itemId: string) {
  const state = useWardrobeProcessingStore.getState();
  const existingItem = state.processingItems[itemId];
  
  // Don't start polling if already polling
  if (existingItem?.pollInterval) return;

  const interval = setInterval(async () => {
    const currentState = useWardrobeProcessingStore.getState();
    const item = currentState.processingItems[itemId];

    if (!item || item.pollAttempts >= MAX_POLL_ATTEMPTS) {
      stopPolling(itemId);
      if (item?.pollAttempts >= MAX_POLL_ATTEMPTS) {
        currentState.onProcessingFailed(itemId, new Error('Processing timeout'));
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

      if (error) return;

      if (data.processing_status === 'completed' && data.cutout_url) {
        useWardrobeProcessingStore.getState().onProcessingComplete(itemId, data.cutout_url);
      } else if (data.processing_status === 'failed') {
        useWardrobeProcessingStore.getState().onProcessingFailed(itemId, new Error('Processing failed'));
      } else if (data.processing_status === 'fallback') {
        useWardrobeProcessingStore.getState().onProcessingFailed(itemId, new Error('Processing fell back to original'));
      } else {
        useWardrobeProcessingStore.getState().updateStatus(itemId, data.processing_status as ProcessingStatus);
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

function stopRealtimeSubscription(itemId: string) {
  const state = useWardrobeProcessingStore.getState();
  const item = state.processingItems[itemId];

  if (item?.channel) {
    supabase.removeChannel(item.channel);
  }

  useWardrobeProcessingStore.setState((prevState) => ({
    processingItems: {
      ...prevState.processingItems,
      [itemId]: {
        ...prevState.processingItems[itemId],
        channel: null,
      },
    },
  }));
}
