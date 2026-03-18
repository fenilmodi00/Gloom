# components — UI Components

## OVERVIEW
Reusable React Native components organized by domain.

## STRUCTURE
```
components/
├── ui/           # Base components (button, fab, heading)
├── wardrobe/     # ItemCard, CategoryFilter, AddItemSheet
├── outfits/      # OutfitCard, OccasionBadge
├── inspo/        # InspoCard
├── shared/       # LoadingOverlay, EmptyState, Toast, BottomTabBar
└── skia/         # Skia graphics (future use)
```

## WHERE TO LOOK

| Component | Location | Purpose |
|-----------|----------|---------|
| Button | `ui/button.tsx` | Primary/secondary buttons |
| FAB | `ui/fab.tsx` | Floating action button |
| ItemCard | `wardrobe/ItemCard.tsx` | Wardrobe grid item |
| CategoryFilter | `wardrobe/CategoryFilter.tsx` | Filter bar (All/Tops/etc) |
| AddItemSheet | `wardrobe/AddItemSheet.tsx` | Camera/gallery bottom sheet |
| OutfitCard | `outfits/OutfitCard.tsx` | AI suggestion card |
| OccasionBadge | `outfits/OccasionBadge.tsx` | Occasion label chip |
| InspoCard | `inspo/InspoCard.tsx` | Trending look card |
| EmptyState | `shared/EmptyState.tsx` | Empty list placeholder |
| LoadingOverlay | `shared/LoadingOverlay.tsx` | Full-screen loader |
| Toast | `shared/Toast.tsx` | Toast notifications |
| BottomTabBar | `shared/BottomTabBar.tsx` | Custom floating tab bar |

## CONVENTIONS
- Use NativeWind `className` for all styles
- Export components as named exports
- Props interfaces: `export interface Props { ... }`
- Use `expo-image` for all images

## ANTI-PATTERNS
- No StyleSheet.create — use className
- No inline styles unless dynamic
- No `Image` from react-native — use expo-image
- No heavy shadows — use shadow-sm

## TEMPLATE FILES (TO REMOVE)
- `EditScreenInfo.tsx` — Expo template leftover
- `ExternalLink.tsx` — Expo template leftover
- `StyledText.tsx` — Expo template leftover
- `Themed.tsx` — Expo template leftover
