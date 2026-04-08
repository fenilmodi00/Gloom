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
import { getWardrobeItemImageUrl } from '@/lib/wardrobe-image';

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

const ItemCard = React.memo(({ item, isSelected, onPress }: ItemCardProps) => {
  const imageUrl = getWardrobeItemImageUrl(item);
  return (
    <Pressable onPress={onPress} className="mr-3 bg-transparent" style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
      <Image
        source={imageUrl ? { uri: imageUrl } : undefined}
        className="w-full h-full bg-transparent rounded-xl"
        contentFit="contain"
        transition={200}
      />
      {isSelected && (
        <View className="absolute inset-0 bg-[#8B7355]/15 rounded-xl justify-center items-center">
          <View className="w-7 h-7 rounded-full bg-primary justify-center items-center">
            <Check size={14} color="#FFFFFF" />
          </View>
        </View>
      )}
    </Pressable>
  );
});

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
if (slot) groups[slot].push(item);
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
          className="pb-4 px-4"
        >
          {/* Header row */}
          <View className="flex-row justify-between items-center">
            <Text className="font-heading text-2xl text-textPrimary tracking-tight">Select Items</Text>
          </View>

          {/* First category - part of same gradient */}
          <View className="mt-4 mb-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-body font-medium text-textSecondary">{first.label}</Text>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 16 }}
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
            className="py-4 px-4"
          >
            <View className="mt-4 mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-body font-medium text-textSecondary">{label}</Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 16 }}
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
        backgroundStyle={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
        handleIndicatorStyle={{ display: 'none' }}
        enableOverDrag={false}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
      >
        {/* Scrollable content - vertical scrolling for categories */}
        <BottomSheetScrollView 
          className="flex-1"
          contentContainerStyle={[{ flexGrow: 1, paddingBottom: insets.bottom + 20 }]}
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

export default SelectItemsSheet;
