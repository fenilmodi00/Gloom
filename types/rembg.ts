/**
 * Rembg Service Types
 *
 * API Contract for background removal service.
 * Endpoint: POST {REMBG_SERVICE_URL}/remove-background
 *
 * Request: Multipart form data with 'file' field
 * Response: Binary image data (PNG cutout)
 */

/**
 * Request payload for rembg service
 */
export interface RembgRequest {
  /** Image file as multipart form data */
  file: File | Blob;
}

/**
 * Response from rembg service
 * On success: binary image data (PNG cutout)
 * On error: JSON error object
 */
export interface RembgResponse {
  /** Cutout image as binary data (on success) */
  image: Uint8Array;
  /** Content type of the returned image */
  contentType: string;
}

/**
 * Error response from rembg service
 */
export interface RembgError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
}

/**
 * Rembg service client interface
 */
export interface RembgService {
  /**
   * Remove background from an image
   * @param imageFile - The image file to process
   * @returns Promise resolving to cutout image bytes
   */
  removeBackground(imageFile: File | Blob): Promise<Uint8Array>;
}

/**
 * Processing status for rembg operations
 * Maps to the ProcessingStatus type in wardrobe.ts
 */
export type RembgProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';
