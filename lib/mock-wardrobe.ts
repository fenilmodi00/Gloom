/**
 * Mock wardrobe data for development/demo purposes.
 * Uses local fashion images from assets/fashion_categorized/
 */

import type { WardrobeItem, Category } from '@/types/wardrobe';

// Category mapping from folder names to our Category type
const FOLDER_TO_CATEGORY: Record<string, Category> = {
  top: 'tops',
  bottom: 'bottoms',
  shoes: 'shoes',
  accessories: 'accessories',
};

// Asset files by category (generated from stats.json and folder contents)
const ASSET_FILES = {
  top: [
    '0000_00_top.png',
    '0001_00_top.png',
    '0002_00_top.png',
    '0003_01_top.png',
    '0003_04_top.png',
    '0004_00_top.png',
    '0005_00_top.png',
    '0006_00_top.png',
    '0007_00_top.png',
    '0008_00_top.png',
    '0009_00_top.png',
    '0010_00_top.png',
    '0011_00_top.png',
    '0012_00_top.png',
    '0013_00_top.png',
    '0014_02_top.png',
    '0014_03_top.png',
    '0015_00_top.png',
  ],
  bottom: [
    '0000_01_bottom.png',
    '0001_01_bottom.png',
    '0002_01_bottom.png',
    '0003_03_bottom.png',
    '0003_04_bottom.png',
    '0005_01_bottom.png',
    '0006_04_bottom.png',
    '0014_05_bottom.png',
  ],
  shoes: [
    '0000_02_shoes.png',
    '0001_03_shoes.png',
    '0002_05_shoes.png',
    '0003_02_shoes.png',
    '0003_03_shoes.png',
    '0004_02_shoes.png',
    '0004_04_shoes.png',
    '0005_04_shoes.png',
    '0006_03_shoes.png',
    '0007_03_shoes.png',
    '0008_02_shoes.png',
    '0009_03_shoes.png',
    '0010_03_shoes.png',
    '0011_05_shoes.png',
    '0012_03_shoes.png',
    '0013_03_shoes.png',
    '0014_06_shoes.png',
  ],
  accessories: [
    '0000_03_accessories.png',
    '0000_04_accessories.png',
    '0000_05_accessories.png',
    '0001_02_accessories.png',
    '0001_04_accessories.png',
    '0001_05_accessories.png',
    '0002_02_accessories.png',
    '0002_03_accessories.png',
    '0002_04_accessories.png',
    '0003_00_accessories.png',
    '0003_01_accessories.png',
    '0003_02_accessories.png',
    '0004_01_accessories.png',
    '0004_03_accessories.png',
    '0005_02_accessories.png',
    '0005_03_accessories.png',
    '0006_01_accessories.png',
    '0006_02_accessories.png',
    '0007_01_accessories.png',
    '0007_02_accessories.png',
  ],
};

// Style tags for variety
const STYLE_TAGS = [
  'minimalist',
  'casual',
  'formal',
  'streetwear',
  'bohemian',
  'vintage',
  'contemporary',
  'classic',
];

// Color options
const COLORS_AVAILABLE = [
  'white',
  'black',
  'navy',
  'beige',
  'gray',
  'brown',
  'olive',
  'cream',
];

// Occasion tags
const OCCASION_TAGS = [
  'everyday',
  'work',
  'casual',
  'formal',
  'party',
  'weekend',
  'date-night',
];

/**
 * Generate mock wardrobe items from local assets
 */
