/**
 * SelectedItemsBar
 * 
 * Shows selected items as a row of cutouts with frosted glass effect.
 * Tap to expand horizontally — reveals remove (X) buttons on each item.
 */
import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text as RNText, useWindowDimensions, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WardrobeItem } from '@/types/wardrobe';
import { THEME } from '@/constants/Colors';
import { useOutfitBuilderStore, useSelectedItemsArray } from '@/lib/store/outfit-builder.store';
import { Typography } from '@/constants/Typography';
import { getWardrobeItemImageUrl } from '@/lib/wardrobe-image';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ITEM_SIZE = 48;
const REMOVE_BUTTON_SIZE = 20;

interface ItemIconProps {
  item: WardrobeItem;
  index: number;
  expanded: boolean;
  onRemove: (id: string) => void;
}

const ItemIcon = ({ item, index, expanded, onRemove }: ItemIconProps) => {
  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      marginLeft: withSpring(expanded ? 12 : index === 0 ? 0 : -28, {
        mass: 0.6,
        damping: 15,
        stiffness: 100,
      }),
    };
  });

  const imageUrl = getWardrobeItemImageUrl(item);

  return (
    <Animated.View 
      layout={LinearTransition.springify().mass(0.8)}
      className="relative"
      style={[{ width: ITEM_SIZE, height: ITEM_SIZE }, animatedWrapperStyle]}
    >
      <View className="overflow-hidden bg-bgSurface items-center justify-center border-2 border-bgSurface shadow-sm shadow-black/10" style={{ width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: ITEM_SIZE / 2 }}>
        <Image
          source={imageUrl ? { uri: imageUrl } : undefined}
          className="w-full h-full"
          contentFit="contain"
        />
      </View>
      
      {expanded && (
        <AnimatedPressable
          entering={FadeIn.duration(200).delay(index * 30)}
          exiting={FadeOut.duration(150)}
          onPress={() => onRemove(item.id)}
          hitSlop={8}
          className="absolute -top-0.5 -right-0.5 items-center justify-center bg-stateError border-2 border-white z-20 shadow-sm shadow-black/20"
          style={{ width: REMOVE_BUTTON_SIZE, height: REMOVE_BUTTON_SIZE, borderRadius: REMOVE_BUTTON_SIZE / 2 }}
        >
          <X size={12} color="#fff" strokeWidth={3} />
        </AnimatedPressable>
      )}
    </Animated.View>
  );
};

export const SelectedItemsBar = () => {
  const [expanded, setExpanded] = useState(false);
  const selectedItems = useSelectedItemsArray();
  const removeSelection = useOutfitBuilderStore((s) => s.removeSelection);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Dynamic max width to prevent overlapping with Generate button
  const MAX_BAR_WIDTH = screenWidth - 140;

  const toggleExpand = () => {
    if (selectedItems.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeSelection(id);
    // If only 1 item left (which was just removed), close expansion
    if (selectedItems.length <= 1) {
      setExpanded(false);
    }
  };

  const animatedInnerStyle = useAnimatedStyle(() => {
    return {
      paddingHorizontal: withSpring(expanded ? 16 : 10, {
        damping: 18,
        stiffness: 120,
      }),
    };
  });

  if (selectedItems.length === 0) return null;

  return (
    <Animated.View
      layout={LinearTransition.springify().mass(0.8)}
      className="absolute left-4 z-[100]"
      style={{ bottom: insets.bottom + 16 }}
    >
      <Pressable onPress={toggleExpand}>
        <BlurView
          intensity={85}
          tint="light"
          className="rounded-[30px] overflow-hidden border-[1.5px] border-white/50 bg-white/15"
          style={{ maxWidth: MAX_BAR_WIDTH }}
        >
          <Animated.View className="flex-row items-center h-16" style={animatedInnerStyle}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: 'center' }}
              scrollEnabled={expanded}
              keyboardShouldPersistTaps="always"
            >
              {selectedItems.map((item, index) => {
                // Collapsed: show first 4 items, then a +N badge
                if (!expanded && index >= 4) return null;
                
                return (
                  <ItemIcon 
                    key={item.id} 
                    item={item} 
                    index={index}
                    expanded={expanded}
                    onRemove={handleRemove}
                  />
                );
              })}

              {!expanded && selectedItems.length > 4 && (
                <View className="bg-bgMuted z-10 justify-center items-center border-2 border-bgSurface -ml-6" style={{ width: ITEM_SIZE - 4, height: ITEM_SIZE - 4, borderRadius: (ITEM_SIZE - 4) / 2 }}>
                  <RNText className="font-ui text-[10px] text-textSecondary">+{selectedItems.length - 4}</RNText>
                </View>
              )}
            </ScrollView>

            {!expanded && (
              <View className="ml-3 px-2 py-0.5 bg-[#1A1A1A]/10 rounded-xl">
                <RNText className="font-ui text-sm font-medium text-textPrimary">{selectedItems.length}</RNText>
              </View>
            )}
          </Animated.View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

export default SelectedItemsBar;
