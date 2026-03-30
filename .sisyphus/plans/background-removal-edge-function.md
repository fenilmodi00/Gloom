# Background Removal Implementation Plan (Supabase Edge Function Approach)

**Generated:** 2026-03-29
**Commit:** Current
**Branch:** main

## OVERVIEW

Implement background removal functionality using Supabase Edge Functions. Users capture photos, which are temporarily stored, processed via the rembg service, and replaced with cutouts.

## STRUCTURE

```
supabase/
├── functions/
│   └── process_rembg/
│       └── index.ts          # Edge Function for background removal
├── migrations/
│   └── 000003_add_processing_status.up.sql  # Add processing_status column
app/
└── (tabs)/
    └── wardrobe/
        └── add-item.tsx      # Modified upload flow
lib/
└── store/
    └── wardrobe.store.ts     # Updated to handle processing status
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Database migration | `supabase/migrations/` | Add processing_status column |
| Edge Function | `supabase/functions/process_rembg/index.ts` | Poll wardrobe-temp bucket, call rembg service |
| Add-item flow | `app/(tabs)/wardrobe/add-item.tsx` | Upload to temp bucket, set processing status |
| Wardrobe store | `lib/store/wardrobe.store.ts` | Handle processing status updates |

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
| AI | Gemini 2.5 Flash (for tagging), rembg service (for background removal) |
| Animations | React Native Reanimated v4 |

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

# Supabase
supabase db push    # Push migrations
supabase functions deploy process_rembg  # Deploy edge function
```

## NOTES

- Auth bypassed in dev (see `app/_layout.tsx` RootLayoutNav)
- Storage: AsyncStorage (NOT MMKV — native module issues)
- Extra tabs (favorites, profile) not in Phase 1 scope
- Template files to remove: `modal.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`

---

### Task 1: Update Database Schema
- Add `processing_status TEXT DEFAULT 'pending'` column to `wardrobe_items` table
- Use Supabase migration system

### Task 2: Create Edge Function
- Create `supabase/functions/process_rembg/index.ts`
- Function should:
  - Poll `wardrobe-temp` bucket for new photos
  - Download photo and send to rembg service
  - Upload cutout to `wardrobe-images` bucket
  - Update `processing_status` to 'completed' or 'failed'

### Task 3: Modify Add-Item Flow
- Update `app/(tabs)/wardrobe/add-item.tsx`
- Upload original photo to `wardrobe-temp` bucket
- Set `processing_status` to 'processing'
- Show loading state to user

### Task 4: Handle Processing Completion
- Create polling mechanism to check processing status
- Update UI when cutout is ready
- Implement retry logic for failed jobs

### Task 5: Cleanup Temporary Storage
- Add lifecycle policy to auto-delete `wardrobe-temp` files after 24h
- Implement cleanup function

---