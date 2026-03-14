import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { WardrobeItem } from '@/types/wardrobe';

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: (item: WardrobeItem) => void;
}

export function ItemCard({ item, onPress }: ItemCardProps) {
  const imageUrl = item.cutout_url || item.image_url;

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      className="flex-1 m-1 rounded-2xl overflow-hidden bg-surface shadow-sm aspect-[3/4]"
    >
      <Image
        source={{ uri: imageUrl }}
        className="flex-1 w-full"
        contentFit="cover"
        transition={200}
        recyclingKey={item.id}
      />
      <View className="p-2">
        {item.sub_category && (
          <Text className="text-xs text-text-secondary capitalize">
            {item.sub_category}
          </Text>
        )}
        {item.colors && item.colors.length > 0 && (
          <View className="flex-row mt-1">
            {item.colors.slice(0, 3).map((color, index) => (
              <View
                key={index}
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
