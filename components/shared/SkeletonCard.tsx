import React, { useEffect } from 'react';
import { Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 8;
const ITEMS_PER_ROW = 4;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - ITEM_MARGIN * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

/**
 * SkeletonCard - Animated shimmer loading placeholder for items being processed.
 *
 * Features:
 * - Smooth opacity-based shimmer animation (1000ms loop)
 * - Matches ItemCard dimensions (square, responsive)
 * - Uses brand colors: bg-surface-raised base, bg-surface shimmer
 * - Displays "Processing..." text indicator
 *
 * Animation: opacity 0.3 → 0.7 → 0.3 on shimmer layer
 */
export function SkeletonCard() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3]
    );
    return { opacity };
  });

  return (
    <View
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        marginRight: ITEM_MARGIN,
        marginBottom: ITEM_MARGIN,
      }}
    >
      {/* Base layer - bg-surface-raised */}
      <View
        className="rounded-2xl bg-surface-raised"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Shimmer overlay - bg-surface with animated opacity */}
      <Animated.View
        className="absolute inset-0 rounded-2xl bg-surface"
        style={[shimmerStyle]}
      />

      {/* Processing text */}
      <View className="absolute inset-0 items-center justify-center">
        <Text className="font-ui text-sm text-textSecondary">Processing...</Text>
      </View>
    </View>
  );
}
