/**
 * useTabAnimation - Directional slide transitions for bottom tabs
 *
 * React Navigation's bottom-tabs don't support directional slide animations natively.
 * This hook uses react-native-reanimated to create slide-from-right/slide-from-left
 * transitions based on the tab's position in the tab bar.
 */
import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

// O(1) Lookup Table (Dictionary/Hash Map) for Tab Order
const TAB_INDEX_MAP: Record<string, number> = {
  'inspo/index': 0,
  'wardrobe/index': 1,
  'outfits/index': 2,
  'profile/index': 3,
};

const SLIDE_DISTANCE = 50; 

const SPRING_CONFIG = {
  damping: 20,
  mass: 0.5,
  stiffness: 150,
};

// Global state to track the last active tab across all hook instances
let globalLastTabIndex = 0;

/**
 * Get the index of a tab route name in O(1) time
 */
function getTabIndex(routeName: string): number {
  return TAB_INDEX_MAP[routeName] ?? 0;
}

export function useTabAnimation(routeName: string) {
  const currentIndex = getTabIndex(routeName);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const lastIndexRef = useRef(currentIndex);

  useFocusEffect(
    useCallback(() => {
      const lastTabIndex = globalLastTabIndex;
      const isMovingRight = currentIndex > lastTabIndex;
      const isMovingLeft = currentIndex < lastTabIndex;

      // Update global last index
      globalLastTabIndex = currentIndex;

      // Only animate if we're switching tabs (not returning from modal)
      if (isMovingRight || isMovingLeft) {
        // Pre-animation state
        translateX.value = isMovingRight ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
        opacity.value = 0;

        // Animate in
        translateX.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        // Ensure values are reset if no transition (e.g. initial render)
        translateX.value = 0;
        opacity.value = 1;
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
  };
}

export default useTabAnimation;
