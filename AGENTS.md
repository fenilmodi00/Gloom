# AGENTS.md — Gloom (AI Fashion App)

**Generated:** 2026-03-30 | **Branch:** main

## OVERVIEW
India-first AI personal stylist app. Users photograph clothes, build digital wardrobe, get AI outfit suggestions. Phase 1: Inspo + Wardrobe + Outfits tabs.

## COMMANDS

```bash
# Development
bun start              # Start Expo dev server
bun run android        # Run on Android
bun run ios            # Run on iOS

# TypeScript
npx tsc --noEmit       # Type check (no emit)

# Testing (Jest)
bun test               # Run all tests
bun test --watch       # Watch mode
bun test <pattern>     # Run tests matching pattern (e.g. "auth-store")
bun test __tests__/auth-store.test.ts  # Run specific test file
bun test --coverage    # Run with coverage report

# Build
npx expo prebuild      # Generate native directories (android/ios)
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
app/                    # Expo Router screens
├── (auth)/             # Login + Onboarding
├── (tabs)/             # Main tabs: inspo, wardrobe, outfits
└── _layout.tsx         # Root layout, auth gate, providers

components/             # UI components (feature-scoped subdirs)
lib/                    # Core logic (NO UI components)
├── store/              # Zustand stores (*.store.ts)
├── schemas/            # Zod validation schemas
├── supabase.ts         # Supabase client singleton
├── gemini.ts           # Gemini 2.5 Flash wrapper
├── storage.ts          # AsyncStorage wrapper
└── i18n.ts             # i18next config (en/hi)
types/                  # TypeScript interfaces (PascalCase, domain files)
__tests__/              # Jest tests (*.test.ts, *.test.tsx)
__mocks__/              # Jest mocks
backend/                # Go backend (separate project)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new screen | `app/(tabs)/` | Follow Expo Router file-based routing |
| Add UI component | `components/ui/` or `components/shared/` | Use NativeWind className |
| Modify auth flow | `lib/store/auth.store.ts` + `app/(auth)/` | Zustand + Supabase |
| Wardrobe state | `lib/store/wardrobe.store.ts` | Zustand store |
| Outfit suggestions | `lib/gemini.ts` | Gemini 2.5 Flash prompts |
| Add item flow | `app/(tabs)/wardrobe/add-item.tsx` | Camera + Gemini tagging |
| Add validation | `lib/schemas/*.ts` | Zod schemas |
| Supabase queries | `lib/supabase.ts` | Client singleton |
| MCP operations | Use Supabase MCP for DB operations | See lib/supabase.ts |

## CODE STYLE

### TypeScript
- Strict mode enabled. No `any`, `@ts-ignore`, or `@ts-expect-error`.
- Absolute imports: `@/lib/...` (configured in tsconfig.json paths).
- Named imports preferred: `{ useState }` not default.
- Use `interface` for objects, `type` for unions.
- Import types with `import type { ... }` when only used as types.

### Naming
- Components/files: PascalCase (`ItemCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Stores: `*.store.ts` suffix
- Types: PascalCase, export from `types/` domain files
- Constants: UPPER_SNAKE_CASE
- Test files: `*.test.ts` or `*.test.tsx`

### Styling (NativeWind)
- Use `className` prop. NEVER `StyleSheet.create`.
- No inline styles except dynamic values.
- Use design tokens (below), not arbitrary values (`[#123456]`).
- Dark mode: `dark:` prefix. Responsive: `sm:`, `md:`, `lg:`.
- Corner radius: `rounded-2xl` (cards), `rounded-full` (pills).

### Images
- Always use `expo-image`. NEVER `Image` from react-native.
- Set appropriate `contentFit` (contain, cover, stretch).

### State Management
- Zustand for global state (`lib/store/*.store.ts`).
- React Query for server state.
- AsyncStorage for persistence via `storage.ts` (NOT MMKV).
- Use `persist` middleware with `partialize` for selective persistence.
- NEVER mutate state directly — use store setters.
- Use `subscribeWithSelector` for side effects on state changes.

### Error Handling
- Never use empty catch blocks.
- Use toast notifications for user-facing errors (`components/shared/Toast`).
- Validate API responses with Zod schemas (`lib/schemas/`).
- Log unexpected errors to console for debugging.

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `as any`, `// @ts-ignore`, `// @ts-expect-error`
- **NEVER** use `StyleSheet.create` — use NativeWind className
- **NEVER** use `Image` from react-native — use expo-image
- **NEVER** suppress errors with empty catch blocks
- **NEVER** use heavy shadows — only `shadow-sm`
- **NEVER** install packages outside tech stack
- **NEVER** use `npm` — use `bun` for ALL package management
- **NO** inline styles unless absolutely necessary
- **NEVER** use `console.log` in production code — remove before commit
- **NEVER** hardcode API endpoints — use environment variables
- **NEVER** mutate state directly — use store setters
- **NEVER** create new Supabase clients — use singleton from `lib/supabase.ts`
- **NEVER** use MMKV for storage (native module issues) — use AsyncStorage
- **NEVER** put UI components in `lib/`
- **NEVER** bypass Zod schemas for API data validation

## DESIGN TOKENS

```
Brand Core:
  primary: #8B7355      primaryDark: #6B5840    primaryLight: #B09A7A
  goldAccent: #C9A84C   goldSoft: #E8D5A3

Backgrounds:
  bgCanvas: #F5F2EE     bgSurface: #FDFAF6
  bgSurfaceRaised: #F0EBE3    bgMuted: #EAE4DA

Typography:
  textPrimary: #1A1A1A  textSecondary: #6B6B6B
  textTertiary: #A89880 textOnDark: #FDFAF6

Feedback:
  stateSuccess: #6A8C69 stateError: #B85C4A
  stateWarning: #C9A84C stateInfo: #7A8FAB
```

- Corner radius: `rounded-2xl` (cards), `rounded-full` (pills/buttons)
- Typography: `font-bold tracking-tight` (headings), `font-normal` (body)
- Spacing: Use Tailwind spacing scale (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64)

## PACKAGE PRIORITY RULES

1. **Expo SDK First** — Always check if Expo provides a native module before adding third-party libs:
   - `expo-blur` for blur effects (NOT react-native-blur)
   - `expo-image` for images (NOT react-native-fast-image)
   - `expo-camera` for camera (NOT react-native-camera)
   - `expo-image-picker` for gallery (NOT react-native-image-picker)
   - `expo-linear-gradient` for gradients (NOT react-native-linear-gradient)
   - `expo-haptics` for haptic feedback (NOT react-native-haptics)
   - `expo-secure-store` for secure storage (NOT react-native-keychain)
   - `expo-clipboard` for clipboard (NOT @react-native-clipboard/clipboard)

2. **Third-party Only When** — Expo doesn't provide the functionality:
   - `react-native-reanimated` — complex animations (expo has basic animations only)
   - `react-native-gesture-handler` — gesture handling (required by reanimated)
   - `@shopify/flash-list` — high-performance lists (expo uses FlatList)
   - `@gorhom/bottom-sheet` — bottom sheets (expo has basic modal only)

3. **Package Manager** — Use `bun` exclusively:
   - Install: `bun add <package>`
   - Remove: `bun remove <package>`
   - Install all: `bun install`
   - Run scripts: `bun run <script>`
   - **NEVER** use `npm`, `yarn`, or `pnpm`

## TESTING GUIDELINES

- Tests in `__tests__/` directory.
- Mock external dependencies: Supabase, Gemini, fetch, reanimated.
- Reset store state between tests: `useXxxStore.getState().clearAll()` in `beforeEach()`.
- Test both positive and negative cases.
- Use `describe()` / `it()` blocks with meaningful assertions.
- See `jest.config.js` and `jest.setup.js` for mock configuration.

## GIT WORKFLOW

- Commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Branch naming: `feature/`, `bugfix/`, `release/`
- Never commit to main directly — always use PRs.
- Atomic commits, focused scope.

## NOTES

- Auth bypassed in dev mode (see `app/_layout.tsx` RootLayoutNav).
- Storage: AsyncStorage only (NOT MMKV — native module issues).
- Extra tabs (favorites, profile) not in Phase 1 scope.
- Environment variables: See `.env.local.example` (Supabase, Gemini, Backend URL).
- **MCP Usage**: Use Supabase MCP for database operations.
- i18n configured for English and Hindi locales.
- Gemini uses REST API (not SDK).
