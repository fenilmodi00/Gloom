// Test for auth store
import { useAuthStore } from '../lib/store/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().signOut();
    useAuthStore.getState().setLoading(false);
  });

  it('should have null user initially', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it('should set user correctly', () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      avatar_url: null,
      body_photo_url: null,
      skin_tone: null,
      style_tags: ['casual'],
      created_at: new Date().toISOString(),
    };
    
    useAuthStore.getState().setUser(mockUser);
    
    const { user } = useAuthStore.getState();
    expect(user?.id).toBe('123');
    expect(user?.name).toBe('Test User');
  });

  it('should set session correctly', () => {
    useAuthStore.getState().setSession('mock-session-token');
    
    const { session, isAuthenticated } = useAuthStore.getState();
    expect(session).toBe('mock-session-token');
    expect(isAuthenticated).toBe(true);
  });

  it('should sign out correctly', () => {
    // Set some state first
    useAuthStore.getState().setUser({
      id: '123',
      name: 'Test',
      avatar_url: null,
      body_photo_url: null,
      skin_tone: null,
      style_tags: [],
      created_at: '',
    });
    useAuthStore.getState().setSession('token');
    
    // Sign out
    useAuthStore.getState().signOut();
    
    const { user, session, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(session).toBeNull();
    expect(isAuthenticated).toBe(false);
  });
});
