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

// Style Tags (expanded from research taxonomy)
const STYLE_TAGS = [
'casual',
'streetwear',
'old_money',
'minimalist',
'bohemian',
'dark_academia',
'cottagecore',
'y2k',
'athleisure',
'gorpcore',
] as const;

// Color options (unchanged)
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

// Occasion Tags (expanded)
const OCCASION_TAGS = [
'daytime',
'night_out',
'work',
'weekend',
'party',
'date_night',
'casual_friday',
'beach',
'travel',
] as const;

// NEW: Functional Tags
const FUNCTIONAL_TAGS = [
'layering_staple',
'statement_piece',
'base_layer',
'outer_layer',
'transitional',
'four_season',
'summer_only',
'winter_only',
] as const;

// NEW: Silhouette Tags
const SILHOUETTE_TAGS = [
'slim_fit',
'regular_fit',
'relaxed_fit',
'oversized',
'cropped',
'fitted',
'flowy',
] as const;

// NEW: Vibe/Era Tags
const VIBE_TAGS = [
'timeless',
'trend_aware',
'90s_revival',
'modern_classic',
'vintage_inspired',
'ahead_of_curve',
] as const;

/**
* Category-aware tag profiles for realistic mock data
* Items from each category get appropriate functional/silhouette tags
*/
const TAG_PROFILES: Record<Category, {
functional: string[];
silhouette: string[];
styles: string[];
}> = {
tops: {
functional: ['layering_staple', 'base_layer', 'transitional'],
silhouette: ['slim_fit', 'regular_fit', 'relaxed_fit', 'oversized'],
styles: ['casual', 'minimalist', 'old_money', 'streetwear'],
},
bottoms: {
functional: ['base_layer', 'four_season'],
silhouette: ['slim_fit', 'regular_fit', 'relaxed_fit', 'cropped'],
styles: ['casual', 'minimalist', 'streetwear'],
},
shoes: {
functional: [], // Shoes rarely have functional tags
silhouette: ['slim_fit', 'regular_fit'],
styles: ['casual', 'classic', 'streetwear'],
},
accessories: {
functional: ['statement_piece'],
silhouette: [], // Accessories don't have silhouette
styles: ['classic', 'minimalist', 'bohemian'],
},
outerwear: {
functional: ['outer_layer', 'layering_staple', 'winter_only', 'transitional'],
silhouette: ['regular_fit', 'relaxed_fit', 'oversized'],
styles: ['casual', 'streetwear', 'gorpcore'],
},
fullbody: {
functional: ['statement_piece', 'four_season'],
silhouette: ['slim_fit', 'regular_fit', 'fitted', 'flowy'],
styles: ['casual', 'bohemian', 'minimalist'],
},
bags: {
functional: ['statement_piece'],
silhouette: [],
styles: ['casual', 'classic', 'minimalist'],
},
};

/**
* Color combinations that work well together
*/
const COLOR_COMBINATIONS: string[][] = [
['white', 'beige'],
['navy', 'white'],
['black', 'gray'],
['olive', 'cream'],
['brown', 'beige'],
['navy', 'beige'],
['black', 'white'],
['gray', 'olive'],
];

/**
* Vibe tag associations by style
*/
const STYLE_TO_VIBE: Record<string, string[]> = {
old_money: ['timeless', 'modern_classic'],
streetwear: ['trend_aware', '90s_revival'],
minimalist: ['timeless', 'modern_classic'],
bohemian: ['vintage_inspired', 'ahead_of_curve'],
dark_academia: ['vintage_inspired', 'timeless'],
cottagecore: ['vintage_inspired', 'timeless'],
y2k: ['90s_revival', 'trend_aware'],
casual: ['timeless', 'modern_classic'],
athleisure: ['trend_aware', 'modern_classic'],
gorpcore: ['trend_aware', 'ahead_of_curve'],
};

