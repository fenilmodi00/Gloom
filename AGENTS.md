# AGENTS.md — Gloom (AI Fashion App)

**Generated:** 2026-04-03 | **Branch:** main

## OVERVIEW

India-first AI personal stylist app. Users photograph clothes, build digital wardrobe, get AI outfit suggestions.
Phase 1: Inspo + Wardrobe + Outfits tabs. React Native (Expo).

## COMMANDS

```bash
# Development
bun start           # Start Expo dev server
bun run android     # Run on Android
bun run ios         # Run on iOS

# TypeScript
npx tsc --noEmit    # Type check (no emit)

# Testing
bun test                           # Run all tests
bun test --watch                   # Watch mode
bun test auth-store                # Run tests matching pattern
bun test __tests__/auth.test.ts    # Run specific test file (Recommended)
bun test --coverage                # Run with coverage report

# Build
npx expo prebuild                  # Generate native directories (android/ios)
```

**Package manager:** `bun` exclusively. Never `npm`/`yarn`/`pnpm`.

## TECH STACK (NON-NEGOTIABLE)

| Category | Technology |
|----------|------------|
| Framework | Expo SDK 55 |
| Runtime | React Native 0.83.2, React 19.2 |
| Language | TypeScript 5.9 strict mode |
| Routing | Expo Router v7 (~55.0.5) |
| Styling | NativeWind v4.1 + TailwindCSS v3.4 |
| State | Zustand v5 + React Query v5 |
| Backend | Supabase (Auth, Storage, PostgreSQL) |
| AI | Gemini 2.5 Flash |
| Animations | React Native Reanimated v4 |

## STRUCTURE

```
app/                    # Expo Router screens (file-based routing)
├── (auth)/             # Login + Onboarding
├── (tabs)/             # Main tabs: inspo, wardrobe, outfits
└── _layout.tsx         # Root layout, auth gate, providers

components/             # UI components (feature-scoped subdirs)
lib/                    # Core logic (NO UI components)
├── store/              # Zustand stores (*.store.ts)
├── schemas/            # Zod validation schemas
├── supabase.ts         # Supabase client singleton
├── gemini.ts           # Gemini 2.5 Flash wrapper
└── storage.ts          # AsyncStorage wrapper
types/                  # TypeScript interfaces (PascalCase, domain files)
__tests__/              # Jest tests (*.test.ts, *.test.tsx)
__mocks__/              # Jest mocks
```

## MCP SERVER USAGE (IMPORTANT)

**ALWAYS use MCP servers instead of CLI tools when available.** MCP provides better type safety, context preservation, and IDE integration.

### Supabase MCP (Use Instead of CLI)
- **MCP Server:** `supabase_*` tools (supabase_execute_sql, supabase_list_tables, etc.)
- **NEVER run:** `supabase db`, `supabase migration`, `psql`, or SQL CLI commands
- **DO use:** `supabase_execute_sql`, `supabase_apply_migration`, `supabase_list_tables`
- **Why:** MCP returns typed results, preserves context across calls

### Google Cloud MCP (Use Instead of CLI)
- **MCP Server:** `gcloud_run_gcloud_command` tool
- **NEVER run:** `gcloud` CLI commands directly
- **DO use:** `gcloud_run_gcloud_command` with args array
- **Example:** `gcloud_run_gcloud_command({ args: ["run", "services", "list"] })`

### GitHub MCP (Use Instead of CLI)
- **MCP Server:** `github_*` tools
- **NEVER run:** `gh` CLI for PRs, issues, repos
- **DO use:** `github_list_issues`, `github_create_pull_request`, etc.

### Context7 (Use Instead of Web Search)
- **MCP Server:** `context7_*` tools for library docs
- **NEVER use:** General web search for library documentation
- **DO use:** `context7_resolve-library-id` + `context7_query-docs`

## CODE STYLE

### TypeScript
- **Strict mode enabled.** No `any`, `@ts-ignore`, or `@ts-expect-error`.
- **Absolute imports:** `@/lib/...` (configured in tsconfig.json paths)
- **Named imports:** `{ useState }` not default imports
- **Use `interface`** for objects, **`type`** for unions
- **Import types:** `import type { ... }` when only used as types

### Naming Conventions
- **Components/files:** PascalCase (`ItemCard.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth`)
- **Stores:** `*.store.ts` suffix (`auth.store.ts`)
- **Types:** PascalCase, export from `types/` domain files
- **Constants:** UPPER_SNAKE_CASE
- **Test files:** `*.test.ts` or `*.test.tsx`

