// Test for supabase module - with mocks
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
  STORAGE_BUCKETS: {
    WARDROBE_IMAGES: 'wardrobe-images',
  },
}));

import { supabase, STORAGE_BUCKETS } from '../lib/supabase';

describe('Supabase Module', () => {
  it('should export supabase client', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should export storage bucket constants', () => {
    expect(STORAGE_BUCKETS.WARDROBE_IMAGES).toBe('wardrobe-images');
  });
});
