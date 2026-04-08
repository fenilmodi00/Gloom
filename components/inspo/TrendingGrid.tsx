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
    <View className="rounded-2xl overflow-hidden bg-bgSurfaceRaised shadow-sm" style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 3 }}>
            <Image
        source={
          typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')
            ? { uri: item.imageUrl }
            : (item.imageUrl as any)
        }
        className="absolute inset-0 w-full h-full"
        contentFit="cover"
      />
      {/* Bottom content */}
      <View className="absolute bottom-2.5 left-2.5 right-2.5 items-start gap-1.5">
        {item.outfitName && (
          <Text className="font-product text-white text-shadow-sm" style={{ textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }} numberOfLines={1}>
            {item.outfitName}
          </Text>
        )}
        <Pressable
          className="bg-white/95 py-1.5 px-3.5 rounded-full"
          style={({ pressed }: any) => (pressed ? { opacity: 0.85, transform: [{ scale: 0.95 }] } : {})}
          onPress={() => onTryOnPress?.(item)}
        >
          <Text className="font-ui text-sm text-textPrimary">Try on</Text>
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
        className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-bgSurface border-bgMuted'}`}
      >
        <Text className={`font-body text-xs ${isSelected ? 'text-white font-semibold' : 'text-textSecondary'}`}>
          {category}
        </Text>
      </Pressable>
    );
  };

  // Render a section row
  const renderSection = ({ item: section }: { item: TrendingSection }) => (
    <View className="mb-6">
      {/* Section Title */}
      <Text className="font-heading text-xl text-textPrimary mb-3 ml-6">{section.title}</Text>
      {/* Horizontal scrollable cards */}
      <FlatList
        data={section.items}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        ItemSeparatorComponent={() => <View className="w-3" />}
        nestedScrollEnabled
      />
    </View>
  );

  return (
    <View className="pb-5">
      {/* Main Title */}
      <Text className="font-heading text-2xl text-textPrimary mb-4 mx-6">Trending Ideas</Text>

      {/* Category Filter - Fixed, wraps to multiple lines if needed */}
      <View className="flex-row flex-wrap gap-2 mb-5 px-6">
        {categories.map(renderCategoryChip)}
      </View>

      {/* Sections with horizontal scrolling cards */}
      {filteredSections.map((section) => (
        <View key={section.id} className="mb-6">
          <Text className="font-heading text-xl text-textPrimary mb-3 ml-6">{section.title}</Text>
          <FlatList
            data={section.items}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            ItemSeparatorComponent={() => <View className="w-3" />}
            nestedScrollEnabled
          />
        </View>
      ))}
    </View>
  );
}
