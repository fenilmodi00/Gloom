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
import { Typography } from '@/constants/Typography';
import {
  useCombinations,
  useOutfitBuilderStore,
} from '@/lib/store/outfit-builder.store';
import { Bookmark, ChevronLeft, Edit3, Sparkles, Upload } from 'lucide-react-native';

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
  
  const handleConfirmTryOn = useCallback((selectedFace: FaceItem | null) => {
    setIsFaceSheetOpen(false);
    // TODO: Implement actual try-on with selected face
    console.log('Try on with face:', selectedFace);
  }, []);
  
  const handleAddFace = useCallback(() => {
    // TODO: Implement add face flow
    console.log('Add new face');
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
      <View style={[styles.container, { backgroundColor: THEME.bgCanvas }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="dark-content" />
        <View style={[styles.emptyState, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.emptyText}>No outfit combinations available</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: THEME.bgCanvas }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      {/* Static Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} style={styles.headerButton}>
          <ChevronLeft size={24} color={THEME.textPrimary} />
        </Pressable>

        <Pressable onPress={handleBookmark} style={styles.headerButton}>
          <View style={styles.settingsIcon}>
            <View style={styles.settingsLine} />
            <View style={styles.settingsLine} />
            <View style={styles.settingsLine} />
          </View>
        </Pressable>
      </View>

      {/* Carousel - only grid + title */}
      <View style={[styles.carouselContainer, { paddingBottom: 100 }]}>
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
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationText}>
            {currentIndex + 1} of {safeCombinations.length}
          </Text>
        </View>
      )}

      {/* Static Bottom Bar - hidden with opacity when face selection sheet is open */}
      <View 
        style={[
          styles.bottomBar, 
          { paddingBottom: insets.bottom + 16 },
          isFaceSheetOpen && { opacity: 0, pointerEvents: 'none' }
        ]}
      >
        <Pressable style={[styles.actionButton, {backgroundColor: THEME.goldAccent}]} onPress={handleTryOn}>
          <Sparkles size={18} color={THEME.bgSurface} />
          <Text style={[styles.actionButtonText, {color: THEME.bgSurface}]}>Try on</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleEdit}>
          <Edit3 size={18} color={THEME.textPrimary} />
          <Text style={[styles.actionButtonText, {color: THEME.textPrimary}]}>Edit</Text>
        </Pressable>

        <Pressable style={styles.iconButton} onPress={handleBookmark}>
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

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: THEME.textSecondary,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: THEME.goldAccent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  closeButtonText: {
    ...Typography.uiLabelMedium,
    color: THEME.bgSurface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10, // Ensure header is above carousel
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  settingsLine: {
    width: 20,
    height: 2,
    backgroundColor: THEME.textPrimary,
    borderRadius: 1,
  },
  carouselContainer: {
    flex: 1,
  },
  paginationContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    zIndex: 10, // Same level as header and bottom bar
  },
  paginationText: {
    ...Typography.bodySmall,
    color: THEME.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: THEME.bgCanvas, // Add background to cover content behind
    zIndex: 10, // Ensure it's above carousel but below bottom sheet
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSurface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
  },
  actionButtonText: {
    ...Typography.uiLabelMedium,
    color: THEME.bgSurface,
  },
  lightButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  lightButtonText: {
    color: THEME.textPrimary,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
