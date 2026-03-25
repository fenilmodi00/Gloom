/**
 * FaceCarousel - Carousel for face selection in try-on flow
 *
 * Shows multiple face images with parallax effect, similar to ModelCarousel
 * but with circular face images and smaller size.
 */
import { Image } from 'expo-image';
import { useCallback, useMemo } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import { Text } from '@/components/ui/text';

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
    <View className="h-[140px] items-center justify-center">
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
      className={`items-center justify-center gap-2 ${isSelected ? '' : ''}`}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {item.isAddButton ? (
        <View className="w-20 h-20 rounded-full bg-black/5 items-center justify-center border border-black/10 border-dashed relative">
          <View className="absolute w-6 h-0.5 bg-text-secondary rounded-sm" />
          <View className="absolute w-6 h-0.5 bg-text-secondary rounded-sm rotate-90" />
        </View>
      ) : (
        <Image
          source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
          className="w-20 h-20 rounded-full border-2 border-transparent"
          contentFit="cover"
        />
      )}
      {item.name && !item.isAddButton && (
        <Text className="font-body text-xs text-text-secondary text-center" numberOfLines={1}>
          {item.name}
        </Text>
      )}
    </Pressable>
  );
}
