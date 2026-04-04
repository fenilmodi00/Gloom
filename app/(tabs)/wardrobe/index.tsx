import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Text } from '@/components/ui/text';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { ClothPopup } from '@/components/wardrobe/ClothPopup';

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
import { Alert, Pressable, View, ImageSourcePropType } from 'react-native';
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

const CategoryCard = memo(
  ({ item, onPress }: {
    item: WardrobeItem;
    onPress?: (item: WardrobeItem, source?: ImageSourcePropType) => void;
  }) => {
    const imageUrl = getWardrobeItemImageUrl(item);
    const source = imageUrl ? { uri: imageUrl } : undefined;

    const { processingItems } = useWardrobeProcessingStore();
    const processingItem = processingItems[item.id];
    const isProcessing = processingItem?.status === 'pending' || processingItem?.status === 'processing';
    const isFailed = processingItem?.status === 'failed' || processingItem?.status === 'fallback';

    const handlePress = () => {
      onPress?.(item, source);
    };

    return (
      <Pressable onPress={handlePress} className="w-[120px] h-[150px] mr-3 bg-transparent">
        {/* Show skeleton for processing items */}
        {isProcessing && (
          <SkeletonCard width={CARD_WIDTH} height={CARD_HEIGHT} />
        )}
        {/* Display image (cutout when available, fallback to original) */}
        <Image
          source={source}
          className={`w-full h-full bg-transparent rounded-xl ${isFailed ? 'border border-chip-idle-border' : ''}`}
          style={{ opacity: isProcessing ? 0 : 1 }}
          contentFit="contain"
          transition={0} // Matches modal for instant cache share
          cachePolicy="disk" // Matches modal to ensure one single memory pull
          priority="high" // High priority to keep in memory
        />
        {isFailed && !isProcessing && (
          <View className="absolute top-1 right-1 bg-black/40 rounded px-1 py-0.5 items-center justify-center">
             <Text className="font-ui text-[10px] text-on-dark">Original</Text>
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
      className="py-4 px-4"
    >
      <View className="mb-2">
        <Pressable onPress={onSeeAll} className="flex-row items-center justify-between">
          <Text className="font-body font-medium text-text-secondary">{label}</Text>
          <ChevronRight size={16} color={Colors.light.textSecondary} />
        </Pressable>
      </View>

      <View style={{ height: CARD_HEIGHT }}>
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          estimatedItemSize={CARD_WIDTH + 12}
        />
      </View>
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

  useEffect(() => {
    if (isHydrated) {
      fetchItems();
    }
  }, [fetchItems, isHydrated]);

  const { processingItems } = useWardrobeProcessingStore();

  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    CATEGORY_CONFIG.forEach(({ key }) => {
      groups[key] = [];
    });

    items.forEach((item) => {
      const isProcessing =
        processingItems[item.id]?.status === 'pending' ||
        processingItems[item.id]?.status === 'processing';

      if (item.category && groups[item.category]) {
        groups[item.category].push(item);
      } else if (isProcessing && item.category === null) {
        // Processing items go to all categories based on previous logic, or just a specific one?
        // Previous logic: groups[key] = items.filter(..., (isProcessing && item.category === null)) -> means it went to ALL categories!
        // Let's replicate this behavior to keep it identical
        CATEGORY_CONFIG.forEach(({ key }) => {
           groups[key].push(item);
        });
      }
    });

    return groups;
  }, [items, processingItems]);

  const navigateToOutfitBuilder = useCallback(() => {
    router.push('/outfit-builder');
  }, [router]);

  const handleOpenSelectSheet = useCallback(() => {
    console.log('[Wardrobe] Opening outfit builder screen');
    navigateToOutfitBuilder();
  }, [navigateToOutfitBuilder]);

  const handleCloseSelectSheet = useCallback(() => { }, []);

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
    await removeItem(itemId);
    setIsModalVisible(false);
    setSelectedItem(null);
    setSelectedSource(undefined);
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
          className="pb-4 px-4"
          style={{ paddingTop: insets.top - 59 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="font-heading text-3xl color-text-primary">Closet</Text>
            <Pressable
              className="bg-primary px-4 py-2 rounded-full"
              onPress={() => navigateToAddItem('camera')}
            >
              <Text className="font-ui text-[13px] uppercase tracking-widest font-bold color-text-on-dark">Add item</Text>
            </Pressable>
          </View>

          {sections.length > 0 && (
            <>
              <View className="mb-2 mt-6">
                <Pressable className="flex-row items-center justify-between">
                  <Text className="font-body font-medium text-text-secondary">
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
        className="flex-1 bg-bg-canvas"
        style={{ paddingTop: insets.top }}
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
      className="flex-1 bg-bg-canvas"
      style={[
        animatedStyle,
        { paddingTop: insets.top },
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
        className="absolute"
        style={{ bottom: 88 + insets.bottom, right: 16 }}
      >
        <Pressable
          className="flex-row items-center bg-surface px-4 py-2.5 rounded-full gap-1.5 shadow-sm border border-black/5"
          onPress={handleOpenSelectSheet}
        >
          <Shirt size={16} color="#1A1A1A" />
          <Text className="font-ui text-[13px] uppercase tracking-widest font-bold color-text-primary">Make outfits</Text>
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
