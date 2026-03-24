# Outfit Combination Cards Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an outfit combination suggestion system for the outfit-builder screen that displays generated outfit combinations as horizontal scrollable cards below the SelectItemsSection, enabling users to preview multiple outfit combinations and view full OutfitBoard details before AI generation.

**Architecture:** A hybrid approach combining simple rule-based combination generation for immediate feedback with AI-powered styling suggestions. The feature uses Zustand for state management, following the existing store pattern in the codebase. Combinations are generated client-side using category-based permutations (dress OR top+bottom), then users can optionally enhance them with AI styling via the existing Gemini integration.

**Tech Stack:** React Native, Zustand (state), @gorhom/bottom-sheet (modals), expo-image (lazy loading), react-native-reanimated (animations), Gemini API (AI suggestions).

---

## Design Decisions Summary

### Q1: How should we generate "multiple combinations" from selected items?

**Decision:** Hybrid approach - simple permutations first, AI enhancement optional

- **Phase 1 (MVP):** Rule-based permutations using selected items
  - If dress selected → dress-only combinations
  - If top+bottom selected → create combinations pairing them
  - Generate 3-6 combinations based on selected items
- **Phase 2 (AI Enhancement):** Use existing `generateOutfitSuggestions()` from `gemini.ts` for styled suggestions
- **Rationale:** Immediate visual feedback is critical for UX. AI calls are slow and may fail. Start fast, enhance optionally.

### Q2: What should the combination card look like?

**Decision:** Mini OutfitBoard preview (scaled version of existing OutfitBoard)

- Card dimensions: 120x150px (matching existing item cards)
- Shows 4-slot layout: top, bottom, shoes, accessory positions
- Each slot displays scaled image of selected item
- Empty slots shown as subtle placeholder outlines
- Consistent with existing OutfitBoard component - reuse via props

### Q3: Should combinations appear immediately or after a "Suggest Combinations" button tap?

**Decision:** Show immediately when 2+ items selected, with "Regenerate" button for refresh

- Auto-generate combinations when 2+ items are selected
- "Mix & Match" button triggers fresh combination generation
- Loading state with skeleton cards while generating
- Maximum 6 combinations shown to avoid cognitive overload

### Q4: How to handle the full board view - bottom sheet, modal, or navigate to new screen?

**Decision:** Bottom sheet (consistent with codebase patterns)

- Use existing `@gorhom/bottom-sheet` library (already in package.json)
- Snap points: 85% height for full view
- Contains: full-size OutfitBoard + "Generate Outfit" CTA button
- Allow drag to dismiss (swipe down)
- Rationale: Maintains navigation context, consistent with SelectItemsSheet pattern

---

## Component Structure

### New Components Needed

```
components/
├── wardrobe/
│   └── outfit-builder/
│       ├── CombinationCards.tsx        # NEW - Horizontal scrollable cards container
│       ├── CombinationCard.tsx         # NEW - Individual mini OutfitBoard card
│       └── CombinationDetailSheet.tsx  # NEW - Bottom sheet for full preview
```

### Modified Files

```
app/outfit-builder.tsx                # Add CombinationCards section below SelectItemsSection
lib/store/outfit-builder.store.ts     # Add combination state management
lib/gemini.ts                         # (Optional) Enhance with AI combinations
```

### Component Specifications

#### CombinationCards.tsx
- Horizontal ScrollView with horizontalScrollIndicator={false}
- Card dimensions: 120w x 150h px
- Gap: 12px between cards
- Padding: 16px horizontal
- Shows 3-6 cards based on generated combinations
- Empty state: "Select items to see combinations" message

#### CombinationCard.tsx
- Mini OutfitBoard rendering (scaled down)
- Touchable - tap opens detail sheet
- Subtle border/background for separation
- Loading state: skeleton placeholder
- Selected state: highlight border when viewing

#### CombinationDetailSheet.tsx
- @gorhom/bottom-sheet with snapPoints={['15%', '85%']}
- Index 1 (85%) shows full board
- Contains: full-size OutfitBoard + "Generate Outfit" button
- "Generate" triggers existing AI generation flow

---

## State Management Approach

### Extended OutfitBuilderStore

```typescript
// New interface for a generated combination
interface OutfitCombination {
  id: string;
  items: OutfitSelection;  // top, bottom, shoes, accessory (reuses existing type)
  createdAt: number;
}

// Extend OutfitBuilderState with:
interface OutfitBuilderState {
  // ... existing state ...
  
  // NEW: Combination state
  combinations: OutfitCombination[];
  isGeneratingCombinations: boolean;
  selectedCombinationId: string | null;
  
  // NEW: Actions
  generateCombinations: () => void;
  setSelectedCombination: (id: string | null) => void;
  clearCombinations: () => void;
}
```

