import "../global.css";

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/lib/store/auth.store';
import { supabase } from '@/lib/supabase';
import 'react-native-reanimated';

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
            // User exists in auth but no profile row yet (fresh signup)
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

    // Safety timeout: if onAuthStateChange never fires (e.g. bad Supabase URL),
    // unlock the app after 5 seconds so it doesn't hang on white screen forever.
    const timeout = setTimeout(() => {
      const { isLoading } = useAuthStore.getState();
      if (isLoading) {
        console.warn('Auth init timed out — unlocking app');
        setLoading(false);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [setSession, setUser, setLoading]);
}

// Auth gate component that handles navigation based on auth state
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navState = useRootNavigationState();
  const { user, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (navState?.key) {
      setIsReady(true);
    }
  }, [navState?.key]);

  useEffect(() => {
    if (isLoading || !isReady) return;

    if (!user) {
      router.replace('/(auth)/login' as any);
    } else if (user && !user.name) {
      router.replace('/(auth)/onboarding' as any);
    }
  }, [router, user, isLoading, isReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  // Initialize auth listener at the top level — BEFORE any loading gates
  useAuthInit();

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    return null;
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
    // Show a loading indicator instead of null — prevents white screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F2EE' }}>
        <ActivityIndicator size="large" color="#8B7355" />
      </View>
    );
  }

  // TEMP: Skip auth for development - go straight to main tabs
  // Remove AuthGate wrapper to bypass login/onboarding
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(auth)/onboarding" options={{ presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
