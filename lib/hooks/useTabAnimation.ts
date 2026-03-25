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
  Easing,
} from 'react-native-reanimated';
import { useWindowDimensions } from 'react-native';

// O(1) Lookup Table (Dictionary/Hash Map) for Tab Order
const TAB_INDEX_MAP: Record<string, number> = {
  'inspo/index': 0,
  'wardrobe/index': 1,
  'outfits/index': 2,
  'profile/index': 3,
};

const ANIMATION_DURATION = 250; // Faster for responsive feel
const EASING = Easing.out(Easing.poly(3)); // Sharp but smooth transition

// Global state to track the last active tab across all hook instances
let globalLastTabIndex = -1; // -1 means no previous tab has been focused yet

/**
 * Get the index of a tab route name in O(1) time
 */
function getTabIndex(routeName: string): number {
  return TAB_INDEX_MAP[routeName] ?? 0;
}

export function useTabAnimation(routeName: string) {
  const { width } = useWindowDimensions();
  const SLIDE_DISTANCE = width; // 100% screen width slide for Telegram style

  const currentIndex = getTabIndex(routeName);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const lastIndexRef = useRef(currentIndex);

  useFocusEffect(
    useCallback(() => {
      const lastTabIndex = globalLastTabIndex;
      const isMovingRight = currentIndex > lastTabIndex && lastTabIndex !== -1;
      const isMovingLeft = currentIndex < lastTabIndex && lastTabIndex !== -1;

      // Update global last index
      globalLastTabIndex = currentIndex;

      // Only animate if we're switching tabs (not returning from modal or initial app load)
      if (isMovingRight || isMovingLeft) {
        // Pre-animation state
        translateX.value = isMovingRight ? SLIDE_DISTANCE : -SLIDE_DISTANCE;
        opacity.value = 1;

        // Animate in
        translateX.value = withTiming(0, {
          duration: ANIMATION_DURATION,
          easing: EASING,
        });
        opacity.value = withTiming(1, {
          duration: 100, // Faster fade so the slide is the focus
        });
      } else {
        // Ensure values are reset if no transition (e.g. initial render)
        translateX.value = 0;
        opacity.value = 1;
      }

      lastIndexRef.current = currentIndex;

      return () => {
        // Cleanup if needed
      };
    }, [currentIndex, translateX, opacity, SLIDE_DISTANCE])
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
