/**
 * SelectItemsSection
 * 
 * Full-screen section for selecting wardrobe items to build an outfit.
 * Displays categories with horizontal scrolling item lists.
 * Shows skeleton when category is empty.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight } from 'lucide-react-native';

import type { Category, WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

const CATEGORY_CONFIG: { key: Category; label: string }[] = [
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'fullbody', label: 'Full Body' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'bags', label: 'Bags' },
  { key: 'accessories', label: 'Accessories' },
];

const GRADIENT_START = THEME.bgCanvas;
const GRADIENT_END = THEME.bgSurfaceRaised;


const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;

// Simple transparent card for outfit builder
interface ItemCardProps {
  item: WardrobeItem;
  isSelected: boolean;
  onPress: () => void;
}

const ItemCard = React.memo(({ item, isSelected, onPress }: ItemCardProps) => (
  <Pressable onPress={onPress} className="w-[120px] h-[150px] mr-3 bg-transparent">
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? (item.cutout_url || item.image_url)
          : item.image_url
      }
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
));

// Skeleton for empty categories
const CategorySkeleton = () => (
  <View className="mt-2">
    <View className="w-[120px] h-4 bg-surface-raised rounded mb-3" />
    <View className="flex-row gap-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="w-[120px] h-[150px] bg-surface-raised rounded-xl" />
      ))}
    </View>
  </View>
);

interface SelectItemsSectionProps {
  items: WardrobeItem[];
}

export const SelectItemsSection = ({ items }: SelectItemsSectionProps) => {
  const insets = useSafeAreaInsets();
  const toggleItem = useOutfitBuilderStore((s) => s.toggleItem);
  const isSelected = useOutfitBuilderStore((s) => s.isSelected);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<Category, WardrobeItem[]> = {
      tops: [],
      bottoms: [],
      fullbody: [],
      outerwear: [],
      shoes: [],
      bags: [],
      accessories: [],
    };
    items.forEach((item) => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    });
    return groups;
  }, [items]);

  // Filter to only show categories with items
  const categoriesWithItems = useMemo(() => {
    return CATEGORY_CONFIG.filter(({ key }) => groupedItems[key]?.length > 0);
  }, [groupedItems]);

  // First category rendered with header in continuous gradient
  const renderFirstSection = useCallback(() => {
    if (categoriesWithItems.length === 0) {
      return (
        <LinearGradient
          colors={[GRADIENT_START, GRADIENT_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="pb-4 px-4"
        >
          <Text className="font-heading text-lg font-semibold text-text-primary text-center mt-10">No items in your wardrobe yet</Text>
          <Text className="font-body text-sm text-text-secondary text-center mt-2">Add some clothes to start building outfits!</Text>
        </LinearGradient>
      );
    }
    
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
          <Text className="font-heading text-2xl text-text-primary">Select Items</Text>
        </View>

        {/* First category - part of same gradient */}
        <View className="mt-4 mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-base font-medium text-text-secondary">{first.label}</Text>
            <ChevronRight size={16} color={THEME.textSecondary} />
          </View>
        </View>
        
        {firstItems.length === 0 ? (
          <CategorySkeleton />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 pr-4"
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
        )}
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
              <Text className="font-body text-base font-medium text-text-secondary">{label}</Text>
              <ChevronRight size={16} color={THEME.textSecondary} />
            </View>
          </View>
          
          {categoryItems.length === 0 ? (
            <CategorySkeleton />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 pr-4"
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
          )}
        </LinearGradient>
      );
    });
  }, [categoriesWithItems, groupedItems, isSelected, toggleItem]);

  return (
    <View className="pb-5">
      {/* First category with header */}
      {renderFirstSection()}
      
      {/* Remaining categories */}
      {renderRemainingSections()}
    </View>
  );
};

export default SelectItemsSection;
