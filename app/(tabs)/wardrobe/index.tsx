import React, { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWardrobeStore, useFilteredItems } from '@/lib/store/wardrobe.store';
import { useAuthStore } from '@/lib/store/auth.store';
import type { WardrobeItem, Category } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2;

const CATEGORIES: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upper', label: 'Tops' },
  { id: 'lower', label: 'Bottoms' },
  { id: 'dress', label: 'Dresses' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'bag', label: 'Bags' },
  { id: 'accessory', label: 'Accessories' },
];

function CategoryFilter() {
  const { selectedCategory, setCategory } = useWardrobeStore();
  
  return (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === item.id && styles.filterChipActive,
            ]}
            onPress={() => setCategory(item.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === item.id && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function ItemCard({ item }: { item: WardrobeItem }) {
  return (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory} numberOfLines={1}>
          {item.sub_category || item.category}
        </Text>
        {item.colors && item.colors.length > 0 && (
          <View style={styles.colorDots}>
            {item.colors.slice(0, 3).map((color, index) => (
              <View
                key={index}
                style={[styles.colorDot, { backgroundColor: color }]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function EmptyState({ onAddItem }: { onAddItem: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👗</Text>
      <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add your first item to get started
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={onAddItem}>
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchItems } = useWardrobeStore();
  const items = useFilteredItems();

  // Fetch items on mount
  useEffect(() => {
    if (user?.id) {
      fetchItems(user.id);
    }
  }, [user?.id]);

  const handleAddItem = useCallback(() => {
    router.push('/(tabs)/wardrobe/add-item');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => <ItemCard item={item} />,
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wardrobe</Text>
        <TouchableOpacity style={styles.addButtonHeader} onPress={handleAddItem}>
          <Text style={styles.addButtonHeaderText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <CategoryFilter />

      {items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState onAddItem={handleAddItem} />
      )}
    </View>
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
    paddingVertical: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#1A1A1A',
    fontStyle: 'italic',
  },
  addButtonHeader: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#8B7355',
  },
  filterChipText: {
    color: '#6B6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  itemCard: {
    width: COLUMN_WIDTH,
    marginBottom: 16,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: COLUMN_WIDTH * 1.2,
    backgroundColor: '#F0EDE8',
  },
  itemInfo: {
    padding: 12,
  },
  itemCategory: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  colorDots: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0DDD5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#8B7355',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
