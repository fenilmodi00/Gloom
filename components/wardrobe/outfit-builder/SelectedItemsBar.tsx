/**
 * SelectedItemsBar
 * 
 * Shows selected items as a row of cutouts with frosted glass effect.
 * "PNGs only" style for a more visual, premium feel.
 */
import React from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import Animated, { FadeInRight, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WardrobeItem } from '@/types/wardrobe';
import { useOutfitBuilderStore, useSelectedItemsArray } from '@/lib/store/outfit-builder.store';

// Design tokens
const COLORS = {
  primary: '#8B7355',
  surface: 'rgba(255, 255, 255, 0.9)',
  border: 'rgba(139, 115, 85, 0.2)',
  textPrimary: '#4A3F2C',
  white: '#FFFFFF',
};

const ITEM_SIZE = 48;

export const SelectedItemsBar = () => {
  const selectedItems = useSelectedItemsArray();
  const insets = useSafeAreaInsets();

  if (selectedItems.length === 0) return null;

  return (
    <Animated.View 
      entering={FadeInDown.delay(300).springify()} 
      style={[styles.container, { bottom: insets.bottom + 16 }]}
    >
      <BlurView intensity={70} tint="light" style={styles.blurContainer}>
        <View style={styles.stackContainer}>
          {selectedItems.slice(0, 4).map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInRight.delay(index * 100).springify()}
              style={[
                styles.itemImageContainer,
                { marginLeft: index === 0 ? 0 : -24, zIndex: 10 - index }
              ]}
            >
              <Image
                source={
                  typeof item.image_url === 'string' && item.image_url.startsWith('http')
                    ? { uri: item.cutout_url || item.image_url }
                    : item.image_url
                }
                style={styles.itemImage}
                contentFit="contain"
              />
            </Animated.View>
          ))}
          {selectedItems.length > 4 && (
            <View style={styles.moreBadge}>
              <RNText style={styles.moreText}>+{selectedItems.length - 4}</RNText>
            </View>
          )}
          {selectedItems.length > 0 && (
            <View style={styles.countBadge}>
              <RNText style={styles.countText}>{selectedItems.length}</RNText>
            </View>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  blurContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    padding: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight overlay for glassmorphism
  },
  stackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  itemImageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: '85%',
    height: '85%',
  },
  moreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    marginLeft: -12,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  countBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(26, 26, 26, 0.05)',
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default SelectedItemsBar;