### Generation Algorithm (MVP - Rule-Based)

```typescript
const generateCombinations = (selection: OutfitSelection): OutfitCombination[] => {
  const combinations: OutfitCombination[] = [];
  
  // Case 1: Dress selected - only dress combinations
  if (selection.dress) {
    const items = {
      upper: selection.dress,
      lower: undefined as any,
      shoes: selection.shoes,
      accessory: selection.accessory,
    };
    combinations.push({ id: uuid(), items, createdAt: Date.now() });
  }
  
  // Case 2: Top + Bottom selected - create variations
  if (selection.upper && selection.lower) {
    // Combination 1: Full
    combinations.push({
      id: uuid(),
      items: {
        top: selection.upper,
        bottom: selection.lower,
        shoes: selection.shoes,
        accessory: selection.accessory,
      },
      createdAt: Date.now(),
    });
    
    // If shoes/accessory exist, create variant without
    if (selection.shoes || selection.accessory) {
      combinations.push({
        id: uuid(),
        items: {
          top: selection.upper,
          bottom: selection.lower,
          shoes: undefined,
          accessory: selection.accessory,
        },
        createdAt: Date.now(),
      });
    }
  }
  
  return combinations.slice(0, 6); // Max 6 combinations
};
```

### Hook Exports

```typescript
export const useCombinations = () => 
  useOutfitBuilderStore((state) => state.combinations);

export const useIsGeneratingCombinations = () => 
  useOutfitBuilderStore((state) => state.isGeneratingCombinations);

export const useSelectedCombinationId = () => 
  useOutfitBuilderStore((state) => state.selectedCombinationId);
```

---

