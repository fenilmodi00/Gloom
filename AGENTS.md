# AGENTS.md — StyleAI (AI Fashion App)

## Project Identity
India-first AI personal stylist app. Users photograph their clothes,
build a digital wardrobe, and get AI-powered outfit suggestions.
Competitor to Aesty (aesty.ai). India-specific: Indian brands,
occasion wear (weddings, Diwali, Holi), affordable pricing.

## Phase 1 Scope (BUILD THIS ONLY)
- Tab 1: Inspo screen
- Tab 2: Wardrobe screen
- Tab 3: Outfits screen
- Auth: Supabase (Google + Phone OTP)
- Onboarding: body photo capture (one-time)
- NO glasses AR, NO try-on in Phase 1 UI (backend only stubs)

## Tech Stack — NON-NEGOTIABLE, DO NOT DEVIATE

### Frontend
- expo SDK 55 (NOT 52, NOT 53)
- react-native 0.83.1
- react 19.2
- expo-router v7 (file-based routing, tabs layout)
- typescript 5.8 strict mode
- hermes v1 (enable in app.json: "jsEngine": "hermes")
- New Architecture: enabled by default in SDK 55, keep it

### Styling
- nativewind v4.1 (NOT v5 — still beta)
- tailwindcss v3.4 (NOT v4 — nativewind v4 targets TW v3)
- @gluestack-ui/themed v1.1
- react-native-reanimated v4.1.0
- react-native-gesture-handler v2.27.x
- expo-blur (SDK 55)
- react-native-safe-area-context v5.x

### Backend & DB
- @supabase/supabase-js v2
- Supabase Auth (Google OAuth + Phone OTP)
- Supabase Storage (wardrobe-images bucket)
- Supabase Realtime (tryon job status)
- PostgreSQL via Supabase

### State
- zustand v5
- @tanstack/react-query v5

### AI (env vars, just stubs in Phase 1 where noted)
- GEMINI_API_KEY → Gemini 2.5 Flash (wardrobe tagging)
- FAL_API_KEY → fal.ai CatVTON (try-on, Phase 2)
- SUPABASE_URL, SUPABASE_ANON_KEY

## Folder Structure — MUST FOLLOW EXACTLY
app/
  (auth)/
    login.tsx
    onboarding.tsx          ← body photo capture screen
  (tabs)/
    inspo/
      index.tsx
    wardrobe/
      index.tsx
      add-item.tsx          ← camera + upload flow
    outfits/
      index.tsx
  _layout.tsx               ← root layout, auth gate
  +not-found.tsx

components/
  ui/                       ← rn-reusables base components
  wardrobe/
    ItemCard.tsx            ← wardrobe grid item
    CategoryFilter.tsx      ← filter bar (All/Tops/Bottoms/etc)
    AddItemSheet.tsx        ← bottom sheet: camera or gallery
  outfits/
    OutfitCard.tsx          ← AI suggestion card
    OccasionBadge.tsx
  inspo/
    InspoCard.tsx           ← trending look card
  shared/
    LoadingOverlay.tsx
    EmptyState.tsx

lib/
  supabase.ts               ← supabase client singleton
  gemini.ts                 ← gemini flash wrapper
  store/
    auth.store.ts           ← zustand auth state
    wardrobe.store.ts       ← wardrobe items state
    outfit.store.ts         ← outfit suggestions state

supabase/
  migrations/
    001_initial_schema.sql
  functions/
    tag-wardrobe-item/      ← Gemini 2.5 Flash vision tagger
    remove-bg/              ← rembg sidecar caller (stub in Phase 1)

types/
  wardrobe.ts
  outfit.ts
  user.ts

## Database Schema
-- profiles
id uuid PK (references auth.users)
name text
avatar_url text
body_photo_url text
skin_tone text
style_tags text[]
created_at timestamptz

-- wardrobe_items
id uuid PK
user_id uuid FK → profiles.id
image_url text           (original)
cutout_url text          (bg removed, nullable in Phase 1)
category text            (upper|lower|dress|shoes|bag|accessory)
sub_category text        (tshirt|shirt|jeans|shorts|sneakers etc)
colors text[]
style_tags text[]
occasion_tags text[]
fabric_guess text
created_at timestamptz

