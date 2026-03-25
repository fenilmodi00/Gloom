import type { WardrobeItem, Category } from '@/types/wardrobe';
import { Outfit, Occasion, Vibe } from '@/types/outfit';

/**
 * Result type for tagWardrobeItem - properly typed to match WardrobeItemInput
 */
interface TagWardrobeItemResult {
  category: Category;
  sub_category: string;
  colors: string[];
  style_tags: string[];
  occasion_tags: string[];
  fabric_guess: string;
}

/**
 * Mock implementation of fashion AI tagging.
 * Returns default tags based on the image (not actually analyzing it).
 */
export async function tagWardrobeItem(base64Image: string): Promise<TagWardrobeItemResult> {
  // Simulating small delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    category: "tops",
    sub_category: "T-Shirt",
    colors: ["White"],
    style_tags: ["Minimalist", "Casual"],
    occasion_tags: ["Daily", "Casual"],
    fabric_guess: "Cotton"
  };
}

/**
 * Local mock matching algorithm based on tags.
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
 * Rule-based outfit suggestion generator.
 */
export async function generateOutfitSuggestions(
  items: WardrobeItem[],
  date: string,
  weather: string,
  city: string
) {
  // Simulating small delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const tops = items.filter(i => i.category === 'tops' || i.category === 'outerwear');
  const bottoms = items.filter(i => i.category === 'bottoms');
  const shoes = items.filter(i => i.category === 'shoes');
  const fullbody = items.filter(i => i.category === 'fullbody');

  if (tops.length === 0 && fullbody.length === 0) {
    return [];
  }

  const findComboForOccasion = (occasion: Occasion): any => {
    // Collect all available categories
    const availableTops = tops.filter(t => t.occasion_tags.includes(occasion)) || tops;
    const availableBottoms = bottoms.filter(b => b.occasion_tags.includes(occasion)) || bottoms;
    const availableShoes = shoes.filter(s => s.occasion_tags.includes(occasion)) || shoes;
    const availableAccessories = items.filter(i => i.category === 'accessories' && i.occasion_tags.includes(occasion));
    const availableOuterwear = items.filter(i => i.category === 'outerwear' && i.occasion_tags.includes(occasion));

    if (availableTops.length === 0 || availableBottoms.length === 0) return null;

    // Pick base items
    const top = availableTops[Math.floor(Math.random() * availableTops.length)];
    const bottom = availableBottoms[Math.floor(Math.random() * availableBottoms.length)];
    const shoe = availableShoes[Math.floor(Math.random() * availableShoes.length)] || shoes[0];

    const item_ids = [top.id, bottom.id];
    if (shoe) item_ids.push(shoe.id);

    // Add optional items for diversity
    if (availableOuterwear.length > 0 && Math.random() > 0.5) {
      item_ids.push(availableOuterwear[Math.floor(Math.random() * availableOuterwear.length)].id);
    }
    if (availableAccessories.length > 0) {
      const accessory = availableAccessories[Math.floor(Math.random() * availableAccessories.length)];
      item_ids.push(accessory.id);
    }

    const vibes: Vibe[] = ['minimalist', 'ethnic', 'western', 'fusion', 'boho', 'classic', 'trendy', 'streetwear'];
    const selectedVibe = top.style_tags[0] && vibes.includes(top.style_tags[0] as Vibe) ? top.style_tags[0] as Vibe : 'minimalist';

    return {
      item_ids,
      occasion: occasion,
      vibe: selectedVibe,
      color_reasoning: `Highly curated ${top.colors[0]} and ${bottom.colors[0]} ensemble with appropriate ${occasion} accents.`,
      ai_score: 0.85 + Math.random() * 0.1
    };
  };

  const suggestions: (Outfit | null)[] = [
    findComboForOccasion('casual'),
    findComboForOccasion('work'),
    findComboForOccasion('party')
  ];

  return suggestions.filter((s): s is Outfit => s !== null);
}

