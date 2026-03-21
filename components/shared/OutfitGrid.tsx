import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { DottedBackground } from './DottedBackground';
import { SkeletonImage } from './SkeletonImage';
import type { OutfitItem } from '@/types/inspo';

export interface OutfitGridProps {
  items: OutfitItem[]; // length must be 4
}

export function OutfitGridCell({ item }: { item: OutfitItem }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View className="w-1/2 h-[50%] items-center justify-center p-1">
      <View className="w-24 h-24 items-center justify-center mb-2 relative">
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center z-10">
            <SkeletonImage width={96} height={96} borderRadius={8} />
          </View>
        )}
        <Image
          source={item.image}
          className="w-full h-full"
          contentFit="contain"
          onLoad={() => setIsLoading(false)}
          transition={200}
        />
      </View>
      <Text className="text-sm font-medium text-[#6B6B6B]">
        {item.label}
      </Text>
    </View>
  );
}

export function OutfitGrid({ items }: OutfitGridProps) {
  // Ensure we display exactly a 2x2 grid (4 items)
  const gridItems = items.slice(0, 4);

  return (
    <DottedBackground>
      <View className="flex-1 flex-row flex-wrap p-6 gap-2 justify-center content-center">
      {gridItems.map((item) => (
        <OutfitGridCell key={item.id} item={item} />
      ))}
      </View>
    </DottedBackground>
  );
}
