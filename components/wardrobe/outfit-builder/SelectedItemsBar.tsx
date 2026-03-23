/**
 * SelectedItemsBar
 * 
 * Shows selected items in a 2-column grid with frosted glass effect.
 * Used in the full-screen outfit builder - floating at bottom left.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore, useSelectedItemsArray } from '@/lib/store/outfit-builder.store';

// Design tokens
const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  surface: 'rgba(245, 243, 237, 0.9)',
};

// Category labels for display
const CATEGORY_LABELS: Record<string, string> = {
  upper: 'Top',
  lower: 'Bottom',
  dress: 'Dress',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Acc.',
};

// Pill for a single selected item - larger size (20% increase)
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

export const SelectedItemsBar = () => {
  const selectedItems = useSelectedItemsArray();
  const removeItem = useOutfitBuilderStore((s) => s.removeItem);
  const getSelectedCount = useOutfitBuilderStore((s) => s.getSelectedCount);

  const insets = useSafeAreaInsets();

  // Don't render if no items selected
  if (selectedItems.length === 0) {
    return null;
  }

  // Split items into 2 columns
  const column1 = selectedItems.slice(0, 3);
  const column2 = selectedItems.slice(3, 6);

  return (
    <BlurView intensity={35} tint="light" style={[styles.container, { bottom: insets.bottom + 16 }]}>
      <View style={styles.content}>
        {/* Left side - 2 columns of items */}
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            {column1.map((item) => (
              <SelectedItemPill
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.category)}
              />
            ))}
          </View>
          <View style={styles.column}>
            {column2.map((item) => (
              <SelectedItemPill
                key={item.id}
                item={item}
                onRemove={() => removeItem(item.category)}
              />
            ))}
          </View>
        </View>
        
        {/* Count badge on right */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{getSelectedCount()}</Text>
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 80, // Leave space for generate button on right
    alignItems: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.12)',
    gap: 10,
  },
  columnsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  pillImage: {
    width: 40, // 20% larger than 32
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0EDE8',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 28,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.surface,
  },
});

export default SelectedItemsBar;
