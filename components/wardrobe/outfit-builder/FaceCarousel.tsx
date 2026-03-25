import { Typography } from '@/constants/Typography';
/**
 * FaceCarousel - Carousel for face selection in try-on flow
 *
 * Shows multiple face images with parallax effect, similar to ModelCarousel
 * but with circular face images and smaller size.
 */
import { Image } from 'expo-image';
import { useCallback, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

import { THEME } from '@/constants/Colors';

// ============================================================================
// Types
// ============================================================================

export interface FaceItem {
  id: string;
  name?: string;
  imageUrl: string | number;
  isAddButton?: boolean; // Special add button face
}

interface FaceCarouselProps {
  faces: FaceItem[];
  selectedFaceId?: string;
  onSelectFace: (face: FaceItem) => void;
  onAddFace?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Face card dimensions
const CARD_WIDTH = 300;
const CARD_HEIGHT = 180;
const FACE_IMAGE_WIDTH = 130;
const FACE_IMAGE_HEIGHT = 178;
const FACE_IMAGE_RADIUS = 60;

// ============================================================================
// Component
// ============================================================================

export function FaceCarousel({
  faces,
  selectedFaceId,
  onSelectFace,
  onAddFace,
}: FaceCarouselProps) {
  // Ensure at least 3 items for parallax effect
  const carouselData = useMemo(() => {
    if (faces.length >= 3) return faces;
    if (faces.length === 2) {
      return [
        faces[0],
        faces[1],
        { ...faces[0], id: `${faces[0].id}-dup-2` },
      ];
    }
    if (faces.length === 1) {
      return [
        faces[0],
        { ...faces[0], id: `${faces[0].id}-dup-2` },
        { ...faces[0], id: `${faces[0].id}-dup-3` },
      ];
    }
    return [];
  }, [faces]);

  const renderItem = useCallback(
    ({ item, animationValue }: { item: FaceItem; animationValue: SharedValue<number> }) => (
      <AnimatedFaceCard
        item={item}
        selectedFaceId={selectedFaceId}
        animationValue={animationValue}
        onPress={() => item.isAddButton && onAddFace?.()}
      />
    ),
    [selectedFaceId, onAddFace]
  );

  const handleSnapToItem = useCallback(
    (index: number) => {
      const item = carouselData[index];
      if (item && !item.isAddButton) {
        // Strip duplicate suffix for selection
        const originalId = item.id.split('-dup')[0];
        const originalItem = faces.find((f) => f.id === originalId);
        if (originalItem && originalItem.id !== selectedFaceId) {
          onSelectFace(originalItem);
        }
      }
    },
    [carouselData, faces, onSelectFace, selectedFaceId]
  );

  if (carouselData.length === 0) {
    return null;
  }

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        width={SCREEN_WIDTH}
        height={CARD_HEIGHT}
        data={carouselData}
        defaultIndex={0}
        renderItem={renderItem}
        onSnapToItem={handleSnapToItem}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1.0,
          parallaxScrollingOffset:CARD_WIDTH * 1.0, // Tighter offset for better centering
          parallaxAdjacentItemScale: 0.7,
        }}
        loop={false}
        snapEnabled
        pagingEnabled={true}
        windowSize={3}
      />
    </View>
  );
}

// ============================================================================
// Animated Face Card
// ============================================================================

interface AnimatedFaceCardProps {
  item: FaceItem;
  selectedFaceId?: string;
  animationValue: SharedValue<number>;
  onPress: () => void;
}

function AnimatedFaceCard({ item, selectedFaceId, animationValue, onPress }: AnimatedFaceCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [0.85, 1, 0.85]
    );

    const opacity = interpolate(
      animationValue.value,
      [-1, 0, 1],
      [0.6, 1, 0.6]
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Calculate if this card is effectively "selected" for initial/static state
  const isSelected = item.id.split('-dup')[0] === selectedFaceId;

  return (
    <Animated.View style={animatedStyle}>
      <FaceCard item={item} isSelected={isSelected} onPress={onPress} animationValue={animationValue} />
    </Animated.View>
  );
}

interface FaceCardProps {
  item: FaceItem;
  isSelected: boolean;
  onPress: () => void;
}

function FaceCard({ item, isSelected, onPress, animationValue }: FaceCardProps & { animationValue?: SharedValue<number> }) {
  const borderStyle = useAnimatedStyle(() => {
    if (!animationValue || item.isAddButton) return {};
    
    const borderColor = interpolateColor(
      animationValue.value,
      [-0.1, 0, 0.1],
      ['transparent', THEME.goldAccent, 'transparent']
    );

    return { borderColor };
  });

  const content = item.isAddButton ? (
    <Pressable
      onPress={onPress}
      style={styles.addFaceButton}
    >
      <View style={styles.addFaceIcon} />
      <View style={[styles.addFaceIcon, styles.addFaceIconCenter]} />
    </Pressable>
  ) : (
    <View style={styles.faceImageContainer}>
      <Animated.View style={[styles.faceImageWrapper, borderStyle]}>
        <Image
          source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
          style={styles.faceImage}
          contentFit="cover"
        />
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.faceCard}>
      {content}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  carouselContainer: {
    height: CARD_HEIGHT,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -16,
  },
  faceCard: {
    width: SCREEN_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  faceCardSelected: {
    // Add some visual indicator for selected face
  },
  faceImageContainer: {
    width: FACE_IMAGE_WIDTH,
    height: FACE_IMAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceImageWrapper: {
    width: FACE_IMAGE_WIDTH,
    height: FACE_IMAGE_HEIGHT,
    borderRadius: FACE_IMAGE_RADIUS,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  faceImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  addFaceButton: {
    width: FACE_IMAGE_WIDTH,
    height: FACE_IMAGE_HEIGHT,
    borderRadius: FACE_IMAGE_RADIUS,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  addFaceIcon: {
    position: 'absolute',
    width: 24,
    height: 2,
    backgroundColor: THEME.textTertiary,
    borderRadius: 1,
  },
  addFaceIconCenter: {
    transform: [{ rotate: '90deg' }],
  },
  faceName: {
    ...Typography.bodySmall,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
});
