/**
 * OutfitCombinationCard
 *
 * A card displaying a mini OutfitBoard preview for outfit suggestions.
 * Uses the proper board layout instead of a simple grid.
 * Tap to expand to full board view.
 */
import React, { useMemo } from 'react';
import { View, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LucideIcon, Sparkles } from 'lucide-react-native';

import { THEME } from '@/constants/Colors';
import { OutfitBoard } from '@/components/outfit-board/OutfitBoard';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import type { WardrobeItem } from '@/types/wardrobe';
import { OUTFIT_BUILDER_CONSTANTS } from '@/constants/OutfitBuilder';

// Use shared constants
const { CARD_WIDTH, ASPECT_RATIO, BOARD_SCALE } = OUTFIT_BUILDER_CONSTANTS;
const CARD_HEIGHT = 215; // Increased for better spacing

interface OutfitCombinationCardProps {
  combination: OutfitCombination;
  onPress: (combination: OutfitCombination) => void;
}

export function OutfitCombinationCard({ combination, onPress }: OutfitCombinationCardProps) {
  const { selection, matchScore } = combination;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(combination);
  };

  // Compute matching tags (tags that appear in more than one item)
  const matchingTags = useMemo(() => {
    const items = Object.values(selection).filter(Boolean) as WardrobeItem[];
    if (items.length < 2) return [];

    const tagCounts: Record<string, number> = {};
    
    items.forEach(item => {
      const tags = [...new Set([...(item.style_tags || []), ...(item.vibe_tags || [])])];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag.replace(/_/g, ' '));
  }, [selection]);

  // Determine score color
  const scoreColor = matchScore >= 80 ? '#6A8C69' : matchScore >= 60 ? '#C9A84C' : '#8B7355';

  // Calculate scaled board dimensions
  const boardWidth = CARD_WIDTH / BOARD_SCALE;
  const boardHeight = boardWidth * ASPECT_RATIO;

  return (
    <Pressable 
      onPress={handlePress} 
      className="bg-bgSurface rounded-2xl overflow-hidden shadow-sm border border-black/5"
    >
      {/* Mini OutfitBoard Preview */}
      <View 
        className="relative overflow-hidden bg-bgCanvas"
        style={{ width: CARD_WIDTH, height: CARD_WIDTH * ASPECT_RATIO * 0.82 }}
      >
        {/* Centered scaled board - shifted down for top padding */}
        <View 
          className="absolute"
          style={{
            width: boardWidth,
            height: boardHeight,
            left: (CARD_WIDTH - boardWidth) / 2,
            top: ((CARD_WIDTH * ASPECT_RATIO * 0.82) - boardHeight) / 2 + 12,
            transform: [{ scale: BOARD_SCALE }],
            transformOrigin: 'center center',
          }}
        >
          <OutfitBoard 
            selection={selection} 
            width={boardWidth} 
            height={boardHeight}
          />
        </View>

        {/* Score Badge */}
        <View 
          className="absolute top-2 left-2 px-2 py-1 rounded-full flex-row items-center border"
          style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderColor: 'rgba(0,0,0,0.05)' }}
        >
          <Sparkles size={10} color={scoreColor} />
          <Text 
            className="ml-1 text-[10px] font-bold" 
            style={{ color: scoreColor }}
          >
            {matchScore}%
          </Text>
        </View>
      </View>

      {/* Style Tags */}
      <View className="px-3 py-2.5">
        {matchingTags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1">
            {matchingTags.map((tag) => (
              <View 
                key={tag} 
                className="bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10"
              >
                <Text className="text-[10px] text-primary font-medium capitalize">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-[11px] text-textTertiary italic">
            Cohesive Look
          </Text>
        )}
      </View>
    </Pressable>
  );
}

