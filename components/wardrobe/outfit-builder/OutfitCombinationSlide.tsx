import { Typography } from '@/constants/Typography';
/**
 * OutfitCombinationSlide
 *
 * A lightweight slide component for the carousel.
 * Contains only: OutfitBoard (2x2 grid with DotGrid) + overlaid title
 * No header, no bottom buttons - those are in the parent screen.
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { OutfitBoard } from '@/components/outfit-board';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

// ============================================================================
// Types
// ============================================================================

interface OutfitCombinationSlideProps {
  combination: OutfitCombination;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a display title from outfit combination tags
 */
function getCombinationTitle(combination: OutfitCombination): string {
  const { selection } = combination;
  const items = Object.values(selection).filter(Boolean);
  
  // Collect all unique style and vibe tags
  const tags = new Set<string>();
  items.forEach((item) => {
    if (!item) return;
    (item.style_tags || []).forEach((tag: string) => { tags.add(tag); });
    (item.vibe_tags || []).forEach((tag: string) => { tags.add(tag); });
  });
  
  // Convert tags to title-case words
  const tagArray = Array.from(tags).slice(0, 3);
  if (tagArray.length === 0) return 'Stylish Look';
  
  // Create a catchy title from first two tags
  const titleWords = tagArray
    .slice(0, 2)
    .map(tag => tag.replace(/_/g, ' '))
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return titleWords || 'Stylish Look';
}

// ============================================================================
// Component
// ============================================================================

export function OutfitCombinationSlide({ combination }: OutfitCombinationSlideProps) {
  const { width: screenWidth } = useWindowDimensions();
  const title = getCombinationTitle(combination);
  
  return (
    <View style={styles.slide}>
      {/* Outfit Board - 2x2 grid with DotGrid background */}
      <OutfitBoard
        selection={combination.selection}
        width={screenWidth}
        height={screenWidth * 1.35}
        disableShadow
        transparent
        noBorderRadius
      />
      
      {/* Title overlaid on DotGrid */}
      <Text style={styles.overlaidTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlaidTitle: {
    position: 'absolute',
    top: 60, // Position below header area
    left: 0,
    right: 0,
    ...Typography.heading1,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
});
