/**
 * StyleSelector
 * 
 * Floating dropdown for selecting outfit style at the bottom center.
 * Animates up when items are selected to make space for SelectedItemsBar.
 * Single selection with visual feedback.
 */
import React, { useState } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOutfitBuilderStore, useSelectedItemsArray, OUTFIT_STYLES, type OutfitStyle } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

const STYLE_LABELS: Record<OutfitStyle, string> = {
  casual: 'Casual',
  streetwear: 'Streetwear',
  formal: 'Formal',
  party: 'Party',
  bohemian: 'Boho',
  sporty: 'Sporty',
};

export const StyleSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedStyle = useOutfitBuilderStore((s) => s.selectedStyle);
  const setSelectedStyle = useOutfitBuilderStore((s) => s.setSelectedStyle);
  const selectedItems = useSelectedItemsArray();
  const insets = useSafeAreaInsets();
  
  // Animated position - moves up when items are selected to make space for SelectedItemsBar
  const hasSelectedItems = selectedItems.length > 0;
  // When items selected, move UP (larger bottom value = further from bottom edge)
  // SelectedItemsBar is at bottom: 16, StyleSelector moves to bottom: 90 to be above it
  const targetBottom = hasSelectedItems ? insets.bottom + 90 : insets.bottom + 16;
  
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      bottom: withTiming(targetBottom, {
        duration: 350,
      }),
    };
  });

  const handleSelect = (style: OutfitStyle | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedStyle(style);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  return (
    <Animated.View className="absolute left-4 z-[150] items-start" style={animatedStyle}>
      {/* Dropdown options - solid white glassmorphism */}
      {isOpen && (
        <Animated.View 
          entering={FadeInDown.springify().mass(2)}
          exiting={FadeOutDown.duration(200)}
          className="absolute bottom-full left-0 w-[180px] mb-2.5 rounded-3xl bg-[#fdfaf6]/98 overflow-hidden border-[1.5px] border-white/90 shadow-sm elevation-4"
        >
          <View className="p-1.5">
            <Pressable 
              onPress={() => handleSelect(null)}
              className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl mb-0.5 ${!selectedStyle ? 'bg-[#8B7355]/15' : ''} active:bg-[#8B7355]/10`}
            >
              <RNText className={`font-ui text-[13px] tracking-wide uppercase font-medium ${!selectedStyle ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>Any Style</RNText>
              {!selectedStyle && <Check size={16} color={THEME.primary} strokeWidth={3} />}
            </Pressable>
            {OUTFIT_STYLES.map((style) => (
              <Pressable
                key={style}
                onPress={() => handleSelect(style)}
                className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl mb-0.5 ${selectedStyle === style ? 'bg-[#8B7355]/15' : ''} active:bg-[#8B7355]/10`}
              >
                <RNText className={`font-ui text-[13px] tracking-wide uppercase font-medium ${selectedStyle === style ? 'text-text-primary font-bold' : 'text-text-secondary'}`}>
                  {STYLE_LABELS[style]}
                </RNText>
                {selectedStyle === style && <Check size={16} color={THEME.primary} strokeWidth={3} />}
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Trigger Button */}
      <Pressable 
        onPress={toggleOpen} 
        className={`rounded-full overflow-hidden border border-white/60 active:scale-[0.97] active:opacity-90 ${isOpen ? 'border-gold-accent' : ''}`}
      >
        <View className="flex-row items-center px-4 py-2.5 bg-[#fdfaf6]/85">
          <RNText className="font-ui text-[13px] tracking-wide uppercase font-medium text-text-secondary mr-2">
            {selectedStyle ? STYLE_LABELS[selectedStyle] : 'Any Style'}
          </RNText>
          <View className="w-5 h-5 rounded-full bg-surface justify-center items-center">
            {isOpen ? (
              <ChevronUp size={14} color={THEME.primary} strokeWidth={3} />
            ) : (
              <ChevronDown size={14} color={THEME.textSecondary} strokeWidth={3} />
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default StyleSelector;
