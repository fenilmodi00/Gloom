# DOMAIN TYPE DEFINITIONS

**Generated:** 2026-03-23
**Commit:** 078aade
**Branch:** main

## OVERVIEW
Central TypeScript interfaces for all business objects. Source of truth for API and store typing.

## STRUCTURE
```
types/
├── user.ts          # Auth profile and preferences
├── wardrobe.ts      # Item types (Cat, Color, Shape, Tags)
├── outfit.ts        # Look and Styling interfaces
├── inspo.ts         # Post and feed data
└── index.ts         # Common re-exports
```

## WHERE TO LOOK
- **Clothing Object**: `wardrobe.ts`
- **User Record**: `user.ts`
- **Common Utility Types**: `index.ts`

## CONVENTIONS
- Use **interfaces** for objects, **types** for unions.
- Follow **PascalCase** for type names.
- Export all interfaces from domain files.
- Import types using `@/types/` alias.

## ANTI-PATTERNS
- **NEVER** use `any`.
- **NEVER** use `// @ts-ignore`.
- **NO** inline object types for props (define an interface).
- **NO** cross-tab-state leakage (keep types strictly separated).

## NOTES
- Interfaces match the Supabase DB schema.
- Used extensively in stores and screen props.
- Reference `lib/schemas/` for Zod validation parity.
