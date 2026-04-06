import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { SkeletonCard as CategorySpecificSkeletonCard } from '@/components/shared/WardrobeSkeleton';
import { Text } from '@/components/ui/text';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { ClothPopup } from '@/components/wardrobe/ClothPopup';

import { Typography } from '@/constants/Typography';
import { useTabAnimation } from '@/lib/hooks/useTabAnimation';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { useWardrobeProcessingStore } from '@/lib/store/wardrobe-processing.store';
import { useOutfitBuilderStore } from '@/lib/store/outfit-builder.store';
import { getWardrobeItemImageUrl } from '@/lib/wardrobe-image';
import type { Category, WardrobeItem, ProcessingStatus } from '@/types/wardrobe';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Shirt } from 'lucide-react-native';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, ImageSourcePropType } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '@/components/shared/Toast';

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

const CategoryCard = memo(
  ({ item, onPress }: {
    item: WardrobeItem;
    onPress?: (item: WardrobeItem, source?: ImageSourcePropType) => void;
  }) => {
    const imageUrl = getWardrobeItemImageUrl(item);
    const source = imageUrl ? { uri: imageUrl } : undefined;
    
    // Determine if we should show skeleton (no imageUrl during processing)
    const isProcessingItem = item.processing_status === 'processing' || item.processing_status === 'analyzing';
    const showSkeleton = !imageUrl && isProcessingItem;

    const { processingItems } = useWardrobeProcessingStore();
    const processingItem = processingItems[item.id];
    const isProcessing = processingItem?.status === 'pending' || processingItem?.status === 'processing';
    const isAnalyzing = processingItem?.status === 'analyzing';
    const isFailed = processingItem?.status === 'failed' || processingItem?.status === 'fallback';

    const handlePress = () => {
      onPress?.(item, source);
    };

    return (
      <Pressable onPress={handlePress} style={styles.cardContainer}>
        {/* Show category-specific skeleton for analyzing items with category */}
         {isAnalyzing && item.category && (
           <CategorySpecificSkeletonCard 
             variant={item.category === 'accessories' ? 'default' : item.category} 
           />
         )}
        {/* Show generic skeleton for processing/pending items or when imageUrl is null during processing */}
        {(isProcessing || showSkeleton) && (
          <SkeletonCard width={CARD_WIDTH} height={CARD_HEIGHT} />
        )}
        {/* Display image whenever a URL is available (cutout or original) */}
        {imageUrl && (
          <Image
            source={source}
            style={[
              styles.cardImage,
              isFailed && { borderWidth: 1, borderColor: Colors.light.chipIdleBorder },
              (isProcessing || isAnalyzing) && { opacity: 0.6 } // Dim while processing
            ]}
            contentFit="contain"
            transition={0}
            cachePolicy="disk"
            priority="high"
          />
        )}
        {isFailed && !isProcessing && !isAnalyzing && (
          <View style={styles.processingOverlay}>
             <Text style={[styles.statusBadgeText, { fontSize: 10 }]}>Original</Text>
          </View>
        )}
      </Pressable>
    );
  }
);

function CategorySection({
  label,
  items,
  onSeeAll,
  onItemPress,
}: {
  label: string;
  items: WardrobeItem[];
  onSeeAll?: () => void;
  onItemPress?: (item: WardrobeItem) => void;
}) {
  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => (
      <CategoryCard item={item} onPress={onItemPress} />
    ),
    [onItemPress]
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
        estimatedItemSize={CARD_WIDTH + 12}
      />
   </LinearGradient>
  );
}


