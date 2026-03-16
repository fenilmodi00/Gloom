import { useAuthStore } from '@/lib/store/auth.store';
import type { UserProfile } from '@/types/user';

// Helper to create a full UserProfile mock
const mockProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: '123',
  name: 'Test User',
  avatar_url: null,
  body_photo_url: null,
  skin_tone: null,
  style_tags: [],
  created_at: new Date().toISOString(),
  ...overrides,
});

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
    useAuthStore.getState().setUser(mockProfile());
    const state = useAuthStore.getState();
    expect(state.user).toBeTruthy();
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
    useAuthStore.getState().setUser(mockProfile());
    useAuthStore.getState().setSession('fake-token');

    // Then sign out
    useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isOnboarded).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should update isOnboarded correctly', () => {
    // Test when not onboarded (empty name)
    useAuthStore.getState().setUser(mockProfile({ name: '' }));
    let state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(false);

    // Test when partially onboarded (name but no style_tags)
    useAuthStore.getState().setUser(mockProfile({ name: 'Test', style_tags: [] }));
    state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(false);

    // Test when fully onboarded
    useAuthStore.getState().setUser(mockProfile({ name: 'Test User', style_tags: ['casual'] }));
    state = useAuthStore.getState();
    expect(state.isOnboarded).toBe(true);
  });
});