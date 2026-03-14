export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  body_photo_url: string | null;
  skin_tone: string | null;
  style_tags: string[];
  created_at: string;
}

export interface UserProfileInput {
  name?: string | null;
  avatar_url?: string | null;
  body_photo_url?: string | null;
  skin_tone?: string | null;
  style_tags?: string[];
}

export type StylePreference = 
  | 'minimalist'
  | 'streetwear'
  | 'ethnic'
  | 'formal'
  | 'casual';

export type SkinTone = 
  | 'very-fair'
  | 'fair'
  | 'medium'
  | 'olive'
  | 'brown'
  | 'dark';