export default function WardrobeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items: storeItems, isLoading, isHydrated, fetchItems, removeItem } =
    useWardrobeStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<ImageSourcePropType | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { animatedStyle } = useTabAnimation('wardrobe/index');

  const items = storeItems;

  // Fetch items when screen comes into focus to get latest data (including processed cutouts)
  useFocusEffect(
    useCallback(() => {
      if (isHydrated) {
        fetchItems();
      }
    }, [fetchItems, isHydrated])
  );

  const { processingItems } = useWardrobeProcessingStore();
  
  // Sync Sentinel: Recover any processing items that aren't being tracked (e.g. after a refresh)
  useEffect(() => {
    if (!isHydrated || items.length === 0) return;
    
    items.forEach(item => {
      // Only recover RECENT items (last 5 minutes) to avoid infinite loops with stuck history
      const createdDate = new Date(item.created_at);
      const isRecent = (Date.now() - createdDate.getTime()) < 5 * 60 * 1000;
      
      const isProcessingInDB = 
        item.processing_status === 'pending' || 
        item.processing_status === 'processing' || 
        item.processing_status === 'analyzing';
      
      const isTracked = !!processingItems[item.id];
      
      if (isRecent && isProcessingInDB && !isTracked) {
        console.log(`[SyncSentinel] Recovering recent orphaned item: ${item.id} (${item.processing_status})`);
        useWardrobeProcessingStore.getState().startProcessing(item.id);
      }
    });
  }, [items, isHydrated]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    CATEGORY_CONFIG.forEach(({ key }) => {
      groups[key] = [];
    });

    items.forEach((item) => {
      const pItem = processingItems[item.id];
      const status = pItem?.status || item.processing_status;
      const isProcessing =
        status === 'pending' ||
        status === 'processing' || 
        status === 'analyzing';

      // Use the category from the item (updated via store sync)
      const category = item.category;

      // Skip items with no category unless they are still in the active processing flow
      // (Even then, we can't group them without a category, so we skip until Gemini sets it)
      if (!category) return;

      if (groups[category]) {
        groups[category].push(item);
      }
    });

    return groups;
  }, [items, processingItems]);

  const navigateToOutfitBuilder = useCallback(() => {
    router.push('/outfit-builder');
  }, [router]);

  const handleOpenSelectSheet = useCallback(() => {
    navigateToOutfitBuilder();
  }, [navigateToOutfitBuilder]);

  const handleEmptyAdd = () => {
    navigateToAddItem('camera');
  };

  const navigateToAddItem = useCallback((method: 'camera' | 'gallery') => {
    setIsAddSheetOpen(false);
    router.push({
      pathname: '/(tabs)/wardrobe/add-item',
      params: { method, origin: 'wardrobe' },
    });
  }, [router]);

  const handleItemPress = useCallback((item: WardrobeItem, source?: ImageSourcePropType) => {
    setSelectedItem(item);
    setSelectedSource(source);
    setIsModalVisible(true);
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      await removeItem(itemId);
      setIsModalVisible(false);
      setSelectedItem(null);
      setSelectedSource(undefined);
      showToast({ type: 'success', message: 'Item removed from wardrobe' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to remove item' });
    }
  }, [removeItem]);

  const handleMakeOutfit = useCallback((item: WardrobeItem) => {
    const { toggleItem } = useOutfitBuilderStore.getState();
    toggleItem(item);
    setIsModalVisible(false);
    setSelectedItem(null);
    setSelectedSource(undefined);
    router.push('/outfit-builder');
  }, [router]);

  const sections = useMemo(() => {
    return CATEGORY_CONFIG.filter(({ key }) => groupedItems[key]?.length > 0);
  }, [groupedItems]);

  const renderItem = useCallback(
  ({
    item,
    index,
  }: {
    item: (typeof CATEGORY_CONFIG)[0] | 'header';
    index: number;
  }) => {
    if (item === 'header') {
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
              <View style={{ height: CARD_HEIGHT }}>
                <FlashList
                  data={groupedItems[sections[0].key] || []}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <CategoryCard item={item} onPress={handleItemPress} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.sectionContent}
                  estimatedItemSize={CARD_WIDTH + 12}
                />
              </View>
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
        onItemPress={handleItemPress}
      />
    );
  },
  [groupedItems, sections, insets.top, navigateToAddItem, handleItemPress]
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
            showToast({ type: 'info', message: 'Search web coming soon' })
          }
          onOutfitPress={() =>
            showToast({ type: 'info', message: 'Outfit import coming soon' })
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
        estimatedItemSize={200}
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

      <ClothPopup
        visible={isModalVisible}
        item={selectedItem}
        source={selectedSource}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedSource(undefined);
        }}
        onDelete={handleDeleteItem}
        onMakeOutfit={handleMakeOutfit}
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
  statusBadgeText: {
    ...Typography.uiLabelMedium,
    color: Colors.light.textOnDark,
  },
  processingOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
