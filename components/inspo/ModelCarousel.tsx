/**
 * ModelCarousel - Parallax Carousel with 3 visible images
 * 
 * Shows 3 images: center one full size, side ones 60% visible and scaled to 0.85
 * Uses react-native-reanimated-carousel v4 with parallax mode
 */
import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable, ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';

import type { ModelCard as ModelCardType } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Card dimensions - center card takes 65% of screen width
const CARD_WIDTH = SCREEN_WIDTH * 0.65;
const CARD_HEIGHT = SCREEN_WIDTH * 1.5;

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
          onPress={() => handleCardPress(item, index)}
        />
      );
    },
    [handleCardPress]
  );

  // Window size determines how many items are visible at once
  // We want 3 items visible: 1 full center + 2 partial sides
  const windowSize = 3;

  return (
    <View style={styles.container}>
      <Carousel
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        data={models}
        defaultIndex={initialIndex}
        renderItem={renderItem}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: 0.5,
          parallaxAdjacentItemScale: PARALLAX_ADJACENT_SCALE,
        }}
        loop={models.length > 2}
        snapEnabled
        pagingEnabled
        onSnapToItem={(index) => {
          if (onCardChange) {
            onCardChange(index);
          }
        }}
        windowSize={windowSize}
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
  onPress: () => void;
}

function CarouselItem({ item, onPress }: CarouselItemProps) {
  // Handle both URL strings and require() assets
  const imageSource: ImageSourcePropType = typeof item.imageUrl === 'string'
    ? { uri: item.imageUrl }
    : item.imageUrl;

  return (
    <Pressable onPress={onPress} style={styles.itemContainer}>
      <View style={styles.card}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="contain"
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
      </View>
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: CARD_HEIGHT + 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
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
