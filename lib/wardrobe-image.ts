/**
 * URL transformation utilities for wardrobe images
 * Routes all image requests through the backend server
 */

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * Transforms a Supabase Storage URL to a backend proxy URL
 * Input:  https://xxx.supabase.co/storage/v1/object/public/wardrobe-images/user123/123.jpg
 * Output: http://localhost:8080/api/v1/wardrobe/images/user123/123.jpg
 */
export function getWardrobeImageUrl(supabaseUrl: string | null | undefined): string | null {
  if (!supabaseUrl) return null;

  // Extract the path from Supabase Storage URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/wardrobe-images/{path}
  const match = supabaseUrl.match(/wardrobe-images\/(.+)$/);
  if (match && match[1]) {
    return `${BACKEND_URL}/api/v1/wardrobe/images/${match[1]}`;
  }

  // If URL doesn't match expected format, return as-is (fallback)
  return supabaseUrl;
}

/**
 * Get image URL for wardrobe item (uses cutout_url if available, returns null during processing)
 * Prevents raw image flash by signaling skeleton when item is being processed
 */
export function getWardrobeItemImageUrl(item: { 
  image_url?: string | number | null; 
  cutout_url?: string | number | null;
  processing_status?: string | null;
}): string | null {
  // If cutout is available, use it (processing complete)
  if (item.cutout_url) {
    if (typeof item.cutout_url === 'number') return null; // Can't proxy local assets
    return getWardrobeImageUrl(item.cutout_url);
  }
  
  // Return null during processing to signal skeleton display
  if (item.processing_status === 'processing' || item.processing_status === 'analyzing') {
    return null;
  }
  
  // Otherwise fallback to original image (for completed items without cutout)
  if (item.image_url) {
    if (typeof item.image_url === 'number') return null; // Can't proxy local assets
    return getWardrobeImageUrl(item.image_url);
  }
  
  return null;
}
