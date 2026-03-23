import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { TrendingItem, TrendingSection } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const TRENDING_CATEGORIES = [
  'All',
  'Street Style',
  'Minimalist',
  'Bohemian',
  'Formal',
  'Casual',
  'Vintage',
];

// ============================================================================
// Types
// ============================================================================

export interface TrendingGridProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

interface TrendingItemWithCategory extends TrendingItem {
  category: string;
}

// ============================================================================
// Mock Data Generator
// ============================================================================

function generateMockTrendingItems(): TrendingItemWithCategory[] {
  const mockItems: TrendingItemWithCategory[] = [
    {
      id: 'street-1',
      imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
      outfitName: 'Urban Edge',
      category: 'Street Style',
    },
    {
      id: 'street-2',
      imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600',
      outfitName: 'City Layers',
      category: 'Street Style',
    },
    {
      id: 'minimal-1',
      imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
      outfitName: 'Clean Lines',
      category: 'Minimalist',
    },
    {
      id: 'minimal-2',
      imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
      outfitName: 'Pure White',
      category: 'Minimalist',
    },
    {
      id: 'boho-1',
      imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?w=600',
      outfitName: 'Free Spirit',
      category: 'Bohemian',
    },
    {
      id: 'boho-2',
      imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
      outfitName: 'Festival Ready',
      category: 'Bohemian',
    },
    {
      id: 'formal-1',
      imageUrl: 'https://images.unsplash.com/photo-1507679798250-c81457d57f47?w=600',
      outfitName: 'Boardroom Chic',
      category: 'Formal',
    },
    {
      id: 'formal-2',
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
      outfitName: 'Power Suit',
      category: 'Formal',
    },
    {
      id: 'casual-1',
      imageUrl: 'https://images.unsplash.com/photo-1551028719-001579e1403f?w=600',
      outfitName: 'Weekend Vibes',
      category: 'Casual',
    },
    {
      id: 'casual-2',
      imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600',
      outfitName: 'Coffee Run',
      category: 'Casual',
    },
    {
      id: 'vintage-1',
      imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
      outfitName: 'Retro Glam',
      category: 'Vintage',
    },
    {
      id: 'vintage-2',
      imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      outfitName: 'Classic Beauty',
      category: 'Vintage',
    },
  ];
  return mockItems;
}

// ============================================================================
// Component
// ============================================================================

export function TrendingGrid({ sections, onTryOnPress }: TrendingGridProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  // Use mock data if no sections provided, or combine sections into flat list
  const allItems = useMemo(() => {
    if (sections && sections.length > 0) {
      // Flatten sections and add category based on section title
      return sections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          category: section.title,
        }))
      );
    }
    return generateMockTrendingItems();
  }, [sections]);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return allItems;
    return allItems.filter((item) => item.category === activeCategory);
  }, [allItems, activeCategory]);

  // Render category filter chip
  const renderCategoryChip = (category: string) => {
    const isSelected = activeCategory === category;
    return (
      <Pressable
        key={category}
        onPress={() => setActiveCategory(category)}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipActive,
        ]}
      >
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.categoryTextActive,
          ]}
        >
          {category}
        </Text>
      </Pressable>
    );
  };

  // Render trending item card
  const renderItem = ({ item }: { item: TrendingItemWithCategory }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        {/* Gradient overlay at bottom */}
        <View style={styles.gradientOverlay} />
        {/* Content overlay */}
        <View style={styles.cardContent}>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Trending Ideas</Text>

      {/* Horizontal Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {TRENDING_CATEGORIES.map(renderCategoryChip)}
      </ScrollView>

      {/* Vertical 2-column Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No outfits in this category</Text>
          </View>
        }
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const CARD_GAP = 12;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  // Category Filter
  categoryContainer: {
    paddingRight: 24,
    gap: 8,
    marginBottom: 16,
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
  // Grid
  gridContainer: {
    gap: CARD_GAP,
  },
  row: {
    gap: CARD_GAP,
  },
  cardContainer: {
    flex: 1,
    aspectRatio: 3 / 4,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F2F0E9',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  outfitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tryOnButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tryOnButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  tryOnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B6B6B',
  },
});
