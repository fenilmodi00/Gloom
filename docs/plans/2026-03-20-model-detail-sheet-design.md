# Model Detail Bottom Sheet — Design Spec
**Date:** 2026-03-20
**Feature:** Open model from carousel → view outfit breakdown in bottom sheet

---

## 1. Overview

A modal bottom sheet that opens when clicking a model in `ModelCarousel`. Two-slide horizontal paging experience:
- **Slide 1**: Full model image (the look)
- **Slide 2**: Outfit breakdown in 2x2 grid on dotted background

Hidden `BottomTabBar` while sheet is open.

---

## 2. Visual & Interaction

### Sheet Container
- Height: 90% of screen
- Rounded top corners (clip behavior)
- Dark backdrop: `rgba(0,0,0,0.4)` behind sheet
- Spring open animation: `damping: 18, stiffness: 180, mass: 0.8` (snappy but not floaty)

### Swipe Behavior
- **Partial peek**: Slide 2 is visible at ~35% from the right on initial open (UX hint to swipe)
- Swipe left/right triggers snap-to-slide paging
- Uses `react-native-reanimated-carousel` with `loop: false`

### Header
- X close button (top-right, 44x44 tap target)
- Translucent background fade

### Footer (below carousel)
- **Pagination indicator** (centered):
  - Active: 2px tall, 30px wide horizontal line (accent #8B7355)
  - Inactive: 3 dots, 5px radius each, 50% opacity (#BEBEBE)
  - Animation tied to scroll offset via `interpolate()`
- **Action buttons row** (horizontal, full width):
  - "Save" — outline/secondary button
  - "Share" — filled primary button (#8B7355 background)
  - Safe area bottom padding via `useSafeAreaInsets().bottom`

### Slide 1 — Model View
- Full model image (source from clicked `ModelCard`)
- No overlay text
- `contentFit: cover`

### Slide 2 — Outfit Grid
- **Background**: Light warm gray (#EBEBEB) with SVG dot pattern
  - Dot: ~5px radius, #BEBEBE at 5% opacity
  - Spacing: ~35px grid, no offset (clean straight grid)
  - Implemented via `react-native-svg` `<Pattern>` + `<Circle>`
- **Grid**: 2x2 layout
- **Each cell**:
  - Centered clothing image (80-120px, aspect-fit)
  - **Label below image** (e.g., "Top", "Bottom", "Shoes", "Accessories")
  - Loading state: skeleton shimmer/placeholder while image loads
  - 16px gap between cells, 24px padding around grid

---

## 3. Data Structure

```typescript
// Outfit item
interface OutfitItem {
  image: ImageSourcePropType;
  label: 'Top' | 'Bottom' | 'Shoes' | 'Accessories';
}

// Mock data (same for all models initially)
const MOCK_CLOTH_ITEMS: OutfitItem[] = [
  { image: require('@assets/modalCloth/0013_00_top.png'), label: 'Top' },
  { image: require('@assets/modalCloth/0003_04_bottom.png'), label: 'Bottom' },
  { image: require('@assets/modalCloth/0011_05_shoes.png'), label: 'Shoes' },
  { image: require('@assets/modalCloth/0009_02_accessories.png'), label: 'Accessories' },
];
```

---

## 4. Components

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ModelDetailSheet.tsx` | `components/inspo/` | Container sheet, carousel, state |
| `OutfitGrid.tsx` | `components/shared/` | 2x2 grid with dotted bg, reusable |
| `PaginationIndicator.tsx` | `components/shared/` | Animated line + dots |
| `DottedBackground.tsx` | `components/shared/` | SVG dot pattern bg, reusable |
| `SkeletonImage.tsx` | `components/shared/` | Image placeholder while loading |

### Files to Modify

| File | Change |
|------|--------|
| `components/inspo/ModelCarousel.tsx` | Ensure `onCardPress` is wired (already exists) |
| `app/(tabs)/inspo/index.tsx` | Add sheet state, render `ModelDetailSheet` |
| `components/shared/BottomTabBar.tsx` | Add `model-detail` to `HIDDEN_TAB_BAR_ROUTES` |

---

## 5. Props Interfaces

```typescript
// ModelDetailSheet
interface ModelDetailSheetProps {
  model: ModelCardType;
  isOpen: boolean;
  clothItems: OutfitItem[];
  onClose: () => void;
}

// OutfitGrid
interface OutfitGridProps {
  items: OutfitItem[]; // length must be 4
}

// PaginationIndicator
interface PaginationIndicatorProps {
  currentIndex: number;
  totalSlides: number; // 2
}

// SkeletonImage
interface SkeletonImageProps {
  width: number;
  height: number;
}
```

---

## 6. Technical Notes

- Use `expo-image` `<Image>` for all images
- Use `react-native-reanimated` for all animations (worklet-based)
- Use `react-native-svg` for dotted pattern background
- Sheet uses `@gorhom/bottom-sheet` or custom implementation with Reanimated
- Add `keyboardShouldPersistTaps="handled"` on any scrollable within sheet
- All styles via NativeWind `className` (no `StyleSheet.create`)
- No heavy shadows — `shadow-sm` max

---

## 7. Animation Specs

| Animation | Config |
|-----------|--------|
| Sheet open spring | `damping: 18, stiffness: 180, mass: 0.8` |
| Sheet close spring | `damping: 20, stiffness: 200` |
| Pagination line | Interpolate from scaleX 0.5→1, opacity 0.5→1 |
| Dot inactive→active | Scale 1→1.2, opacity 0.5→1 |
| Image skeleton shimmer | `withRepeat(withTiming(...))`, 1000ms loop |
