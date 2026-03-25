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
import Carousel from 'react-native-reanimated-carousel';

import { Text } from '@/components/ui/text';
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

// Smaller cards for faces
const CARD_WIDTH = 100;
const CARD_HEIGHT = 120;
const FACE_IMAGE_SIZE = 80;

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
    ({ item, index }: { item: FaceItem; index: number }) => (
      <FaceCard
        item={item}
        isSelected={item.id === selectedFaceId}
        onPress={() => {
          if (item.isAddButton && onAddFace) {
            onAddFace();
          } else {
            onSelectFace(item);
          }
        }}
      />
    ),
    [selectedFaceId, onSelectFace, onAddFace]
  );

  if (carouselData.length === 0) {
    return null;
  }

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        data={carouselData}
        defaultIndex={0}
        renderItem={renderItem}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: CARD_WIDTH * 0.6,
          parallaxAdjacentItemScale: 0.7,
        }}
        loop={carouselData.length > 2}
        snapEnabled
        pagingEnabled
        windowSize={3}
      />
    </View>
  );
}

// ============================================================================
// Face Card
// ============================================================================

interface FaceCardProps {
  item: FaceItem;
  isSelected: boolean;
  onPress: () => void;
}

function FaceCard({ item, isSelected, onPress }: FaceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.faceCard,
        isSelected && styles.faceCardSelected,
      ]}
    >
      {item.isAddButton ? (
        <View style={styles.addFaceButton}>
          <View style={styles.addFaceIcon} />
          <View style={[styles.addFaceIcon, styles.addFaceIconCenter]} />
        </View>
      ) : (
        <Image
          source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
          style={styles.faceImage}
          contentFit="cover"
        />
      )}
      {item.name && !item.isAddButton && (
        <Text style={styles.faceName} numberOfLines={1}>
          {item.name}
        </Text>
      )}
    </Pressable>
  );
}

// ============================================================================
// Styles
// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  carouselContainer: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  faceCardSelected: {
    // Add some visual indicator for selected face
  },
  faceImage: {
    width: FACE_IMAGE_SIZE,
    height: FACE_IMAGE_SIZE,
    borderRadius: FACE_IMAGE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addFaceButton: {
    width: FACE_IMAGE_SIZE,
    height: FACE_IMAGE_SIZE,
    borderRadius: FACE_IMAGE_SIZE / 2,
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
    backgroundColor: THEME.textSecondary,
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
