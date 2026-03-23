import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { SkeletonImage } from './SkeletonImage';
import type { OutfitItem } from '@/types/inspo';

export interface OutfitGridProps {
  items: OutfitItem[]; // length must be 4
  onItemPress?: (item: OutfitItem) => void;
}

const CELL_SIZE = 112;

export function OutfitGridCell({ item, onPress }: { item: OutfitItem; onPress?: () => void }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <View className="w-1/2 items-center justify-start p-1">
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        className="active:opacity-70"
      >
        {/* Explicit dimensions + warm background so transparent PNGs show */}
        <View
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: '#F0EDE8',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center z-10">
              <SkeletonImage
                width={CELL_SIZE}
                height={CELL_SIZE}
                borderRadius={8}
              />
            </View>
          )}
          <Image
            source={item.image}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
            contentFit="contain"
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            transition={200}
          />
        </View>
        <Text className="text-sm font-medium text-[#6B6B6B] text-center">
          {item.label}
        </Text>
      </Pressable>
    </View>
  );
}

export function OutfitGrid({ items, onItemPress }: OutfitGridProps) {
  const gridItems = items.slice(0, 4);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#EBEBEB',
        padding: 24,
        gap: 8,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
        }}
      >
        {gridItems.map((item) => (
          <OutfitGridCell
            key={item.id}
            item={item}
            onPress={onItemPress ? () => onItemPress(item) : undefined}
          />
        ))}
      </View>
    </View>
  );
}
