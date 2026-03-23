# lib — Core Logic Layer

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
State management (Zustand), API clients (Supabase, Gemini), validation schemas (Zod). No UI components.

## STRUCTURE
```
lib/
├── store/           # Zustand stores
│   ├── auth.store.ts      # Auth + session state
│   ├── wardrobe.store.ts  # Items + categories
│   ├── outfit.store.ts    # AI suggestions
│   ├── outfit-builder.store.ts
│   └── modelDetail.store.ts
├── schemas/         # Zod validation
│   ├── auth.ts
│   ├── profile.ts
│   └── wardrobe.ts
├── supabase.ts      # Client singleton
├── gemini.ts        # Gemini 2.5 Flash API
├── storage.ts       # AsyncStorage wrapper
├── i18n.ts          # i18next config
└── data/            # Static data
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add auth feature | `store/auth.store.ts` |
| Modify wardrobe state | `store/wardrobe.store.ts` |
| Change AI prompts | `gemini.ts` |
| Add validation | `schemas/*.ts` |
| Supabase queries | `supabase.ts` |
| Persist state | `storage.ts` |

## CONVENTIONS

### Store Pattern
```typescript
export const useWardrobeStore = create<WardrobeState>()(...)
export const useWardrobeItems = () => useWardrobeStore((s) => s.items)
```

### Persistence
- Use `storage.ts` wrapper (AsyncStorage, NOT MMKV)
- Selective persistence via `partialize`

## ANTI-PATTERNS
- **NEVER** create new Supabase clients — use singleton
- **NEVER** use MMKV for storage (native module issues)
- **NEVER** put UI components in `lib/`
- **NEVER** bypass Zod schemas for API data

## NOTES
- `clearAll()` resets store state (use in tests)
- Gemini uses REST API (not SDK)
- i18n configured for en/hi locales
