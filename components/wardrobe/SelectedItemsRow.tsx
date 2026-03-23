/**
 * SelectedItemsRow
 * 
 * Shows selected items as pills in a blurred row at the bottom of the screen.
 * Replaces the tab bar when the SelectItemsSheet is open.
 * Uses expo-blur for frosted glass effect.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

import type { WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore, useSelectedItemsArray } from '@/lib/store/outfit-builder.store';

// Design tokens
const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  surface: 'rgba(245, 243, 237, 0.85)',
};

// Category labels for pills
const CATEGORY_LABELS: Record<string, string> = {
  upper: 'Top',
  lower: 'Bottom',
  dress: 'Dress',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Acc.',
};

// Pill for a single selected item
interface SelectedItemPillProps {
  item: WardrobeItem;
  onRemove: () => void;
}

const SelectedItemPill = React.memo(({ item, onRemove }: SelectedItemPillProps) => (
  <View style={styles.pill}>
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? { uri: item.cutout_url || item.image_url }
          : item.image_url
      }
      style={styles.pillImage}
      contentFit="cover"
      transition={150}
    />
    <Text style={styles.pillLabel} numberOfLines={1}>
      {CATEGORY_LABELS[item.category] || item.category}
    </Text>
    <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
      <X size={12} color={COLORS.textSecondary} />
    </Pressable>
  </View>
));

export const SelectedItemsRow = () => {
  const insets = useSafeAreaInsets();
  const selectedItems = useSelectedItemsArray();
  const removeItem = useOutfitBuilderStore((s) => s.removeItem);
  const getSelectedCount = useOutfitBuilderStore((s) => s.getSelectedCount);

  // Don't render if no items selected
  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { bottom: 6 + insets.bottom }]} pointerEvents="box-none">
      <BlurView intensity={30} tint="light" style={styles.blurContainer}>
        <View style={styles.content}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {selectedItems.map((item) => (
              <SelectedItemPill
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.category)}
              />
            ))}
          </ScrollView>
          <Text style={styles.countText}>
            {getSelectedCount()} selected
          </Text>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60, // Above tab bar
  },
  blurContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.05)',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingLeft: 6,
    paddingRight: 8,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  pillImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0EDE8',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
    maxWidth: 50,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
});

export default SelectedItemsRow;
