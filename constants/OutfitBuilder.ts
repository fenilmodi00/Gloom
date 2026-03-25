import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Shared constants for the outfit builder UI
 */
export const OUTFIT_BUILDER_CONSTANTS = {
  CARD_WIDTH: 210, // Increased for a larger, more prominent display
  ASPECT_RATIO: 1.45,
  BOARD_SCALE: 0.48, // Adjusted scale for the larger card size
  GAP: 12,
  HORIZONTAL_PADDING: 18,
};
