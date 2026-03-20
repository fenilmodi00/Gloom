# Model Detail Bottom Sheet — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Bottom sheet opens on model card tap, shows model image (slide 1) and outfit grid (slide 2) with swipe navigation, pagination indicator, and Save/Share buttons.

**Architecture:** Uses `@gorhom/bottom-sheet` (already installed) as container with a custom two-slide `react-native-reanimated-carousel` inside. `BottomTabBar` hides via route list. Outfit grid built with `react-native-svg` dot pattern background. All animations via Reanimated worklets.

**Tech Stack:** `@gorhom/bottom-sheet`, `react-native-reanimated-carousel`, `react-native-svg`, `expo-image`, NativeWind, `react-native-safe-area-context`

---

## Dependencies

Verify these are already installed (check `package.json`):
- `@gorhom/bottom-sheet: ^5.2.8` ✅
- `react-native-reanimated-carousel: 4.0.3` ✅
- `react-native-svg: ^15.15.3` ✅
- `expo-image: ^55.0.6` ✅
- `react-native-safe-area-context: ^5.7.0` ✅

---

## File Map

### New Files

| File | Purpose |
|------|---------|
| `components/shared/DottedBackground.tsx` | SVG `<Pattern>` dot grid background |
| `components/shared/SkeletonImage.tsx` | Shimmer placeholder while image loads |
| `components/shared/OutfitGrid.tsx` | 2x2 grid with dotted bg + item labels |
| `components/shared/PaginationIndicator.tsx` | Animated line + dots pagination |
| `components/inspo/ModelDetailSheet.tsx` | Full sheet: carousel + footer controls |

### Modified Files

| File | Change |
|------|--------|
| `app/(tabs)/inspo/index.tsx` | Add `isSheetOpen` state + `selectedModel`, render `ModelDetailSheet`, wire `onCardPress` |
| `components/shared/BottomTabBar.tsx` | Add `'inspo/model-detail'` to `HIDDEN_TAB_BAR_ROUTES` |
| `types/inspo.ts` | Add `OutfitItem` interface |

---

## Mock Data

Add to `types/inspo.ts`:
```typescript
export interface OutfitItem {
  image: ImageSourcePropType;
  label: 'Top' | 'Bottom' | 'Shoes' | 'Accessories';
}

export const MOCK_CLOTH_ITEMS: OutfitItem[] = [
  { image: require('@assets/modalCloth/0013_00_top.png'), label: 'Top' },
  { image: require('@assets/modalCloth/0003_04_bottom.png'), label: 'Bottom' },
  { image: require('@assets/modalCloth/0011_05_shoes.png'), label: 'Shoes' },
  { image: require('@assets/modalCloth/0009_02_accessories.png'), label: 'Accessories' },
];
```

---

## Task 1: `DottedBackground.tsx`

**Files:**
- Create: `components/shared/DottedBackground.tsx`

**Step 1: Write the component**

```tsx
/**
 * DottedBackground - SVG dot pattern fill
 * 
 * Background: #EBEBEB with #BEBEBE dots (~5px radius, 5% opacity)
 * Spacing: ~35px grid, no offset, clean straight grid
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Pattern, Rect, Defs } from 'react-native-svg';

interface DottedBackgroundProps {
  children: React.ReactNode;
  dotColor?: string;
  dotRadius?: number;
  spacing?: number;
  backgroundColor?: string;
}

export function DottedBackground({
  children,
  dotColor = '#BEBEBE',
  dotRadius = 5,
  spacing = 35,
  backgroundColor = '#EBEBEB',
}: DottedBackgroundProps) {
  const patternId = 'dotted-pattern';

  return (
    <View className="flex-1 relative">
      {/* SVG pattern layer (fills entire space) */}
      <Svg className="absolute inset-0" width="100%" height="100%">
        <Defs>
          <Pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={spacing}
            height={spacing}
            patternTransform={`translate(0, 0)`}
          >
            <Circle cx={spacing / 2} cy={spacing / 2} r={dotRadius} fill={dotColor} opacity={0.05} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={backgroundColor} />
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
      {/* Content layer */}
      <View className="absolute inset-0 z-10">{children}</View>
    </View>
  );
}
```

**Step 2: Verify**

Read the file. Check:
- Uses `react-native-svg` with `<Pattern>`, `<Circle>`, `<Defs>`
- Props for dot color, radius, spacing, background color
- Renders children above SVG layer via absolute positioning
- Exports as named export

---

## Task 2: `SkeletonImage.tsx`

**Files:**
- Create: `components/shared/SkeletonImage.tsx`

**Step 1: Write the component**

