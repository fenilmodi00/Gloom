import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../../types';

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
      
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user,
          isOnboarded: checkIsOnboarded(user),
        }),
      
      setSession: (session) => 
        set({ 
          session,
          isAuthenticated: !!session,
        }),
      
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
      storage: createJSONStorage(() => AsyncStorage),
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
