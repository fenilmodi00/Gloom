import { useAuthStore } from '@/lib/store/auth.store';

describe('auth store', () => {
  beforeEach(() => {
    // Clear the store before each test
    useAuthStore.getState().clearAll();
  });

  it('should initialize with correct defaults', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false); // clearAll sets isLoading to false
    expect(state.isOnboarded).toBe(false);
  });

  it('should set user and update authentication status', () => {
    const mockUser = { id: '123', name: 'Test User', style_tags: [] };
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should set session and update authentication status', () => {
    const mockSession = 'fake-session-token';
    useAuthStore.getState().setSession(mockSession);
    const state = useAuthStore.getState();
    expect(state.session).toBe(mockSession);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear all state on signOut', () => {
    // First set some state
    useAuthStore.getState().setUser({ id: '123', name: 'Test' });
    useAuthStore.getState().setSession('fake-token');
    
    // Then sign out
    useAuthStore.getState().signOut();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isOnboarded).toBe(false);
    // Note: isLoading is set to false by clearAll
    expect(state.isLoading).toBe(false);
  });

  it('should update isOnboarded correctly', () => {
    // Test when not onboarded
    useAuthStore.getState().setUser({ id: '123', name: '', style_tags: [] });
    let state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(false);
    
    // Test when partially onboarded
    useAuthStore.getState().setUser({ id: '123', name: 'Test', style_tags: [] });
    state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(false);
    
    // Test when fully onboarded
    useAuthStore.getState().setUser({ id: '123', name: 'Test User', style_tags: ['casual'] });
    state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(true);
  });
});