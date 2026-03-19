/**
 * InspoScreen - Fashion Inspiration Feed
 * 
 * Layer 1 (Bottom): Full-screen horizontally swipeable background images
 * Layer 2 (Middle): Absolute floating header
 * Layer 3 (Overlay): Bottom sheet with trending ideas
 * Layer 4 (Top): Bottom navigation (handled by parent layout)
 */
import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type BottomSheet from '@gorhom/bottom-sheet';

import { InspoBackgroundPager } from '@/components/inspo/InspoBackgroundPager';
import { InspoBottomSheet } from '@/components/inspo/InspoBottomSheet';
import type { TrendingSection, TrendingItem } from '@/types/inspo';

// ============================================================================
// Constants & Data
// ============================================================================

const PAGER_IMAGES = [
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800',
];

const TRENDING_SECTIONS: TrendingSection[] = [
  {
    id: 'leather-trench',
    title: 'Leather Trench',
    items: [
      { id: 'lt-1', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600' },
      { id: 'lt-2', imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600' },
      { id: 'lt-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600' },
      { id: 'lt-4', imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600' },
    ],
  },
  {
    id: 'lace-renaissance',
    title: 'Lace Renaissance',
    items: [
      { id: 'lr-1', imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600' },
      { id: 'lr-2', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600' },
      { id: 'lr-3', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600' },
      { id: 'lr-4', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600' },
    ],
  },
  {
    id: 'minimalist-whites',
    title: 'Minimalist Whites',
    items: [
      { id: 'mw-1', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
      { id: 'mw-2', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600' },
      { id: 'mw-3', imageUrl: 'https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600' },
      { id: 'mw-4', imageUrl: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600' },
    ],
  },
];

// Colors matching the design system
const COLORS = {
  background: '#F5F2EE',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  buttonBg: '#FFFFFF',
};

// ============================================================================
// Component
// ============================================================================

export default function InspoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleUploadPress = useCallback(() => {
    router.push('/(tabs)/wardrobe/add-item');
  }, [router]);

  const handleTryOnPress = useCallback((item: TrendingItem) => {
    console.log('Try on pressed for:', item.id);
  }, []);

  return (
    <View style={styles.container}>
      {/* ======================================== */}
      {/* Layer 1: Full-Screen Background Pager    */}
      {/* ======================================== */}
      <InspoBackgroundPager images={PAGER_IMAGES} />

      {/* ======================================== */}
      {/* Layer 2: Floating Header                 */}
      {/* ======================================== */}
      <View style={[styles.header, { top: insets.top + 16 }]} className="z-20">
        <Text style={styles.title}>Inspo</Text>
        <Pressable style={styles.uploadButton} onPress={handleUploadPress}>
          <Text style={styles.uploadText}>Upload outfit</Text>
        </Pressable>
      </View>

      {/* ======================================== */}
      {/* Layer 3: Overlay Bottom Sheet            */}
      {/* ======================================== */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none" className="z-30">
        <InspoBottomSheet 
          ref={bottomSheetRef} 
          sections={TRENDING_SECTIONS} 
          onTryOnPress={handleTryOnPress} 
        />
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background to prevent white flashes during scroll
  },
  header: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.surface, // Use white text against image background
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  uploadButton: {
    backgroundColor: COLORS.buttonBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
