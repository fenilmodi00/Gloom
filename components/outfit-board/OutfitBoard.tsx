/**
 * OutfitBoard
 *
 * A fashion flat-lay moodboard component that displays clothing items
 * in a 4-quadrant layout with a dotted background.
 * Items float freely on a canvas — NO slot borders, NO placeholders.
 *
 * Integrates with outfit-builder store's OutfitSelection type.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';

import { DotGrid } from './DotGrid';
import type { WardrobeItem } from '@/types/wardrobe';
import type { ClothingItem, SlotKey } from '@/lib/store/outfit-board.store';
import type { OutfitSelection } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

// Slot configuration with position multipliers (relative to board dimensions)
interface SlotConfig {
  key: SlotKey;
  left?: number; // multiplier for left position
  right?: number; // multiplier for right position
  top?: number; // multiplier for top position
  bottom?: number; // multiplier for bottom position
  width: number; // multiplier for width
  height: number; // multiplier for height
}

const RELATIVE_PAD = 0.08; // Increased from 0.04 for more breathing room (minimal look)

const SLOT_CONFIGS: SlotConfig[] = [
  // TOP (shirt) — top left
  {
    key: 'top',
    left: RELATIVE_PAD,
    top: RELATIVE_PAD,
    width: 0.44,
    height: 0.40,
  },
  // ACCESSORY (charm/bag) — top right
  {
    key: 'accessory',
    right: RELATIVE_PAD,
    top: RELATIVE_PAD + 0.04,
    width: 0.32,
    height: 0.22,
  },
  // BOTTOM (skirt/pants) — bottom left
  {
    key: 'bottom',
    left: RELATIVE_PAD,
    bottom: RELATIVE_PAD,
    width: 0.44,
    height: 0.44,
  },
  // SHOES (sneakers) — bottom right
  {
    key: 'shoes',
    right: RELATIVE_PAD,
    bottom: RELATIVE_PAD * 1.5,
    width: 0.42,
    height: 0.24,
  },
];

interface OutfitBoardProps {
  /** Selection from outfit-builder store */
  selection?: OutfitSelection;
  /** Optional explicit overrides */
  top?: ClothingItem | null;
  bottom?: ClothingItem | null;
  shoes?: ClothingItem | null;
  accessory?: ClothingItem | null;
  /** Custom width (defaults to screenWidth - 32) */
  width?: number;
  /** Custom height (defaults to width * 1.35) */
  height?: number;
  /** Disable shadow */
  disableShadow?: boolean;
  /** Make background transparent */
  transparent?: boolean;
  /** Remove border radius */
  noBorderRadius?: boolean;
}

/**
 * Convert WardrobeItem to ClothingItem format for rendering
 */
function toItem(item: WardrobeItem | undefined): ClothingItem | null {
  if (!item) return null;
  
  const uri = item.cutout_url || item.image_url;
  if (!uri) {
    console.warn('[OutfitBoard] Item has no valid image URI:', item.id);
    return null;
  }
  
  return {
    id: item.id,
    uri,
    name: item.sub_category || undefined,
    category: item.category,
  };
}

export function OutfitBoard({
  selection,
  top,
  bottom,
  shoes,
  accessory,
  width,
  height,
  disableShadow,
  transparent,
  noBorderRadius,
}: OutfitBoardProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate board dimensions
  const boardWidth = useMemo(() => width ?? screenWidth - 32, [screenWidth, width]);
  const boardHeight = useMemo(() => height ?? boardWidth * 1.35, [boardWidth, height]);

  // Map selection to board slots
  // Priority: explicit props > selection mapping
  // Mapping: upper → top, lower → bottom, shoes → shoes, accessory/bag → accessory
  // Note: dress occupies the top slot (replaces upper body)
  const items: Record<SlotKey, ClothingItem | null | undefined> = useMemo(() => {
    // Start with explicit props
    const mapped: Record<SlotKey, ClothingItem | null | undefined> = {
      top,
      bottom,
      shoes,
      accessory,
    };

    // If selection provided, map from OutfitSelection
    if (selection) {
      // Dress takes priority for top slot (it replaces upper body)
      if (selection.dress) {
        mapped.top = toItem(selection.dress);
        mapped.bottom = null; // Dress fills both slots visually
      } else {
        if (!mapped.top && selection.upper) {
          mapped.top = toItem(selection.upper);
        }
        if (!mapped.bottom && selection.lower) {
          mapped.bottom = toItem(selection.lower);
        }
      }
      if (!mapped.shoes && selection.shoes) {
        mapped.shoes = toItem(selection.shoes);
      }
      // Accessory slot: prefer explicit, then accessory, then bag
      if (!mapped.accessory) {
        mapped.accessory = toItem(selection.accessory) ?? toItem(selection.bag);
      }
    }

    return mapped;
  }, [selection, top, bottom, shoes, accessory]);

  return (
    <View
      style={[
        styles.board,
        {
          width: boardWidth,
          height: boardHeight,
          backgroundColor: transparent ? 'transparent' : THEME.bgSurface,
          ...(disableShadow ? { shadowOpacity: 0, elevation: 0 } : {}),
          ...(noBorderRadius ? { borderRadius: 0 } : {}),
        },
      ]}
    >
      {/* Dotted background */}
      <DotGrid width={boardWidth} height={boardHeight} />

      {/* Item slots */}
      {SLOT_CONFIGS.map((config) => {
        const item = items[config.key];
        if (!item) return null;

        // Calculate absolute positions using multipliers
        const slotWidth = boardWidth * config.width;
        const slotHeight = boardHeight * config.height;

        const positionStyle = {
          position: 'absolute' as const,
          width: slotWidth,
          height: slotHeight,
          ...(config.left !== undefined ? { left: boardWidth * config.left } : {}),
          ...(config.right !== undefined ? { right: boardWidth * config.right } : {}),
          ...(config.top !== undefined ? { top: boardHeight * config.top } : {}),
          ...(config.bottom !== undefined ? { bottom: boardHeight * config.bottom } : {}),
        };

        return (
          <View key={config.key} style={[styles.itemContainer, positionStyle]}>
            <Image
              source={item.uri as any}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: 24, // Matches rounded-2xl
    overflow: 'hidden',
    backgroundColor: THEME.bgSurface,
    // Soft shadow following brand guidelines
    shadowColor: THEME.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  itemContainer: {
    // Elegant shadow for items to make them feel "placed"
    shadowColor: THEME.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
});
