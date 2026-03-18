/**
 * TrendingGrid - 2-column grid of trending outfit cards
 *
 * Displays trending outfits in a 2-column grid layout
 * with glassmorphism "Try on" buttons overlaying each card.
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import type { TrendingItem, TrendingSection as TrendingSectionType } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_MARGIN = 24;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.33; // 3:4 aspect ratio

// ============================================================================
// Types
// ============================================================================

export interface TrendingGridProps {
  sections: TrendingSectionType[];
  onTryOnPress?: (item: TrendingItem) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TrendingGrid({ sections, onTryOnPress }: TrendingGridProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending ideas</Text>
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.grid}>
            {section.items.map((item) => (
              <TrendingCard
                key={item.id}
                item={item}
                onTryOnPress={() => onTryOnPress?.(item)}
              />
            ))}
          </View>
        </View>
      ))}
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

function TrendingCard({ item, onTryOnPress }: TrendingCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={styles.gradient}
      />
      <Pressable style={styles.tryOnButton} onPress={onTryOnPress}>
        <Text style={styles.tryOnIcon}>✦</Text>
        <Text style={styles.tryOnText}>Try on</Text>
      </Pressable>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 16,
    textTransform: 'none',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  tryOnButton: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tryOnIcon: {
    fontSize: 12,
    color: '#333',
  },
  tryOnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default TrendingGrid;
