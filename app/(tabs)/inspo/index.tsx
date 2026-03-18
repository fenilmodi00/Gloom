/**
 * InspoScreen - Fashion Inspiration Feed with Layered Architecture
 *
 * Layered design (bottom to top):
 * 1. Full-screen pager with model images (absoluteFillObject)
 * 2. Floating header (absolute positioned)
 * 3. @gorhom/bottom-sheet overlaying the background
 * 4. Floating tab bar handled by parent layout
 */
import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList, ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import type { TrendingSection, TrendingItem, ModelCard } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Model data using the modal.png asset (repeated 4 times for carousel)
const MODEL_CARDS: ModelCard[] = [
  { id: 'model-1', imageUrl: require('@/assets/modal.png'), name: 'Style 1' },
  { id: 'model-2', imageUrl: require('@/assets/modal.png'), name: 'Style 2' },
  { id: 'model-3', imageUrl: require('@/assets/modal.png'), name: 'Style 3' },
  { id: 'model-4', imageUrl: require('@/assets/modal.png'), name: 'Style 4' },
];

// Trending sections data
const TRENDING_SECTIONS: TrendingSection[] = [
  {
    id: 'leather-trench',
    title: 'Leather Trench',
    items: [
      { id: 'lt-1', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600' },
      { id: 'lt-2', imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600' },
      { id: 'lt-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600' },
    ],
  },
  {
    id: 'lace-renaissance',
    title: 'Lace Renaissance',
    items: [
      { id: 'lr-1', imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600' },
      { id: 'lr-2', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600' },
      { id: 'lr-3', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600' },
    ],
  },
  {
    id: 'minimalist-whites',
    title: 'Minimalist Whites',
    items: [
      { id: 'mw-1', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
      { id: 'mw-2', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600' },
      { id: 'mw-3', imageUrl: 'https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600' },
    ],
  },
];

// Colors matching the design system
const COLORS = {
  background: '#F2F0E9',
  surface: '#F5F3ED',
  textPrimary: '#333',
  textSecondary: '#78716C',
  buttonBg: '#FFFFFF',
  buttonBorder: '#E7E5E4',
};

// ============================================================================
// Component
// ============================================================================

export default function InspoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['20%', '50%', '85%'], []);

  // Navigate to add-item screen
  const handleUploadPress = useCallback(() => {
    router.push('/(tabs)/wardrobe/add-item');
  }, [router]);

  // Handle try on press
  const handleTryOnPress = useCallback((item: TrendingItem) => {
    console.log('Try on pressed for:', item.id);
  }, []);

  // Render backdrop for bottom sheet
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={-1}
        opacity={0.1}
      />
    ),
    []
  );

  // Render a single model page for the pager
  const renderModelPage = useCallback(({ item }: { item: ModelCard }) => {
    const imageSource: ImageSourcePropType = typeof item.imageUrl === 'string'
      ? { uri: item.imageUrl }
      : item.imageUrl;

    return (
      <View style={styles.modelPage}>
        <Image
          source={imageSource}
          style={styles.modelImage}
          contentFit="cover"
          transition={300}
        />
        {/* Gradient overlay at bottom for text readability */}
        <View style={styles.modelOverlay} />
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* ======================================== */}
      {/* Layer 1: Full-screen Pager Background */}
      {/* ======================================== */}
      <View style={StyleSheet.absoluteFillObject}>
        <FlatList
          data={MODEL_CARDS}
          keyExtractor={(item) => item.id}
          renderItem={renderModelPage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </View>

      {/* ======================================== */}
      {/* Layer 2: Floating Header */}
      {/* ======================================== */}
      <View style={[styles.header, { top: insets.top + 16 }]}>
        <Text style={styles.title}>Inspo</Text>
        <Pressable style={styles.uploadButton} onPress={handleUploadPress}>
          <Text style={styles.uploadText}>Upload outfit</Text>
        </Pressable>
      </View>

      {/* ======================================== */}
      {/* Layer 3: Bottom Sheet */}
      {/* ======================================== */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at 50%
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        handleStyle={styles.handleStyle}
      >
        <BottomSheetScrollView
          style={styles.sheetContent}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Trending Header */}
          <Text style={styles.trendingHeader}>Trending ideas</Text>

          {/* Sections */}
          {TRENDING_SECTIONS.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <FlatList
                data={section.items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TrendingCard
                    item={item}
                    onTryOnPress={() => handleTryOnPress(item)}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
                ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
              />
            </View>
          ))}

          {/* Bottom padding for tab bar */}
          <View style={styles.bottomPadding} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

// ============================================================================
// TrendingCard Sub-component
// ============================================================================

interface TrendingCardProps {
  item: TrendingItem;
  onTryOnPress: () => void;
}

const CARD_WIDTH = 140;
const CARD_HEIGHT = 190;

function TrendingCard({ item, onTryOnPress }: TrendingCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.cardGradient} />
      <Pressable style={styles.tryOnButton} onPress={onTryOnPress}>
        <Text style={styles.tryOnText}>Try on</Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Layer 1: Model Pager
  modelPage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modelImage: {
    width: '100%',
    height: '100%',
  },
  modelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'transparent',
  },

  // Layer 2: Header
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
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
    elevation: 3,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  // Layer 3: Bottom Sheet
  sheetBackground: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleStyle: {
    paddingTop: 16,
  },
  handleIndicator: {
    width: 48,
    height: 6,
    backgroundColor: '#D6D3D1',
    borderRadius: 3,
  },
  sheetContent: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  trendingHeader: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'none',
  },
  horizontalListContent: {
    paddingVertical: 4,
  },
  cardSeparator: {
    width: 12,
  },

  // Trending Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  tryOnButton: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  tryOnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Bottom padding
  bottomPadding: {
    height: 120,
  },
});
