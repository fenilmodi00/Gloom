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
import { ChevronRight, Shirt, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, ScrollView } from 'react-native';
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
import Colors from '@/constants/Colors';

// ... existing code ...

// Category section colors
const GRADIENT_START = Colors.light.bgCanvas;
const GRADIENT_END = Colors.light.bgSurfaceRaised;

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
          <ChevronRight size={16} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

      {/* Horizontal scrolling items */}
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
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

  // Navigate to outfit builder screen
  const navigateToOutfitBuilder = useCallback(() => {
    router.push('/(tabs)/wardrobe/outfit-builder');
  }, [router]);

  // Handler for SelectItemsSheet - now just opens the screen
  const handleOpenSelectSheet = useCallback(() => {
    console.log('[Wardrobe] Opening outfit builder screen');
    navigateToOutfitBuilder();
  }, [navigateToOutfitBuilder]);

  // Handle close - not needed for full screen
  const handleCloseSelectSheet = useCallback(() => {
    // Full screen handles its own close
  }, []);

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
                 style={styles.uploadButton} 
                 onPress={() => setIsAddSheetOpen(true)}
               >
                 <Text style={styles.uploadText}>Add item</Text>
               </Pressable>
            </View>

            {/* First category section - part of same gradient */}
            {sections.length > 0 && (
              <>
                <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                  <Pressable style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{sections[0].label}</Text>
                    <ChevronRight size={16} color={Colors.light.textSecondary} />
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sectionContent}
                >
                  {(groupedItems[sections[0].key] || []).map((item) => (
                    <CategoryCard key={item.id} item={item} />
                  ))}
                </ScrollView>
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
    [groupedItems, sections, insets.top]
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
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      />

      {/* "Make outfits" button - opens full-screen outfit builder */}
      <View style={[styles.makeOutfitsContainer, { bottom: 88 + insets.bottom, right: 16 }]}>
        <Pressable
          style={styles.makeOutfitsButton}
          onPress={handleOpenSelectSheet}
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
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
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
    color: Colors.light.textSecondary,
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
  headerButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 100, // Above the bottom sheet
  },
  sheetContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  makeOutfitsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 6,
  },
  makeOutfitsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textPrimary,
  },
  uploadButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textOnDark,
  },
});