export function getMockWardrobeItems(): WardrobeItem[] {
  const items: WardrobeItem[] = [];
  let globalIndex = 0;

  // Process each category
  for (const [folder, category] of Object.entries(FOLDER_TO_CATEGORY)) {
    const files = ASSET_FILES[folder as keyof typeof ASSET_FILES] || [];

    files.forEach((filename, index) => {
      // Create the asset URI - require works for local assets in React Native
      const assetPath = `../assets/fashion_categorized/${folder}/${filename}`;

      items.push({
        id: `mock-${category}-${index}`,
        user_id: 'mock-user',
        // Use require for local assets in React Native
        image_url: assetPath,
        cutout_url: null,
        category: category,
        sub_category: null,
        colors: getRandomColors(),
        style_tags: getRandomTags(STYLE_TAGS, 2),
        occasion_tags: getRandomTags(OCCASION_TAGS, 1),
        fabric_guess: null,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      globalIndex++;
    });
  }

  return items;
}

/**
 * Get random subset of colors
 */
function getRandomColors(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...COLORS_AVAILABLE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get random subset of tags
 */
function getRandomTags(tags: string[], count: number): string[] {
  const shuffled = [...tags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get asset URI for local images (to be used with expo-image)
 */
export function getLocalAssetUri(folder: string, filename: string): string {
  // For expo-image, we need to use require() or asset URIs
  // In development, we'll use the asset path directly
  return `../assets/fashion_categorized/${folder}/${filename}`;
}

/**
 * Preloaded mock item images as require() calls for React Native
 * These are resolved at build time
 */
export const MOCK_ASSETS = {
  top: [
    require('../assets/fashion_categorized/top/0000_00_top.png'),
    require('../assets/fashion_categorized/top/0001_00_top.png'),
    require('../assets/fashion_categorized/top/0002_00_top.png'),
    require('../assets/fashion_categorized/top/0003_01_top.png'),
    require('../assets/fashion_categorized/top/0004_00_top.png'),
    require('../assets/fashion_categorized/top/0005_00_top.png'),
  ],
  bottom: [
    require('../assets/fashion_categorized/bottom/0000_01_bottom.png'),
    require('../assets/fashion_categorized/bottom/0001_01_bottom.png'),
    require('../assets/fashion_categorized/bottom/0002_01_bottom.png'),
    require('../assets/fashion_categorized/bottom/0003_03_bottom.png'),
    require('../assets/fashion_categorized/bottom/0005_01_bottom.png'),
  ],
  shoes: [
    require('../assets/fashion_categorized/shoes/0000_02_shoes.png'),
    require('../assets/fashion_categorized/shoes/0001_03_shoes.png'),
    require('../assets/fashion_categorized/shoes/0002_05_shoes.png'),
    require('../assets/fashion_categorized/shoes/0003_02_shoes.png'),
    require('../assets/fashion_categorized/shoes/0004_02_shoes.png'),
  ],
  accessories: [
    require('../assets/fashion_categorized/accessories/0000_03_accessories.png'),
    require('../assets/fashion_categorized/accessories/0001_02_accessories.png'),
    require('../assets/fashion_categorized/accessories/0002_02_accessories.png'),
    require('../assets/fashion_categorized/accessories/0003_00_accessories.png'),
    require('../assets/fashion_categorized/accessories/0004_01_accessories.png'),
  ],
};

/**
 * Generate mock items with proper require() assets for React Native
 */
export function getMockWardrobeItemsWithAssets(): WardrobeItem[] {
  const items: WardrobeItem[] = [];

  // Tops
  MOCK_ASSETS.top.forEach((asset, index) => {
    items.push({
      id: `mock-tops-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'tops',
      sub_category: null,
      colors: ['white', 'beige'],
      style_tags: ['casual', 'minimalist'],
      occasion_tags: ['everyday'],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Bottoms
  MOCK_ASSETS.bottom.forEach((asset, index) => {
    items.push({
      id: `mock-bottoms-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'bottoms',
      sub_category: null,
      colors: ['navy', 'black'],
      style_tags: ['casual'],
      occasion_tags: ['everyday'],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Shoes
  MOCK_ASSETS.shoes.forEach((asset, index) => {
    items.push({
      id: `mock-shoes-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'shoes',
      sub_category: null,
      colors: ['brown', 'black'],
      style_tags: ['classic'],
      occasion_tags: ['everyday'],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  // Accessories
  MOCK_ASSETS.accessories.forEach((asset, index) => {
    items.push({
      id: `mock-accessories-${index}`,
      user_id: 'mock-user',
      image_url: asset,
      cutout_url: null,
      category: 'accessories',
      sub_category: null,
      colors: ['black', 'gold'],
      style_tags: ['classic'],
      occasion_tags: ['everyday'],
      fabric_guess: null,
      created_at: new Date().toISOString(),
    });
  });

  return items;
}
