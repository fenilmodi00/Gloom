/**
 * InspoScreen - Fashion Inspiration Feed
 * 
 * Layer 1 (Bottom): Top-aligned model carousel
 * Layer 2 (Middle): Absolute floating header
 * Layer 3 (Overlay): Bottom sheet with trending ideas
 * Layer 4 (Top): Bottom navigation (handled by parent layout)
 */
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InspoBottomSheet } from '@/components/inspo/InspoBottomSheet';
import { ModelCarousel } from '@/components/inspo/ModelCarousel';
import { ModelDetailPopup } from '@/components/inspo/ModelDetailPopup';
import { useModelImageStore } from '@/lib/store/model-image.store';
import { useTrendingSections, useTrendingLoading, useTrendingError, useTrendingStore } from '@/lib/store/trending.store';
import type { ModelCard, TrendingItem, TrendingSection } from '@/types/inspo';
import { MOCK_CLOTH_ITEMS } from '@/types/inspo';
import BottomSheet from '@gorhom/bottom-sheet';

// Ref type for @gorhom/bottom-sheet
type BottomSheetRef = React.ElementRef<typeof BottomSheet>;

// Snap point indices (must match InspoBottomSheet snapPoints order)
const SNAP_INDEX_34 = 0;   // Bottom sheet at 34%
const SNAP_INDEX_60 = 1;   // Bottom sheet at 60%

// ============================================================================
// Constants & Data
// ============================================================================

const MODAL_MODEL_IMAGE = require('../../../assets/modal.png');

const MODEL_CARDS: ModelCard[] = [
  { id: 'model-1', imageUrl: MODAL_MODEL_IMAGE, name: 'Style 1' },
  { id: 'model-2', imageUrl: MODAL_MODEL_IMAGE, name: 'Style 2' },
  { id: 'model-3', imageUrl: MODAL_MODEL_IMAGE, name: 'Style 3' },
  { id: 'model-4', imageUrl: MODAL_MODEL_IMAGE, name: 'Style 4' },
];

// ============================================================================
// Component
// ============================================================================

export default function InspoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetRef>(null);
  const { animatedStyle } = useTabAnimation('inspo/index');

  // Inline popup state — keeps inspo screen alive behind the blur backdrop
  const [activeModel, setActiveModel] = useState<ModelCard | null>(null);
  
  // State for generated images (temporary carousel display)
  const [generatedImages, setGeneratedImages] = useState<ModelCard[]>([]);

  // ── Two-stage bottom sheet state ──
  // Track current sheet index to know position on tap
  const currentSheetIndex = useRef<number>(SNAP_INDEX_60);
  
  // Trending store hooks
  const sections = useTrendingSections();
  const isLoading = useTrendingLoading();
  const error = useTrendingError();

  // Fetch trending sections on mount
  useEffect(() => {
    useTrendingStore.getState().fetchSections();
  }, []);

  // Handle model tap — TWO-stage flow:
  //   @ 60% (index 1) → shrink to 34% (carousel stays interactive)
  //   @ 34% (index 0) → open ModelDetailPopup
  //   @ 80% (index 2) → open ModelDetailPopup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleModelPress = useCallback((model: ModelCard) => {
    if (currentSheetIndex.current === SNAP_INDEX_60) {
      // At 60% — shrink to 34%, NO popup
      bottomSheetRef.current?.snapToIndex(SNAP_INDEX_34);
    } else {
      // At 34%, 80%, or any other position — open popup
      setActiveModel(model);
    }
  }, []);

  // Bottom sheet settled — update current index for next tap decision
  const handleSheetChange = useCallback((index: number) => {
    currentSheetIndex.current = index;
  }, []);

  // Popup closed — sheet STAYS at 34%, no position change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handlePopupClose = useCallback(() => {
    setActiveModel(null);
    // Do NOT restore sheet — stay at 34%
  }, []);

  const handleUploadPress = useCallback(() => {
    router.push({
      pathname: '/(tabs)/wardrobe/add-item',
      params: { origin: 'inspo', ts: String(Date.now()) },
    });
  }, [router]);

  const { uploadImage } = useModelImageStore();

  const handleTryOnPress = useCallback(async (item: TrendingItem) => {
    console.log('🎨 Generating try-on image for:', item.id);
    
    try {
      // For MVP: Use the modal.png asset as the "generated" image
      // In production, this would call an AI image generation endpoint
      const modalAsset = MODAL_MODEL_IMAGE;
      
      // Upload to backend (this saves to database and storage)
      console.log('📤 Saving generated image to database...');
      
      // Create mock generated image for carousel display
      const mockGeneratedImage: ModelCard = {
        id: `generated-${Date.now()}`,
        imageUrl: modalAsset,
        name: `Try-On ${item.id}`,
        outfit: item.id,
      };
      
      // Add to carousel immediately for visual feedback
      setGeneratedImages((prev) => [mockGeneratedImage, ...prev]);
      
      console.log('✅ Try-on image generated and added to carousel');
    } catch (error) {
      console.error('❌ Error generating try-on image:', error);
    }
  }, []);

  // Upload button spring scale animation
  const uploadScale = useSharedValue(1);
  const uploadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uploadScale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="flex-1 bg-bgCanvas">
      {/* ======================================== */}
      {/* Layer 1: Top-aligned model carousel */}
      {/* ======================================== */}
      <ModelCarousel
        models={[...generatedImages, ...MODEL_CARDS]}
        onCardPress={handleModelPress}
      />

      {/* ======================================== */}
      {/* Layer 2: Floating Header                 */}
      {/* ======================================== */}
      <View className="absolute left-6 right-6 flex-row justify-between items-center z-20" style={{ top: insets.top + 16 }}>
        <Text className="font-heading text-4xl text-textPrimary shadow-sm" style={{ textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Inspo</Text>
        <Animated.View style={uploadAnimatedStyle}>
          <Pressable
            className="bg-primary px-4 py-2 rounded-full"
            onPress={handleUploadPress}
            onPressIn={() => { uploadScale.value = withSpring(0.93, { damping: 15, stiffness: 300 }); }}
            onPressOut={() => { uploadScale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
          >
            <Text className="font-ui text-sm font-semibold text-white">Upload outfit</Text>
          </Pressable>
        </Animated.View>
      </View>

       {/* ======================================== */}
       {/* Layer 3: Overlay Bottom Sheet            */}
       {/* ======================================== */}
       <View className="absolute inset-0 z-30" pointerEvents="box-none">
         {isLoading ? (
           <View className="flex-1 justify-center items-center bg-bgCanvas">
             <Text className="text-textSecondary font-body">Loading trending ideas...</Text>
           </View>
         ) : error ? (
           <View className="flex-1 p-6 justify-center items-center bg-bgCanvas">
             <Text className="text-red-500 text-center mb-4 font-body">
               Failed to load trending ideas
             </Text>
             <Pressable onPress={() => useTrendingStore.getState().fetchSections()}>
               <Text className="text-primary font-ui font-medium">Retry</Text>
             </Pressable>
           </View>
         ) : (
           <InspoBottomSheet
             ref={bottomSheetRef}
             sections={sections}
             onTryOnPress={handleTryOnPress}
             onIndexChange={handleSheetChange}
           />
         )}
       </View>

      {/* ======================================== */}
      {/* Layer 4: Inline popup overlay             */}
      {/* ======================================== */}
      <ModelDetailPopup
        visible={activeModel !== null}
        model={activeModel}
        clothItems={MOCK_CLOTH_ITEMS}
        onClose={handlePopupClose}
      />
    </Animated.View>
  );
}