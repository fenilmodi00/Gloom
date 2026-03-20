import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface PaginationIndicatorProps {
  currentIndex: number;
  totalSlides: number;
  scrollX: SharedValue<number>;
}

const DOT_SIZE = 5;
const ACTIVE_WIDTH = 30;
const INACTIVE_WIDTH = 6;
const ACCENT_COLOR = '#8B7355';
const INACTIVE_COLOR = '#BEBEBE';
const GAP = 12; // equivalent to gap-3

export function PaginationIndicator({
  currentIndex,
  totalSlides,
  scrollX,
}: PaginationIndicatorProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const dots = Array.from({ length: totalSlides });

  const lineStyle = useAnimatedStyle(() => {
    'worklet';
    // Position = how many screens we have scrolled
    const position = scrollX.value / SCREEN_WIDTH;
    const distanceBetweenDots = DOT_SIZE + GAP;
    const translateX = position * distanceBetweenDots;

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View className="flex-row items-center justify-center h-5">
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.line, lineStyle]} />
        {dots.map((_, i) => {
          const dotKey = `dot-${i}`;
          return (
            <Dot
              key={dotKey}
              index={i}
              scrollX={scrollX}
              screenWidth={SCREEN_WIDTH}
            />
          );
        })}
      </View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  screenWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
}) {
  const dotStyle = useAnimatedStyle(() => {
    'worklet';
    const position = scrollX.value / screenWidth;

    const scale = interpolate(
      position,
      [index - 0.5, index, index + 0.5],
      [1, 1.2, 1],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      position,
      [index - 0.5, index, index + 0.5],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: GAP,
  },
  line: {
    position: 'absolute',
    left: DOT_SIZE / 2 - ACTIVE_WIDTH / 2,
    width: ACTIVE_WIDTH,
    height: 2,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 1,
    zIndex: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: INACTIVE_COLOR,
  },
});
