# Model Detail Modal Route — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken inline `ModelDetailSheet` bottom sheet with a proper Expo Router modal route that eliminates gesture conflicts and provides a blur-backed popup experience.

**Architecture:** Modal route lives outside the InspoScreen component tree, removing the sibling bottom-sheet conflict. State is shared via a lightweight Zustand store. Blur backdrop uses existing expo-blur patterns.

**Tech Stack:** Expo Router, expo-blur@55.0.9, expo-image, react-native-reanimated v4, Zustand

---

## Background

### Root Cause (from code review)
- `InspoBottomSheet` (regular @gorhom/bottom-sheet) is always mounted in a full-screen overlay at z-30
- `ModelDetailSheet` (regular @gorhom/bottom-sheet) was conditionally rendered in the same overlay
- Both sheets fight for gesture control — taps never reach `ModelCarousel`
- `ModelDetailSheet` has dead imports (`OutfitGrid`, `PaginationIndicator`) and unused `clothItems` prop
- Mixed styling systems (StyleSheet.create vs NativeWind) throughout
- Split state (`isDetailSheetOpen` + `selectedModel`) can drift out of sync

### Decision
Replace inline bottom-sheet approach with Expo Router modal route. This:
- Eliminates gesture conflict (modal is a separate navigation layer)
- Uses existing expo-blur patterns from `LoadingOverlay.tsx`
- Follows existing `router.push()` patterns in the codebase
- Aligns with `_layout.tsx` Stack structure

---

## File Changes Summary

| File | Action | Notes |
|------|--------|-------|
| `lib/store/modelDetail.store.ts` | CREATE | Zustand store for selectedModel + clothItems |
| `app/(tabs)/inspo/model-detail.tsx` | CREATE | Modal route with blur backdrop and content |
| `app/(tabs)/inspo/index.tsx` | MODIFY | Replace sheet with `router.push()`, remove dead code |
| `components/inspo/ModelDetailSheet.tsx` | DELETE | Replaced by modal route |
| `components/inspo/ModelCarousel.tsx` | MODIFY | Ensure `onCardPress` is wired correctly |
| `app/(tabs)/_layout.tsx` | MODIFY | Add hidden route for model-detail |
| `__tests__/modelDetail.store.test.ts` | CREATE | Test for store |
| `__tests__/model-detail-screen.test.tsx` | CREATE | Test for modal screen |
| `__tests__/inspo-screen-modal.test.tsx` | CREATE | Test for InspoScreen navigation |
| `__tests__/model-carousel-press.test.ts` | CREATE | Test for carousel press |

---

## Atomic Commits

### Commit 1a: `test: add modelDetail store tests`
**Files:** `__tests__/modelDetail.store.test.ts`

Create test file that:
- Tests initial state (null model, empty clothItems)
- Tests `openModelDetail` sets model and clothItems
- Tests `closeModelDetail` resets state
- Uses Zustand's `act()` pattern

**Verification:**
```bash
bun run test __tests__/modelDetail.store.test.ts --runInBand
```
Expected: All store tests pass

---

### Commit 1: `feat: add modelDetail store for modal state`
**Files:** `lib/store/modelDetail.store.ts`

Create Zustand store with:
- `selectedModel: ModelCard | null`
- `clothItems: OutfitItem[]`
- `openModelDetail(model, clothItems)`
- `closeModelDetail()`
- `useSelectedModel()` selector
- `useIsModelDetailOpen()` selector

**Verification:**
```bash
bun run test __tests__/modelDetail.store.test.ts --runInBand
```
Expected: All tests pass, store has correct initial state and actions

---

### Commit 2a: `test: add model-detail screen tests`
**Files:** `__tests__/model-detail-screen.test.tsx`

Create test file that:
- Mocks expo-router (`useRouter`, `useLocalSearchParams`)
- Mocks modelDetail store
- Tests modal renders with blur backdrop
- Tests close button calls `router.replace('/(tabs)/inspo')`

**Verification:**
```bash
bun run test __tests__/model-detail-screen.test.tsx --runInBand
```
Expected: Modal screen tests pass

