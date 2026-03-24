/**
 * useTabAnimation - Directional slide transitions for bottom tabs
 *
 * React Navigation's bottom-tabs don't support directional slide animations natively.
 * This hook uses react-native-reanimated to create slide-from-right/slide-from-left
 * transitions based on the tab's position in the tab bar.
 *
 * Usage:
 *   const { animatedStyle, key } = useTabAnimation(0); // 0 = first tab
 *   return <Animated.View key={key} style={[styles.container, animatedStyle]}>...</Animated.View>
 */
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// Tab order configuration - must match BottomTabBar.tsx TAB_CONFIG order
const TAB_ORDER = ['inspo/index', 'wardrobe/index', 'outfits/index', 'profile/index'];

// Animation configuration
const ANIMATION_DURATION = 280;
const SLIDE_DISTANCE = 100; // Pixels to slide

/**
 * Get the index of a tab route name
 */
function getTabIndex(routeName: string): number {
  const index = TAB_ORDER.indexOf(routeName);
  return index >= 0 ? index : 0;
}

/**
 * Hook for directional slide animations when switching between tabs.
 *
 * @param routeName - The route name of the current tab (e.g., 'inspo/index')
 * @returns An object with animatedStyle to apply to Animated.View and a key prop for re-mounting
 *
 * @example
 * ```tsx
 * export default function InspoScreen() {
 *   const { animatedStyle, viewKey } = useTabAnimation('inspo/index');
 *
 *   return (
 *     <Animated.View key={viewKey} style={[styles.container, animatedStyle]}>
 *       {/* screen content *\/}
 *     </Animated.View>
 *   );
 * }
 * ```
 */
export function useTabAnimation(routeName: string) {
  const currentIndex = getTabIndex(routeName);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [viewKey, setViewKey] = useState(0);
  const lastIndexRef = useRef(currentIndex);

  // Track the last tab index globally (shared across all tab screens)
  // We use a module-level variable to persist across hook instances
  if (typeof (global as any).__lastTabIndex === 'undefined') {
    (global as any).__lastTabIndex = currentIndex;
  }

  const animateIn = useCallback((fromRight: boolean) => {
    'worklet';
    // Start position: off-screen from left or right
    translateX.value = fromRight ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
    opacity.value = 0.8;

    // Animate to center
    translateX.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateX, opacity]);

  useFocusEffect(
    useCallback(() => {
      const lastTabIndex = (global as any).__lastTabIndex;
      const isMovingRight = currentIndex > lastTabIndex;
      const isMovingLeft = currentIndex < lastTabIndex;

      // Update global last index
      (global as any).__lastTabIndex = currentIndex;

      // Only animate if we're switching tabs (not initial focus)
      if (isMovingRight || isMovingLeft) {
        // Increment key to trigger re-mount and animation
        setViewKey((k) => k + 1);

        // Run animation on UI thread
        animateIn(isMovingRight);
      }

      // Cleanup - store current index for next focus
      lastIndexRef.current = currentIndex;

      return () => {
        // On blur, don't reset - let the animation complete
      };
    }, [currentIndex, animateIn])
  );

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  return {
    animatedStyle,
    viewKey,
  };
}

export default useTabAnimation;
