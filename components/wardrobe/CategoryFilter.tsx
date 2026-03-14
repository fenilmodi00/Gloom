import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { Category } from '@/types/wardrobe';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: Category | 'all';
  onSelect: (category: Category | 'all') => void;
  counts?: Record<Category | 'all', number>;
}

const CATEGORY_LABELS: Record<Category | 'all', string> = {
  all: 'All',
  upper: 'Tops',
  lower: 'Bottoms',
  dress: 'Dresses',
  shoes: 'Shoes',
  bag: 'Bags',
  accessory: 'Accessories',
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  counts,
}: CategoryFilterProps) {
  const allCategories: (Category | 'all')[] = ['all', ...categories];

  return (
    <View className="bg-surface border-b border-gray-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {allCategories.map((category) => {
          const isActive = selectedCategory === category;
          const count = counts?.[category];

          return (
            <Pressable
              key={category}
              onPress={() => onSelect(category)}
              className={`mr-2 px-4 py-2 rounded-full border transition-colors ${
                isActive
                  ? 'bg-accent border-accent'
                  : 'bg-surface border-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isActive ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {CATEGORY_LABELS[category]}
                {count !== undefined && ` (${count})`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
