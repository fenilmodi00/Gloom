import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { WardrobeItem } from '@/types/wardrobe';

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: () => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-full bg-surface rounded-2xl overflow-hidden shadow-sm mb-4"
    >
      <View className="w-full aspect-square bg-[#F8F8F8]">
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-full"
          contentFit="cover"
          transition={200}
        />
      </View>
      <View className="p-3">
        <Text className="text-sm font-bold text-text-primary capitalize">
          {item.sub_category || item.category}
        </Text>
        {item.colors && item.colors.length > 0 && (
          <Text className="text-xs text-text-secondary mt-1 capitalize">
            {item.colors.join(', ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
