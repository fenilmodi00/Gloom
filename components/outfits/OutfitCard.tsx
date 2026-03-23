import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { OccasionBadge } from './OccasionBadge';
import { Outfit } from '../../lib/store/outfit.store';
import { useWardrobeStore } from '../../lib/store/wardrobe.store';

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
    <View style={styles.card}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row justify-between items-start mb-2">
          <OccasionBadge occasion={outfit.occasion} />
          <View className="bg-[#F2F0E9] px-3 py-1 rounded-full">
            <Text className="text-[#2D2F1D] font-medium text-xs">
              {Math.round((outfit.ai_score || 0.95) * 100)}% match
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-[#2D2F1D] tracking-tight">{outfit.vibe}</Text>
        <Text className="text-[#2D2F1D]/50 text-sm mt-1 leading-5">{outfit.color_reasoning}</Text>
      </View>

      {/* Item images grid */}
      <View className="flex-row flex-wrap px-5 py-3 gap-2 justify-center">
        {outfitItems.map((item, index) => (
          <View
            key={item?.id ?? index}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: item?.image_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          </View>
        ))}
        {outfitItems.length === 0 && (
          <Text className="text-[#2D2F1D]/30 my-4 text-sm">No item images available</Text>
        )}
      </View>

      {/* Try On CTA */}
      <View className="px-5 pb-5 pt-2">
        <TouchableOpacity
          onPress={handleTryOn}
          style={styles.tryOnButton}
          activeOpacity={0.85}
        >
          <Text className="text-[#F2F0E9] font-semibold text-sm tracking-wide">✦ Try On</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.06)',
    shadowColor: '#2D2F1D',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 6,
  },
  imageWrapper: {
    width: '46%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#F2F0E9',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  tryOnButton: {
    backgroundColor: '#2D2F1D',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
