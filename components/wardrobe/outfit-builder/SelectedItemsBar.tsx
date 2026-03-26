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
      style={[styles.itemWrapper, animatedWrapperStyle]}
    >
      <View style={styles.itemImageContainer}>
        <Image
          source={imageUrl ? { uri: imageUrl } : undefined}
          style={styles.itemImage}
          contentFit="contain"
        />
      </View>
      
      {expanded && (
        <AnimatedPressable
          entering={FadeIn.duration(200).delay(index * 30)}
          exiting={FadeOut.duration(150)}
          onPress={() => onRemove(item.id)}
          hitSlop={8}
          style={styles.removeButton}
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
      style={[styles.container, { bottom: insets.bottom + 16 }]}
    >
      <Pressable onPress={toggleExpand}>
        <BlurView
          intensity={85}
          tint="light"
          style={[styles.blurContainer, { maxWidth: MAX_BAR_WIDTH }]}
        >
          <Animated.View style={[styles.innerContent, animatedInnerStyle]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
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
                <View style={styles.moreBadge}>
                  <RNText style={styles.moreText}>+{selectedItems.length - 4}</RNText>
                </View>
              )}
            </ScrollView>

            {!expanded && (
              <View style={styles.countPill}>
                <RNText style={styles.countText}>{selectedItems.length}</RNText>
              </View>
            )}
          </Animated.View>
        </BlurView>
      </Pressable>
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
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
  },
  scrollContent: {
    alignItems: 'center',
  },
  itemWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
  },
  itemImageContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: THEME.bgSurface,
    borderWidth: 2,
    borderColor: THEME.bgSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: REMOVE_BUTTON_SIZE,
    height: REMOVE_BUTTON_SIZE,
    borderRadius: REMOVE_BUTTON_SIZE / 2,
    backgroundColor: THEME.stateError,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 20,
  },
  moreBadge: {
    width: ITEM_SIZE - 4,
    height: ITEM_SIZE - 4,
    borderRadius: (ITEM_SIZE - 4) / 2,
    backgroundColor: THEME.bgMuted,
    marginLeft: -24,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.bgSurface,
  },
  moreText: {
    ...Typography.uiLabel,
    color: THEME.textSecondary,
  },
  countPill: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    borderRadius: 12,
  },
  countText: {
    ...Typography.uiLabelMedium,
    color: THEME.textPrimary,
  },
});

export default SelectedItemsBar;
