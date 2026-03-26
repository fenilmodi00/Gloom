import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import type { TrendingItem, TrendingSection } from '@/types/inspo';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

// ============================================================================
// Types
// ============================================================================

export interface TrendingGridProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

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
    return sections && sections.length > 0 ? sections : [];
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
        source={
          typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')
            ? { uri: item.imageUrl }
            : (item.imageUrl as any)
        }
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
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

  if (displaySections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Trending Ideas</Text>
        <Text style={styles.emptyText}>No trending ideas available</Text>
      </View>
    );
  }

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
    ...Typography.heading2,
    color: Colors.light.textPrimary,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 40,
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
    backgroundColor: Colors.light.bgSurface,
    borderWidth: 1,
    borderColor: Colors.light.bgMuted,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: Colors.light.textSecondary,
  },
  categoryTextActive: {
    color: Colors.light.textOnDark,
    fontWeight: '600',
  },
  // Section
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
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
    backgroundColor: Colors.light.bgSurfaceRaised,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    ...Typography.productName,
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
    ...Typography.uiLabel,
    color: Colors.light.textPrimary,
  },
});
