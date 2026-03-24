/**
 * ModelCarousel - 3-visible-item carousel for Inspo screen
 *
 * Shows 3 models simultaneously: center full size + 2 sides peeking (50% visible)
 * Uses built-in parallax mode with centered container + offset tuning
 * Takes 64% of screen height from top position 100
 */
import React, { useCallback, useMemo } from 'react';
import { View, Dimensions, Pressable, type ImageSourcePropType } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

import type { ModelCard as ModelCardType } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Height: 64% of screen from top position
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.64;

const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = CAROUSEL_HEIGHT;

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

  // Ensure at least 3 items so layout always works
  const carouselData = useMemo(() => {
    if (models.length >= 3) return models;
    if (models.length === 2) {
      return [
        models[0],
        models[1],
        { ...models[0], id: `${models[0].id}-dup-2` },
      ];
    }
    if (models.length === 1) {
      return [
        models[0],
        { ...models[0], id: `${models[0].id}-dup-2` },
        { ...models[0], id: `${models[0].id}-dup-3` },
      ];
    }
    return [];
  }, [models]);

  const renderItem = useCallback(
    ({ item, index }: { item: ModelCardType; index: number }) => (
      <CarouselItem
        item={item}
        onPress={() => handleCardPress(item, index)}
      />
    ),
    [handleCardPress]
  );

  return (
    <View
      className="absolute left-0 right-0 z-0 items-center"
      style={{ top: 100, height: CAROUSEL_HEIGHT, width: '100%' }}
    >
      <Carousel
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        data={carouselData}
        defaultIndex={initialIndex}
        renderItem={renderItem}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: CARD_WIDTH * 0.5,
          parallaxAdjacentItemScale: 0.65,
        }}
        loop={carouselData.length > 2}
        snapEnabled
        pagingEnabled
        onSnapToItem={(index) => {
          if (onCardChange) {
            onCardChange(index);
          }
        }}
        windowSize={3}
      />
    </View>
  );
}

// ============================================================================
// Carousel Item
// ============================================================================

interface CarouselItemProps {
  item: ModelCardType;
  onPress: () => void;
}

function CarouselItem({ item, onPress }: CarouselItemProps) {
  const imageSource: ImageSourcePropType = typeof item.imageUrl === 'string'
    ? { uri: item.imageUrl }
    : item.imageUrl;

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-start"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <Image
        source={imageSource}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        contentFit="cover"
      />
      {(item.name || item.outfit) && (
        <View className="absolute bottom-0 left-0 right-0 p-4 pb-6">
          <View className="gap-1">
            {item.name && (
              <Animated.Text
                className="text-lg font-semibold text-white"
                style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
              >
                {item.name}
              </Animated.Text>
            )}
            {item.outfit && (
              <Animated.Text
                className="text-sm font-normal text-white/90"
                style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
              >
                {item.outfit}
              </Animated.Text>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ============================================================================
// Re-export types
// ============================================================================
export type { ModelCardType };
