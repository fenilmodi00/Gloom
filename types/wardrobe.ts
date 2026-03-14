export type Category = 'upper' | 'lower' | 'dress' | 'shoes' | 'bag' | 'accessory';

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  cutout_url: string | null;
  category: Category;
  sub_category: string | null;
  colors: string[];
  style_tags: string[];
  occasion_tags: string[];
  fabric_guess: string | null;
  created_at: string;
}

export interface WardrobeItemInput {
  image_url?: string;
  cutout_url?: string | null;
  category: Category;
  sub_category?: string | null;
  colors?: string[];
  style_tags?: string[];
  occasion_tags?: string[];
  fabric_guess?: string | null;
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
