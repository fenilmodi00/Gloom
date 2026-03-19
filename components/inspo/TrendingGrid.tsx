import React from 'react';
import { View, Text, FlatList, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import type { TrendingSection, TrendingItem } from '@/types/inspo';

export interface TrendingGridProps {
  sections: TrendingSection[];
  onTryOnPress?: (item: TrendingItem) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2; // 24px padding on each side, 12px gap
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export function TrendingGrid({ sections, onTryOnPress }: TrendingGridProps) {
  const renderItem = ({ item }: { item: TrendingItem }) => (
    <View 
      className="rounded-2xl overflow-hidden bg-white shadow-sm"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, elevation: 4 }}
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-full"
        contentFit="cover"
        transition={200}
      />
      <Pressable 
        className="absolute bottom-3 self-center bg-white/95 py-2 px-4 rounded-full min-w-[80px] items-center shadow-sm"
        style={{ elevation: 2 }}
        onPress={() => onTryOnPress?.(item)}
      >
        <Text className="text-[13px] font-semibold text-[#1A1A1A]">Try on</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 pb-10">
      <Text className="text-[22px] font-semibold text-[#1A1A1A] mb-5">Trending ideas</Text>
      
      {sections.map((section) => (
        <View key={section.id} className="mb-7">
          <Text className="text-base font-medium text-[#6B6B6B] mb-3 normal-case">{section.title}</Text>
          
          <FlatList
            data={section.items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          />
        </View>
      ))}
    </View>
  );
}