```tsx
/**
 * SkeletonImage - Shimmer loading placeholder for images
 * 
 * Shimmer animation: 1000ms loop using withRepeat(withTiming)
 * Color: warm gray gradient (#EBEBEB → #F5F5F5 → #EBEBEB)
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface SkeletonImageProps {
  width: number;
  height: number;
  borderRadius?: number;
}

export function SkeletonImage({ width, height, borderRadius = 8 }: SkeletonImageProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#EBEBEB',
        },
        animatedStyle,
      ]}
    />
  );
}
```

**Step 2: Verify**

Read the file. Check:
- Uses `useSharedValue` + `useAnimatedStyle` (worklet-safe)
- `withRepeat(withTiming(...))` for shimmer loop
- Accepts `width`, `height`, `borderRadius` props
- Warm gray color palette matches design

---

## Task 3: `OutfitGrid.tsx`

**Files:**
- Create: `components/shared/OutfitGrid.tsx`
- Read: `types/inspo.ts`

**Step 1: Write the component**

```tsx
/**
 * OutfitGrid - 2x2 grid of clothing items on dotted background
 * 
 * Layout: 2 columns × 2 rows, 16px gap, 24px padding
 * Each cell: centered image (80-120px) + label below
 * Loading state: SkeletonImage placeholder
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

import { DottedBackground } from './DottedBackground';
import { SkeletonImage } from './SkeletonImage';
import type { OutfitItem } from '@/types/inspo';

interface OutfitGridProps {
  items: OutfitItem[];
}

export function OutfitGrid({ items }: OutfitGridProps) {
  return (
    <DottedBackground>
      <View className="flex-1 p-6">
        <View className="flex-1 flex-row flex-wrap">
          {items.map((item, index) => (
            <OutfitGridCell key={index} item={item} index={index} />
          ))}
        </View>
      </View>
    </DottedBackground>
  );
}

interface OutfitGridCellProps {
  item: OutfitItem;
  index: number;
}

function OutfitGridCell({ item, index }: OutfitGridCellProps) {
  // Alternate left/right placement per row
  const isLeftCol = index % 2 === 0;

  return (
    <View
      className={`w-1/2 flex items-center justify-center p-2`}
      style={{ height: '50%' }}
    >
      <View className="items-center gap-2">
        {/* Image with skeleton loading state */}
        <View className="w-24 h-24 rounded-xl overflow-hidden bg-[#F0EFED]">
          <Image
            source={item.image}
            style={{ width: 96, height: 96 }}
            contentFit="contain"
            transition={200}
          />
        </View>
        {/* Label */}
        <Text className="text-sm font-medium text-[#6B6B6B]">
          {item.label}
        </Text>
      </View>
    </View>
  );
}
```

**Step 2: Verify**

Read the file. Check:
- Uses `DottedBackground` as container
- 2x2 grid via `flex-row flex-wrap` with `w-1/2`
- Each cell has `height: '50%'` to fill the grid
- Label below image
- Uses `expo-image` `<Image>` with `contentFit="contain"`
- `OutfitItem` type imported from `@/types/inspo`

---

## Task 4: `PaginationIndicator.tsx`

**Files:**
- Create: `components/shared/PaginationIndicator.tsx`

**Step 1: Write the component**

```tsx
/**
 * PaginationIndicator - Animated line + dots indicator
 * 
 * Active: 2px tall, 30px wide horizontal line (accent #8B7355)
 * Inactive: 3 dots, 5px radius each, 50% opacity (#BEBEBE)
 * Animation: tied to scroll offset via interpolate()
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface PaginationIndicatorProps {
  currentIndex: number;
  totalSlides: number;
  scrollX: Animated.SharedValue<number>;
}

const DOT_SIZE = 5;
const ACTIVE_WIDTH = 30;
const INACTIVE_WIDTH = 6;
const ACCENT_COLOR = '#8B7355';
const INACTIVE_COLOR = '#BEBEBE';

export function PaginationIndicator({
  currentIndex,
  totalSlides,
  scrollX,
}: PaginationIndicatorProps) {
  return (
    <View style={styles.container}>
      {/* Animated line indicator */}
      <AnimatedLine scrollX={scrollX} totalSlides={totalSlides} />

      {/* Static dots for each slide */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <Dot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
}

function AnimatedLine({
  scrollX,
  totalSlides,
}: {
  scrollX: Animated.SharedValue<number>;
  totalSlides: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const windowWidth = 375; // approximate, will be overridden by carousel
    // Interpolate position based on scroll offset
    const position = scrollX.value / windowWidth;
    const translateX = interpolate(
      position,
      [0, 1],
      [0, ACTIVE_WIDTH + 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.line, animatedStyle]} />
  );
}

function Dot({
  index,
  scrollX,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const windowWidth = 375;
    const position = scrollX.value / windowWidth;
    const scale = interpolate(
      position,
      [index - 0.5, index, index + 0.5],
      [1, 1.2, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      position,
      [index - 0.5, index, index + 0.5],
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    gap: 12,
  },
  line: {
    width: ACTIVE_WIDTH,
    height: 2,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: INACTIVE_COLOR,
  },
});
```

