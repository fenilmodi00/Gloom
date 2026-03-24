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
          <View className="bg-[#EAE4DA] px-3 py-1 rounded-full">
            <Text className="text-[#1A1A1A] font-medium text-xs">
              {Math.round((outfit.ai_score || 0.95) * 100)}% match
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-[#1A1A1A] tracking-tight">{outfit.vibe}</Text>
        <Text className="text-[#6B6B6B] text-sm mt-1 leading-5">{outfit.color_reasoning}</Text>
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
            />
          </View>
        ))}
        {outfitItems.length === 0 && (
          <Text className="text-[#A89880] my-4 text-sm">No item images available</Text>
        )}
      </View>

      {/* Try On CTA */}
      <View className="px-5 pb-5 pt-2">
        <TouchableOpacity
          onPress={handleTryOn}
          style={styles.tryOnButton}
          activeOpacity={0.85}
        >
          <Text className="text-[#FDFAF6] font-semibold text-sm tracking-wide">✦ Try On</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDFAF6',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.08)',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  imageWrapper: {
    width: '46%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#EAE4DA',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FDFAF6',
  },
  tryOnButton: {
    backgroundColor: '#8B7355',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
