# Problems - Outfit Builder Integration

## Unresolved Technical Problems

### 1. Category Type Mismatch
**Problem**: OutfitSelection keys (upper, lower, dress, shoes, bag, accessory) are not part of Category union. This causes TypeScript errors throughout outfit-builder.store.ts and likely runtime errors when trying to index WardrobeItem objects.

**Impact**: High - breaks type safety, may cause runtime bugs.

**Potential Solutions**:
- Create a mapping type: `type OutfitSlot = 'upper' | 'lower' | 'dress' | 'shoes' | 'bag' | 'accessory'`
- Create mapping function: `function categoryToSlot(category: Category): OutfitSlot`
- Update OutfitSelection to use Category union? That would require redesigning OutfitBoard.

### 2. OutfitSelection vs Category Mapping Ambiguity
**Problem**: No clear mapping for where outerwear and fullbody items go. Should outerwear be separate slot or map to upper? Should fullbody items map to dress slot? How to handle bags vs accessories?

**Impact**: Medium - affects outfit composition logic.

### 3. Tag Scoring Complexity
**Problem**: Designing a fair scoring algorithm that balances multiple tag dimensions without being too restrictive. Need to avoid over-penalizing creative combinations.

**Impact**: Medium - affects user experience of outfit suggestions.

### 4. Existing Mock Data Tag Consistency
**Problem**: Mock wardrobe generators assign tags but not all items have multiple tags (e.g., functional_tags may be empty array). The scoring algorithm must handle missing tags gracefully.

**Impact**: Low - can be handled with defaults.

### 5. Integration with Existing Outfit Builder UI
**Problem**: The UI currently shows combinations but doesn't display why they match (no tag explanation). Adding visual feedback for tag compatibility may be needed.

**Impact**: Low - UI enhancement for future iteration.

## Blockers
- TypeScript errors must be fixed before any tag integration can work.
- Need to decide on category mapping before implementing tag scoring.