export type Category = 'tops' | 'bottoms' | 'shoes' | 'accessories' | 'bags' | 'fullbody' | 'outerwear';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';

export interface WardrobeItem {
id: string;
user_id: string;
image_url: string | number;
cutout_url: (string | number) | null;
category: Category;
sub_category: string | null;
colors: string[];
style_tags: string[];
occasion_tags: string[];
functional_tags: string[];
silhouette_tags: string[];
vibe_tags: string[];
fabric_guess: string | null;
created_at: string;
processing_status: ProcessingStatus;
}

export interface WardrobeItemInput {
  image_url?: string | number;
  cutout_url?: (string | number) | null;
  category: Category;
  sub_category?: string | null;
  colors?: string[];
  style_tags?: string[];
  occasion_tags?: string[];
  functional_tags?: string[];
  silhouette_tags?: string[];
  vibe_tags?: string[];
  fabric_guess?: string | null;
  processing_status?: ProcessingStatus;
}

export type SubCategory = 
  // Upper
  | 'tshirt' | 'shirt' | 'blouse' | 'kurta' | 'sherwani' | 'jacket' | 'hoodie' | 'sweater'
  // Lower
  | 'jeans' | 'trousers' | 'shorts' | 'skirt' | 'palazzo' | 'churidar' | 'leggings'
  // Dress
  | 'gown' | 'saree' | 'lehenga' | 'anarkali' | 'maxi' | 'jumpsuit'
  // Shoes
  | 'sneakers' | 'heels' | 'flats' | 'sandals' | 'boots' | 'mojaris' | 'juttis'
  // Bags
  | 'handbag' | 'clutch' | 'tote' | 'backpack' | 'slingbag' | 'potli'
  // Accessories
  | 'watch' | 'jewelry' | 'scarf' | 'belt' | 'sunglasses' | 'hat' | 'bag' | 'wallet';
