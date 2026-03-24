/**
 * StyleSelector
 * 
 * Floating dropdown for selecting outfit style at the bottom center.
 * Single selection with visual feedback.
 */
import React, { useState } from 'react';
import { View, Text as RNText, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOutfitBuilderStore, OUTFIT_STYLES, type OutfitStyle } from '@/lib/store/outfit-builder.store';
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
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { bottom: insets.bottom + 80 }]}>
      {/* Dropdown options - solid white glassmorphism */}
      {isOpen && (
        <Animated.View 
          entering={FadeInDown.springify()} 
          exiting={FadeOutDown.duration(200)}
          style={styles.dropdownWrapper}
        >
          <View style={styles.dropdown}>
            <Pressable 
              onPress={() => handleSelect(null)}
              style={({ pressed }) => [
                styles.option, 
                !selectedStyle && styles.optionSelected,
                pressed && styles.optionPressed
              ]}
            >
              <RNText style={[styles.optionText, !selectedStyle && styles.optionTextSelected]}>Any Style</RNText>
              {!selectedStyle && <Check size={16} color={THEME.primary} strokeWidth={3} />}
            </Pressable>
            {OUTFIT_STYLES.map((style) => (
              <Pressable
                key={style}
                onPress={() => handleSelect(style)}
                style={({ pressed }) => [
                  styles.option, 
                  selectedStyle === style && styles.optionSelected,
                  pressed && styles.optionPressed
                ]}
              >
                <RNText style={[styles.optionText, selectedStyle === style && styles.optionTextSelected]}>
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
        style={({ pressed }) => [
          styles.trigger, 
          isOpen && styles.triggerActive,
          pressed && styles.triggerPressed
        ]}
      >
        <View style={styles.triggerContent}>
          <RNText style={styles.triggerText}>
            {selectedStyle ? STYLE_LABELS[selectedStyle] : 'Any Style'}
          </RNText>
          <View style={styles.iconContainer}>
            {isOpen ? (
              <ChevronUp size={14} color={THEME.primary} strokeWidth={3} />
            ) : (
              <ChevronDown size={14} color={THEME.textSecondary} strokeWidth={3} />
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 150,
    alignItems: 'flex-start',
  },
  trigger: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  triggerActive: {
    borderColor: THEME.goldAccent,
  },
  triggerPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(253, 250, 246, 0.85)', // surfaceGlass equivalent
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginRight: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THEME.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownWrapper: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    width: 180,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdown: {
    backgroundColor: THEME.bgSurface,
    padding: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 2,
    backgroundColor: THEME.bgSurface,
  },
  optionPressed: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
  },
  optionSelected: {
    backgroundColor: 'rgba(139, 115, 85, 0.15)',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  optionTextSelected: {
    color: THEME.textPrimary,
    fontWeight: '700',
  },
});

export default StyleSelector;
