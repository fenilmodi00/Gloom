# Model Detail Modal Route — Design Spec (Updated)

**Date:** 2026-03-21  
**Feature:** Open model from carousel → view in Expo Router modal route (replacing broken bottom-sheet approach)

---

## 1. Overview

A modal route that opens when clicking a model in `ModelCarousel`. Uses Expo Router's navigation system instead of `@gorhom/bottom-sheet` to avoid gesture conflicts with the existing `InspoBottomSheet`.

**Key Change from Previous Design:**
- **Before:** Inline `ModelDetailSheet` bottom sheet (blocked by `InspoBottomSheet` gesture layer)
- **After:** Separate Expo Router hidden tab route `/(tabs)/inspo/model-detail`

---

## 2. Architecture

### Route Structure

```
app/(tabs)/
├── inspo/
│   ├── index.tsx          # Main inspo screen with carousel
│   └── model-detail.tsx   # Modal route (hidden from tab bar)
└── _layout.tsx            # Tabs layout with hidden route registration
```

### State Management

- **Zustand store:** `lib/store/modelDetail.store.ts`
  - `selectedModel: ModelCard | null`
  - `clothItems: OutfitItem[]`
  - `openModelDetail(model, clothItems)`
  - `closeModelDetail()`
- **NOT persisted** — modal state resets on app restart

### Close Strategy

Uses `router.replace('/(tabs)/inspo')` pattern (same as `wardrobe/add-item.tsx:62-64`) to avoid back-stack issues with hidden tab routes.

---

## 3. Visual & Interaction

### Modal Screen (`model-detail.tsx`)

- **Backdrop:** `BlurView` (intensity: 80, tint: dark) from `expo-blur`
- **Content:** Slide-up animation via `react-native-reanimated`
- **Tap backdrop:** Dismisses modal
- **Android back:** Handled via `BackHandler`

### Header
- X close button (top-right, 44x44 tap target)
- Safe area top padding

### Content
- Model image (from `selectedModel.imageUrl`)
- Page indicator (single line, accent color)
- Action buttons row:
  - "Save" — bookmark icon, outline style
  - "Share" — share icon, filled style

### Animation Specs

| Animation | Config |
|-----------|--------|
| Slide-up open | `withSpring(0, { damping: 18, stiffness: 180, mass: 0.8 })` |
| Slide-down close | `withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 200 })` |

---

## 4. Data Structure

```typescript
// Store state
interface ModelDetailState {
  selectedModel: ModelCard | null;
  clothItems: OutfitItem[];
  openModelDetail: (model: ModelCard, clothItems: OutfitItem[]) => void;
  closeModelDetail: () => void;
}

// Outfit item (for future expansion)
interface OutfitItem {
  id: string;
  imageUrl: ImageSourcePropType;
  label: 'Top' | 'Bottom' | 'Shoes' | 'Accessories';
}
```

---

## 5. Components

### Files Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `model-detail.tsx` | `app/(tabs)/inspo/` | Modal screen with blur backdrop |
| `modelDetail.store.ts` | `lib/store/` | Zustand store for modal state |

### Files Modified

| File | Change |
|------|--------|
| `app/(tabs)/_layout.tsx` | Added hidden route for `inspo/model-detail` |
| `app/(tabs)/inspo/index.tsx` | Replaced `ModelDetailSheet` with `router.push()` |
| `components/shared/BottomTabBar.tsx` | Already has `inspo/model-detail` in hidden routes |

### Files Deleted

| File | Reason |
|------|--------|
| `components/inspo/ModelDetailSheet.tsx` | Replaced by modal route |

---

## 6. Props Interfaces

```typescript
// model-detail.tsx screen — no props, reads from store
// State is managed via useModelDetailStore()

// Store selectors
export const useSelectedModel = () => useModelDetailStore((state) => state.selectedModel);
export const useClothItems = () => useModelDetailStore((state) => state.clothItems);
export const useIsModelDetailOpen = () => useModelDetailStore((state) => state.selectedModel !== null);
```

---

## 7. Technical Notes

- **Navigation:** `router.push('/(tabs)/inspo/model-detail')` to open
- **Close:** `router.replace('/(tabs)/inspo')` (not `router.back()`)
- **Blur:** Uses `expo-blur` `BlurView` (already installed)
- **Animation:** `react-native-reanimated` v4 with worklets
- **No swipe-down dismiss** — out of MVP scope
- **No horizontal paging** — out of MVP scope

---

## 8. Testing Checklist

- [ ] Model carousel works normally on inspo screen
- [ ] Tap model card → modal slides up with blur backdrop
- [ ] Tab bar hides when modal is open
- [ ] Tap X button → modal dismisses, returns to inspo
- [ ] Tap backdrop → modal dismisses
- [ ] Android back button → modal dismisses
- [ ] Rapid taps → only one modal opens (no double navigation)
- [ ] Model image displays correctly

---

## 9. Out of Scope (Future Iterations)

- Horizontal paging to outfit breakdown view
- Swipe-down gesture to dismiss
- Save/Share button functionality (currently haptic feedback only)
- Dynamic cloth items from model data

---

## 10. Commit History

| Commit | Description |
|--------|-------------|
| `41089d2` | feat: add modelDetail store for modal state |
| `8fffb91` | feat: add model-detail modal route with blur backdrop and hidden tab |
| `8eb5313` | refactor: use router.push for model detail, remove ModelDetailSheet |
| `3ec965b` | test: add model-detail screen tests with moduleNameMapper mocks |
