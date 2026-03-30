# AGENTS.md — Gloom (AI Fashion App)

**Generated:** 2026-03-30
**Commit:** Current
**Branch:** main

## OVERVIEW
India-first AI personal stylist app. Users photograph clothes, build digital wardrobe, get AI outfit suggestions. Competitor to Aesty (aesty.ai). Phase 1: Inspo + Wardrobe + Outfits tabs.

## STRUCTURE
```
app/
├── (auth)/        # Login + Onboarding screens
├── (tabs)/        # Main tabs: inspo, wardrobe, outfits (+ extras: favorites, profile)
└── _layout.tsx    # Root layout, auth gate, providers

components/
├── ui/            # Base components (button, fab, heading)
├── wardrobe/      # ItemCard, CategoryFilter, AddItemSheet
├── outfits/       # OutfitCard, OccasionBadge
├── shared/        # LoadingOverlay, EmptyState, Toast, BottomTabBar
└── inspo/         # InspoCard

lib/
├── store/         # Zustand stores: auth, wardrobe, outfit
├── supabase.ts    # Supabase client singleton
├── gemini.ts      # Gemini 2.5 Flash wrapper
├── storage.ts     # AsyncStorage wrapper for Zustand persist
└── schemas/       # Zod validation schemas

types/             # TypeScript interfaces: wardrobe, outfit, user, inspo
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
| Run tests | See COMMANDS section | Jest testing framework |
| Type checking | See COMMANDS section | TypeScript compiler |
| MCP operations | Use Supabase MCP for DB operations | See lib/supabase.ts |

## CONVENTIONS

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig.json)
- No `any` types — use interfaces from `types/`
- Absolute imports: `@/lib/...` not `../lib/...`
- Named imports: `{ useState }` not default
- Enable `noImplicitReturns`, `noFallthroughCasesInSwitch`

### Naming
- Components: PascalCase (`ItemCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Stores: `*.store.ts` suffix
- Types: PascalCase, export from `types/`
- Constants: UPPER_SNAKE_CASE (`MAX_ITEMS_PER_ROW`)
- Test files: `*.test.ts` or `*.test.tsx`

### Styling (NativeWind)
- Use `className` prop, NOT StyleSheet.create
- Colors from design tokens below
- No inline styles except dynamic values
- Responsive prefixes: `sm:`, `md:`, `lg:` (Tailwind breakpoints)
- Dark mode: `dark:` prefix
- Avoid arbitrary values when possible (`[#123456]`)

### Images
- Always use `expo-image`, NEVER `Image` from react-native
- Lazy loading is default
- Use `placeholder` prop for blur effect
- Set appropriate `contentFit` (contain, cover, stretch, etc.)

### State
- Zustand for global state (`lib/store/*.ts`)
- React Query for server state (`lib/query/` if exists)
- AsyncStorage for persistence (via `storage.ts`)
- Avoid local state for cross-component data

### Error Handling
- Never use empty catch blocks `catch(e) {}`
- Handle errors gracefully with user feedback
- Use toast notifications for user-facing errors (`components/shared/Toast`)
- Log unexpected errors to console for debugging
- Validate API responses with Zod schemas (`lib/schemas/`)

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

## COMMANDS

```bash
# Development
bun start           # Start Expo dev server
bun run android     # Run on Android
bun run ios         # Run on iOS

# TypeScript
npx tsc --noEmit     # Type check (no emission)

# Testing
bun test             # Run all tests
bun test --watch     # Run tests in watch mode
bun test -- testName # Run specific test (jest pattern matching)
bun test src/path/to.test.ts # Run specific test file
bun test --coverage  # Run tests with coverage report

# Build
npx expo prebuild    # Generate native directories
```

## TESTING GUIDELINES

- Test files located in `__tests__/` directory
- Unit tests for stores, utilities, helpers
- Integration tests for components with complex logic
- Mock external dependencies (Supabase, Gemini, fetch)
- Use `describe()` and `it()` blocks from Jest
- Reset mocks and state between tests with `beforeEach()`
- Test both positive and negative cases
- Aim for meaningful assertions, not just coverage
- Follow existing test patterns in `__tests__/`

## GIT WORKFLOW

- Use descriptive commit messages: `feat: add user profile screen`
- Prefix commits: `feat:` (feature), `fix:` (bug fix), `docs:` (documentation), `refactor:` (code refactor), `test:` (tests), `chore:` (maintenance)
- Keep commits atomic and focused
- Branch naming: `feature/`, `bugfix/`, `release/`
- Pull requests require description and relevant screenshots
- Never commit to main directly — always use PRs

## NOTES

- Auth bypassed in dev (see `app/_layout.tsx` RootLayoutNav)
- Storage: AsyncStorage (NOT MMKV — native module issues)
- Extra tabs (favorites, profile) not in Phase 1 scope
- Template files to remove: `modal.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`
- Environment variables: See `.env.local.example`
- Supabase URL/anon key: Configure in `.env.local`
- Gemini API key: Configure in `.env.local`
- **MCP Usage**: Use Supabase MCP for database operations when direct SQL is needed
- **MCP Reference**: See `supabase/` directory for MCP server configurations