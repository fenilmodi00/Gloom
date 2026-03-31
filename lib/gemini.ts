import type { WardrobeItem, Category } from '@/types/wardrobe';
import { Outfit, Occasion, Vibe } from '@/types/outfit';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const isGeminiConfigured = !!GEMINI_API_KEY;

/**
 * Result type for tagWardrobeItem - properly typed to match WardrobeItemInput
 */
interface TagWardrobeItemResult {
  category: Category;
  sub_category: string;
  colors: string[];
  style_tags: string[];
  occasion_tags: string[];
  vibe_tags: string[];
  functional_tags: string[];
  silhouette_tags: string[];
  fabric_guess: string;
}

/**
 * Implementation of fashion AI tagging using Gemini 2.5 Flash.
 * Falls back to mock in DEV if no API key is provided.
 */
export async function tagWardrobeItem(photoUri: string): Promise<TagWardrobeItemResult> {
  if (!isGeminiConfigured) {
    if (!__DEV__) {
      throw new Error('Gemini API key is not configured.');
    }
    // Mock implementation for DEV
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      category: "tops",
      sub_category: "T-Shirt",
      colors: ["White"],
      style_tags: ["Minimalist", "Casual"],
      occasion_tags: ["Daily", "Casual"],
      vibe_tags: ["minimalist", "classic"],
      functional_tags: ["breathable", "lightweight"],
      silhouette_tags: ["regular fit"],
      fabric_guess: "Cotton"
    };
  }

  try {
    // 1. Get base64 from URI
    // 1. Get blob from URI using XHR (more robust than fetch for local files on RN)
    // On Android, ensure we have the file:// prefix if it's a local path
    const normalizedUri = photoUri.startsWith('/') ? `file://${photoUri}` : photoUri;

    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Failed to load local file: status ${xhr.status}`));
        }
      };
      xhr.onerror = (e) => {
        console.error('[GEMINI] XHR Error details:', e);
        reject(new TypeError(`Network request failed to get local blob for Gemini (URI: ${normalizedUri})`));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', normalizedUri, true);
      xhr.send(null);
    });
    
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (!result) {
          reject(new Error('FileReader result is empty'));
          return;
        }
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Failed to extract base64 from data URL'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = (e) => {
        console.error('[GEMINI] FileReader error:', e);
        reject(e);
      };
      reader.readAsDataURL(blob);
    });

    // 2. Call Gemini API
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
      Analyze this clothing item image for a personal styling app. 
      Extract these details accurately as a JSON object:
      - category: One of (tops, bottoms, shoes, accessories, bags, fullbody, outerwear)
      - sub_category: The specific type (e.g., tshirt, jeans, heels, etc.)
      - colors: Array of dominant color names
      - style_tags: Array of style descriptors (e.g., streetwear, minimalist, boho)
      - occasion_tags: Array of suitable occasions (e.g., casual, work, party, formal)
      - functional_tags: Array of functional properties (e.g., breathable, warm, waterproof)
      - silhouette_tags: Array of fit/shape descriptors (e.g., slim fit, oversized, regular)
      - vibe_tags: Array of aesthetic vibes (e.g., edgy, soft, professional)
      - fabric_guess: String describing the likely fabric (e.g., cotton, linen, silk)
      
      Respond ONLY with the JSON object, nothing else.
    `;

    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      })
    });

    const result = await geminiResponse.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Gemini failed to return analysis result.');
    }

    const parsed = JSON.parse(textResponse);
    
    return {
      category: parsed.category || "tops",
      sub_category: parsed.sub_category || "Item",
      colors: parsed.colors || [],
      style_tags: parsed.style_tags || [],
      occasion_tags: parsed.occasion_tags || [],
      vibe_tags: parsed.vibe_tags || [],
      functional_tags: parsed.functional_tags || [],
      silhouette_tags: parsed.silhouette_tags || [],
      fabric_guess: parsed.fabric_guess || "Unknown"
    };
  } catch (error) {
    console.error('Gemini Tagging Error:', error);
    // Fallback to simpler mock if everything fails
    return {
      category: "tops",
      sub_category: "Item",
      colors: ["Default"],
      style_tags: ["Classic"],
      occasion_tags: ["Daily"],
      vibe_tags: ["minimalist"],
      functional_tags: [],
      silhouette_tags: [],
      fabric_guess: "Cotton"
    };
  }
}

/**
 * Local matching algorithm based on tags.
 */
