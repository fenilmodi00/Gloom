import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import type { WardrobeItem } from '@/types/wardrobe';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 8;
const ITEMS_PER_ROW = 4;
const ITEM_SIZE = (SCREEN_WIDTH - 32 - ITEM_MARGIN * (ITEMS_PER_ROW - 1)) / ITEMS_PER_ROW;

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: () => void;
  size?: number;
}

export function ItemCard({ item, onPress, size }: ItemCardProps) {
  const cardSize = size || ITEM_SIZE;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: cardSize,
        height: cardSize,
        marginRight: ITEM_MARGIN,
        marginBottom: ITEM_MARGIN,
      }}
    >
      <Image
        source={(item.cutout_url || item.image_url) as any}
        style={{
          width: '100%',
          height: '100%',
        }}
        contentFit="contain"
      />
    </Pressable>
  );
}
