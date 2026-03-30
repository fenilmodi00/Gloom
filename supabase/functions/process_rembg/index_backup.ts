import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client with service role key for backend operations
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration for rembg service
const REMBG_SERVICE_URL = Deno.env.get("REMBG_SERVICE_URL") || "https://api.remove.bg/v1.0/removebg";
const REMBG_API_KEY = Deno.env.get("REMBG_API_KEY") ?? "";

// Background removal function using external rembg service
async function removeBackground(imageBuffer: Uint8Array): Promise<Uint8Array> {
  try {
    // Convert image buffer to base64 for sending to rembg service
    const base64Image = btoa(String.fromCharCode(...imageBuffer));
    
    // Call external rembg service (using remove.bg as example)
    const formData = new FormData();
    formData.append("image_file", base64Image);
    formData.append("size", "auto");
    
    const response = await fetch(REMBG_SERVICE_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": REMBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Rembg service error: ${response.status}`);
    }

    // Get the processed image as buffer
    const processedImageBlob = await response.blob();
    const processedImageArrayBuffer = await processedImageBlob.arrayBuffer();
    return new Uint8Array(processedImageArrayBuffer);
  } catch (error) {
    console.error("Error removing background:", error);
    throw error;
  }
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

  try {
    // Get the image file path from query params
    const url = new URL(req.url);
    const filePath = url.searchParams.get("filePath");
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "Missing filePath parameter" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Processing image: ${filePath}`);

    // Download the original image from storage
    const { data: imageData, error: downloadError } = await supabase
      .storage
      .from("wardrobe-temp")
      .download(filePath);

    if (downloadError) {
      throw downloadError;
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Convert blob to array buffer
    const arrayBuffer = await imageData.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    // Remove background using external service
    const processedBuffer = await removeBackground(imageBuffer);

    // Generate output file path (same name but in wardrobe-images bucket)
    const outputFilePath = filePath.replace(/^.*[\\\/]/, ''); // Get just the filename
    
    // Upload processed image to wardrobe-images bucket
    const { error: uploadError } = await supabase
      .storage
      .from("wardrobe-images")
      .upload(outputFilePath, processedBuffer, {
        contentType: "image/png", // rembg outputs PNG
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Extract wardrobe item ID from file path (assuming format: wardrobe-id/timestamp.extension)
    const pathParts = filePath.split("/");
    const wardrobeItemId = pathParts[0]; // First part is the wardrobe item ID

    // Update processing status to completed
    const { error: updateError } = await supabase
      .from("wardrobe_items")
      .update({ 
        processing_status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", wardrobeItemId);

    if (updateError) {
      throw updateError;
    }

    // Clean up: Delete the temporary file
    await supabase
      .storage
      .from("wardrobe-temp")
      .remove([filePath]);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Background removed successfully",
        processedFilePath: outputFilePath
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in process_rembg function:", error);
    
    // Try to update status to failed if we have the wardrobe item ID
    try {
      const url = new URL(req.url);
      const filePath = url.searchParams.get("filePath");
      if (filePath) {
        const pathParts = filePath.split("/");
        const wardrobeItemId = pathParts[0];
        
        await supabase
          .from("wardrobe_items")
          .update({ 
            processing_status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", wardrobeItemId);
      }
    } catch (updateError) {
      console.error("Failed to update processing status to failed:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});