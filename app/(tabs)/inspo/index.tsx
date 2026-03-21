/**
 * InspoScreen - Fashion Inspiration Feed
 * 
 * Layer 1 (Bottom): Top-aligned model carousel
 * Layer 2 (Middle): Absolute floating header
 * Layer 3 (Overlay): Bottom sheet with trending ideas
 * Layer 4 (Top): Bottom navigation (handled by parent layout)
 */
import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type BottomSheet from '@gorhom/bottom-sheet';

import { ModelCarousel } from '@/components/inspo/ModelCarousel';
import { InspoBottomSheet } from '@/components/inspo/InspoBottomSheet';
import type { TrendingSection, TrendingItem, ModelCard } from '@/types/inspo';
import { MOCK_CLOTH_ITEMS } from '@/types/inspo';
import { useModelDetailStore } from '@/lib/store/modelDetail.store';

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
  accent: '#8B7355',
};

// ============================================================================
// Component
// ============================================================================

export default function InspoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { openModelDetail } = useModelDetailStore();

  const handleModelPress = useCallback((model: ModelCard) => {
    openModelDetail(model, MOCK_CLOTH_ITEMS);
    router.push('/(tabs)/inspo/model-detail');
  }, [openModelDetail, router]);

  const handleUploadPress = useCallback(() => {
    router.push({
      pathname: '/(tabs)/wardrobe/add-item',
      params: { origin: 'inspo' },
    });
  }, [router]);

  const handleTryOnPress = useCallback((item: TrendingItem) => {
    console.log('Try on pressed for:', item.id);
  }, []);

  return (
    <View style={styles.container}>
      {/* ======================================== */}
      {/* Layer 1: Top-aligned model carousel */}
      {/* ======================================== */}
      <ModelCarousel
        models={MODEL_CARDS}
        onCardPress={handleModelPress}
      />

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
    backgroundColor: COLORS.background,
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
    fontSize: 34,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  uploadButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
});
