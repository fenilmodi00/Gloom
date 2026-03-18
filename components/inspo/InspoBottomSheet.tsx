/**
 * InspoBottomSheet - Layered Bottom Sheet for Inspo Screen
 *
 * A bottom sheet that sits on top of a mannequin silhouette background,
 * displaying trending outfit sections in a scrollable container.
 *
 * Features:
 * - Drag handle at top
 * - Rounded top corners (40px radius)
 * - Scrollable content with hidden scrollbar
 */
import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TrendingGrid } from './TrendingGrid';
import type { TrendingSection, TrendingItem } from '@/types/inspo';

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65; // 65vh

// ============================================================================
// Types
// ============================================================================

export interface InspoBottomSheetProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

// ============================================================================
// Component
// ============================================================================

export function InspoBottomSheet({ sections, onTryOnPress }: InspoBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 80 }]}>
      {/* Drag Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <TrendingGrid sections={sections} onTryOnPress={onTryOnPress} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#F5F3ED',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  handle: {
    width: 48,
    height: 6,
    backgroundColor: '#D6D3D1',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
});

export default InspoBottomSheet;
