import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

export interface SkeletonImageProps {
  width: number;
  height: number;
  borderRadius?: number;
}

/**
 * SkeletonImage - Shimmer loading placeholder for images
 * 
 * Shimmer animation: 1000ms loop using withRepeat(withTiming)
 * Color: warm gray gradient (#EBEBEB) animated via opacity (0.3 → 0.7 → 0.3)
 */
export function SkeletonImage({
  width,
  height,
  borderRadius = 8,
}: SkeletonImageProps) {
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
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#EBEBEB',
        },
        animatedStyle,
      ]}
    />
  );
}
