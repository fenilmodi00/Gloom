export interface ModelImage {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url?: string | null;
  outfit_id?: string | null;
  model_id?: string | null;
  created_at: string;
  updated_at: string;
}