/**
* Generate mock wardrobe items with smart category-aware tags
*/
export function getMockWardrobeItems(): WardrobeItem[] {
const items: WardrobeItem[] = [];

// Process each category
for (const [folder, category] of Object.entries(FOLDER_TO_CATEGORY)) {
const files = ASSET_FILES[folder as keyof typeof ASSET_FILES] || [];
const profile = TAG_PROFILES[category];

files.forEach((filename, index) => {
const assetPath = `../assets/fashion_categorized/${folder}/${filename}`;

// Get smart tags based on category
const styleTag = profile.styles[index % profile.styles.length];
const vibeTags = STYLE_TO_VIBE[styleTag] || ['timeless'];

items.push({
id: `mock-${category}-${index}`,
user_id: 'mock-user',
image_url: assetPath,
cutout_url: null,
category: category,
sub_category: null,
colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
style_tags: [styleTag],
occasion_tags: [OCCASION_TAGS[index % OCCASION_TAGS.length]],
functional_tags: profile.functional.length > 0
? [profile.functional[index % profile.functional.length]]
: [],
silhouette_tags: profile.silhouette.length > 0
? [profile.silhouette[index % profile.silhouette.length]]
: [],
vibe_tags: [vibeTags[index % vibeTags.length]],
fabric_guess: null,
created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
});
});
}

return items;
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
* Generate mock items with proper require() assets and smart tags
*/
export function getMockWardrobeItemsWithAssets(): WardrobeItem[] {
const items: WardrobeItem[] = [];

// Tops - mostly casual/minimalist with layering capability
MOCK_ASSETS.top.forEach((asset, index) => {
const styles = ['casual', 'minimalist', 'old_money', 'streetwear'];
const style = styles[index % styles.length];
const vibeTags = STYLE_TO_VIBE[style] || ['timeless'];

items.push({
id: `mock-tops-${index}`,
user_id: 'mock-user',
image_url: asset,
cutout_url: null,
category: 'tops',
sub_category: null,
colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
style_tags: [style],
occasion_tags: ['daytime'],
functional_tags: ['layering_staple'],
silhouette_tags: [['slim_fit', 'regular_fit', 'oversized'][index % 3]],
vibe_tags: [vibeTags[0]],
fabric_guess: null,
created_at: new Date().toISOString(),
});
});

// Bottoms - casual/minimalist with base layer
MOCK_ASSETS.bottom.forEach((asset, index) => {
items.push({
id: `mock-bottoms-${index}`,
user_id: 'mock-user',
image_url: asset,
cutout_url: null,
category: 'bottoms',
sub_category: null,
colors: COLOR_COMBINATIONS[index % COLOR_COMBINATIONS.length],
style_tags: [['casual', 'minimalist', 'streetwear'][index % 3]],
occasion_tags: ['daytime'],
functional_tags: ['base_layer'],
silhouette_tags: [['slim_fit', 'regular_fit', 'cropped'][index % 3]],
vibe_tags: ['timeless'],
fabric_guess: null,
created_at: new Date().toISOString(),
});
});

// Shoes - classic/casual
MOCK_ASSETS.shoes.forEach((asset, index) => {
items.push({
id: `mock-shoes-${index}`,
user_id: 'mock-user',
image_url: asset,
cutout_url: null,
category: 'shoes',
sub_category: null,
colors: [['brown', 'black'], ['white', 'cream'], ['navy', 'beige']][index % 3],
style_tags: [['classic', 'casual', 'streetwear'][index % 3]],
occasion_tags: ['daytime'],
functional_tags: [], // Shoes don't have functional tags
silhouette_tags: [], // Shoes don't use silhouette tags
vibe_tags: [['timeless', 'modern_classic', 'trend_aware'][index % 3]],
fabric_guess: null,
created_at: new Date().toISOString(),
});
});

// Accessories - statement pieces
MOCK_ASSETS.accessories.forEach((asset, index) => {
items.push({
id: `mock-accessories-${index}`,
user_id: 'mock-user',
image_url: asset,
cutout_url: null,
category: 'accessories',
sub_category: null,
colors: [['black', 'gold'], ['brown', 'beige'], ['silver', 'white']][index % 3],
style_tags: [['classic', 'minimalist', 'bohemian'][index % 3]],
occasion_tags: ['daytime'],
functional_tags: ['statement_piece'],
silhouette_tags: [], // Accessories don't have silhouette
vibe_tags: [['timeless', 'modern_classic', 'vintage_inspired'][index % 3]],
fabric_guess: null,
created_at: new Date().toISOString(),
});
});

return items;
}

// Export tag constants for use in StyleSelector, filtering, etc.
export {
STYLE_TAGS,
OCCASION_TAGS,
FUNCTIONAL_TAGS,
SILHOUETTE_TAGS,
VIBE_TAGS,
TAG_PROFILES,
COLOR_COMBINATIONS,
STYLE_TO_VIBE,
};