export async function getMatchingItems(
  selectedItem: WardrobeItem,
  candidateItems: WardrobeItem[]
) {
  // Simulating small delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const results = candidateItems
    .filter(item => item.id !== selectedItem.id)
    .map(item => {
      let score = 0;
      
      // 1. Category matching (Tops match Bottoms, etc.)
      const isTop = selectedItem.category === 'tops';
      const isBottom = selectedItem.category === 'bottoms';
      const isShoes = selectedItem.category === 'shoes';
      
      const targetIsTop = item.category === 'tops';
      const targetIsBottom = item.category === 'bottoms';
      const targetIsShoes = item.category === 'shoes';

      if ((isTop && targetIsBottom) || (isBottom && targetIsTop)) score += 0.5;
      if ((isTop && targetIsShoes) || (isBottom && targetIsShoes)) score += 0.3;
      if (selectedItem.category === item.category) score -= 0.2; // Penalize same category

      // 2. Style Tag Match
      const commonStyle = selectedItem.style_tags.filter(tag => item.style_tags.includes(tag));
      score += commonStyle.length * 0.15;

      // 3. Occasion Tag Match
      const commonOccasion = selectedItem.occasion_tags.filter(tag => item.occasion_tags.includes(tag));
      score += commonOccasion.length * 0.15;

      // 4. Color Match
      const commonColors = selectedItem.colors.filter(color => item.colors.includes(color));
      score += commonColors.length * 0.1;

      // Normalize score to 0.0 - 1.0
      const finalScore = Math.min(Math.max(score, 0.1), 0.95);

      return {
        id: item.id,
        score: finalScore,
        reasoning: `Matches ${commonStyle.length > 0 ? commonStyle[0] : 'style'} and is a good ${item.category} choice.`
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return results;
}

/**
 * AI-powered outfit suggestion generator.
 */
export async function generateOutfitSuggestions(
  items: WardrobeItem[],
  date: string,
  weather: string,
  city: string
) {
  if (!isGeminiConfigured) {
    // Falls back to rule-based logic in DEV
    return generateRuleBasedSuggestions(items);
  }

  // Real Gemini implementation for outfit generation would go here
  await new Promise(resolve => setTimeout(resolve, 1500));
  return generateRuleBasedSuggestions(items);
}

/**
 * Rule-based fallback for outfit suggestions.
 */
function generateRuleBasedSuggestions(items: WardrobeItem[]): Outfit[] {
  const tops = items.filter(i => i.category === 'tops');
  const bottoms = items.filter(i => i.category === 'bottoms');
  const shoes = items.filter(i => i.category === 'shoes');
  const fullbody = items.filter(i => i.category === 'fullbody');
  const outerwear = items.filter(i => i.category === 'outerwear');
  const bags = items.filter(i => i.category === 'bags');

  if (tops.length === 0 && fullbody.length === 0) {
    return [];
  }

  const findComboForOccasion = (occasion: Occasion): Outfit | null => {
    let availableTops = tops.filter(t => t.occasion_tags.includes(occasion));
    if (availableTops.length === 0) availableTops = tops;

    let availableBottoms = bottoms.filter(b => b.occasion_tags.includes(occasion));
    if (availableBottoms.length === 0) availableBottoms = bottoms;

    let availableFullbody = fullbody.filter(f => f.occasion_tags.includes(occasion));
    if (availableFullbody.length === 0) availableFullbody = fullbody;

    let availableShoes = shoes.filter(s => s.occasion_tags.includes(occasion));
    if (availableShoes.length === 0) availableShoes = shoes;

    let availableOuterwear = outerwear.filter(o => o.occasion_tags.includes(occasion));
    if (availableOuterwear.length === 0) availableOuterwear = outerwear;

    let availableBags = bags.filter(bg => bg.occasion_tags.includes(occasion));
    if (availableBags.length === 0) availableBags = bags;

    // Logic: Either Fullbody OR (Top + Bottom)
    const useFullbody = availableFullbody.length > 0 && (Math.random() > 0.5 || availableTops.length === 0);
    
    if (useFullbody && availableFullbody.length === 0) return null;
    if (!useFullbody && (availableTops.length === 0 || availableBottoms.length === 0)) return null;

    const item_ids: string[] = [];
    let baseItem: WardrobeItem;

    if (useFullbody) {
      const fb = availableFullbody[Math.floor(Math.random() * availableFullbody.length)];
      item_ids.push(fb.id);
      baseItem = fb;
    } else {
      const t = availableTops[Math.floor(Math.random() * availableTops.length)];
      const b = availableBottoms[Math.floor(Math.random() * availableBottoms.length)];
      item_ids.push(t.id, b.id);
      baseItem = t;
    }

    // Add optional shoes, outerwear, and bags
    const shoe = availableShoes[Math.floor(Math.random() * availableShoes.length)];
    if (shoe) item_ids.push(shoe.id);

    if (availableOuterwear.length > 0 && Math.random() > 0.6) {
      item_ids.push(availableOuterwear[Math.floor(Math.random() * availableOuterwear.length)].id);
    }

    if (availableBags.length > 0 && Math.random() > 0.7) {
      item_ids.push(availableBags[Math.floor(Math.random() * availableBags.length)].id);
    }

    const vibes: Vibe[] = ['minimalist', 'ethnic', 'western', 'fusion', 'boho', 'classic', 'trendy', 'streetwear'];
    const selectedVibe = baseItem.style_tags[0] && vibes.includes(baseItem.style_tags[0] as Vibe) ? baseItem.style_tags[0] as Vibe : 'minimalist';

    return {
      id: Math.random().toString(36).substr(2, 9),
      user_id: 'dev-user',
      item_ids,
      occasion: occasion,
      vibe: selectedVibe,
      color_reasoning: `Highly curated ${baseItem.colors[0]} based ensemble for ${occasion}.`,
      ai_score: 0.85 + Math.random() * 0.1,
      cover_image_url: baseItem.image_url as string,
      created_at: new Date().toISOString()
    };
  };

  const suggestions: (Outfit | null)[] = [
    findComboForOccasion('casual'),
    findComboForOccasion('work'),
    findComboForOccasion('party')
  ];

  return suggestions.filter((s): s is Outfit => s !== null);
}