## UI Flow and Interactions

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OutfitBuilderScreen                      │
├─────────────────────────────────────────────────────────────┤
│  Header: "Build Outfit"                                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  OutfitBoard Preview (when items selected)          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SelectItemsSection (scrollable categories)        │    │
│  │  - upper | lower | dress | shoes | bag | accessory  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  COMBINATION CARDS (below SelectItemsSection)       │    │
│  │  [Card1] [Card2] [Card3] [Card4] → (horizontal scroll)│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  StyleSelector (floating bottom center)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐    ┌─────────────────────────────────┐  │
│  │ SelectedItems │    │ Generate Button (sparkles)      │  │
│  │ Bar (floating│    │                                 │  │
│  └──────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ Tap on Card
┌─────────────────────────────────────────────────────────────┐
│              CombinationDetailSheet (Bottom Sheet)           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Full OutfitBoard Preview                            │    │
│  │  (larger size, all 4 slots visible)                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  "Generate Outfit" Button                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Interaction Details

1. **User selects items** → OutfitBoard preview updates + CombinationCards appear (if 2+ items)

2. **User scrolls to bottom** → CombinationCards section visible

3. **User taps combination card** → Bottom sheet opens with full preview

4. **User taps "Generate Outfit"** → Existing AI generation flow triggers (pass selected combination)

5. **User swipes down on sheet** → Closes sheet, returns to builder

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Only 1 item selected | Don't show combinations (need 2+ for valid outfit) |
| All items from same category | Show limited combinations (1-2 max) |
| Loading state | Show skeleton cards (3 placeholders) |
| API failure | Show error toast, allow retry |
| Empty wardrobe | Show "Add items to get started" (already handled by SelectItemsSection) |

---

## File Changes Required

### New Files (5 files)

1. `components/wardrobe/outfit-builder/CombinationCard.tsx`
2. `components/wardrobe/outfit-builder/CombinationCards.tsx`
3. `components/wardrobe/outfit-builder/CombinationDetailSheet.tsx`
4. `types/outfit-combination.ts` (new type definitions)
5. `__tests__/outfit-combination.test.ts`

### Modified Files (3 files)

1. `lib/store/outfit-builder.store.ts` - Add combination state and actions
2. `app/outfit-builder.tsx` - Integrate CombinationCards component
3. `components/wardrobe/outfit-builder/index.ts` - Export new components (if exists)

### Test Files (1 file)

1. `__tests__/outfit-combination.test.ts` - Unit tests for combination generation

---

## Step-by-Step Implementation Order

### Phase 1: State Management (Tasks 1-2)

- Task 1: Define OutfitCombination type and add to store
- Task 2: Implement generateCombinations logic in store

### Phase 2: Components (Tasks 3-5)

- Task 3: Create CombinationCard component (mini board)
- Task 4: Create CombinationCards container (horizontal scroll)
- Task 5: Create CombinationDetailSheet (bottom sheet)

### Phase 3: Integration (Tasks 6-7)

- Task 6: Integrate into OutfitBuilderScreen
- Task 7: Connect selection changes to auto-generate

### Phase 4: Polish (Tasks 8-10)

- Task 8: Add loading/skeleton states
- Task 9: Add animations and transitions
- Task 10: Test edge cases

### Phase 5: Optional AI Enhancement (Tasks 11-12)

- Task 11: Create AI combination enhancement
- Task 12: Add "Style with AI" button

---

## Atomic Commit Strategy

### Commit 1: Types and Store
```
feat: Add outfit combination types and store state

- Add OutfitCombination interface
- Add combinations, isGenerating to OutfitBuilderState
- Implement generateCombinations() logic
- Add useCombinations, useIsGenerating selectors
```

### Commit 2: CombinationCard Component
```
feat: Create CombinationCard component

- Add CombinationCard.tsx with mini OutfitBoard rendering
- Add loading skeleton state
- Add onPress handler for selection
```

### Commit 3: CombinationCards Container
```
feat: Create CombinationCards horizontal scroll container

- Add CombinationCards.tsx with ScrollView
- Add empty state and loading states
- Integrate with store selections
```

### Commit 4: Detail Bottom Sheet
```
feat: Create CombinationDetailSheet component

- Add CombinationDetailSheet.tsx with @gorhom/bottom-sheet
- Implement full OutfitBoard preview
- Add Generate button
```

### Commit 5: OutfitBuilder Integration
```
feat: Integrate combination cards into OutfitBuilderScreen

- Add CombinationCards below SelectItemsSection
- Connect selection changes to auto-generate
- Add spacing and layout adjustments
```

### Commit 6: Tests
```
test: Add unit tests for combination generation

- Test generateCombinations with dress
- Test generateCombinations with top+bottom
- Test max 6 combinations limit
```

---

## TDD Test Cases

### Test Suite: Outfit Combination Generation

```typescript
// __tests__/outfit-combination.test.ts

describe('generateCombinations', () => {
  test('generates single combination when only dress selected', () => {
    const selection: OutfitSelection = {
      dress: mockDressItem,
      shoes: undefined,
      accessory: undefined,
    };
    const result = generateCombinations(selection);
    expect(result).toHaveLength(1);
    expect(result[0].items.upper).toBe(mockDressItem);
  });

  test('generates multiple combinations when top+bottom+shoes selected', () => {
    const selection: OutfitSelection = {
      upper: mockTopItem,
      lower: mockBottomItem,
      shoes: mockShoesItem,
      accessory: undefined,
    };
    const result = generateCombinations(selection);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  test('limits to maximum 6 combinations', () => {
    const selection: OutfitSelection = {
      upper: mockTopItem,
      lower: mockBottomItem,
      shoes: mockShoesItem,
      accessory: mockAccessoryItem,
    };
    const result = generateCombinations(selection);
    expect(result.length).toBeLessThanOrEqual(6);
  });

  test('returns empty array when less than 2 items selected', () => {
    const selection: OutfitSelection = {
      upper: mockTopItem,
    };
    const result = generateCombinations(selection);
    expect(result).toHaveLength(0);
  });
});
```

---

## Acceptance Criteria

### Visual Checkpoints

- [ ] Combination cards appear below SelectItemsSection after selecting 2+ items
- [ ] Cards display as horizontal scrollable row (120x150px each)
- [ ] Each card shows mini OutfitBoard preview with item images
- [ ] Tapping card opens bottom sheet with full-size board
- [ ] Bottom sheet has "Generate Outfit" button
- [ ] Skeleton loading shown while generating
- [ ] Empty state shown when fewer than 2 items selected

### Functional Checkpoints

- [ ] Combinations auto-generate when 2+ items selected
- [ ] Selection changes trigger regeneration
- [ ] Bottom sheet dismisses on swipe down
- [ ] Generate button triggers existing AI flow
- [ ] State properly cleared when items deselected

### Performance Checkpoints

- [ ] Lazy loading for card images (using expo-image)
- [ ] No lag when scrolling combinations
- [ ] Fast generation (sub-100ms for rule-based)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-------------|
| AI API slow/fails | Medium | Start with rule-based, add AI as enhancement |
| Too many combinations | Low | Cap at 6, prioritize by completeness |
| Complex state sync | Medium | Use Zustand selectors, avoid derived state |
| Bottom sheet conflicts | Low | Reuse existing @gorhom/bottom-sheet patterns |

---

## Optional: AI Enhancement (Future Phase)

After MVP, add AI-powered styling:

1. Add "Style with AI" button below combination cards
2. Call existing `generateOutfitSuggestions()` from `gemini.ts`
3. Display AI suggestions as additional cards with sparkle icon
4. User can choose: rule-based OR AI-enhanced combinations

This is out of scope for initial implementation but documented for future consideration.