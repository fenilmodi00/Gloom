# UI COMPONENTS & DESIGN SYSTEM

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
Reusable UI building blocks following atomic design principles. Styled with NativeWind 4.1.

## STRUCTURE
```
components/
├── ui/            # Atomic primitives (button, input, heading)
├── shared/        # Context-aware molecules (bottom-sheet, tab-bar)
├── wardrobe/      # Domain-specific components for clothing management
├── outfits/       # Domain-specific components for outfit creation
└── inspo/         # Domain-specific components for inspiration feed
```

## WHERE TO LOOK
- **Base Primitives**: `ui/`
- **Global UI Overlay**: `shared/LoadingOverlay.tsx`
- **Wardrobe Card**: `wardrobe/ItemCard.tsx`
- **Outfit Card**: `outfits/OutfitCard.tsx`

## CONVENTIONS
- Use **NativeWind** (`className`) for styling.
- Use **expo-image** for all image rendering.
- Follow **PascalCase** for component file naming.
- Use **named exports** for all components.

## ANTI-PATTERNS
- **NEVER** use `StyleSheet.create` (use classes).
- **NEVER** use `react-native`'s `Image` (use `expo-image`).
- **NO** heavy shadows (use `shadow-sm` or design tokens).
- **NO** hardcoded hex colors (use Tailwind themes from `tailwind.config.js`).

## NOTES
- `shared/` contains components used across multiple tabs.
- Check `ui/` before building a new primitive.
