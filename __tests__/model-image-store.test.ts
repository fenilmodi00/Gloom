import { useModelImageStore } from '@/lib/store/model-image.store';
import { useAuthStore } from '@/lib/store/auth.store';

// Mock the auth store
jest.mock('@/lib/store/auth.store', () => ({
  useAuthStore: jest.fn(() => ({
    getState: jest.fn(() => ({
      user: { id: 'test-user-id' },
      session: 'test-session',
    })),
  })),
}));

describe('useModelImageStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useModelImageStore.setState({ images: [], isLoading: false, error: null });
  });

  it('should have initial empty state', () => {
    const { images, isLoading, error } = useModelImageStore.getState();
    expect(images).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('should add image to state via uploadImage', async () => {
    // Mock the fetch calls for presigned URL, upload, and save
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: { url: 'http://presigned.url' } }) }) // presigned URL
      .mockResolvedValueOnce({ ok: true, blob: () => new Blob([]) }) // image fetch
      .mockResolvedValueOnce({ ok: true }) // upload to storage
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: { id: '1', user_id: 'test-user-id', image_url: 'http://example.com/image.jpg', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } }) }); // save to DB

    const uri = 'file:///path/to/image.jpg';
    const outfitId = 'outfit-1';

    await useModelImageStore.getState().uploadImage(uri, outfitId);

    const { images } = useModelImageStore.getState();
    expect(images).toHaveLength(1);
    expect(images[0].id).toBe('1');
    expect(images[0].outfit_id).toBe('outfit-1');
  });

  it('should remove image via deleteImage', async () => {
    // First add an image using uploadImage (mocked)
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: { url: 'http://presigned.url' } }) }) // presigned URL
      .mockResolvedValueOnce({ ok: true, blob: () => new Blob([]) }) // image fetch
      .mockResolvedValueOnce({ ok: true }) // upload to storage
      .mockResolvedValueOnce({ ok: true, json: () => ({ data: { id: 'test-1', user_id: 'test-user-id', image_url: 'http://example.com/test.jpg', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } }) }); // save to DB

    await useModelImageStore.getState().uploadImage('file:///path/to/image.jpg');

    // Mock the fetch call for delete
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true });

    await useModelImageStore.getState().deleteImage('test-1');

    const { images } = useModelImageStore.getState();
    expect(images).toHaveLength(0);
  });

  it('should fetch images', async () => {
    // Mock the fetch call for fetching images
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => ({
        data: [
          { id: '1', user_id: 'test-user-id', image_url: 'http://example.com/image1.jpg', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: '2', user_id: 'test-user-id', image_url: 'http://example.com/image2.jpg', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      }),
    });

    await useModelImageStore.getState().fetchImages();

    const { images } = useModelImageStore.getState();
    expect(images).toHaveLength(2);
    expect(images[0].id).toBe('1');
    expect(images[1].id).toBe('2');
  });
});