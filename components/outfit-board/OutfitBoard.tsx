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

const PAD = 14; // base padding

const SLOT_CONFIGS: SlotConfig[] = [
  // TOP (shirt) — top left, tall
  {
    key: 'top',
    left: PAD,
    top: PAD,
    width: 0.47,
    height: 0.44,
  },
  // ACCESSORY (charm/bag) — top right, small
  {
    key: 'accessory',
    right: PAD,
    top: PAD + 10,
    width: 0.30,
    height: 0.22,
  },
  // BOTTOM (skirt/pants) — bottom left, tall
  {
    key: 'bottom',
    left: PAD,
    bottom: PAD,
    width: 0.47,
    height: 0.50,
  },
  // SHOES (sneakers) — bottom right, medium
  {
    key: 'shoes',
    right: PAD,
    bottom: PAD + 20,
    width: 0.44,
    height: 0.26,
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
}

/**
 * Convert WardrobeItem to ClothingItem format for rendering
 */
function toItem(item: WardrobeItem | undefined): ClothingItem | null {
  if (!item) return null;
  return {
    id: item.id,
    uri: item.cutout_url || item.image_url,
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
          ...(config.left !== undefined ? { left: config.left } : {}),
          ...(config.right !== undefined ? { right: config.right } : {}),
          ...(config.top !== undefined ? { top: config.top } : {}),
          ...(config.bottom !== undefined ? { bottom: config.bottom } : {}),
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
