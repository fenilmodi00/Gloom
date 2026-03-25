import { Typography } from '@/constants/Typography';
/**
 * SelectItemsSheet
 * 
 * Bottom sheet for selecting wardrobe items to build an outfit.
 * Matches wardrobe screen styling with gradient sections and transparent cards.
 */
import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight } from 'lucide-react-native';

import type { Category, WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore } from '@/lib/store/outfit-builder.store';
import { categoryToSlot, type OutfitSlot } from '@/lib/outfit-mapping';

// Category configuration (using OutfitSlot, not Category)
const CATEGORY_CONFIG: { key: OutfitSlot; label: string }[] = [
{ key: 'upper', label: 'upper body' },
{ key: 'lower', label: 'lower body' },
{ key: 'dress', label: 'dresses' },
{ key: 'shoes', label: 'shoes' },
{ key: 'bag', label: 'bags' },
{ key: 'accessory', label: 'accessories' },
];

const GRADIENT_START = '#F5F2EE'; // bgCanvas
const GRADIENT_END = '#EAE4DA';   // bgMuted

const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  surface: '#FDFAF6', // bgSurface
};

const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;

export interface SelectItemsSheetProps {
  items: WardrobeItem[];
  onClose?: () => void;
}

// Simple transparent card (matches wardrobe screen)
interface ItemCardProps {
  item: WardrobeItem;
  isSelected: boolean;
  onPress: () => void;
}

const ItemCard = React.memo(({ item, isSelected, onPress }: ItemCardProps) => (
  <Pressable onPress={onPress} style={styles.cardContainer}>
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? { uri: (item.cutout_url || item.image_url) as string }
          : (item.image_url as any)
      }
      style={styles.cardImage}
      contentFit="contain"
      transition={200}
    />
    {isSelected && (
      <View style={styles.selectedOverlay}>
        <View style={styles.checkCircle}>
          <Check size={14} color="#FFFFFF" />
        </View>
      </View>
    )}
  </Pressable>
));

export const SelectItemsSheet = forwardRef<BottomSheet, SelectItemsSheetProps>(
  ({ items, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const toggleItem = useOutfitBuilderStore((s) => s.toggleItem);
    const isSelected = useOutfitBuilderStore((s) => s.isSelected);

    const snapPoints = useMemo(() => ['94%'], []);

// Group items by slot (using mapping from Category → slot)
const groupedItems = useMemo(() => {
const groups: Record<OutfitSlot, WardrobeItem[]> = {
upper: [],
lower: [],
dress: [],
shoes: [],
bag: [],
accessory: [],
};
items.forEach((item) => {
const slot = categoryToSlot(item.category);
groups[slot].push(item);
});
return groups;
}, [items]);

    // Filter to only show categories with items
    const categoriesWithItems = useMemo(() => {
      return CATEGORY_CONFIG.filter(({ key }) => groupedItems[key]?.length > 0);
    }, [groupedItems]);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose?.();
        }
      },
      [onClose]
    );

    // First category rendered with header in continuous gradient
    const renderFirstSection = useCallback(() => {
      if (categoriesWithItems.length === 0) return null;
      
      const first = categoriesWithItems[0];
      const firstItems = groupedItems[first.key] || [];

      return (
        <LinearGradient
          colors={[GRADIENT_START, GRADIENT_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Select Items</Text>
          </View>

          {/* First category - part of same gradient */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{first.label}</Text>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionContent}
            nestedScrollEnabled
          >
            {firstItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={isSelected(item.id)}
                onPress={() => toggleItem(item)}
              />
            ))}
          </ScrollView>
        </LinearGradient>
      );
    }, [categoriesWithItems, groupedItems, isSelected, toggleItem]);

    // Remaining categories
    const renderRemainingSections = useCallback(() => {
      if (categoriesWithItems.length <= 1) return null;
      
      return categoriesWithItems.slice(1).map(({ key, label }) => {
        const categoryItems = groupedItems[key];
        if (!categoryItems?.length) return null;

        return (
          <LinearGradient
            key={key}
            colors={[GRADIENT_START, GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.categorySection}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{label}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionContent}
              nestedScrollEnabled
            >
              {categoryItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isSelected={isSelected(item.id)}
                  onPress={() => toggleItem(item)}
                />
              ))}
            </ScrollView>
          </LinearGradient>
        );
      });
    }, [categoriesWithItems, groupedItems, isSelected, toggleItem]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handleIndicator}
        enableOverDrag={false}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
      >
        {/* Scrollable content - vertical scrolling for categories */}
        <BottomSheetScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* First category with header */}
          {renderFirstSection()}
          
          {/* Remaining categories */}
          {renderRemainingSections()}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

SelectItemsSheet.displayName = 'SelectItemsSheet';

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleIndicator: {
    display: 'none',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.heading2,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  sectionHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    ...Typography.body,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sectionContent: {
    gap: 12,
    paddingRight: 16,
  },
  categorySection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  // Transparent cards matching wardrobe screen
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139, 115, 85, 0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SelectItemsSheet;
