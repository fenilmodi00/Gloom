/**
 * InspoBackgroundPager - Model carousel wrapper
 *
 * Uses ModelCarousel for 3-model peeking parallax effect
 * Takes 70% of screen from top, with padding below header
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ModelCarousel } from './ModelCarousel';
import type { ModelCard } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Height: 70% of screen for the model carousel area
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.70;

// ============================================================================
// Types
// ============================================================================

export interface InspoBackgroundPagerProps {
  images: (string | number)[];
  initialIndex?: number;
}

// ============================================================================
// Component
// ============================================================================

export function InspoBackgroundPager({
  images,
  initialIndex = 1, // Start with middle model in focus
}: InspoBackgroundPagerProps) {
  // Convert images to ModelCard format
  const modelCards: ModelCard[] = useMemo(() => {
    return images.map((img, index) => ({
      id: `model-${index}`,
      imageUrl: img,
    }));
  }, [images]);

  return (
    <View style={styles.container}>
      <ModelCarousel
        models={modelCards}
        initialIndex={initialIndex}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CAROUSEL_HEIGHT,
    backgroundColor: '#F5F2EE',
    zIndex: 0,
  },
});
