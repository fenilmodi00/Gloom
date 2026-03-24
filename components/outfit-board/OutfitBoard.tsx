import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { DotGrid } from './DotGrid';
import { ClothingItem } from './useOutfitStore';

interface OutfitBoardProps {
  top?: ClothingItem | null;
  bottom?: ClothingItem | null;
  shoes?: ClothingItem | null;
  accessory?: ClothingItem | null;
  width?: number;
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OutfitBoard: React.FC<OutfitBoardProps> = ({
  top,
  bottom,
  shoes,
  accessory,
  width,
  height,
}) => {
  const DEFAULT_BOARD_W = SCREEN_WIDTH - 32;
  const BOARD_W = width || DEFAULT_BOARD_W;
  const BOARD_H = height || BOARD_W * 1.35;
  const PAD = 14;

  const topStyles = {
    position: 'absolute' as const,
    left: PAD,
    top: PAD,
    width: BOARD_W * 0.47,
    height: BOARD_H * 0.44,
  };

  const accessoryStyles = {
    position: 'absolute' as const,
    right: PAD,
    top: PAD + 10,
    width: BOARD_W * 0.30,
    height: BOARD_H * 0.22,
  };

  const bottomStyles = {
    position: 'absolute' as const,
    left: PAD,
    bottom: PAD,
    width: BOARD_W * 0.47,
    height: BOARD_H * 0.50,
  };

  const shoesStyles = {
    position: 'absolute' as const,
    right: PAD,
    bottom: PAD + 20,
    width: BOARD_W * 0.44,
    height: BOARD_H * 0.26,
  };

  const commonImageProps = {
    contentFit: 'contain' as const,
  };

  const renderItem = (item: ClothingItem | null | undefined, style: any) => {
    if (!item) return null;

    return (
      <View style={[style, styles.imageContainer]}>
        <Image
          source={{ uri: item.uri }}
          style={StyleSheet.absoluteFill}
          {...commonImageProps}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: BOARD_W, height: BOARD_H }]}>
      <DotGrid width={BOARD_W} height={BOARD_H} />
      {renderItem(top, topStyles)}
      {renderItem(accessory, accessoryStyles)}
      {renderItem(bottom, bottomStyles)}
      {renderItem(shoes, shoesStyles)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EDEAE5',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
