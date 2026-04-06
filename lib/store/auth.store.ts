import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../storage';
import { isSupabaseConfigured } from '../supabase';
import type { UserProfile } from '../../types';

// Helper to decode base64url to string (for JWT payload)
function base64UrlDecode(str: string): string {
  try {
    // Convert from base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' to make length multiple of 4
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(pad === 1 ? 3 : 4 - pad);
    }
    // Decode using Buffer (available via globalThis in Expo/React Native)
    const buffer = (globalThis as any).Buffer;
    if (buffer) {
      return buffer.from(base64, 'base64').toString('utf8');
    }
    // Fallback: use atob if available (web)
    if (typeof atob !== 'undefined') {
      return decodeURIComponent(
        Array.from(atob(base64))
          .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );
    }
    throw new Error('No base64 decoder available');
  } catch (e) {
    console.error('base64UrlDecode error:', e);
    throw e;
  }
}

interface AuthState {
  user: UserProfile | null;
  session: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setSession: (session: string | null) => void;
  signOut: () => void;
  setLoading: (isLoading: boolean) => void;
  clearAll: () => void;
}

// Helper to check if user is onboarded
const checkIsOnboarded = (user: UserProfile | null): boolean => {
  if (!user) return false;
  return !!(user.name && user.name.trim().length >= 2 && user.style_tags && user.style_tags.length > 0);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      isOnboarded: false,
      
      setUser: (user) => {
        // Don't allow clearing user if we are in dev bypass mode
        if (!user && __DEV__) {
          return;
        }

        set({ 
          user, 
          isAuthenticated: !!user,
          isOnboarded: checkIsOnboarded(user),
        });
      },
      
      setSession: (session) => {
        set({ 
          session, 
          isAuthenticated: !!session || (__DEV__ && !session),
        });

        // If we have a dev token (session is non-null in dev mode), decode it and set user
        if (__DEV__ && session) {
          try {
            const parts = session.split('.');
            if (parts.length === 3) {
              const decodedPayload = base64UrlDecode(parts[1]);
              const claims = JSON.parse(decodedPayload);
              const userId = claims.sub || '00000000-0000-0000-0000-000000000000';
              
              // Only set user if not already set (preserve existing if any)
              const currentState = get();
              if (!currentState.user) {
                set({
                  user: {
                    id: userId,
                    name: 'Gloom Dev',
                    email: 'dev@gloom.ai',
                    style_tags: ['minimalist', 'classic'],
                  } as any,
                  isOnboarded: true,
                });
              }
            }
          } catch (e) {
            console.error('Failed to decode dev token, falling back to default dev user:', e);
            const currentState = get();
            if (!currentState.user) {
              set({
                user: {
                  id: '00000000-0000-0000-0000-000000000000',
                  name: 'Gloom Dev',
                  email: 'dev@gloom.ai',
                  style_tags: ['minimalist', 'classic'],
                } as any,
                isAuthenticated: true,
                isOnboarded: true,
              });
            }
          }
        } else if (__DEV__ && !session) {
          // Legacy bypass: no token at all
          const currentState = get();
          if (!currentState.user) {
            set({
              user: {
                id: '00000000-0000-0000-0000-000000000000',
                name: 'Gloom Dev',
                email: 'dev@gloom.ai',
                style_tags: ['minimalist', 'classic'],
              } as any,
              isAuthenticated: true,
              isOnboarded: true,
            });
          }
        }
      },
      
      signOut: () => 
        set({ 
          user: null, 
          session: null, 
          isAuthenticated: false,
          isOnboarded: false,
        }),
        
      setLoading: (isLoading) => 
        set({ isLoading }),

      // Clear all auth state (used when signing out)
      clearAll: () => 
        set({ 
          user: null, 
          session: null, 
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);

// Selector hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsOnboarded = () => useAuthStore((state) => state.isOnboarded);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
