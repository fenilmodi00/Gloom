/**
 * OutfitCombinationScreen
 *
 * A dedicated screen for viewing outfit combinations with swipe navigation.
 * Architecture:
 * - Static header (back, upload, settings) - always visible
 * - Carousel of OutfitCombinationSlide (grid + title only)
 * - Static bottom buttons (try on, edit, bookmark) - always visible
 * - Pagination indicator
 */
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Pressable, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { OutfitCombinationSlide } from '@/components/wardrobe/outfit-builder/OutfitCombinationSlide';
import { FaceSelectionBottomSheet } from '@/components/wardrobe/outfit-builder/FaceSelectionBottomSheet';
import type { FaceItem } from '@/components/wardrobe/outfit-builder/FaceCarousel';
import { THEME } from '@/constants/Colors';
import {
  useCombinations,
  useOutfitBuilderStore,
} from '@/lib/store/outfit-builder.store';
import { Bookmark, ChevronLeft, Edit3, Sparkles } from 'lucide-react-native';

// Mock face data for now
const MOCK_FACES: FaceItem[] = [
  { id: '1', name: 'Face 1', imageUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Face 2', imageUrl: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Face 3', imageUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: 'add', name: 'Add', imageUrl: '', isAddButton: true },
];

// ============================================================================
// Component
// ============================================================================

export default function OutfitCombinationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Get params
  const params = useLocalSearchParams<{ index?: string }>();
  const initialIndex = parseInt(params.index || '0', 10);

  // Store state
  const combinations = useCombinations();
  const closeCombinationCarousel = useOutfitBuilderStore((s) => s.closeCombinationCarousel);

  // Current slide index
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Face selection state
  const [selectedFaceId, setSelectedFaceId] = useState<string | undefined>();
  const [isFaceSheetOpen, setIsFaceSheetOpen] = useState(false);
  const [faces] = useState<FaceItem[]>(MOCK_FACES);
  
  // Fixed carousel height (always account for bottom bar)
  const carouselHeight = screenHeight - 250;

  // Valid combinations
  const safeCombinations = combinations.length > 0 ? combinations : [];

  // Handle close
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeCombinationCarousel();
    router.back();
  }, [closeCombinationCarousel, router]);

  // Handle swipe
  const handleSnapToItem = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Placeholder actions
  const handleTryOn = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsFaceSheetOpen(true);
  }, []);
  
  // Face selection handlers
  const handleSelectFace = useCallback((face: FaceItem) => {
    setSelectedFaceId(face.id);
  }, []);
  
  const handleCloseFaceSheet = useCallback(() => {
    setIsFaceSheetOpen(false);
  }, []);
  
  const handleConfirmTryOn = useCallback((_selectedFace: FaceItem | null) => {
    setIsFaceSheetOpen(false);
    // TODO: Implement actual try-on with selected face
  }, []);
  
  const handleAddFace = useCallback(() => {
    // TODO: Implement add face flow
  }, []);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement edit flow
  }, []);

  const handleUpload = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Implement upload flow
  }, []);

  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement bookmark
  }, []);

  // Handle empty state
  if (safeCombinations.length === 0) {
    return (
      <View className="flex-1 bg-canvas">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top + 16 }}>
          <Text className="font-body text-base text-text-secondary mb-4">No outfit combinations available</Text>
          <Pressable onPress={handleClose} className="bg-gold-accent px-6 py-3 rounded-[20px]">
            <Text className="font-ui text-sm font-medium text-surface">Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Static Header */}
      <View className="flex-row items-center justify-between px-4 pb-4 z-10" style={{ paddingTop: insets.top + 8 }}>
        <Pressable onPress={handleClose} className="w-11 h-11 rounded-full bg-white/80 items-center justify-center">
          <ChevronLeft size={24} color={THEME.textPrimary} />
        </Pressable>

        <Pressable onPress={handleBookmark} className="w-11 h-11 rounded-full bg-white/80 items-center justify-center">
          <View className="w-5 h-4 justify-between">
            <View className="w-5 h-0.5 bg-text-primary rounded-sm" />
            <View className="w-5 h-0.5 bg-text-primary rounded-sm" />
            <View className="w-5 h-0.5 bg-text-primary rounded-sm" />
          </View>
        </Pressable>
      </View>

      {/* Carousel - only grid + title */}
      <View className="flex-1 pb-[100px]">
        <Carousel
          width={screenWidth}
          height={carouselHeight} // Dynamic height based on bottom bar visibility
          data={safeCombinations}
          defaultIndex={initialIndex}
          renderItem={({ item }) => <OutfitCombinationSlide combination={item} />}
          onSnapToItem={handleSnapToItem}
          loop={false}
          autoPlay={false}
        />
      </View>

      {/* Pagination Indicator - hidden when bottom sheet is open */}
      {!isFaceSheetOpen && (
        <View className="items-center py-2 z-10">
          <Text className="font-body text-xs text-text-secondary bg-white/80 px-2 py-1 rounded-lg">
            {currentIndex + 1} of {safeCombinations.length}
          </Text>
        </View>
      )}

      {/* Static Bottom Bar - hidden with opacity when face selection sheet is open */}
      <View 
        className="absolute bottom-0 left-0 right-0 flex-row items-center justify-center px-4 gap-3 bg-canvas z-10"
        style={[
          { paddingBottom: insets.bottom + 16 },
          isFaceSheetOpen && { opacity: 0, pointerEvents: 'none' }
        ]}
      >
        <Pressable className="flex-row items-center justify-center bg-gold-accent px-6 py-3.5 rounded-[20px] gap-2" onPress={handleTryOn}>
          <Sparkles size={18} color={THEME.bgSurface} />
          <Text className="font-ui text-sm font-medium text-surface">Try on</Text>
        </Pressable>

        <Pressable className="flex-row items-center justify-center bg-surface px-6 py-3.5 rounded-[20px] gap-2" onPress={handleEdit}>
          <Edit3 size={18} color={THEME.textPrimary} />
          <Text className="font-ui text-sm font-medium text-text-primary">Edit</Text>
        </Pressable>

        <Pressable className="w-12 h-12 rounded-full bg-white/90 items-center justify-center" onPress={handleBookmark}>
          <Bookmark size={20} color={THEME.textPrimary} />
        </Pressable>
      </View>
      
      {/* Blur Overlay when sheet is open */}
      {isFaceSheetOpen && (
        <BlurView
          intensity={60}
          tint="prominent"
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Face Selection Bottom Sheet */}
      <FaceSelectionBottomSheet
        isOpen={isFaceSheetOpen}
        onClose={handleCloseFaceSheet}
        onTryOn={handleConfirmTryOn}
        faces={faces}
        selectedFaceId={selectedFaceId}
        onSelectFace={handleSelectFace}
        onAddFace={handleAddFace}
      />
    </View>
  );
}