---

### Commit 2: `feat: add model-detail modal route`
**Files:** `app/(tabs)/inspo/model-detail.tsx`

Create modal screen with:
- `BlurView` backdrop (intensity 80, tint dark) - **wraps entire screen**
- `Pressable` overlay on backdrop for tap-to-dismiss → calls `closeModal()` function
- Model image using `expo-image`
- Save/Share buttons (placeholder actions)
- Close button → calls `closeModal()` function
- `closeModal()` function uses `router.replace('/(tabs)/inspo')` (same pattern as `wardrobe/add-item.tsx:62-64`)
- `BackHandler` for Android hardware back → calls `closeModal()`
- Slide-up animation via Reanimated (`useSharedValue` + `withSpring` for translateY)
- Read model from `useSelectedModel()` store into local state on mount (captures value before clearing)
- On unmount/dismiss, call `closeModelDetail()` store action to clear state

**Verification:**
```bash
bun run test __tests__/model-detail-screen.test.tsx --runInBand
```
Expected: Modal renders with blur backdrop, close button calls `router.replace('/(tabs)/inspo')`

---

### Commit 3: `feat: add model-detail hidden route to tabs layout`
**Files:** `app/(tabs)/_layout.tsx`

Add hidden route to Tabs (not root Stack). The tab bar hiding is already configured in `components/shared/BottomTabBar.tsx:37` which includes `'inspo/model-detail'` in `HIDDEN_TAB_BAR_ROUTES`.

Add after line 64 (after `wardrobe/add-item` screen):
```tsx
{/* Hidden route — model detail modal */}
<Tabs.Screen
  name="inspo/model-detail"
  options={{
    href: null,
  }}
/>
```

**Why this file:**
- `app/(tabs)/_layout.tsx` is the authoritative routing file for all tab-nested screens
- `app/_layout.tsx` uses Stack for auth flows and the tabs group, not individual tab screens
- `HIDDEN_TAB_BAR_ROUTES` in `BottomTabBar.tsx` already includes `inspo/model-detail`, so tab bar will auto-hide

**Verification:**
1. `bun run android` to start the app
2. Navigate to Inspo tab
3. Tap a model card
4. Verify: modal slides up, tab bar is hidden
5. Press back: modal dismisses, tab bar reappears

---

### Commit 4a: `test: add InspoScreen navigation tests`
**Files:** `__tests__/inspo-screen-modal.test.tsx`

Create test file that:
- Mocks expo-router and modelDetail store
- Renders InspoScreen
- Tests model card press calls `openModelDetail` + `router.push`

**Verification:**
```bash
bun run test __tests__/inspo-screen-modal.test.tsx --runInBand
```
Expected: InspoScreen navigation tests pass

---

### Commit 4: `refactor: use router.push for model detail in InspoScreen`
**Files:** `app/(tabs)/inspo/index.tsx`

Changes:
- Remove `ModelDetailSheet` import and render
- Remove `isDetailSheetOpen` state
- Keep `selectedModel` for potential caching (or remove if unused)
- `handleModelPress` → `openModelDetail(model, MOCK_CLOTH_ITEMS)` + `router.push('/(tabs)/inspo/model-detail')`
- Remove inline sheet container and `ModelDetailSheet` from JSX
- Clean up unused imports (`BottomSheet`, `ModelDetailSheet`, etc.)

**Verification:**
```bash
bun run test __tests__/inspo-screen-modal.test.tsx --runInBand
```
Expected: Pressing model card calls `openModelDetail` + `router.push`

---

### Commit 5a: `test: add carousel press tests`
**Files:** `__tests__/model-carousel-press.test.ts`

Create test file that:
- Mocks react-native-reanimated-carousel
- Tests `onCardPress` callback is called when card is pressed

**Verification:**
```bash
bun run test __tests__/model-carousel-press.test.ts --runInBand
```
Expected: Carousel press tests pass

---

### Commit 5: `refactor: ensure ModelCarousel onCardPress wiring`
**Files:** `components/inspo/ModelCarousel.tsx`

