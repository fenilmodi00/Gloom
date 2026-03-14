import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { InspoItem } from '@/types/inspo';

interface InspoCardProps {
  item: InspoItem;
}

export function InspoCard({ item }: InspoCardProps) {
  const handleTryOn = () => {
    // Phase 2 feature - show stub toast
    console.log('Try-on coming in Phase 2');
  };

  return (
    <Pressable
      className="w-[180px] mr-3 rounded-2xl overflow-hidden bg-surface shadow-sm h-[260px]"
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="flex-1 w-full"
        contentFit="cover"
        transition={200}
        recyclingKey={item.id}
      />
      <View className="p-2">
        <Text className="text-sm font-medium text-text-primary mb-2" numberOfLines={1}>
          {item.title}
        </Text>
        <Pressable
          onPress={handleTryOn}
          className="bg-accent-light py-2 px-3 rounded-full self-start"
        >
          <Text className="text-xs font-medium text-accent">✦ Try On</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
