import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  if (!__DEV__) {
    throw new Error(
      'Missing Supabase configuration. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }
  console.warn('Supabase env variables missing. Using dummy client in DEV.');
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-anon-key'
);

// Storage bucket names
export const STORAGE_BUCKETS = {
  WARDROBE_IMAGES: 'wardrobe-images',
} as const;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          body_photo_url: string | null;
          skin_tone: string | null;
          style_tags: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          body_photo_url?: string | null;
          skin_tone?: string | null;
          style_tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          body_photo_url?: string | null;
          skin_tone?: string | null;
          style_tags?: string[];
          created_at?: string;
        };
      };
      wardrobe_items: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          cutout_url: string | null;
          category: 'upper' | 'lower' | 'dress' | 'shoes' | 'bag' | 'accessory';
          sub_category: string | null;
          colors: string[];
          style_tags: string[];
          occasion_tags: string[];
          fabric_guess: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          cutout_url?: string | null;
          category: 'upper' | 'lower' | 'dress' | 'shoes' | 'bag' | 'accessory';
          sub_category?: string | null;
          colors?: string[];
          style_tags?: string[];
          occasion_tags?: string[];
          fabric_guess?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          cutout_url?: string | null;
          category?: 'upper' | 'lower' | 'dress' | 'shoes' | 'bag' | 'accessory';
          sub_category?: string | null;
          colors?: string[];
          style_tags?: string[];
          occasion_tags?: string[];
          fabric_guess?: string | null;
          created_at?: string;
        };
      };
      outfits: {
        Row: {
          id: string;
          user_id: string;
          item_ids: string[];
          occasion: string | null;
          vibe: string | null;
          color_reasoning: string | null;
          ai_score: number;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_ids?: string[];
          occasion?: string | null;
          vibe?: string | null;
          color_reasoning?: string | null;
          ai_score?: number;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_ids?: string[];
          occasion?: string | null;
          vibe?: string | null;
          color_reasoning?: string | null;
          ai_score?: number;
          cover_image_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
