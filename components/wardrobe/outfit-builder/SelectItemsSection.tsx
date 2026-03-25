/**
 * SelectItemsSection
 * 
 * Full-screen section for selecting wardrobe items to build an outfit.
 * Displays categories with horizontal scrolling item lists.
 * Shows skeleton when category is empty.
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronRight } from 'lucide-react-native';

import type { Category, WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

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
  <Pressable onPress={onPress} style={styles.cardContainer}>
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? (item.cutout_url || item.image_url)
          : item.image_url
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

// Skeleton for empty categories
const CategorySkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonHeader} />
    <View style={styles.skeletonRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard} />
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
          style={styles.headerGradient}
        >
          <Text style={styles.emptyText}>No items in your wardrobe yet</Text>
          <Text style={styles.emptySubtext}>Add some clothes to start building outfits!</Text>
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
            <ChevronRight size={16} color={THEME.textSecondary} />
          </View>
        </View>
        
        {firstItems.length === 0 ? (
          <CategorySkeleton />
        ) : (
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
          style={styles.categorySection}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{label}</Text>
              <ChevronRight size={16} color={THEME.textSecondary} />
            </View>
          </View>
          
          {categoryItems.length === 0 ? (
            <CategorySkeleton />
          ) : (
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
          )}
        </LinearGradient>
      );
    });
  }, [categoriesWithItems, groupedItems, isSelected, toggleItem]);

  return (
    <View style={styles.container}>
      {/* First category with header */}
      {renderFirstSection()}
      
      {/* Remaining categories */}
      {renderRemainingSections()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
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
    ...Typography.heading1,
    color: THEME.textPrimary,
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
    color: THEME.textSecondary,
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
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state
  emptyText: {
    ...Typography.body,
    fontWeight: '600',
    color: THEME.textPrimary,
    textAlign: 'center',
    marginTop: 40,
  },
  emptySubtext: {
    ...Typography.bodySmall,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  // Skeleton
  skeletonContainer: {
    marginTop: 8,
  },
  skeletonHeader: {
    width: 120,
    height: 16,
    backgroundColor: THEME.skeleton,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: THEME.skeleton,
    borderRadius: 12,
  },
});

export default SelectItemsSection;
