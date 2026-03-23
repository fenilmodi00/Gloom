# APP NAVIGATION & ROUTING

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
Expo Router v7 file-based navigation. Controls screen mapping and auth-gated access.

## STRUCTURE
```
app/
├── (auth)/        # Public-facing onboarding screens
├── (tabs)/        # Authenticated bottom-tab navigation
├── _layout.tsx    # Root layout with auth provider logic
└── index.tsx      # Main redirection entry point
```

## WHERE TO LOOK
- **Tabs**: `(tabs)/_layout.tsx` (Tab config)
- **Wardrobe**: `(tabs)/wardrobe/index.tsx`
- **Outfit Builder**: `(tabs)/wardrobe/outfit-builder.tsx`
- **Inspo**: `(tabs)/inspo/index.tsx`

## CONVENTIONS
- Use **Expo Router** hooks (`useRouter`, `useLocalSearchParams`)
- Screen-specific layouts in subdirectories (e.g. `(tabs)/_layout.tsx`)
- Keep screen components thin—extract UI to `components/`

## ANTI-PATTERNS
- **NEVER** use manual navigation stacks (use folders)
- **NEVER** put business logic in screen files (use `lib/store/` or hooks)
- **NO** direct Supabase queries in screens—use stores/hooks

## NOTES
- `(tabs)/_layout.tsx` defines the visuals for the bottom tab bar.
- Auth is currently bypassed in `RootLayoutNav` for dev.
