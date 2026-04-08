import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { OccasionBadge } from './OccasionBadge';
import { Outfit } from '../../lib/store/outfit.store';
import { useWardrobeStore } from '../../lib/store/wardrobe.store';
import { getWardrobeImageUrl } from '../../lib/wardrobe-image';

interface OutfitCardProps {
  outfit: Outfit;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const { items } = useWardrobeStore();

  // Create a Map for O(1) lookups
  const itemMap = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  // Find the actual wardrobe items for this outfit
  const outfitItems = useMemo(() => 
    outfit.item_ids
      .map((id) => itemMap.get(id))
      .filter(Boolean),
    [itemMap, outfit.item_ids]
  );

  const handleTryOn = () => {
    Alert.alert('Coming Soon', 'Virtual Try-On will be available in Phase 2!');
  };

  return (
    <View
      className="bg-[#FDFAF6] rounded-3xl overflow-hidden mb-5 border border-[#8B7355]/10 shadow-xl shadow-[#8B7355]/10"
      style={{ elevation: 4 }}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row justify-between items-start mb-2">
          <OccasionBadge occasion={outfit.occasion || ''} />
          <View className="bg-bgMuted px-3 py-1 rounded-full">
            <Text className="text-textPrimary font-product text-xs">
              {Math.round((outfit.ai_score || 0.95) * 100)}% match
            </Text>
          </View>
        </View>
        <Text className="text-lg font-heading text-textPrimary tracking-tight">{outfit.vibe || ''}</Text>
        <Text className="text-textSecondary text-sm mt-1 leading-5 font-body">{outfit.color_reasoning}</Text>
      </View>

      {/* Item images grid */}
      <View className="flex-row flex-wrap px-5 py-3 gap-2 justify-center">
        {outfitItems.map((item, index) => {
          const imageUrl = item?.image_url ? getWardrobeImageUrl(item.image_url) : null;
          return (
            <View
              key={item?.id ?? index}
              className="w-[46%] aspect-[3/4] rounded-2xl bg-[#EAE4DA] overflow-hidden border-4 border-[#FDFAF6]"
            >
              <Image
                source={imageUrl ? { uri: imageUrl as string } : undefined}
                className="absolute inset-0 w-full h-full"
                contentFit="cover"
              />
            </View>
          );
        })}
        {outfitItems.length === 0 && (
          <Text className="text-textTertiary my-4 text-sm font-body">No item images available</Text>
        )}
      </View>

      {/* Try On CTA */}
      <View className="px-5 pb-5 pt-2">
        <TouchableOpacity
          onPress={handleTryOn}
          className="bg-[#8B7355] py-3.5 rounded-full items-center justify-center"
          activeOpacity={0.85}
        >
          <Text className="text-bgSurface font-ui uppercase text-sm tracking-wide">✦ Try On</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
