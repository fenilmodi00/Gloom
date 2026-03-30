import "../global.css";
import "../lib/i18n";

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { BodoniModa_700Bold } from '@expo-google-fonts/bodoni-moda';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond';
import { InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/lib/store/auth.store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import 'react-native-reanimated';
import { SplashScreenAnimation } from '@/components/shared/SplashScreenAnimation';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/**
 * Hook that initializes the Supabase auth listener at the top level.
 * This MUST run unconditionally (not gated behind isLoading)
 * to break the deadlock where AuthGate never mounts.
 */
function useAuthInit() {
  const { setUser, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // If we are in DEV, trigger bypass immediately to skip login screen
    if (__DEV__) {
      console.log('[AuthInit] DEV Mode: bypassing auth with preset user');
      setSession(null); // This triggers the bypass in auth.store.ts
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session?.access_token || null);

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser(profile);
            } else {
              setUser({ id: session.user.id } as any);
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      });
      subscription = data.subscription;
    } catch (e) {
      console.error('Failed to initialize Supabase auth listener:', e);
      if (__DEV__) {
        setSession(null);
      }
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      const { isLoading } = useAuthStore.getState();
      if (isLoading) {
        console.warn('Auth init timed out — unlocking app');
        if (__DEV__ && !useAuthStore.getState().isAuthenticated) {
          setSession(null);
        }
        setLoading(false);
      }
    }, 5000);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
  }, [setSession, setUser, setLoading]);
}

// Auth gate component that handles navigation based on auth state
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navState = useRootNavigationState();
  const { user, isLoading } = useAuthStore();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (navState?.key) {
      setIsReady(true);
    }
  }, [navState?.key]);

  useEffect(() => {
    if (isLoading || !isReady) return;

    // Use a small timeout to ensure navigation state is fully settled
    const timeout = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login' as any);
      } else if (user && !user.name) {
        router.replace('/(auth)/onboarding' as any);
      } else if (user && user.name && segments[0] === '(auth)') {
        // If user is logged in and fully onboarded, but still on an auth screen, redirect to home
        router.replace('/(tabs)/inspo' as any);
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [router, user, isLoading, isReady, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  // Initialize auth listener at the top level — BEFORE any loading gates
  useAuthInit();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BodoniModa_700Bold,
    PlayfairDisplay_600SemiBold,
    CormorantGaramond_500Medium,
    InstrumentSans_500Medium,
    DMSans_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <SplashScreenAnimation />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading } = useAuthStore();

  if (isLoading) {
    // Show animated splash screen instead of simple ActivityIndicator
    return <SplashScreenAnimation />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(auth)/onboarding" options={{ presentation: 'modal' }} />
          {/* Outfit builder modal - slide up from bottom with platform-specific animation */}
          {/* iOS: slide_from_bottom opens and closes (reverse animation) */}
          {/* Android: fade_from_bottom opens and closes (reverse animation) */}
          <Stack.Screen 
            name="outfit-builder" 
            options={{ 
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }} 
          />
        </Stack>
      </AuthGate>
    </ThemeProvider>
  );
}
