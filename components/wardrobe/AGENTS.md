# WARDROBE UI COMPONENTS

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
UI components specifically for clothing management and wardrobe browsing.

## STRUCTURE
```
components/wardrobe/
├── outfit-builder/      # Specialized views for look creation
├── ItemCard.tsx         # Primary visual for a clothing item
├── CategoryFilter.tsx   # Pill-based filtering UI
├── AddItemSheet.tsx     # Camera-to-Closet workflow entry point
├── SelectItemsSheet.tsx # Multi-select modal for outfit building
└── SelectedItemsRow.tsx # Horizontal display of staged items
```

## WHERE TO LOOK
- **Clothing Card**: `ItemCard.tsx`
- **Filter logic**: `CategoryFilter.tsx`
- **Camera integration**: `AddItemSheet.tsx`

## CONVENTIONS
- Use **expo-image** for high-performance lazy loading.
- Components should connect to `wardrobe.store.ts` via hooks.
- Handle different aspect ratios gracefully.

## ANTI-PATTERNS
- **NEVER** pass large arrays as props (select only what's needed).
- **NEVER** perform image manipulation in components (use `lib/gemini.ts` or `lib/supabase.ts`).
- **NO** direct state mutations (use store actions).

## NOTES
- Linked extensively with `app/(tabs)/wardrobe/index.tsx`.
- Highly visual; maintain consistent spacing and rounded-2xl corners.
- `AddItemSheet.tsx` provides haptic feedback via `expo-haptics`.
