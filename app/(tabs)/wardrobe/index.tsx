import React, { useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Fab, FabIcon } from '@/components/ui/fab';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobeStore } from '@/lib/store/wardrobe.store';
import { ItemCard } from '@/components/wardrobe/ItemCard';
import { CategoryFilter } from '@/components/wardrobe/CategoryFilter';
import { AddItemSheet } from '@/components/wardrobe/AddItemSheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

export default function WardrobeScreen() {
  const router = useRouter();
  const { items, isLoading, fetchItems, deleteItem } = useWardrobeStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // Initial fetch
  React.useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => item.category === activeCategory.toLowerCase());
  }, [items, activeCategory]);

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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4 pb-2">
        <Heading size="2xl" className="text-text-primary">
          Wardrobe
        </Heading>
      </View>

      {isLoading && items.length === 0 ? (
        <LoadingOverlay message="Loading wardrobe..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wardrobe is empty"
          description="Start building your digital closet to get personalized outfit suggestions."
          buttonTitle="Add item"
          onPress={handleEmptyAdd}
        />
      ) : (
        <View className="flex-1">
          <View className="mb-4">
            <CategoryFilter
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </View>
          
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerClassName="px-4 pb-24"
            columnWrapperClassName="justify-between"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
               <View className="w-[48%] mb-4">
                 <ItemCard
                   item={item}
                   onPress={() => console.log('View item', item.id)}
                 />
               </View>
            )}
            ListEmptyComponent={() => (
              <View className="items-center justify-center p-8 mt-10">
                 <Text className="text-text-secondary text-center">
                   No items found for this category.
                 </Text>
              </View>
            )}
          />

          <Fab
            size="md"
            placement="bottom right"
            isHovered={false}
            isDisabled={false}
            isPressed={false}
            onPress={() => setIsAddSheetOpen(true)}
            className="bg-accent mb-20 z-50 absolute bottom-4 right-4"
          >
            <FabIcon as={Plus} className="text-white" />
          </Fab>
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
