import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import {
  WardrobeSkeleton,
  SkeletonCard,
  SkeletonVariant,       // ← CHANGED: import the type
} from '@/components/shared/WardrobeSkeleton';
import { Text } from '@/components/ui/text';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';

import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import type { Category, WardrobeItem } from '@/types/wardrobe';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
import { FlashList } from '@shopify/flash-list';
import { Typography } from '@/constants/Typography';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Shirt, Plus } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Category configuration
const CATEGORY_CONFIG: { key: Category; label: string }[] = [
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'fullbody', label: 'Full Body' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'bags', label: 'Bags' },
  { key: 'accessories', label: 'Accessories' },
];

import Colors from '@/constants/Colors';

const GRADIENT_START = Colors.light.bgCanvas;
const GRADIENT_END = Colors.light.bgSurfaceRaised;

const CARD_WIDTH = 120;
const CARD_HEIGHT = 150;


// ─────────────────────────────────────────────
// ← CHANGED: maps a category key → skeleton variant
// ─────────────────────────────────────────────
const getCategoryVariant = (key: Category): SkeletonVariant => {
  const map: Partial<Record<Category, SkeletonVariant>> = {
    tops: 'tops',
    bottoms: 'bottoms',
    shoes: 'shoes',
    bags: 'bags',
  };
  return map[key] ?? 'default';
};


interface CategorySectionProps {
  label: string;
  items: WardrobeItem[];
  index: number;
  categoryKey: Category;   // ← CHANGED: added
  onSeeAll?: () => void;
}


// ← CHANGED: CategoryCard now accepts a variant prop
const CategoryCard = memo(
  ({
    item,
    variant = 'default',
  }: {
    item: WardrobeItem;
    variant?: SkeletonVariant;
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const uri = item.cutout_url || item.image_url;
    const source = typeof uri === 'string' ? { uri } : uri;

    return (
      <View style={styles.cardContainer}>
        {/* ← CHANGED: pass variant so skeleton matches the category */}
        {!isLoaded && <SkeletonCard variant={variant} />}
        <Image
          source={source as any}
          style={[styles.cardImage, { opacity: isLoaded ? 1 : 0 }]}
          contentFit="contain"
          onLoad={() => setIsLoaded(true)}
        />
      </View>
    );
  }
);


// ← CHANGED: CategorySection derives variant from categoryKey and passes it down
function CategorySection({
  label,
  items,
  categoryKey,
  onSeeAll,
}: CategorySectionProps) {
  const variant = getCategoryVariant(categoryKey); // ← CHANGED

  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => (
      <CategoryCard item={item} variant={variant} /> // ← CHANGED
    ),
    [variant]
  );

  if (items.length === 0) return null;

  return (
    <LinearGradient
      colors={[GRADIENT_START, GRADIENT_END]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientSection}
    >
      <View style={styles.sectionHeaderRow}>
        <Pressable onPress={onSeeAll} style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <ChevronRight size={16} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

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
  const { items: storeItems, isLoading, isHydrated, fetchItems } =
    useWardrobeStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const { animatedStyle } = useTabAnimation('wardrobe/index');

  const items = storeItems;

  useEffect(() => {
    if (isHydrated) {
      fetchItems();
    }
  }, [fetchItems, isHydrated]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    CATEGORY_CONFIG.forEach(({ key }) => {
      groups[key] = items.filter((item) => item.category === key);
    });
    return groups;
  }, [items]);

  const navigateToOutfitBuilder = useCallback(() => {
    router.push('/outfit-builder');
  }, [router]);

  const handleOpenSelectSheet = useCallback(() => {
    console.log('[Wardrobe] Opening outfit builder screen');
    navigateToOutfitBuilder();
  }, [navigateToOutfitBuilder]);

  const handleCloseSelectSheet = useCallback(() => {}, []);

  const handleEmptyAdd = () => {
    navigateToAddItem('camera');
  };

  const navigateToAddItem = (method: 'camera' | 'gallery') => {
    setIsAddSheetOpen(false);
    router.push({
      pathname: '/(tabs)/wardrobe/add-item',
      params: { method, origin: 'wardrobe' },
    });
  };

  const sections = useMemo(() => {
    return CATEGORY_CONFIG.filter(({ key }) => groupedItems[key]?.length > 0);
  }, [groupedItems]);

  const firstCategoryRenderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => <CategoryCard item={item} />,
    []
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: (typeof CATEGORY_CONFIG)[0] | 'header';
      index: number;
    }) => {
      if (item === 'header') {
        // ← CHANGED: derive variant for first category in header
        const firstVariant =
          sections.length > 0
            ? getCategoryVariant(sections[0].key)
            : 'default';

        return (
          <LinearGradient
            colors={[GRADIENT_START, GRADIENT_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.headerWithFirstCategory,
              { paddingTop: insets.top - 59 },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Closet</Text>
              <Pressable
                style={styles.uploadButton}
                onPress={() => navigateToAddItem('camera')}
              >
                <Text style={styles.uploadText}>Add item</Text>
              </Pressable>
            </View>

            {sections.length > 0 && (
              <>
                <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
                  <Pressable style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>
                      {sections[0].label}
                    </Text>
                    <ChevronRight
                      size={16}
                      color={Colors.light.textSecondary}
                    />
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sectionContent}
                >
                  {/* ← CHANGED: pass firstVariant down to each card */}
                  {(groupedItems[sections[0].key] || []).map((item) => (
                    <CategoryCard
                      key={item.id}
                      item={item}
                      variant={firstVariant}
                    />
                  ))}
                </ScrollView>
              </>
            )}
          </LinearGradient>
        );
      }

      const sectionIndex = sections.findIndex((s) => s.key === item.key);
      if (sectionIndex === 0) return null;

      return (
        <CategorySection
          label={item.label}
          items={groupedItems[item.key] || []}
          index={index}
          categoryKey={item.key}   // ← CHANGED: pass key for variant lookup
        />
      );
    },
    [groupedItems, sections, insets.top]
  );

  const listData = useMemo(() => {
    return ['header', ...sections] as ((typeof sections)[0] | 'header')[];
  }, [sections]);

  if (!isHydrated && items.length === 0) {
    return <LoadingOverlay message="Loading wardrobe..." />;
  }

  if (items.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: Colors.light.bgCanvas },
        ]}
      >
        <EmptyState
          title="Your closet is empty"
          description="Start building your digital closet to get personalized outfit suggestions."
          buttonTitle="Add item"
          onPress={handleEmptyAdd}
          onSearchPress={() =>
            Alert.alert(
              'Coming Soon',
              'Search web will be available in a future update.'
            )
          }
          onOutfitPress={() =>
            Alert.alert(
              'Coming Soon',
              'Add items from outfit will be available soon.'
            )
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
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { paddingTop: insets.top, backgroundColor: Colors.light.bgCanvas },
      ]}
    >
      <FlashList
        data={listData}
        keyExtractor={(item, index) =>
          item === 'header' ? 'header' : item.key
        }
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      />

      <View
        style={[
          styles.makeOutfitsContainer,
          { bottom: 88 + insets.bottom, right: 16 },
        ]}
      >
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
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgCanvas,
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
    ...Typography.heading1,
    color: Colors.light.textPrimary,
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
    ...Typography.body,
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
    zIndex: 100,
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
    ...Typography.uiLabelMedium,
    color: Colors.light.textPrimary,
  },
  uploadButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.textOnDark,
  },
});
