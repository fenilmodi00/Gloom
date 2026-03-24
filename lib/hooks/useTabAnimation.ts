/**
 * useTabAnimation - Directional slide transitions for bottom tabs
 *
 * React Navigation's bottom-tabs don't support directional slide animations natively.
 * This hook uses react-native-reanimated to create slide-from-right/slide-from-left
 * transitions based on the tab's position in the tab bar.
 */
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

// Tab order configuration - must match BottomTabBar.tsx TAB_CONFIG order
const TAB_ORDER = ['inspo/index', 'wardrobe/index', 'outfits/index', 'profile/index'];

const SLIDE_DISTANCE = 50; 

const SPRING_CONFIG = {
  damping: 20,
  mass: 0.5,
  stiffness: 150,
};

/**
 * Get the index of a tab route name
 */
function getTabIndex(routeName: string): number {
  const index = TAB_ORDER.indexOf(routeName);
  return index >= 0 ? index : 0;
}

export function useTabAnimation(routeName: string) {
  const currentIndex = getTabIndex(routeName);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [viewKey, setViewKey] = useState(0);
  const lastIndexRef = useRef(currentIndex);

  // Initialize global last index if not present
  if (typeof (global as any).__lastTabIndex === 'undefined') {
    (global as any).__lastTabIndex = currentIndex;
  }

  useFocusEffect(
    useCallback(() => {
      const lastTabIndex = (global as any).__lastTabIndex;
      const isMovingRight = currentIndex > lastTabIndex;
      const isMovingLeft = currentIndex < lastTabIndex;

      // Update global last index
      (global as any).__lastTabIndex = currentIndex;

      // Only animate if we're switching tabs (not returning from modal)
      if (isMovingRight || isMovingLeft) {
        // Increment key to trigger re-mount
        setViewKey((k) => k + 1);

        // Pre-animation state
        translateX.value = isMovingRight ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
        opacity.value = 0;

        // Animate in
        translateX.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 300 });
      }

      lastIndexRef.current = currentIndex;

      return () => {
        // Cleanup if needed
      };
    }, [currentIndex, translateX, opacity])
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
