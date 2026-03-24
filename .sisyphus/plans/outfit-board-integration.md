# OutfitBoard Inline Integration Plan

## Executive Summary

**Recommendation: Option B (Between header and SelectItemsSection)** — This approach best matches the user's intent of showing selected items in a moodboard style "while in the screen" during the selection process. It provides a dedicated preview panel that remains visible while users scroll through wardrobe items, enabling real-time visual feedback as they build their outfit.

---

## 1. Evaluation of Integration Options

### Option A: Inline within ScrollView
**Not recommended.** Would require significant modification to `SelectItemsSection`'s internal ScrollView structure. Additionally, the board would scroll away when users explore more items, defeating the purpose of a real-time preview.

### Option B: Between header and SelectItemsSection ✅
**Recommended.** Places OutfitBoard as a fixed section between the header and the item selection area.
- **Pros:**
  - Board remains visible while scrolling through items (user sees real-time updates)
  - No modification needed to `SelectItemsSection`
  - Clean separation: Header → Preview Board → Item Selection
  - Follows same pattern as `SelectedItemsBar` (floating but part of layout)
- **Cons:**
  - Takes up screen space at top

### Option C: Inside mainContent View, before SelectItemsSection
**Alternative to consider.** Similar to B but rendered inside the mainContent container. Would require less structural change but shares the same tradeoffs as B.

---

## 2. Answers to Design Questions

### Q1: Which integration approach best matches user intent?
**Option B** — The user said "should appear inline in the screen after SelectItemsSection" (which implies as part of the layout, not as an overlay), and "showing selected items on the board while in the screen" (implying continuous visibility during selection). Option B delivers exactly this:

- Fixed position between header and content
- Always visible while selecting items
- Enables real-time visual feedback as user taps items

### Q2: Fixed height or responsive to content?
**Fixed height with aspect ratio** — The `OutfitBoard` component already calculates dimensions using `boardWidth * 1.35` aspect ratio. Use a constrained width that fits within the screen margins and derive height from that ratio.

- **Recommended dimensions:** Width = `screenWidth - 32`, Height = `width * 0.65` (tighter than current 0.9)
- This ensures the board doesn't dominate the screen while remaining large enough for clear item visibility

### Q3: Visual transition/animation when items are added?
**Yes, subtle fade-in animation.** Use React Native Reanimated:
- When board transitions from empty to non-empty: `FadeIn` animation (300ms)
- When items are added to non-empty board: subtle scale pulse on the newly-added slot
- Keep animations subtle to avoid distracting from item selection

### Q4: Always visible or only when items are selected?
**Always visible when in outfit-builder** (with visual indication of empty state). Similar to how `SelectedItemsBar` returns `null` when no items are selected, we could:

- Option A: Hide completely when empty (current behavior in overlay mode)
- Option B: Show empty board with subtle placeholder text "Select items to preview your outfit"
- **Recommendation:** Option A — Hide when no items selected to maximize screen real estate for item selection. The `SelectedItemsBar` already provides the "something selected" indicator at the bottom.

---

## 3. Implementation Plan (TDD-Oriented)

### Phase 1: Verify Current Behavior
- [ ] Run app and navigate to outfit-builder
- [ ] Verify current overlay behavior (appears as full-screen modal when items selected)
- [ ] Document current z-index and positioning issues

### Phase 2: Component Integration
- [ ] Remove absolute positioning from OutfitBoard in outfit-builder.tsx
- [ ] Place OutfitBoard between Header and mainContent
- [ ] Configure fixed dimensions (width: screenWidth - 32, height: width * 0.65)
- [ ] Add conditional rendering: show only when selectedItems.length > 0

### Phase 3: Animation & Polish
- [ ] Add FadeIn animation when board appears
- [ ] Add smooth height transition (optional - from 0 to target height)
- [ ] Test real-time updates as items are selected/deselected
- [ ] Verify no layout conflicts with floating elements (StyleSelector, SelectedItemsBar, GenerateButton)

### Phase 4: Verification
- [ ] Run TypeScript check (no new errors)
- [ ] Run build verification
- [ ] Manual test: select items → verify board updates in real-time
- [ ] Manual test: scroll through items → board remains visible
- [ ] Manual test: deselect all → board hides smoothly

---

## 4. Atomic Commit Strategy

### Commit 1: Remove overlay positioning
```
feat(outfit-builder): Remove OutfitBoard overlay and prepare for inline placement

- Remove absoluteFill positioning and zIndex from outfitBoardContainer
- Remove semi-transparent background overlay styling
- Prepare structure for inline placement between header and content
```

### Commit 2: Add inline OutfitBoard between header and SelectItemsSection
```
feat(outfit-builder): Place OutfitBoard inline between header and item selection

- Add OutfitBoard between Header and mainContent sections
- Configure fixed dimensions: width = screenWidth - 32, height = width * 0.65
- Add conditional render: only show when selectedItems.length > 0
- Maintain existing selection prop passing
```

### Commit 3: Add entrance animation
```
feat(outfit-builder): Add FadeIn animation when OutfitBoard appears

- Add React Native Reanimated FadeIn with springify()
- Configure: duration 300ms, damping 18 for smooth feel
- Test animation triggers correctly on item selection
```

### Commit 4: Verification and styling adjustments
```
fix(outfit-builder): Adjust board dimensions and verify layout

- Tighten board height ratio from 0.9 to 0.65 for better screen balance
- Add padding to prevent edge-to-edge appearance
- Verify no overlap with floating controls (GenerateButton, StyleSelector)
- Run TypeScript and build verification
```

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `app/outfit-builder.tsx` | Remove overlay positioning, place inline between header and mainContent, add animation |
| (No changes to other files expected) | OutfitBoard component already supports selection prop |

---

## 6. Risk Mitigation

- **Risk:** Board takes too much vertical space  
  **Mitigation:** Use tighter height ratio (0.65 vs current 0.9), add max-height constraint

- **Risk:** Floating elements overlap board  
  **Mitigation:** Currently floating elements are at bottom (GenerateButton, SelectedItemsBar), board is at top — no overlap expected

- **Risk:** Board doesn't update in real-time  
  **Mitigation:** OutfitBoard already receives `selection` prop from store, real-time update is automatic

---

## 7. Success Criteria

- [ ] OutfitBoard appears between header and item selection (not as overlay)
- [ ] Board remains visible while scrolling through wardrobe items
- [ ] Board shows/hides based on selection state (with animation)
- [ ] Real-time visual updates as items are selected/deselected
- [ ] No TypeScript errors or build failures
- [ ] Layout doesn't conflict with floating controls