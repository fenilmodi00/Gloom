/**
 * OutfitCombinationCard
 *
 * A card displaying a mini OutfitBoard preview for outfit suggestions.
 * Uses the proper board layout instead of a simple grid.
 * Tap to expand to full board view.
 */
import React from 'react';
import { View, Pressable, StyleSheet, Text as RNText } from 'react-native';
import * as Haptics from 'expo-haptics';

import { OutfitBoard } from '@/components/outfit-board';
import type { OutfitCombination } from '@/lib/store/outfit-builder.store';
import { THEME } from '@/constants/Colors';

const CARD_WIDTH = 130;
const CARD_HEIGHT = 170;
const BOARD_SCALE = 0.35; // Scale factor for the mini board

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

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Mini OutfitBoard */}
      <View style={styles.boardContainer}>
        <View style={styles.scaler}>
          <OutfitBoard 
            selection={selection} 
            width={130 / BOARD_SCALE} 
            height={170 / BOARD_SCALE}
          />
        </View>
      </View>

      {/* Match score badge */}
      <View style={styles.scoreBadge}>
        <RNText style={styles.scoreText}>{matchScore}%</RNText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: THEME.bgSurface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  boardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgCanvas,
  },
  scaler: {
    transform: [{ scale: BOARD_SCALE }],
    width: 130 / BOARD_SCALE,
    height: 170 / BOARD_SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.bgMuted,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
  },
});

