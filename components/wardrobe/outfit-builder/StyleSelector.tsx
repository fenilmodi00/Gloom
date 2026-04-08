/**
 * StyleSelector
 * 
 * Floating dropdown for selecting outfit style at the bottom center.
 * Animates up when items are selected to make space for SelectedItemsBar.
 * Single selection with visual feedback.
 */
import React, { useState } from 'react';
import { View, Text as RNText, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, withTiming, withSpring, useSharedValue } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOutfitBuilderStore, useSelectedItemsArray, OUTFIT_STYLES, type OutfitStyle } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

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
          className="absolute left-0 w-[180px] mb-2.5 rounded-3xl bg-bgSurface/98 overflow-hidden border-[1.5px] border-white/90 shadow-lg shadow-black/10"
          style={{ bottom: '100%', elevation: 4 }}
        >
          <View className="p-1.5">
            <Pressable 
              onPress={() => handleSelect(null)}
              className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl mb-0.5 ${!selectedStyle ? 'bg-primary/15' : ''}`}
              style={({ pressed }: any) => (!selectedStyle ? {} : pressed ? { backgroundColor: 'rgba(var(--primary), 0.1)' } : {})}
            >
              <RNText className={`font-ui text-sm ${!selectedStyle ? 'text-textPrimary font-bold' : 'text-textSecondary'}`}>Any Style</RNText>
              {!selectedStyle && <Check size={16} color={THEME.primary} strokeWidth={3} />}
            </Pressable>
            {OUTFIT_STYLES.map((style) => {
              const isSelected = selectedStyle === style;
              return (
                <Pressable
                  key={style}
                  onPress={() => handleSelect(style)}
                  className={`flex-row items-center justify-between px-3.5 py-3 rounded-2xl mb-0.5 ${isSelected ? 'bg-primary/15' : ''}`}
                  style={({ pressed }: any) => (isSelected ? {} : pressed ? { backgroundColor: 'rgba(var(--primary), 0.1)' } : {})}
                >
                  <RNText className={`font-ui text-sm ${isSelected ? 'text-textPrimary font-bold' : 'text-textSecondary'}`}>
                    {STYLE_LABELS[style]}
                  </RNText>
                  {isSelected && <Check size={16} color={THEME.primary} strokeWidth={3} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Trigger Button */}
      <Pressable 
        onPress={toggleOpen} 
        className={`rounded-[20px] overflow-hidden border ${isOpen ? 'border-goldAccent' : 'border-white/60'}`}
        style={({ pressed }: any) => (pressed ? { transform: [{ scale: 0.95 }], opacity: 0.9 } : {})}
      >
        <View className="flex-row items-center px-4 py-2.5 bg-bgSurface/85">
          <RNText className="font-ui text-sm text-textSecondary mr-2">
            {selectedStyle ? STYLE_LABELS[selectedStyle] : 'Any Style'}
          </RNText>
          <View className="w-5 h-5 rounded-full bg-bgSurface justify-center items-center">
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
