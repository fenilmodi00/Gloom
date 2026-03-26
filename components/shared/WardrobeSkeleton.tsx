import React, { useEffect, memo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { View } from 'react-native';
import Colors from '@/constants/Colors';

const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;

/**
 * SkeletonCard - Shimmer loading placeholder for wardrobe items
 * 
 * Shimmer animation: 1000ms loop using withRepeat(withTiming)
 * Color: THEME.skeleton (#EAE4DA) animated via opacity (0.3 → 0.7 → 0.3)
 */
export const SkeletonCard = memo(function SkeletonCard() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3]
    );

    return {
      opacity,
    };
  });

  return (
    <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginRight: 12 }}>
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            borderRadius: 12,
            backgroundColor: Colors.light.bgMuted,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
});

export interface WardrobeSkeletonProps {
  count?: number;
}

/**
 * WardrobeSkeleton - Horizontal row of skeleton cards
 * 
 * @param count - Number of skeleton cards to show (default: 4)
 */
export function WardrobeSkeleton({ count = 4 }: WardrobeSkeletonProps) {
  return (
    <View className="flex-row px-4" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={`skeleton-${i}`} />
      ))}
    </View>
  );
}

// Export constants for use in wardrobe screen
export const SKELETON_CARD_WIDTH = CARD_WIDTH;
export const SKELETON_CARD_HEIGHT = CARD_HEIGHT;
