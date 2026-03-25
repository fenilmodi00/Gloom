/**
 * Outfit Mapping Utility
 *
 * Maps between WardrobeItem categories and OutfitSelection slots.
 * WardrobeItem.category uses: tops, bottoms, shoes, accessories, outerwear, fullbody, bags
 * OutfitSelection uses: upper, lower, dress, shoes, bag, accessory
 */

import type { Category } from '@/types/wardrobe';
import type { OutfitSelection } from '@/lib/store/outfit-builder.store';

export type OutfitSlot = keyof OutfitSelection;

/** Map a WardrobeItem category to its OutfitSelection slot */
export function categoryToSlot(category: Category): OutfitSlot {
  switch (category) {
    case 'tops':
    case 'outerwear':
      return 'upper';
    case 'bottoms':
      return 'lower';
    case 'fullbody':
      return 'dress';
    case 'shoes':
      return 'shoes';
    case 'bags':
      return 'bag';
    case 'accessories':
      return 'accessory';
  }
}

/** Inverse mapping: get all categories that map to a given slot */
export function slotToCategories(slot: OutfitSlot): Category[] {
  switch (slot) {
    case 'upper':
      return ['tops', 'outerwear'];
    case 'lower':
      return ['bottoms'];
    case 'dress':
      return ['fullbody'];
    case 'shoes':
      return ['shoes'];
    case 'bag':
      return ['bags'];
    case 'accessory':
      return ['accessories'];
  }
}

/** All outfit slots in display order */
export const OUTFIT_SLOTS: OutfitSlot[] = ['upper', 'lower', 'dress', 'shoes', 'bag', 'accessory'];