Verify:
- `onCardPress` prop is passed through and called on card press
- `Pressable` uses `onPress` correctly
- No gesture-handler conflicts (carousel uses `react-native-reanimated-carousel`)

If issues found, add gesture compatibility (already researched but may need adjustment)

**Verification:**
```bash
bun run test __tests__/model-carousel-press.test.ts --runInBand
```
Expected: Carousel item press calls `onCardPress` callback

---

### Commit 6: `refactor: remove ModelDetailSheet component`
**Files:** `components/inspo/ModelDetailSheet.tsx`

Delete the file. It's replaced by the modal route.

**Verification:**
```bash
grep -r "ModelDetailSheet" --include="*.tsx" --include="*.ts" .
```
Expected: No results (file fully removed)

```bash
bun run test --runInBand
```
Expected: All tests pass (no import errors)

---

### Commit 7: `test: add regression test for model detail modal`
**Files:** `__tests__/model-detail-modal.test.ts`

Create test that:
- Mocks router and store
- Renders InspoScreen
- Simulates model card press
- Verifies `router.push` is called with correct path
- Verifies store has correct model selected

**Verification:**
```bash
bun run test __tests__/model-detail-modal.test.ts --runInBand
```
Expected: Test passes — modal flow works end-to-end

---

### Commit 8: `docs: update design spec for modal route`
**Files:** `docs/plans/2026-03-21-model-detail-modal-route.md`

Update with any implementation notes or deviations.

**Verification:**
```bash
git log -1 --oneline
```
Expected: Commit `8. docs: update design spec...` is visible in history

---

## QA Scenarios

Each scenario includes specific verification steps and tools.

| Scenario | Expected Behavior | Verification Steps |
|----------|-------------------|---------------------|
| Tap model image in carousel | Modal slides up with blur backdrop, shows model | 1. `bun run android` 2. Go to Inspo 3. Tap model card 4. Verify modal appears with blur behind |
| Tap backdrop | Modal dismisses, returns to inspo screen | **Covered in Commit 2** - Pressable on BlurView calls `closeModal()`. Test: 1. Open modal 2. Tap outside content 3. Verify modal closes |
| Tap close button | Modal dismisses | **Covered in Commit 2** - Close button calls `closeModal()`. Test: 1. Open modal 2. Tap X button 3. Verify modal closes |
| Android hardware back | Modal dismisses | **Covered in Commit 2** - BackHandler registered, calls `closeModal()`. Manual: 1. Open modal 2. Press Android back 3. Verify modal closes |
| Swipe down to dismiss | Modal dismisses | **NOT IMPLEMENTED** - Swipe gestures require custom pan handler. Remove from MVP scope. |
| Navigate away while modal open | Modal should dismiss cleanly | **Covered by navigation lifecycle** - Router handles unmounting. Manual: 1. Open modal 2. Use deep link elsewhere 3. Verify no crash |
| Multiple rapid taps | Should not open multiple modals | 1. Rapidly tap model card 3x 2. Verify only one modal opens 3. Verify store has single model |
| Model with missing image | Should show placeholder or error state | 1. Modify test to pass `imageUrl: ''` 2. Open modal 3. Verify graceful degradation (no crash) |

### Test File
`__tests__/model-detail-modal.test.ts` covers scenarios 1, 2, 3, 7 via Jest mocks. Scenarios 4, 5, 6 require manual Android testing.

---

## Rollback Plan

If modal route has issues:
1. Revert commits 1-6 (keep commit 7 as test infrastructure)
2. Alternative: Use custom Reanimated animated component instead of modal route
3. Alternative: Use `BottomSheetModal` with proper stacking (requires more refactoring)

---

## Notes

- `expo-blur` on Android in SDK 55+ works with `BlurView` directly (no BlurTargetView needed for static backdrop)
- `presentation: 'card'` with `animation: 'slide_from_bottom'` is more reliable on Android than `presentation: 'modal'`
- The `clothItems` data will now be stored and potentially rendered in a future iteration (currently just passed through)
