# Draft: Outfit-Builder Refactor Plan

## Requirements (Confirmed)

### Dead Code to Delete
- `OutfitCombinationCarousel.tsx` (215 lines) — Never imported anywhere
- `OutfitCombinationGrid.tsx` (275 lines) — Only used by dead Carousel

### Anti-Pattern Violations to Fix
1. **StyleSheet.create → NativeWind** — 12 files affected (all active components/screens)
2. **console.log removal** — 3 files with debug logs
3. **Missing null checks** — `getBestMatchingItem` returns null

### Performance Optimizations (DSA-based)
1. Pair Score Memoization — Cache item-to-item compatibility scores
2. Inverted Tag Index — `Map<string, Set<WardrobeItem>>` for O(1) tag lookups
3. Priority Queue — Max-heap for top-K items per slot
4. Precomputed Color Compatibility — O(1) color pair lookup
5. Early Pruning — Skip items with low compatibility scores

## Research Findings

### File Structure (11 components)
| File | Status | Anti-Patterns |
|------|--------|---------------|
| `SelectItemsSection.tsx` | ACTIVE | StyleSheet.create |
| `SelectedItemsBar.tsx` | ACTIVE | StyleSheet.create |
| `StyleSelector.tsx` | ACTIVE | StyleSheet.create |
| `OutfitCombinationsSection.tsx` | ACTIVE | StyleSheet.create, console.log |
| `OutfitCombinationCard.tsx` | ACTIVE | None (compliant) |
| `OutfitBoardSheet.tsx` | ACTIVE | StyleSheet.create |
| `OutfitCombinationSlide.tsx` | ACTIVE | StyleSheet.create |
| `FaceCarousel.tsx` | ACTIVE | StyleSheet.create |
| `FaceSelectionBottomSheet.tsx` | ACTIVE | StyleSheet.create |
| `OutfitCombinationCarousel.tsx` | DEAD | StyleSheet.create, console.log |
| `OutfitCombinationGrid.tsx` | DEAD | StyleSheet.create, duplicate helper |

### Existing Infrastructure
- **Scoring**: `lib/outfit-scoring.ts` EXISTS — 6 scoring functions, 288 lines
- **Constants**: `constants/OutfitBuilder.ts` — Minimal (CARD_WIDTH, etc.)
- **Types**: `types/outfit.ts` — Outfit, OutfitInput, Occasion, Vibe
- **Store**: `lib/store/outfit-builder.store.ts` — 335 lines, full-featured
- **Tests**: Jest configured, but NO tests for outfit-scoring or outfit-builder store

### Test Coverage Gaps
- `lib/outfit-scoring.ts` — 0% coverage
- `lib/store/outfit-builder.store.ts` — 0% coverage
- Need fixtures for `WardrobeItem` mock data

## Scope Boundaries

### INCLUDE
- Delete 2 dead files
- Convert all StyleSheet.create to NativeWind className
- Remove all console.log statements
- Add null checks for getBestMatchingItem
- Create test infrastructure for outfit-scoring.ts
- Create test infrastructure for outfit-builder.store.ts
- Performance optimizations for scoring (if time permits)

### EXCLUDE
- Changes to `components/outfit-board/` (external dependency)
- Changes to wardrobe store or other unrelated modules
- Visual/design changes — only style migration, not redesign
- Database schema changes

## Technical Decisions
- Use TDD approach: Write failing tests first, then fix/refactor
- Preserve exact visual appearance after StyleSheet → NativeWind migration
- Use absolute imports `@/lib/...` throughout
- Named exports only (no default exports)
- Use `bun test` for all test execution

## Open Questions
1. Should performance optimizations be in Phase 1 or separate phase?
2. What test coverage threshold should we target?
