import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Dimensions, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, Shirt } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { ItemCard } from '@/components/wardrobe/ItemCard';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import type { Category, WardrobeItem } from '@/types/wardrobe';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 8;
const ITEMS_PER_ROW = 4;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - ITEM_MARGIN * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

// Category display config — matches the Aesty closet screenshot
const CATEGORY_CONFIG: { key: Category | 'all'; label: string }[] = [
  { key: 'upper', label: 'upper body' },
  { key: 'lower', label: 'lower body' },
  { key: 'dress', label: 'dresses' },
  { key: 'shoes', label: 'shoes' },
  { key: 'bag', label: 'bags' },
  { key: 'accessory', label: 'accessories' },
];

interface CategorySectionProps {
  label: string;
  items: WardrobeItem[];
  onSeeAll?: () => void;
}

function CategorySection({ label, items, onSeeAll }: CategorySectionProps) {
  if (items.length === 0) return null;

  // Chunk items into rows of ITEMS_PER_ROW
  const rows: WardrobeItem[][] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
    rows.push(items.slice(i, i + ITEMS_PER_ROW));
  }

  return (
    <View style={styles.section}>
      {/* Section header */}
      <Pressable
        onPress={onSeeAll}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionLabel}>{label}</Text>
        <ChevronRight size={16} color="#6B6B6B" />
      </Pressable>

      {/* Items grid — show rows inline */}
      <View style={styles.sectionItems}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.itemRow}>
            {row.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                size={ITEM_SIZE}
                onPress={() => console.log('View item', item.id)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function WardrobeScreen() {
  const router = useRouter();
  const { items, isLoading, fetchItems } = useWardrobeStore();
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // Initial fetch
  React.useEffect(() => {
    fetchItems();
  }, []);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, WardrobeItem[]> = {};
    CATEGORY_CONFIG.forEach(({ key }) => {
      groups[key] = items.filter((item) => item.category === key);
    });
    return groups;
  }, [items]);

  const handleEmptyAdd = () => {
    setIsAddSheetOpen(true);
  };

  const navigateToAddItem = (method: 'camera' | 'gallery') => {
    setIsAddSheetOpen(false);
    router.push({
      pathname: '/(tabs)/wardrobe/add-item',
      params: { method },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — "Closet" + circular "+" */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Closet</Text>
        <Pressable
          onPress={() => setIsAddSheetOpen(true)}
          style={styles.addButton}
        >
          <Plus size={24} color="#1A1A1A" />
        </Pressable>
      </View>

      {isLoading && items.length === 0 ? (
        <LoadingOverlay message="Loading wardrobe..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your closet is empty"
          description="Start building your digital closet to get personalized outfit suggestions."
          buttonTitle="Add item"
          onPress={handleEmptyAdd}
          onSearchPress={() => Alert.alert('Coming Soon', 'Search web will be available in a future update.')}
          onOutfitPress={() => Alert.alert('Coming Soon', 'Add items from outfit will be available soon.')}
        />
      ) : (
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {CATEGORY_CONFIG.map(({ key, label }) => (
              <CategorySection
                key={key}
                label={label}
                items={groupedItems[key] || []}
              />
            ))}

            {/* Spacer for bottom bar + Make outfits button */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* "Make outfits" floating button */}
          <View style={styles.makeOutfitsContainer}>
            <Pressable
              style={styles.makeOutfitsButton}
              onPress={() => router.push('/(tabs)/outfits' as any)}
            >
              <Shirt size={18} color="#1A1A1A" />
              <Text style={styles.makeOutfitsText}>Make outfits</Text>
            </Pressable>
          </View>
        </View>
      )}

      <AddItemSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSelectMethod={navigateToAddItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B6B6B',
    marginRight: 4,
  },
  sectionItems: {
    // Items laid out in rows
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  makeOutfitsContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
  },
  makeOutfitsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  makeOutfitsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
