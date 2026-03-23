import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Shoes', 'Bags', 'Accessories'];

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <View className="mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4" contentContainerStyle={{ paddingRight: 32 }}>
        {CATEGORIES.map((category) => {
          const isSelected = activeCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => onSelectCategory(category)}
              className={`mr-2 px-5 py-2 rounded-full border ${
                isSelected 
                  ? 'bg-chipActiveBg border-chipActiveBg' 
                  : 'bg-chipIdleBg border-chipIdleBorder'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isSelected ? 'text-chipActiveText' : 'text-textSecondary'
                }`}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