-- outfits
id uuid PK
user_id uuid FK → profiles.id
item_ids uuid[]
occasion text
ai_score float
cover_image_url text
vibe text
color_reasoning text
created_at timestamptz

## Design System — MUST FOLLOW
Color palette (Aesty-inspired, warm neutral):
  background: #F5F2EE   (warm off-white)
  surface: #FFFFFF
  text-primary: #1A1A1A
  text-secondary: #6B6B6B
  accent: #8B7355        (warm brown — matches Aesty's olive/brown)
  accent-light: #D4C5B0
  error: #C0392B
  success: #27AE60

Typography:
  headings: font-bold tracking-tight
  body: font-normal
  captions: font-light text-sm text-secondary

Corner radius: rounded-2xl for cards, rounded-full for pills/buttons
Shadows: subtle (shadow-sm), never heavy
Bottom tab bar: floating, rounded-full container (like Aesty screenshots)

## Screen Specs

### Tab 1 — Inspo
- Header: "Inspo" title + "Upload outfit" button (top right)
- Trending sections: each section has a title ("Leather Trench", etc.)
  and a horizontal scroll of InspoCards
- Each InspoCard: full image, "✦ Try On" button at bottom (disabled in Phase 1,
  shows "Coming Soon" toast)
- Data: hardcode 2-3 trending sections with placeholder images in Phase 1

### Tab 2 — Wardrobe
- Header: "Wardrobe" title
- If empty: EmptyState with 3 buttons:
    "Add item" (opens camera)
    "Search web" (placeholder toast)
    "✦ Add items from outfit" (placeholder toast)
- If has items: CategoryFilter bar + masonry/grid of ItemCards
- Categories: All | Tops | Bottoms | Dresses | Shoes | Bags | Accessories
- FAB or "+" button → AddItemSheet (bottom sheet)
- AddItemSheet: "Take photo" | "Choose from gallery" options
- After photo taken → calls Gemini 2.5 Flash to tag item
- Show loading state while tagging
- Item saved to Supabase → appears in grid

### Tab 3 — Outfits
- Header: "Outfits" + "Upload outfit" button
- If no wardrobe items: prompt to add items first
- If has items: scrollable outfit suggestion cards
- Each OutfitCard shows: item cutout images stacked, occasion badge,
  vibe label, "Try On" button (stub for Phase 2)
- AI generates suggestions using Gemini 2.5 Flash on demand
- "Refresh suggestions" pull-to-refresh

### Auth / Onboarding
- login.tsx: Google Sign-In + Phone OTP, warm minimal design
- onboarding.tsx: 
    Step 1: Name
    Step 2: Style preferences (chips: minimalist/streetwear/ethnic/formal/casual)
    Step 3: Body photo (expo-camera, guidance overlay, full-body)
    Step 4: Done → navigate to (tabs)

## API Integrations

### Gemini 2.5 Flash — Wardrobe Tagger
POST to: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
Input: base64 image + prompt
Prompt template:
  "You are a fashion AI. Analyze this clothing item photo and return ONLY valid JSON:
  {
    category: 'upper'|'lower'|'dress'|'shoes'|'bag'|'accessory',
    sub_category: string,
    colors: string[],
    style_tags: string[],
    occasion_tags: string[],
    fabric_guess: string
  }
  No markdown, no explanation, only JSON."

### Gemini 2.5 Flash — Outfit Suggestions
Input: wardrobe items summary + date + city weather
Prompt template:
  "You are an Indian fashion stylist. User has these wardrobe items: [ITEMS_JSON].
   Today: [DATE]. Weather: [WEATHER]. City: [CITY].
   Suggest 3 outfit combinations using ONLY items from the wardrobe.
   Return ONLY valid JSON array:
   [{
     item_ids: string[],
     occasion: string,
     vibe: string,
     color_reasoning: string,
     ai_score: number (0-1)
   }]"

### OpenMeteo — Weather (free, no key)
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode

## Environment Variables (.env.local)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_FAL_API_KEY=          # stub for Phase 2

