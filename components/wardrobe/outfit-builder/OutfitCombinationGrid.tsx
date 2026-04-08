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
    <View className="flex-1 bg-bgCanvas">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-4 bg-transparent" style={{ paddingTop: insets.top + 8 }}>
        <Pressable onPress={handleClose} className="w-11 h-11 rounded-full bg-white/80 items-center justify-center shadow-sm shadow-black/5">
          <ChevronLeft size={24} color={THEME.textPrimary} />
        </Pressable>
        
        <Pressable onPress={handleUpload} className="flex-row items-center justify-center bg-white/80 rounded-full px-4 py-2 shadow-sm shadow-black/5">
          <Upload size={16} color={THEME.textPrimary} style={{ marginRight: 4 }} />
          <Text className="font-ui text-sm font-medium text-textPrimary">Upload outfit</Text>
        </Pressable>
        
        <Pressable onPress={handleBookmark} className="w-11 h-11 rounded-full bg-white/80 items-center justify-center shadow-sm shadow-black/5">
          {/* Settings/filter icon */}
          <View className="w-5 h-4 justify-between">
            <View className="w-5 h-0.5 bg-textPrimary rounded-sm" />
            <View className="w-5 h-0.5 bg-textPrimary rounded-sm" />
            <View className="w-5 h-0.5 bg-textPrimary rounded-sm" />
          </View>
        </Pressable>
      </View>
      
      {/* Outfit Board Grid with overlaid title */}
      <View className="flex-1 items-center justify-center">
        <OutfitBoard
          selection={combination.selection}
          width={screenWidth}
          height={screenWidth * 1.60}
        />
        {/* Title overlaid on top of DotGrid */}
        <Text className="absolute left-0 right-0 text-center font-heading text-4xl text-textSecondary" style={{ top: 60 }} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      {/* Bottom action bar */}
      <View className="flex-row items-center justify-center px-4 gap-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <Pressable className="flex-row items-center justify-center bg-goldAccent border border-goldAccent px-6 py-3.5 rounded-[20px] gap-2 shadow-md shadow-black/10" onPress={handleTryOn}>
          <Sparkles size={18} color={THEME.bgSurface} />
          <Text className="font-ui text-sm font-medium text-white">Try on</Text>
        </Pressable>
        
        <Pressable className="flex-row items-center justify-center bg-goldAccent px-6 py-3.5 rounded-[20px] gap-2 shadow-md shadow-black/10" onPress={handleEdit}>
          <Edit3 size={18} color={THEME.bgSurface} />
          <Text className="font-ui text-sm font-medium text-white">Edit</Text>
        </Pressable>
        
        <Pressable className="w-12 h-12 rounded-full bg-white/90 items-center justify-center shadow-sm shadow-black/5" onPress={handleBookmark}>
          <Bookmark size={20} color={THEME.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}