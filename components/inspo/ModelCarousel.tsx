/**
 * ModelCarousel - Parallax Carousel with react-native-reanimated-carousel
 *
 * Features:
 * - Takes up exactly the top 60% of the device screen
 * - Shows 3 images: main center + peeking sides
 * - Uses mode="parallax" for smooth side animations
 * - Center image: scale 1, side images: scale 0.85
 * - Smooth animated transitions on swipe
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';

import type { ModelCard as ModelCardType } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Carousel takes exactly 60% of screen height
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.6;

// Card dimensions - main card fills most of the carousel height
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CAROUSEL_HEIGHT * 0.85;

// Parallax configuration
const PARALLAX_ADJACENT_SCALE = 0.85;

// ============================================================================
// Types
// ============================================================================

export interface ModelCarouselProps {
  models: ModelCardType[];
  initialIndex?: number;
  onCardChange?: (index: number) => void;
  onCardPress?: (model: ModelCardType, index: number) => void;
}

// ============================================================================
// Component
// ============================================================================

export function ModelCarousel({
  models,
  initialIndex = 0,
  onCardChange,
  onCardPress,
}: ModelCarouselProps) {
  const progress = useSharedValue(initialIndex);

  const handleProgressChange = useCallback(
    (offsetProgress: number, absoluteProgress: number) => {
      // Round to nearest index
      const currentIndex = Math.round(absoluteProgress);
      if (onCardChange) {
        onCardChange(currentIndex);
      }
    },
    [onCardChange]
  );

  const handleCardPress = useCallback(
    (model: ModelCardType, index: number) => {
      if (onCardPress) {
        onCardPress(model, index);
      }
    },
    [onCardPress]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ModelCardType; index: number }) => {
      return (
        <CarouselItem
          item={item}
          index={index}
          progress={progress}
          onPress={() => handleCardPress(item, index)}
        />
      );
    },
    [progress, handleCardPress]
  );

  return (
    <View style={styles.container}>
      <Carousel
        width={SCREEN_WIDTH}
        height={CAROUSEL_HEIGHT}
        data={models}
        defaultIndex={initialIndex}
        renderItem={renderItem}
        onProgressChange={handleProgressChange}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: 50,
          parallaxAdjacentItemScale: PARALLAX_ADJACENT_SCALE,
        }}
        loop={models.length > 1}
        scrollAnimationDuration={400}
        pagingEnabled
        snapEnabled
      />
    </View>
  );
}

// ============================================================================
// Carousel Item Sub-component
// ============================================================================

interface CarouselItemProps {
  item: ModelCardType;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}

function CarouselItem({ item, index, progress, onPress }: CarouselItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate scale based on position
    // When this item is at center (progress.value ≈ index), scale = 1
    // When this item is on sides, scale = PARALLAX_ADJACENT_SCALE
    const scale = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [PARALLAX_ADJACENT_SCALE, 1, PARALLAX_ADJACENT_SCALE],
      Extrapolation.CLAMP
    );

    // Opacity for depth effect
    const opacity = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.6, 1, 0.6],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Handle both URL strings and require() assets
  const imageSource: ImageSourcePropType = typeof item.imageUrl === 'string'
    ? { uri: item.imageUrl }
    : item.imageUrl;

  return (
    <Pressable onPress={onPress} style={styles.itemContainer}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {/* Optional: Model name overlay */}
        {(item.name || item.outfit) && (
          <View style={styles.overlay}>
            <View style={styles.infoContainer}>
              {item.name && (
                <Animated.Text style={styles.modelName}>
                  {item.name}
                </Animated.Text>
              )}
              {item.outfit && (
                <Animated.Text style={styles.outfitName}>
                  {item.outfit}
                </Animated.Text>
              )}
            </View>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CAROUSEL_HEIGHT,
    zIndex: 1,
  },
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
  },
  infoContainer: {
    gap: 4,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  outfitName: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default ModelCarousel;
