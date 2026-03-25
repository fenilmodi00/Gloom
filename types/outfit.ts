export interface Outfit {
  id: string;
  user_id: string;
  item_ids: string[];
  occasion: string | null;
  vibe: string | null;
  color_reasoning: string | null;
  ai_score: number;
  cover_image_url: string | null;
  created_at: string;
}

export interface OutfitInput {
  item_ids: string[];
  occasion?: string | null;
  vibe?: string | null;
  color_reasoning?: string | null;
  ai_score?: number;
  cover_image_url?: string | null;
}

export type Occasion =
  | 'casual'
  | 'work'
  | 'formal'
  | 'party'
  | 'wedding'
  | 'festival'
  | 'date'
  | 'sports'
  | 'travel'
  | 'home';

export type Vibe =
  | 'minimalist'
  | 'ethnic'
  | 'western'
  | 'fusion'
  | 'boho'
  | 'classic'
  | 'trendy'
  | 'streetwear';
