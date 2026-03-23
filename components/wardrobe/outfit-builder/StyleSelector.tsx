/**
 * StyleSelector
 * 
 * Floating dropdown for selecting outfit style at the bottom center.
 * Single selection with visual feedback.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOutfitBuilderStore, OUTFIT_STYLES, type OutfitStyle } from '@/lib/store/outfit-builder.store';

const COLORS = {
  primary: '#8B7355',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  surface: '#FFFFFF',
  surfaceBg: 'rgba(255, 255, 255, 0.95)',
};

// Style labels for display
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
    Haptics.selectionAsync();
    if (style === selectedStyle) {
      setSelectedStyle(null);
    } else {
      setSelectedStyle(style);
    }
    setIsOpen(false);
  };

  const toggleOpen = () => {
    Haptics.selectionAsync();
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
      {/* Trigger Button */}
      <Pressable 
        onPress={toggleOpen} 
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <Text style={styles.label}>Style</Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, selectedStyle && styles.valueSelected]}>
            {selectedStyle ? STYLE_LABELS[selectedStyle] : 'Any'}
          </Text>
          {isOpen ? (
            <ChevronUp size={18} color={COLORS.textSecondary} />
          ) : (
            <ChevronDown size={18} color={COLORS.textSecondary} />
          )}
        </View>
      </Pressable>
      
      {/* Dropdown options */}
      {isOpen && (
        <BlurView intensity={100} tint="light" style={styles.dropdown}>
          <Pressable 
            onPress={() => handleSelect(null)}
            style={[styles.option, !selectedStyle && styles.optionSelected]}
          >
            <Text style={[styles.optionText, !selectedStyle && styles.optionTextSelected]}>Any</Text>
            {!selectedStyle && <Check size={16} color={COLORS.primary} />}
          </Pressable>
          {OUTFIT_STYLES.map((style) => (
            <Pressable
              key={style}
              onPress={() => handleSelect(style)}
              style={[styles.option, selectedStyle === style && styles.optionSelected]}
            >
              <Text style={[styles.optionText, selectedStyle === style && styles.optionTextSelected]}>
                {STYLE_LABELS[style]}
              </Text>
              {selectedStyle === style && <Check size={16} color={COLORS.primary} />}
            </Pressable>
          ))}
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 80, // Leave space for generate button
    zIndex: 150,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.15)',
  },
  triggerPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  valueSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45, 47, 29, 0.12)',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default StyleSelector;
