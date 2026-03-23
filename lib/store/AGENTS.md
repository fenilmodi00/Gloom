# GLOBAL STATE MANAGEMENT (ZUSTAND)

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
Reactive application state using Zustand. Avoids prop-drilling and provides persistence.

## STRUCTURE
```
lib/store/
├── auth.store.ts         # User authentication & session state
├── wardrobe.store.ts     # User's digital closet (items, filtering)
├── outfit.store.ts       # Generated and saved outfits
└── outfit-builder.store.ts # Temporary creator UI state
```

## WHERE TO LOOK
- **User Session**: `auth.store.ts`
- **Clothing Cache**: `wardrobe.store.ts`
- **Builder Interaction**: `outfit-builder.store.ts`

## CONVENTIONS
- Suffix all files with `.store.ts`.
- Use **persist** middleware for `auth` and `wardrobe` stores.
- Use **subscribeWithSelector** for side effects.
- Extract complex actions into helper functions.

## ANTI-PATTERNS
- **NEVER** use `any` in state (use `types/`).
- **NEVER** mutate state directly (use `set()`).
- **NO** direct AsyncStorage calls (use persistence middleware).
- **NO** component-specific ephemeral state in global stores.

## NOTES
- `wardrobe.store.ts` is the most frequently updated.
- Use `subscribeWithSelector` to perform actions when state changes.
