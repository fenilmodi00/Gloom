/**
 * SelectedItemsRow
 * 
 * Shows selected items as pills in a blurred row at the bottom of the screen.
 * Replaces the tab bar when the SelectItemsSheet is open.
 * Uses expo-blur for frosted glass effect.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X, Sparkles } from 'lucide-react-native';

import type { WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore, useSelectedItemsArray, useSelectedItems } from '@/lib/store/outfit-builder.store';
import { categoryToSlot } from '@/lib/outfit-mapping';
import { calculateOutfitScore } from '@/lib/outfit-scoring';

// Category labels for pills
const CATEGORY_LABELS: Record<string, string> = {
  upper: 'Top',
  lower: 'Bottom',
  dress: 'Dress',
  shoes: 'Shoes',
  bag: 'Bag',
  accessory: 'Acc.',
};

// Pill for a single selected item
interface SelectedItemPillProps {
  item: WardrobeItem;
  onRemove: () => void;
}

const SelectedItemPill = React.memo(({ item, onRemove }: SelectedItemPillProps) => (
  <View className="flex-row items-center bg-white/90 rounded-full pl-[6px] pr-[8px] py-[6px] gap-1.5 border border-primary/20">
    <Image
      source={
        typeof item.image_url === 'string' && item.image_url.startsWith('http')
          ? { uri: (item.cutout_url || item.image_url) as string }
          : (item.image_url as any)
      }
      className="w-7 h-7 rounded-full bg-bgSurfaceRaised"
      contentFit="cover"
      transition={150}
    />
    <Text className="text-xs font-medium text-textPrimary max-w-[50px]" numberOfLines={1}>
      {CATEGORY_LABELS[item.category] || item.category}
    </Text>
    <Pressable onPress={onRemove} className="w-5 h-5 rounded-full bg-black/5 justify-center items-center" hitSlop={8}>
      <X size={12} color="#6B6B6B" />
    </Pressable>
  </View>
));

export const SelectedItemsRow = () => {
  const insets = useSafeAreaInsets();
  const selectedItemsArray = useSelectedItemsArray();
  const selectedItemsMap = useSelectedItems();
  const removeItem = useOutfitBuilderStore((s) => s.removeItem);

  const matchScore = useMemo(() => {
    return calculateOutfitScore(selectedItemsMap as Record<string, WardrobeItem | undefined>);
  }, [selectedItemsMap]);

  // Don't render if no items selected
  if (selectedItemsArray.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-stateSuccess bg-stateSuccess/10 border-stateSuccess/20';
    if (score >= 60) return 'text-goldAccent bg-goldAccent/10 border-goldAccent/20';
    return 'text-primary bg-primary/10 border-primary/20';
  };

  const scoreTheme = getScoreColor(matchScore);

  return (
    <View className="absolute left-0 right-0 items-center z-[60]" style={{ bottom: 6 + insets.bottom }} pointerEvents="box-none">
      <BlurView intensity={30} tint="light" className="w-[90%] max-w-[400px] rounded-3xl overflow-hidden">
        <View className="bg-bgSurface/90 rounded-3xl py-2 px-3 flex-row items-center border border-primaryLight/20">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}
            className="flex-1"
          >
            {selectedItemsArray.map((item) => (
              <SelectedItemPill
                key={item.id}
                item={item}
                onRemove={() => removeItem(categoryToSlot(item.category))}
              />
            ))}
          </ScrollView>
          
          <View className="ml-2 items-end justify-center shrink-0">
            {matchScore > 0 ? (
              <View className={`flex-row items-center px-2 py-1 rounded-full border ${scoreTheme}`}>
                <Sparkles size={10} color={scoreTheme.split(' ')[0].replace('text-[', '').replace(']', '')} className="mr-1" />
                <Text className={`text-[10px] font-bold ${scoreTheme.split(' ')[0]}`}>
                  {matchScore}% match
                </Text>
              </View>
            ) : (
              <Text className="text-xs font-semibold text-primary">
                {selectedItemsArray.length} items
              </Text>
            )}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

export default SelectedItemsRow;
