/**
 * OutfitCombinationSlide
 *
 * A lightweight slide component for the carousel.
 * Contains only: OutfitBoard (2x2 grid with DotGrid) + overlaid title
 * No header, no bottom buttons - those are in the parent screen.
 */
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { OutfitBoard } from '@/components/outfit-board';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';

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
    <View className="flex-1 items-center justify-center relative">
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
      <Text className="absolute top-[60px] left-0 right-0 font-heading text-3xl text-text-secondary text-center" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