### Styling (NativeWind)
- **Use `className`** prop. NEVER `StyleSheet.create`
- **No inline styles** except dynamic values
- **Use design tokens** (below), not arbitrary values
- **Dark mode:** `dark:` prefix. Responsive: `sm:`, `md:`, `lg:`
- **Corner radius:** `rounded-2xl` (cards), `rounded-full` (pills/buttons)

### Images
- **Always use `expo-image`.** NEVER `Image` from react-native
- **Set appropriate `contentFit`:** contain, cover, or stretch

### State Management
- **Zustand** for global state (`lib/store/*.store.ts`)
- **React Query** for server state
- **AsyncStorage** for persistence via `storage.ts` (NOT MMKV)
- **Use `persist`** middleware with `partialize` for selective persistence
- **NEVER mutate state directly** — use store setters
- **Use `subscribeWithSelector`** for side effects on state changes

### Error Handling
- **Never use empty catch blocks**
- **Use toast notifications** for user-facing errors (`components/shared/Toast`)
- **Validate API responses** with Zod schemas (`lib/schemas/`)
- **Log unexpected errors** to console for debugging

## ANTI-PATTERNS (NEVER DO THESE)

- **NEVER** use `as any`, `// @ts-ignore`, `// @ts-expect-error`
- **NEVER** use `StyleSheet.create` — use NativeWind className
- **NEVER** use `Image` from react-native — use expo-image
- **NEVER** suppress errors with empty catch blocks
- **NEVER** use heavy shadows — only `shadow-sm`
- **NEVER** install packages outside tech stack
- **NEVER** use `npm`/`yarn`/`pnpm` — use `bun` exclusively
- **NEVER** use `console.log` in production code — remove before commit
- **NEVER** hardcode API endpoints — use environment variables
- **NEVER** mutate state directly — use store setters
- **NEVER** create new Supabase clients — use singleton from `lib/supabase.ts`
- **NEVER** use MMKV for storage (native module issues) — use AsyncStorage
- **NEVER** put UI components in `lib/`
- **NEVER** bypass Zod schemas for API data validation

## DESIGN TOKENS

```css
/* Brand Core */
primary: #8B7355, primaryDark: #6B5840, primaryLight: #B09A7A
goldAccent: #C9A84C, goldSoft: #E8D5A3

/* Backgrounds */
bgCanvas: #F5F2EE, bgSurface: #FDFAF6, bgSurfaceRaised: #F0EBE3, bgMuted: #EAE4DA

/* Typography */
textPrimary: #1A1A1A, textSecondary: #6B6B6B, textTertiary: #A89880, textOnDark: #FDFAF6

/* Feedback */
stateSuccess: #6A8C69, stateError: #B85C4A, stateWarning: #C9A84C, stateInfo: #7A8FAB
```

## PACKAGE PRIORITY RULES

1. **Expo SDK First** — Always check if Expo provides a native module:
   - `expo-blur`, `expo-image`, `expo-camera`, `expo-image-picker`
   - `expo-linear-gradient`, `expo-haptics`, `expo-secure-store`, `expo-clipboard`

2. **Third-party Only When** Expo doesn't provide functionality:
   - `react-native-reanimated` (complex animations)
   - `react-native-gesture-handler` (required by reanimated)
   - `@shopify/flash-list` (high-performance lists)
   - `@gorhom/bottom-sheet` (bottom sheets)

3. **Package Manager:** Use `bun` exclusively:
   - Install: `bun add <package>`
   - Remove: `bun remove <package>`
   - Install all: `bun install`

## TESTING GUIDELINES

- Tests in `__tests__/` directory
- Mock external dependencies: Supabase, Gemini, fetch, reanimated
- Reset store state: `useXxxStore.getState().clearAll()` in `beforeEach()`
- Test both positive and negative cases
- Use `describe()` / `it()` blocks with meaningful assertions

## GIT WORKFLOW

- **Commit prefixes:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Branch naming:** `feature/`, `bugfix/`, `release/`
- Never commit to main directly — always use PRs
- Atomic commits, focused scope

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new screen | `app/(tabs)/` |
| Add UI component | `components/ui/` or `components/shared/` |
| Modify auth flow | `lib/store/auth.store.ts` + `app/(auth)/` |
| Wardrobe state | `lib/store/wardrobe.store.ts` |
| Outfit suggestions | `lib/gemini.ts` |
| Add validation | `lib/schemas/*.ts` |
| Supabase queries | Use `supabase_execute_sql` MCP |

## NOTES

- Auth bypassed in dev mode (see `app/_layout.tsx`)
- Storage: AsyncStorage only (NOT MMKV)
- Environment variables: See `.env.local.example`
- i18n: English and Hindi locales
- Gemini: Uses REST API (not SDK)