import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration for rembg service
const REMBG_SERVICE_URL = Deno.env.get("REMBG_SERVICE_URL") || "https://api.remove.bg/v1.0/removebg";
const REMBG_API_KEY = Deno.env.get("REMBG_API_KEY") ?? "";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 3000]; // Exponential backoff: 1s, 2s, 3s

// Timeout for external API calls (30 seconds)
const API_TIMEOUT_MS = 30000;

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = API_TIMEOUT_MS, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Background removal function using external rembg service with retry logic
 */
async function removeBackground(imageBuffer: Uint8Array, attempt = 1): Promise<Uint8Array> {
  try {
    // Convert image buffer to base64 for sending to rembg service
    const base64Image = btoa(String.fromCharCode(...imageBuffer));
    
    // Call external rembg service (using remove.bg as example)
    const formData = new FormData();
    formData.append("image_file_b64", base64Image);
    formData.append("size", "auto");
    
    const response = await fetchWithTimeout(REMBG_SERVICE_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": REMBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rembg service error: ${response.status} - ${errorText}`);
    }

    // Get the processed image as buffer
    const processedImageBlob = await response.blob();
    const processedImageArrayBuffer = await processedImageBlob.arrayBuffer();
    return new Uint8Array(processedImageArrayBuffer);
  } catch (error) {
    // Check if we should retry
    if (attempt < MAX_RETRIES) {
      console.log(`Background removal attempt ${attempt} failed, retrying in ${RETRY_DELAYS[attempt - 1]}ms...`);
      await sleep(RETRY_DELAYS[attempt - 1]);
      return removeBackground(imageBuffer, attempt + 1);
    }
    
    console.error(`Background removal failed after ${MAX_RETRIES} attempts:`, error);
    throw error;
  }
}

/**
 * Validate JWT token from Authorization header
 */
async function validateToken(authHeader: string | null): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the JWT using Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("Token validation error:", error);
      return null;
    }
    
    return { userId: user.id };
  } catch (error) {
    console.error("Token validation exception:", error);
    return null;
  }
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitize file path to prevent directory traversal
 */
function sanitizeFilePath(filePath: string): string {
  // Remove any path traversal attempts
  const sanitized = filePath.replace(/\.\./g, "").replace(/[<>:"|?*]/g, "");
  return sanitized;
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      }
    });
  }

  let wardrobeItemId: string | null = null;
  let filePath: string | null = null;

  try {
    // Step 1: Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    const user = await validateToken(authHeader);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing authentication token" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Step 2: Parse JSON body
    let body: { itemId?: string; filePath?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { itemId, filePath: reqFilePath } = body;

    // Step 3: Validate itemId (must be valid UUID)
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: "Missing itemId parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!isValidUUID(itemId)) {
      return new Response(
        JSON.stringify({ error: "Invalid itemId format: must be a valid UUID" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Step 4: Validate filePath
    if (!reqFilePath) {
      return new Response(
        JSON.stringify({ error: "Missing filePath parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    filePath = sanitizeFilePath(reqFilePath);
    wardrobeItemId = itemId;

    console.log(`Processing image for item ${wardrobeItemId}: ${filePath}`);

    // Step 5: Download the original image from storage
    const { data: imageData, error: downloadError } = await supabase
      .storage
      .from("wardrobe-temp")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image not found in storage" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Step 6: Convert blob to array buffer
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    // Step 7: Remove background using external service (with retries)
    console.log(`Starting background removal for item ${wardrobeItemId}...`);
    const processedBuffer = await removeBackground(imageBuffer);

    // Step 8: Generate output file path
    const outputFilePath = filePath.replace(/^.*[\\\/]/, ''); // Get just the filename
    
    // Step 9: Upload processed image to wardrobe-images bucket
    const { error: uploadError } = await supabase
      .storage
      .from("wardrobe-images")
      .upload(outputFilePath, processedBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    // Step 10: Get the public URL of the processed image
    const { data: urlData } = supabase
      .storage
      .from("wardrobe-images")
      .getPublicUrl(outputFilePath);

    // Step 11: Update wardrobe item with cutout_url and processing_status (transaction-safe)
    const { error: updateError } = await supabase
      .from("wardrobe_items")
      .update({ 
        cutout_url: urlData.publicUrl,
        processing_status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", wardrobeItemId)
      .eq("user_id", user.userId); // Ensure user owns this item

    if (updateError) {
      throw new Error(`Failed to update wardrobe item: ${updateError.message}`);
    }

    // Step 12: Clean up temporary file
    try {
      await supabase
        .storage
        .from("wardrobe-temp")
        .remove([filePath]);
    } catch (cleanupError) {
      // Log but don't fail the request if cleanup fails
      console.warn(`Failed to cleanup temp file: ${cleanupError}`);
    }

    console.log(`Background removal completed for item ${wardrobeItemId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Background removed successfully",
        cutoutUrl: urlData.publicUrl,
        processedFilePath: outputFilePath
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    console.error("Error in process_rembg function:", error);
    
    // Update status to failed if we have the wardrobe item ID
    if (wardrobeItemId && authHeader) {
      try {
        const user = await validateToken(authHeader);
        if (user) {
          await supabase
            .from("wardrobe_items")
            .update({ 
              processing_status: "failed",
              updated_at: new Date().toISOString()
            })
            .eq("id", wardrobeItemId)
            .eq("user_id", user.userId);
        }
      } catch (updateError) {
        console.error("Failed to update processing status to failed:", updateError);
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