**Step 2: Verify**

Read the file. Check:
- Uses `useAnimatedStyle` + `interpolate` (worklet-safe)
- Active line with smooth position animation tied to `scrollX`
- Dots with scale + opacity animation
- Colors match design system (#8B7355 accent, #BEBEBE inactive)
- `scrollX` is a `SharedValue` passed as prop

---

## Task 5: `ModelDetailSheet.tsx`

**Files:**
- Create: `components/inspo/ModelDetailSheet.tsx`
- Read: `components/inspo/ModelCarousel.tsx` (reference for Image usage)
- Read: `components/shared/BottomTabBar.tsx` (HIDDEN_TAB_BAR_ROUTES pattern)

**Step 1: Write the component**

```tsx
/**
 * ModelDetailSheet - Full-screen bottom sheet for model detail
 * 
 * Two-slide carousel:
 * - Slide 1: Full model image (contentFit cover)
 * - Slide 2: OutfitGrid with dotted background
 * 
 * Footer: PaginationIndicator + Save/Share buttons
 * Backdrop: rgba(0,0,0,0.4) semi-transparent overlay
 * Animation: spring open (damping:18, stiffness:180, mass:0.8)
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import Carousel from 'react-native-reanimated-carousel';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { OutfitGrid } from '@/components/shared/OutfitGrid';
import { PaginationIndicator } from '@/components/shared/PaginationIndicator';
import type { ModelCard, OutfitItem } from '@/types/inspo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = Dimensions.get('window').height * 0.9;

interface ModelDetailSheetProps {
  model: ModelCard | null;
  isOpen: boolean;
  clothItems: OutfitItem[];
  onClose: () => void;
}

// Spring config for open/close
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.8,
};

export function ModelDetailSheet({
  model,
  isOpen,
  clothItems,
  onClose,
}: ModelDetailSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const carouselRef = useRef<Carousel>(null);
  const scrollX = useSharedValue(0);

  // Sync isOpen to bottom sheet index
  React.useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(0, undefined, SPRING_CONFIG);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const handleScroll = useCallback(
    (offset: number) => {
      scrollX.value = offset;
    },
    [scrollX]
  );

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: implement save
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: implement share
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  if (!model) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={[SHEET_HEIGHT]}
      onChange={handleSheetChange}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(0,0,0,0.2)', width: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 44, height: 44 }} />
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={24} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Carousel (2 slides) */}
        <Carousel
          ref={carouselRef}
          width={SCREEN_WIDTH}
          height={SHEET_HEIGHT - 180}
          data={[1, 2]}
          renderItem={({ item }) =>
            item === 1 ? (
              <ModelSlide model={model} />
            ) : (
              <OutfitGrid items={clothItems} />
            )
          }
          onScroll={(offset) => handleScroll(offset)}
          scrollEventThrottle={16}
          loop={false}
          pagingEnabled
          snapEnabled
        />

        {/* Footer: Pagination + Buttons */}
        <View style={styles.footer}>
          <PaginationIndicator
            currentIndex={0}
            totalSlides={2}
            scrollX={scrollX}
          />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Feather name="bookmark" size={20} color="#8B7355" />
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>

            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Feather name="share" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

function ModelSlide({ model }: { model: ModelCard }) {
  const imageSource =
    typeof model.imageUrl === 'string'
      ? { uri: model.imageUrl }
      : model.imageUrl;

  return (
    <View className="flex-1">
      <Image
        source={imageSource}
        style={{ width: SCREEN_WIDTH, height: '100%' }}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8B7355',
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B7355',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B7355',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Step 2: Verify**

Read the file. Check:
- Uses `@gorhom/bottom-sheet` as container
- `isOpen` syncs via `useEffect` + `snapToIndex`/`close`
- Two-slide `Carousel` inside sheet
- `ModelSlide` renders full model image
- `OutfitGrid` on slide 2
- `PaginationIndicator` with `scrollX` shared value
- Save/Share buttons with proper styles
- `keyboardShouldPersistTaps="handled"` on BottomSheet
- Backdrop via `BottomSheetBackdrop` with `opacity={0.4}`
- Spring config for open/close animation
- `onClose` called when sheet dismisses (index -1)
- Named export `ModelDetailSheet`

---

## Task 6: Wire `inspo/index.tsx`

**Files:**
- Modify: `app/(tabs)/inspo/index.tsx`
- Read: `components/inspo/ModelDetailSheet.tsx` (after Task 5)

**Step 1: Add state and import**

In `inspo/index.tsx`, add:
```tsx
import { ModelDetailSheet } from '@/components/inspo/ModelDetailSheet';
import { MOCK_CLOTH_ITEMS } from '@/types/inspo';
import type { ModelCard } from '@/types/inspo';
```

**Step 2: Add state variables**

```tsx
const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
const [selectedModel, setSelectedModel] = useState<ModelCard | null>(null);
```

**Step 3: Update `handleModelPress`**

```tsx
const handleModelPress = useCallback((model: ModelCard) => {
  setSelectedModel(model);
  setIsDetailSheetOpen(true);
}, []);
```

**Step 4: Add `ModelDetailSheet` below carousel**

```tsx
<ModelDetailSheet
  model={selectedModel}
  isOpen={isDetailSheetOpen}
  clothItems={MOCK_CLOTH_ITEMS}
  onClose={() => setIsDetailSheetOpen(false)}
/>
```

**Step 5: Verify**

Read the file. Check:
- State added: `isDetailSheetOpen`, `selectedModel`
- `handleModelPress` uses both `model` and `index` params (update callback signature)
- `ModelDetailSheet` rendered with correct props
- `onClose` resets state

---

## Task 7: Hide BottomTabBar for model detail

**Files:**
- Modify: `components/shared/BottomTabBar.tsx`

**Step 1: Add to HIDDEN_TAB_BAR_ROUTES**

```tsx
const HIDDEN_TAB_BAR_ROUTES = [
  'wardrobe/add-item',
  'favorites/index',
  'inspo/model-detail',  // ADD THIS
];
```

**Step 2: Verify**

Read the file. Check:
- `'inspo/model-detail'` added to `HIDDEN_TAB_BAR_ROUTES`

---

## Task 8: Add `OutfitItem` to types

**Files:**
- Modify: `types/inspo.ts`

**Step 1: Add interface and mock data**

```typescript
import { type ImageSourcePropType } from 'react-native';

export interface OutfitItem {
  image: ImageSourcePropType;
  label: 'Top' | 'Bottom' | 'Shoes' | 'Accessories';
}

export const MOCK_CLOTH_ITEMS: OutfitItem[] = [
  { image: require('@assets/modalCloth/0013_00_top.png'), label: 'Top' },
  { image: require('@assets/modalCloth/0003_04_bottom.png'), label: 'Bottom' },
  { image: require('@assets/modalCloth/0011_05_shoes.png'), label: 'Shoes' },
  { image: require('@assets/modalCloth/0009_02_accessories.png'), label: 'Accessories' },
];
```

**Step 2: Verify**

Read the file. Check:
- `OutfitItem` interface matches spec
- `MOCK_CLOTH_ITEMS` array has 4 items with correct labels
- `ImageSourcePropType` imported from react-native

---

## Task 9: Verify build

**Step 1: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: No errors

**Step 2: Run lint/build**

```bash
bun run build
```
Or if no build script:
```bash
npx expo export --platform android
```

**Step 3: Verify all new files**

Read each new file and confirm:
- All imports resolve
- No `as any`, `@ts-ignore`, or empty catch blocks
- NativeWind `className` used (no `StyleSheet.create` except for DynamicAnimationSheet styles)
- `expo-image` used instead of React Native `Image`

---

## Task 10: Commit

```bash
git add components/shared/DottedBackground.tsx components/shared/SkeletonImage.tsx components/shared/OutfitGrid.tsx components/shared/PaginationIndicator.tsx components/inspo/ModelDetailSheet.tsx app/\(tabs\)/inspo/index.tsx components/shared/BottomTabBar.tsx types/inspo.ts
git commit -m "feat(inspo): add model detail bottom sheet with outfit grid

- ModelDetailSheet: two-slide carousel (model + outfit grid)
- OutfitGrid: 2x2 grid on dotted SVG background
- DottedBackground: reusable SVG dot pattern component
- SkeletonImage: shimmer loading placeholder
- PaginationIndicator: animated line + dots
- BottomTabBar hides on model detail route
- Save and Share buttons with haptic feedback
- Uses @gorhom/bottom-sheet for sheet container
- Partial peek (35%) on initial open for swipe UX hint"
```
