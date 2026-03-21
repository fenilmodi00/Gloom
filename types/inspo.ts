import type { ImageSourcePropType } from 'react-native';

export interface InspoItem {
  id: string;
  imageUrl: string;
  title?: string;
}

export interface InspoSection {
  id: string;
  title: string;
  items: InspoItem[];
}

/**
 * Model card for the 3D carousel in Inspo bottom sheet
 * Supports both URL strings and local assets (require())
 */
export interface ModelCard {
  id: string;
  imageUrl: string | ImageSourcePropType;
  name?: string;
  outfit?: string;
  // Optional metadata
  brand?: string;
  style?: string;
  tags?: string[];
}

/**
 * Trending section for the layered Inspo screen
 * Each section has a title and grid of outfit cards
 */
export interface TrendingSection {
  id: string;
  title: string;
  items: TrendingItem[];
}

export interface TrendingItem {
  id: string;
  imageUrl: string;
  outfitName?: string;
}

export interface OutfitItem {
  id: string;
  image: ImageSourcePropType;
  label: 'Top' | 'Bottom' | 'Shoes' | 'Accessories';
}

export const MOCK_CLOTH_ITEMS: OutfitItem[] = [
  { id: 'top-1', image: require('../assets/modalCloth/0013_00_top.png'), label: 'Top' },
  { id: 'bottom-1', image: require('../assets/modalCloth/0003_04_bottom.png'), label: 'Bottom' },
  { id: 'shoes-1', image: require('../assets/modalCloth/0011_05_shoes.png'), label: 'Shoes' },
  { id: 'accessories-1', image: require('../assets/modalCloth/0009_02_accessories.png'), label: 'Accessories' },
];

