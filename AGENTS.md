# AGENTS.md — StyleAI (AI Fashion App)

**Generated:** 2026-03-23
**Commit:** 078aade
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

## CONVENTIONS

### TypeScript
- Strict mode enabled
- No `any` types — use interfaces from `types/`
- Absolute imports: `@/lib/...` not `../lib/...`
- Named imports: `{ useState }` not default

### Naming
- Components: PascalCase (`ItemCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Stores: `*.store.ts` suffix
- Types: PascalCase, export from `types/`

### Styling (NativeWind)
- Use `className` prop, NOT StyleSheet.create
- Colors from design tokens below
- No inline styles except dynamic values

### Images
- Always use `expo-image`, NEVER `Image` from react-native
- Lazy loading is default

### State
- Zustand for global state (`lib/store/*.ts`)
- React Query for server state
- AsyncStorage for persistence

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use `as any`, `// @ts-ignore`, `// @ts-expect-error`
- **NEVER** use `StyleSheet.create` — use NativeWind className
- **NEVER** use `Image` from react-native — use expo-image
- **NEVER** suppress errors with empty catch blocks
- **NEVER** use heavy shadows — only `shadow-sm`
- **NEVER** install packages outside tech stack
- **NEVER** use `npm` — use `bun` for ALL package management
- **NO** inline styles unless absolutely necessary

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
| Runtime | React Native 0.83.1, React 19.2 |
| Language | TypeScript 5.8 strict mode |
| Routing | Expo Router v7 |
| Styling | NativeWind v4.1 + TailwindCSS v3.4 |
| State | Zustand v5 + React Query v5 |
| Backend | Supabase (Auth, Storage, PostgreSQL) |
| AI | Gemini 2.5 Flash |
| Animations | React Native Reanimated v4 |

## DESIGN TOKENS

```
background: #F5F2EE    surface: #FFFFFF
text-primary: #1A1A1A  text-secondary: #6B6B6B
accent: #8B7355        accent-light: #D4C5B0
error: #C0392B         success: #27AE60
```

- Corner radius: `rounded-2xl` (cards), `rounded-full` (pills/buttons)
- Typography: `font-bold tracking-tight` (headings), `font-normal` (body)

## COMMANDS

```bash
# Development
bun start           # Start Expo dev server
bun run android     # Run on Android
bun run ios         # Run on iOS

# TypeScript
npx tsc --noEmit     # Type check

# Testing
bun test            # Run all tests

# Build
npx expo prebuild   # Generate native directories
```

## NOTES

- Auth bypassed in dev (see `app/_layout.tsx` RootLayoutNav)
- Storage: AsyncStorage (NOT MMKV — native module issues)
- Extra tabs (favorites, profile) not in Phase 1 scope
- Template files to remove: `modal.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`
