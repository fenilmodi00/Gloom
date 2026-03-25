/**
 * OutfitCombinationsSection
 *
 * Horizontal scrollable section displaying outfit combination cards.
 * Appears below the category lists when items are selected.
 */
import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';

import { OutfitCombinationCard } from './OutfitCombinationCard';
import type { WardrobeItem, Category } from '@/types/wardrobe';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import {
  useOutfitBuilderStore,
  useCombinations,
  useSelectedCount,
} from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { OUTFIT_BUILDER_CONSTANTS } from '@/constants/OutfitBuilder';

const { CARD_WIDTH, GAP, HORIZONTAL_PADDING } = OUTFIT_BUILDER_CONSTANTS;

const GRADIENT_START = THEME.bgCanvas;
const GRADIENT_END = THEME.bgSurfaceRaised;

interface OutfitCombinationsSectionProps {
  items: WardrobeItem[];
  onCombinationPress: (combination: OutfitCombination) => void;
}

export function OutfitCombinationsSection({
  items,
  onCombinationPress,
}: OutfitCombinationsSectionProps) {
  const combinations = useCombinations();
  const selectedCount = useSelectedCount();
  const generateCombinations = useOutfitBuilderStore((s) => s.generateCombinations);
  const generateRef = React.useRef(generateCombinations);
  generateRef.current = generateCombinations;

  // Generate combinations when selection changes
  useEffect(() => {
    if (selectedCount > 0) {
      console.log('[OutfitCombinationsSection] Generating combinations for', items.length, 'items');
      generateRef.current(items);
      console.log('[OutfitCombinationsSection] Combinations generated');
    }
  }, [selectedCount, items]);

  // Don't render if no items selected or no combinations
  if (selectedCount === 0 || combinations.length === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={[GRADIENT_START, GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Section header */}
      <View style={styles.headerRow}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={14} color={THEME.goldAccent} />
          </View>
          <Text style={styles.headerLabel}>Suggested Looks</Text>
        </View>
        <Text style={styles.countText}>{combinations.length} options</Text>
      </View>

      {/* Horizontal scrollable cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        nestedScrollEnabled
      >
        {combinations.map((combination) => (
          <View key={combination.id} style={styles.cardWrapper}>
            <OutfitCombinationCard
              combination={combination}
              onPress={onCombinationPress}
            />
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 0, // Removed to allow scroll to touch edge
  },
  headerRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.textSecondary,
    backgroundColor: THEME.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 8,
    gap: GAP,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    flexShrink: 0,
  },
});
