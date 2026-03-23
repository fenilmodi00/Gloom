import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import type { TrendingItem, TrendingSection } from '@/types/inspo';

// ============================================================================
// Types
// ============================================================================

export interface TrendingGridProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_SECTIONS: TrendingSection[] = [
  {
    id: 'today-trend',
    title: "Today's Trend",
    items: [
      { id: 'tt-1', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', outfitName: 'Urban Edge' },
      { id: 'tt-2', imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600', outfitName: 'City Layers' },
      { id: 'tt-3', imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600', outfitName: 'Street Chic' },
      { id: 'tt-4', imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600', outfitName: 'Casual Cool' },
      { id: 'tt-5', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', outfitName: 'Retro Vibes' },
    ],
  },
  {
    id: 'minimalist',
    title: 'Minimalist',
    items: [
      { id: 'min-1', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600', outfitName: 'Clean Lines' },
      { id: 'min-2', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600', outfitName: 'Pure White' },
      { id: 'min-3', imageUrl: 'https://images.unsplash.com/photo-1485968579169-a6d4e6e6e9d3?w=600', outfitName: 'Simple Luxe' },
      { id: 'min-4', imageUrl: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=600', outfitName: 'Monochrome' },
      { id: 'min-5', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', outfitName: 'Less is More' },
    ],
  },
  {
    id: 'street-style',
    title: 'Street Style',
    items: [
      { id: 'ss-1', imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600', outfitName: 'Urban Edge' },
      { id: 'ss-2', imageUrl: 'https://images.unsplash.com/photo-1507679798250-c81457d57f47?w=600', outfitName: 'City Runner' },
      { id: 'ss-3', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', outfitName: 'Street Pro' },
      { id: 'ss-4', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600', outfitName: 'Night Out' },
      { id: 'ss-5', imageUrl: 'https://images.unsplash.com/photo-1495385794356-15371f348c71?w=600', outfitName: 'Graffiti Chic' },
    ],
  },
  {
    id: 'bohemian',
    title: 'Bohemian',
    items: [
      { id: 'bo-1', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', outfitName: 'Free Spirit' },
      { id: 'bo-2', imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', outfitName: 'Festival Ready' },
      { id: 'bo-3', imageUrl: 'https://images.unsplash.com/photo-1473286715294-ff073486671c?w=600', outfitName: 'Boho Dreams' },
      { id: 'bo-4', imageUrl: 'https://images.unsplash.com/photo-1469504512102-900f29606341?w=600', outfitName: 'Wanderlust' },
      { id: 'bo-5', imageUrl: 'https://images.unsplash.com/photo-1497312647135-16d78a307da5?w=600', outfitName: 'Earth Tones' },
    ],
  },
];

// ============================================================================
// Constants
// ============================================================================

const CARD_WIDTH = 140;
const CARD_HEIGHT = 200;

// ============================================================================
// Component
// ============================================================================

export function TrendingGrid({ sections, onTryOnPress }: TrendingGridProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Use provided sections or fallback to mock data
  const displaySections = useMemo(() => {
    return sections && sections.length > 0 ? sections : MOCK_SECTIONS;
  }, [sections]);

  // Get unique categories from sections + "All"
  const categories = useMemo(() => {
    const cats = ['All', ...displaySections.map((s) => s.title)];
    return cats;
  }, [displaySections]);

  // Filter sections by active category
  const filteredSections = useMemo(() => {
    if (activeCategory === 'All') return displaySections;
    return displaySections.filter((s) => s.title === activeCategory);
  }, [displaySections, activeCategory]);

  // Render a single card
  const renderCard = ({ item }: { item: TrendingItem }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />
      {/* Gradient overlay */}
      <View style={styles.gradientOverlay} />
      {/* Bottom content */}
      <View style={styles.cardBottom}>
        {item.outfitName && (
          <Text style={styles.outfitName} numberOfLines={1}>
            {item.outfitName}
          </Text>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.tryOnButton,
            pressed && styles.tryOnButtonPressed,
          ]}
          onPress={() => onTryOnPress?.(item)}
        >
          <Text style={styles.tryOnText}>Try on</Text>
        </Pressable>
      </View>
    </View>
  );

  // Render category chip
  const renderCategoryChip = (category: string) => {
    const isSelected = activeCategory === category;
    return (
      <Pressable
        key={category}
        onPress={() => setActiveCategory(category)}
        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
      >
        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
          {category}
        </Text>
      </Pressable>
    );
  };

  // Render a section row
  const renderSection = ({ item: section }: { item: TrendingSection }) => (
    <View style={styles.sectionContainer}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {/* Horizontal scrollable cards */}
      <FlatList
        data={section.items}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        nestedScrollEnabled
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Main Title */}
      <Text style={styles.mainTitle}>Trending Ideas</Text>

      {/* Category Filter - Fixed, wraps to multiple lines if needed */}
      <View style={styles.categoryContainer}>
        {categories.map(renderCategoryChip)}
      </View>

      {/* Sections with horizontal scrolling cards */}
      {filteredSections.map((section) => (
        <View key={section.id} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <FlatList
            data={section.items}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
            ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            nestedScrollEnabled
          />
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    marginHorizontal: 24,
  },
  // Category Filter - wraps to multiple lines
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.3)',
  },
  categoryChipActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Section
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginLeft: 24,
  },
  // Cards Container
  cardsContainer: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  cardSeparator: {
    width: 12,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F0E9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardBottom: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: 'flex-start',
    gap: 6,
  },
  outfitName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tryOnButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  tryOnButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  tryOnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
