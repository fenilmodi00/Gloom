import type { WardrobeItem, WardrobeItemInput } from '../types/wardrobe';
import type { Outfit, OutfitInput } from '../types/outfit';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;

/**
 * Strip markdown JSON code fences from response
 */
function stripMarkdown(jsonString: string): string {
  // Remove ```json and ``` fences
  let cleaned = jsonString.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  
  return cleaned.trim();
}

/**
 * Call Gemini API with retry logic
 */
async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY environment variable');
  }

  const contents: any[] = [];
  
  if (imageBase64) {
    contents.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }
  
  contents.push({
    text: prompt,
  });

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid Gemini response structure');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini API request timed out');
      }
    }
  }

  throw lastError || new Error('Failed to call Gemini API');
}

/**
 * Tag a wardrobe item from an image using Gemini 2.5 Flash
 */
export async function tagWardrobeItem(imageBase64: string): Promise<WardrobeItemInput> {
  const prompt = `You are a fashion AI. Analyze this clothing item photo and return ONLY valid JSON:
{
  "category": "upper" | "lower" | "dress" | "shoes" | "bag" | "accessory",
  "sub_category": string,
  "colors": string[],
  "style_tags": string[],
  "occasion_tags": string[],
  "fabric_guess": string
}
No markdown, no explanation, only JSON.`;

  const response = await callGemini(prompt, imageBase64);
  const cleaned = stripMarkdown(response);
  
  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate required fields
    if (!parsed.category || !['upper', 'lower', 'dress', 'shoes', 'bag', 'accessory'].includes(parsed.category)) {
      throw new Error('Invalid category in response');
    }
    
    return {
      category: parsed.category,
      sub_category: parsed.sub_category || null,
      colors: parsed.colors || [],
      style_tags: parsed.style_tags || [],
      occasion_tags: parsed.occasion_tags || [],
      fabric_guess: parsed.fabric_guess || null,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.substring(0, 200)}`);
    }
    throw error;
  }
}

/**
 * Generate outfit suggestions based on wardrobe items
 */
export async function generateOutfitSuggestions(
  wardrobeItems: WardrobeItem[],
  date: string,
  city: string,
  weather: string
): Promise<OutfitInput[]> {
  const itemsSummary = wardrobeItems.map(item => ({
    id: item.id,
    category: item.category,
    sub_category: item.sub_category,
    colors: item.colors,
    style_tags: item.style_tags,
  }));

  const prompt = `You are an Indian fashion stylist. User has these wardrobe items:
${JSON.stringify(itemsSummary)}

Today: ${date}
Weather: ${weather}
City: ${city}

Suggest 3 outfit combinations using ONLY items from the wardrobe.
Return ONLY valid JSON array:
[{
  "item_ids": string[],
  "occasion": string,
  "vibe": string,
  "color_reasoning": string,
  "ai_score": number (0-1)
}]`;

  const response = await callGemini(prompt);
  const cleaned = stripMarkdown(response);
  
  try {
    const parsed = JSON.parse(cleaned);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array response from Gemini');
    }
    
    return parsed.map((outfit: any) => ({
      item_ids: outfit.item_ids || [],
      occasion: outfit.occasion || null,
      vibe: outfit.vibe || null,
      color_reasoning: outfit.color_reasoning || null,
      ai_score: typeof outfit.ai_score === 'number' ? outfit.ai_score : 0,
    }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Gemini outfit response as JSON: ${cleaned.substring(0, 200)}`);
    }
    throw error;
  }
}