## Code Standards
- All components: functional, typed with TypeScript interfaces
- No any types — use proper interfaces in types/
- All API calls: wrapped in React Query hooks (useQuery/useMutation)
- Errors: caught and shown via toast (expo-toast or simple Animated overlay)
- Loading states: every async operation shows a skeleton or spinner
- Images: always use expo-image (not Image from react-native)
- Tailwind classes: use className prop (nativewind), not StyleSheet.create
- NO inline styles unless absolutely necessary
- Reanimated v4 CSS-style animations for screen transitions and card mounts

## What NOT to build in Phase 1
- Virtual try-on (CatVTON) — stubs only, "Coming Soon" UI
- Background removal — upload original image, cutout_url = null for now
- Shopping links / SerpAPI integration
- Glasses AR — permanently removed from scope
- pgvector / embeddings — Postgres tag queries only
- Push notifications
- Go backend — Gemini called directly from Expo app via env key in Phase 1
  (Go backend comes in Phase 2 when try-on and bg removal are needed)
```

***

## Step 2: Supabase Migration File
Save as `supabase/migrations/001_initial_schema.sql` — agent should run this first:

```sql
-- Enable UUID
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  body_photo_url text,
  skin_tone text,
  style_tags text[] default '{}',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users own their profile"
  on profiles for all using (auth.uid() = id);

-- Wardrobe Items
create table wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  cutout_url text,
  category text not null
    check (category in ('upper','lower','dress','shoes','bag','accessory')),
  sub_category text,
  colors text[] default '{}',
  style_tags text[] default '{}',
  occasion_tags text[] default '{}',
  fabric_guess text,
  created_at timestamptz default now()
);
alter table wardrobe_items enable row level security;
create policy "Users own their wardrobe"
  on wardrobe_items for all using (auth.uid() = user_id);
create index on wardrobe_items(user_id, category);

-- Outfits
create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  item_ids uuid[] default '{}',
  occasion text,
  vibe text,
  color_reasoning text,
  ai_score float default 0.0,
  cover_image_url text,
  created_at timestamptz default now()
);
alter table outfits enable row level security;
create policy "Users own their outfits"
  on outfits for all using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
  values ('wardrobe-images', 'wardrobe-images', true);
create policy "Users upload their own images"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name)) [expo](https://expo.dev/changelog/sdk-55));
create policy "Public read wardrobe images"
  on storage.objects for select using (bucket_id = 'wardrobe-images');
```

***

## Step 3: Give This to the Agent

Paste this **exactly** into your oh-my-openagent session to kick off with Prometheus planning first, then full execution:

```
/start-work

I am building an India-first AI fashion stylist mobile app called StyleAI.
Full project context is in AGENTS.md at the project root — read it completely
before doing anything.

PHASE 1 TASK: Build the complete React Native Expo app for Phase 1 scope only.

SETUP ORDER (follow exactly):
1. Read AGENTS.md thoroughly
2. Run: npx create-expo-app@latest StyleAI --template tabs
3. Install ALL dependencies from the tech stack in AGENTS.md
4. Configure: nativewind v4 + tailwindcss v3.4, hermes v1 in app.json,
   New Architecture enabled, TypeScript strict mode
5. Run /init-deep to generate hierarchical AGENTS.md files
6. Build in this order:
   a. lib/supabase.ts client + types/
   b. Auth screens (login + onboarding 4 steps)
   c. Root layout with auth gate
   d. Tab navigation with custom floating tab bar
   e. Wardrobe screen + add item camera flow + Gemini tagging
   f. Inspo screen with hardcoded trending data
   g. Outfits screen with Gemini AI suggestions
   h. Shared components (EmptyState, LoadingOverlay, etc.)

DESIGN: Warm neutral palette as specified in AGENTS.md.
Aesty app screenshots are the visual reference — clean, minimal,
rounded cards, floating tab bar.

USE:
- Hephaestus for deep implementation of each screen
- visual-engineering category for all UI components
- After each screen: run lsp_diagnostics to check for TypeScript errors
- Commit after each completed screen with git-master

DO NOT build anything outside Phase 1 scope in AGENTS.md.
DO NOT install any packages not in the tech stack.
DO NOT use StyleSheet.create — use nativewind className only.
DO NOT use the built-in Image component — use expo-image everywhere.
```
