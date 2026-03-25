# Learnings - Outfit Builder Integration with Enhanced Tags

## Current State
- Mock wardrobe tags have been successfully added (functional_tags, silhouette_tags, vibe_tags) to WardrobeItem interface and mock generators.
- Outfit builder currently uses random selection for filling missing outfit slots, ignoring tag compatibility.
- Outfit builder store uses a different category mapping (upper, lower, dress, shoes, bag, accessory) that does not align with WardrobeItem.Category (tops, bottoms, shoes, accessories, outerwear, fullbody, bags). This causes TypeScript errors and logical mismatches.

## Tag Taxonomy
- **Functional tags**: layering_staple, base_layer, outer_layer, transitional, four_season, etc. Indicate layering compatibility.
- **Silhouette tags**: slim_fit, regular_fit, relaxed_fit, oversized, cropped, fitted, flowy. Indicate fit/shape.
- **Vibe tags**: timeless, trend_aware, 90s_revival, modern_classic, vintage_inspired, ahead_of_curve. Indicate style era/aesthetic.
- **Style tags**: casual, streetwear, old_money, minimalist, bohemian, dark_academia, cottagecore, y2k, athleisure, gorpcore.
- **Occasion tags**: daytime, night_out, work, weekend, party, date_night, casual_friday, beach, travel.

## How Tags Should Influence Outfit Generation
1. **Style compatibility**: Items with matching style tags (e.g., old_money + old_money) should score higher.
2. **Functional layering**: Ensure proper layering: base_layer items go under outer_layer items; avoid two outer_layer pieces.
3. **Occasion matching**: Items with overlapping occasion tags are more compatible (e.g., work + work).
4. **Silhouette balance**: Pair slim_fit top with relaxed_fit bottom, etc.
5. **Vibe consistency**: Items with similar vibe tags (timeless + modern_classic) should be preferred.
6. **Color harmony**: Use COLOR_COMBINATIONS for color pairing suggestions.

## Current TypeScript Issues
- OutfitSelection keys (upper, lower, dress, shoes, bag, accessory) do not match Category union.
- Outfit builder store uses 'upper', 'lower', etc. but WardrobeItem.category uses 'tops', 'bottoms', etc.
- This mismatch leads to indexing errors and likely broken functionality.

## Key Observations
- The outfit builder's OutfitBoard component expects OutfitSelection with keys: top, bottom, shoes, accessory (and dress). It maps 'upper' to 'top', 'lower' to 'bottom', 'bag'/'accessory' to 'accessory'.
- The mapping between WardrobeItem.category and OutfitSelection slots is not clearly defined.
- The store's generateCombinations function groups items by Category but uses wrong category strings (upper, lower, dress, shoes, bag, accessory) which are not valid Category values.
- The selection logic toggles items based on category, but the mapping from WardrobeItem.category to selection slot is missing.