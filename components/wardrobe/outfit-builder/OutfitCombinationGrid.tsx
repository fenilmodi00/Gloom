import { Typography } from '@/constants/Typography';
/**
 * OutfitCombinationGrid
 *
 * A reusable component displaying a single outfit combination with:
 * - Header (back/upload/settings buttons)
 * - Large centered title
 * - 2x2 grid (OutfitBoard)
 * - Bottom action buttons (Try on, Edit, Bookmark)
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { OutfitBoard } from '@/components/outfit-board';
import { Text } from '@/components/ui/text';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { ChevronLeft, Upload, Bookmark, Edit3, Sparkles } from 'lucide-react-native';

// ============================================================================
// Types
// ============================================================================

interface OutfitCombinationGridProps {
  combination: OutfitCombination;
  onClose: () => void;
  onTryOn?: () => void;
  onEdit?: () => void;
  onBookmark?: () => void;
  onUpload?: () => void;
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

export function OutfitCombinationGrid({
  combination,
  onClose,
  onTryOn,
  onEdit,
  onBookmark,
  onUpload,
}: OutfitCombinationGridProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  
  const title = getCombinationTitle(combination);
  
  // Handle actions
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);
  
  const handleTryOn = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTryOn?.();
  }, [onTryOn]);
  
  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEdit?.();
  }, [onEdit]);
  
  const handleUpload = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpload?.();
  }, [onUpload]);
  
  const handleBookmark = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBookmark?.();
  }, [onBookmark]);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleClose} style={styles.headerButton}>
          <ChevronLeft size={24} color={THEME.textPrimary} />
        </Pressable>
        
        <Pressable onPress={handleUpload} style={styles.uploadButton}>
          <Upload size={16} color={THEME.textPrimary} style={{ marginRight: 4 }} />
          <Text style={styles.uploadButtonText}>Upload outfit</Text>
        </Pressable>
        
        <Pressable onPress={handleBookmark} style={styles.headerButton}>
          {/* Settings/filter icon */}
          <View style={styles.settingsIcon}>
            <View style={styles.settingsLine} />
            <View style={styles.settingsLine} />
            <View style={styles.settingsLine} />
          </View>
        </Pressable>
      </View>
      
      {/* Outfit Board Grid with overlaid title */}
      <View style={styles.boardWrapper}>
        <OutfitBoard
          selection={combination.selection}
          width={screenWidth}
          height={screenWidth * 1.60}
        />
        {/* Title overlaid on top of DotGrid */}
        <Text style={styles.overlaidTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.actionButton, styles.lightButton]} onPress={handleTryOn}>
          <Sparkles size={18} color={THEME.bgSurface} />
          <Text style={[styles.actionButtonText, styles.lightButtonText]}>Try on</Text>
        </Pressable>
        
        <Pressable style={styles.actionButton} onPress={handleEdit}>
          <Edit3 size={18} color={THEME.bgSurface} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        
        <Pressable style={styles.iconButton} onPress={handleBookmark}>
          <Bookmark size={20} color={THEME.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgCanvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  uploadButtonText: {
    ...Typography.uiLabelMedium,
    color: THEME.textPrimary,
  },
  settingsIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  settingsLine: {
    width: 20,
    height: 2,
    backgroundColor: THEME.textPrimary,
    borderRadius: 1,
  },
  overlaidTitle: {
    position: 'absolute',
    top: 60, // Position below header
    left: 0,
    right: 0,
    ...Typography.heading1,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  boardWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.goldAccent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  actionButtonText: {
    ...Typography.uiLabelMedium,
    color: THEME.bgSurface,
  },
  lightButton: {
    backgroundColor: THEME.goldAccent,
    borderWidth: 1,
    borderColor: THEME.goldAccent,
  },
  lightButtonText: {
    color: THEME.bgSurface,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
});