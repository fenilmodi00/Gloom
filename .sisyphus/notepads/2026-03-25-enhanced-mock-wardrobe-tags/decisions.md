# Decisions - Outfit Builder Integration

## Required Architectural Decisions

### 1. Category Mapping Strategy
**Decision Needed**: How to map WardrobeItem.category to OutfitSelection slots (upper, lower, dress, shoes, bag, accessory). Options:
- **Option A**: Keep OutfitSelection keys as they are (upper, lower, dress, shoes, bag, accessory) and create mapping function: tops → upper, bottoms → lower, outerwear → upper, fullbody → dress, bags → bag, accessories → accessory.
- **Option B**: Change OutfitSelection keys to match Category union (tops, bottoms, etc.) and update OutfitBoard component accordingly.
- **Recommendation**: Option A (minimal changes) but need to decide how to handle outerwear (should it map to upper or have separate slot?).

### 2. Tag Scoring Algorithm Design
**Decision Needed**: How to weight different tag types in matchScore. Proposed weights:
- Style compatibility: 30%
- Vibe consistency: 20%
- Occasion matching: 15%
- Functional layering: 20%
- Silhouette balance: 10%
- Color harmony: 5%

### 3. Integration with Existing Style Selection
**Decision Needed**: Should selectedStyle filter items before combination generation, or influence scoring? Probably both: filter items that have at least one matching style tag, then boost score for items with exact style match.

### 4. Outfit Generation Scope
**Decision Needed**: Should outfit builder generate only complete outfits (all slots filled) or partial outfits? Currently generates partial outfits (some slots empty). Should we enforce minimum items (top + bottom + shoes)?

## Existing Decisions (from Plan)
- Use hybrid approach (structured tags now, embeddings later) - already implemented.
- Keep WardrobeItem as source of truth for tags - already done.
- Export tag constants for use in components - already done.