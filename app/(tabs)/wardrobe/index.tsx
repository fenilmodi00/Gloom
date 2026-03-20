import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { Text } from '@/components/ui/text';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { getMockWardrobeItemsWithAssets } from '@/lib/mock-wardrobe';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import type { Category, WardrobeItem } from '@/types/wardrobe';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus, Shirt } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Category configuration
const CATEGORY_CONFIG: { key: Category; label: string }[] = [
  { key: 'upper', label: 'upper body' },
  { key: 'lower', label: 'lower body' },
  { key: 'dress', label: 'dresses' },
  { key: 'shoes', label: 'shoes' },
  { key: 'bag', label: 'bags' },
  { key: 'accessory', label: 'accessories' },
];

// Vertical gradient colors for each category (top to bottom)
const GRADIENT_START = '#F5F2EE';
const GRADIENT_END = '#F0EACC';

// Aesty-inspired color palette
const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
};

// Card dimensions - increased size by 25%
const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;

// Category section with its own vertical gradient
interface CategorySectionProps {
  label: string;
  items: WardrobeItem[];
  index: number;
  onSeeAll?: () => void;
}

// Memoized card renderer
const CategoryCard = ({ item }: { item: WardrobeItem }) => (
  <View style={styles.cardContainer}>
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? { uri: item.cutout_url || item.image_url }
          : item.image_url
      }
      style={styles.cardImage}
      contentFit="contain"
      transition={200}
    />
  </View>
);

function CategorySection({ label, items, onSeeAll }: CategorySectionProps) {
  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => <CategoryCard item={item} />,
    []
  );

  if (items.length === 0) return null;

  return (
    <LinearGradient
      colors={[GRADIENT_START, GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientSection}
    >
      {/* Section header with chevron */}
      <View style={styles.sectionHeaderRow}>
        <Pressable onPress={onSeeAll} style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* Horizontal scrolling items */}
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        estimatedItemSize={CARD_WIDTH + 12}
        contentContainerStyle={styles.sectionContent}
      />
    </LinearGradient>
  );
}

export default function WardrobeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: storeItems, isLoading, fetchItems } = useWardrobeStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // Use mock data if store is empty
  const items = useMemo(() => {
    return storeItems.length > 0 ? storeItems : getMockWardrobeItemsWithAssets();
  }, [storeItems]);

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    CATEGORY_CONFIG.forEach(({ key }) => {
      groups[key] = items.filter((item) => item.category === key);
    });
    return groups;
  }, [items]);

  // Sections to render
  const sections = useMemo(() => {
    return CATEGORY_CONFIG.filter(({ key }) => groupedItems[key]?.length > 0);
  }, [groupedItems]);

  const handleEmptyAdd = () => {
    setIsAddSheetOpen(true);
  };

   const navigateToAddItem = (method: 'camera' | 'gallery') => {
     setIsAddSheetOpen(false);
     router.push({
       pathname: '/(tabs)/wardrobe/add-item',
       params: { method, origin: 'wardrobe' },
     });
   };

  // First category card renderer
  const firstCategoryRenderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => <CategoryCard item={item} />,
    []
  );

  // Render item for FlashList - header + first category together as ONE continuous gradient
  const renderItem = useCallback(
    ({ item, index }: { item: typeof CATEGORY_CONFIG[0] | 'header'; index: number }) => {
      // Header is rendered with first category - continuous gradient
      if (item === 'header') {
        return (
          <LinearGradient
            colors={[GRADIENT_START, GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.headerWithFirstCategory, { paddingTop: insets.top - 59 }]}
          >
            {/* Header row */}
            <View style={styles.headerRow}>
               <Text style={styles.headerTitle}>Closet</Text>
               <Pressable 
                 onPress={() => {
                   router.push({
                     pathname: '/(tabs)/wardrobe/add-item',
                     params: { origin: 'wardrobe' },
                   });
                 }} 
                 style={styles.addButton}
               >
                 <Plus size={24} color="#FFFFFF" />
               </Pressable>
            </View>

            {/* First category section - part of same gradient */}
            {sections.length > 0 && (
              <>
                <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                  <Pressable style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{sections[0].label}</Text>
                    <ChevronRight size={16} color={COLORS.textSecondary} />
                  </Pressable>
                </View>
                <FlashList
                  data={groupedItems[sections[0].key] || []}
                  keyExtractor={(item) => item.id}
                  renderItem={firstCategoryRenderItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  estimatedItemSize={CARD_WIDTH + 12}
                  contentContainerStyle={styles.sectionContent}
                />
              </>
            )}
          </LinearGradient>
        );
      }

      // Skip first category (already rendered with header)
      const sectionIndex = sections.findIndex(s => s.key === item.key);
      if (sectionIndex === 0) return null;

      return (
        <CategorySection
          label={item.label}
          items={groupedItems[item.key] || []}
          index={index}
        />
      );
    },
    [groupedItems, sections, insets.top, firstCategoryRenderItem]
  );

  // Data for FlashList: header + sections
  const listData = useMemo(() => {
    return ['header', ...sections] as (typeof sections[0] | 'header')[];
  }, [sections]);

  if (isLoading && items.length === 0) {
    return <LoadingOverlay message="Loading wardrobe..." />;
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          title="Your closet is empty"
          description="Start building your digital closet to get personalized outfit suggestions."
          buttonTitle="Add item"
          onPress={handleEmptyAdd}
          onSearchPress={() =>
            Alert.alert('Coming Soon', 'Search web will be available in a future update.')
          }
          onOutfitPress={() =>
            Alert.alert('Coming Soon', 'Add items from outfit will be available soon.')
          }
        />
        <AddItemSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onSelectMethod={navigateToAddItem}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Main content - scrollable with header + categories */}
      <FlashList
        data={listData}
        keyExtractor={(item, index) => (item === 'header' ? 'header' : item.key)}
        renderItem={renderItem}
        estimatedItemSize={180}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      />

      {/* "Make outfits" floating button */}
      <View style={[styles.makeOutfitsContainer, { bottom: 88 + insets.bottom, right: 16 }]}>
        <Pressable
          style={styles.makeOutfitsButton}
          onPress={() => router.push('/(tabs)/outfits' as any)}
        >
          <Shirt size={16} color="#1A1A1A" />
          <Text style={styles.makeOutfitsText}>Make outfits</Text>
        </Pressable>
      </View>

      <AddItemSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSelectMethod={navigateToAddItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerWithFirstCategory: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerGradient: {
    paddingTop: 6,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sectionContent: {
    gap: 12,
  },
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
  makeOutfitsContainer: {
    position: 'absolute',
  },
  makeOutfitsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  makeOutfitsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
