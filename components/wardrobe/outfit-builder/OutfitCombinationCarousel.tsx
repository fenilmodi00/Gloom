/**
 * OutfitCombinationCarousel
 *
 * Full-screen modal carousel displaying outfit combinations with swipe navigation.
 * Hinge-style horizontal paging between suggestions.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { OutfitCombinationGrid } from './OutfitCombinationGrid';
import { Text } from '@/components/ui/text';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

// ============================================================================
// Types
// ============================================================================

interface OutfitCombinationCarouselProps {
  combinations: OutfitCombination[];
  initialIndex: number;
  onClose: () => void;
}

// Constants (computed inside component)

// ============================================================================
// Helpers
// ============================================================================



// ============================================================================
// Component
// ============================================================================

export function OutfitCombinationCarousel({
  combinations,
  initialIndex,
  onClose,
}: OutfitCombinationCarouselProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const carouselRef = useRef<any>(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[OutfitCombinationCarousel] Mounted with combinations:', combinations.length, 'initialIndex:', initialIndex);
    return () => console.log('[OutfitCombinationCarousel] Unmounted');
  }, [combinations.length, initialIndex]);
  
  React.useEffect(() => {
    console.log('[OutfitCombinationCarousel] combinations changed:', combinations.length);
  }, [combinations.length]);
  
  // Track current index for UI updates
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  
  // Ensure combinations array is valid
  const safeCombinations = useMemo(() => {
    if (combinations.length === 0) return [];
    return combinations;
  }, [combinations]);
  
  // Current combination
  const currentCombination = safeCombinations[currentIndex] || safeCombinations[0];
  
  // Handle swipe to change combination
  const handleSnapToItem = useCallback((index: number) => {
    setCurrentIndex(index);
    // Light haptic on swipe
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  // Handle close with haptic
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);
  
  // Placeholder actions
  const handleTryOn = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement try-on flow
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
  
  // Render each carousel item
  const renderItem = useCallback(({ item, index }: { item: OutfitCombination; index: number }) => {
    console.log('[OutfitCombinationCarousel] renderItem called for index:', index, 'item:', item.id);
    
    return (
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(100)}
        style={styles.slide}
      >
        <OutfitCombinationGrid
          combination={item}
          onClose={handleClose}
          onTryOn={handleTryOn}
          onEdit={handleEdit}
          onBookmark={handleBookmark}
          onUpload={handleUpload}
        />
        
        {/* Pagination indicator */}
        <View style={[styles.paginationContainer, { bottom: insets.bottom + 80 }]}>
          <Text style={styles.paginationText}>
            {currentIndex + 1} of {safeCombinations.length}
          </Text>
        </View>
      </Animated.View>
    );
  }, [handleClose, handleUpload, handleTryOn, handleEdit, handleBookmark, currentIndex, safeCombinations, insets]);
  
  if (safeCombinations.length === 0) {
    return (
      <Animated.View 
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
      >
        <StatusBar barStyle="dark-content" />
        <View style={[styles.container, { backgroundColor: THEME.bgCanvas, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: THEME.textSecondary, marginBottom: 16 }}>No outfit combinations available</Text>
          <Pressable onPress={handleClose} style={{ backgroundColor: THEME.goldAccent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
            <Text style={{ color: THEME.bgSurface, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }
  
  // Debug: ensure we have valid dimensions
  const validScreenWidth = screenWidth > 0 ? screenWidth : 400;
  const validScreenHeight = screenHeight > 0 ? screenHeight : 800;
  
  console.log('[OutfitCombinationCarousel] Rendering with dimensions:', validScreenWidth, 'x', validScreenHeight);
  
  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.container, { backgroundColor: THEME.bgCanvas, height: validScreenHeight }]}>
        <Carousel
          ref={carouselRef}
          width={validScreenWidth}
          height={validScreenHeight}
          data={safeCombinations}
          defaultIndex={initialIndex}
          renderItem={renderItem}
          onSnapToItem={handleSnapToItem}
          style={[styles.carousel, { overflow: 'visible' }]}
          loop={false}
          autoPlay={false}
          enabled={true}
        />
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});