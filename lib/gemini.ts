import { Platform } from 'react-native';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function tagWardrobeItem(base64Image: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `You are a fashion AI. Analyze this clothing item photo and return ONLY valid JSON:
  {
    "category": "tops|bottoms|shoes|accessories|outerwear|fullbody|bags",
    "sub_category": "string",
    "colors": ["string"],
    "style_tags": ["string"],
    "occasion_tags": ["string"],
    "fabric_guess": "string"
  }
  No markdown, no explanation, only JSON.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    throw new Error('Failed to analyze image with Gemini');
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textContent) {
    throw new Error('Invalid response from Gemini');
  }

  try {
    return JSON.parse(textContent);
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', textContent);
    throw new Error('Failed to parse Gemini response');
  }
}

export async function generateOutfitSuggestions(
  items: any[],
  date: string,
  weather: string,
  city: string
) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const itemsJson = JSON.stringify(
    items.map((item) => ({
      id: item.id,
      category: item.category,
      sub_category: item.sub_category,
      colors: item.colors,
      style_tags: item.style_tags,
      occasion_tags: item.occasion_tags,
    }))
  );

  const prompt = `You are an Indian fashion stylist. User has these wardrobe items: ${itemsJson}.
   Today: ${date}. Weather: ${weather}. City: ${city}.
   Suggest 3 outfit combinations using ONLY items from the wardrobe.
   Return ONLY valid JSON array:
   [{
     "item_ids": ["string"],
     "occasion": "string",
     "vibe": "string",
     "color_reasoning": "string",
     "ai_score": 0.95
   }]
   No markdown, no explanation, only JSON.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', errorText);
    throw new Error('Failed to generate outfit suggestions');
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error('Invalid response from Gemini');
  }

  try {
    return JSON.parse(textContent);
  } catch (e) {
    console.error('Failed to parse Gemini JSON:', textContent);
    throw new Error('Failed to parse Gemini response');
  }
}
