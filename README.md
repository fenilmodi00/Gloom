# StyleAI - India-First AI Fashion Stylist

<p align="center">
  <img src="https://img.shields.io/badge/Expo%20SDK-55-blue?style=flat-square&logo=expo" alt="Expo SDK 55" />
  <img src="https://img.shields.io/badge/React%20Native-0.83.1-blue?style=flat-square&logo=react" alt="React Native 0.83.1" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" alt="TypeScript 5.8" />
  <img src="https://img.shields.io/badge/Platform-Android%20First-orange?style=flat-square" alt="Android First" />
</p>

An India-first AI personal stylist app. Users photograph their clothes, build a digital wardrobe, and get AI-powered outfit suggestions powered by Gemini 2.5 Flash.

## Features

### Phase 1 (Current)
- **Inspo Tab** - Browse trending fashion looks with horizontal scrolling sections
- **Wardrobe Tab** - Upload clothing items via camera/gallery, auto-tagged with AI
- **Outfits Tab** - Get AI-generated outfit suggestions based on your wardrobe
- **Authentication** - Supabase Auth (Google OAuth + Phone OTP)
- **Onboarding** - Body photo capture for personalization

### What's Included
- Warm neutral design system (Aesty-inspired)
- NativeWind v4.1 for native-first styling
- Floating tab bar with frosted glass effect
- Gemini 2.5 Flash integration for wardrobe tagging and outfit suggestions
- Supabase backend (Auth, Storage, Database)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Expo SDK 55 |
| Runtime | React Native 0.83.1 |
| Language | TypeScript 5.8 (strict mode) |
| Routing | Expo Router v7 |
| Styling | NativeWind v4.1 + TailwindCSS v3.4 |
| State | Zustand v5 + React Query v5 |
| Backend | Supabase (Auth, Storage, PostgreSQL) |
| AI | Gemini 2.5 Flash |
| Animations | React Native Reanimated v4.1.0 |

## Project Structure

```
StyleAI/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                  # Auth screens
│   │   ├── login.tsx           # Google + Phone OTP login
│   │   └── onboarding.tsx      # 4-step onboarding flow
│   ├── (tabs)/                  # Main tab navigation
│   │   ├── inspo/              # Tab 1: Inspiration feed
│   │   ├── wardrobe/           # Tab 2: Wardrobe management
│   │   └── outfits/            # Tab 3: AI outfit suggestions
│   ├── _layout.tsx            # Root layout with auth gate
│   └── +not-found.tsx          # 404 handler
├── components/
│   ├── ui/                     # Base reusable components
│   ├── wardrobe/               # Wardrobe-specific components
│   │   ├── ItemCard.tsx
│   │   ├── CategoryFilter.tsx
│   │   └── AddItemSheet.tsx
│   ├── outfits/
│   │   ├── OutfitCard.tsx
│   │   └── OccasionBadge.tsx
│   ├── inspo/
│   │   └── InspoCard.tsx
│   └── shared/
│       ├── LoadingOverlay.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase.ts             # Supabase client singleton
│   ├── gemini.ts               # Gemini 2.5 Flash wrapper
│   └── store/                  # Zustand stores
│       ├── auth.store.ts
│       ├── wardrobe.store.ts
│       └── outfit.store.ts
├── types/                      # TypeScript interfaces
│   ├── wardrobe.ts
│   ├── outfit.ts
│   └── user.ts
├── supabase/
│   └── migrations/             # Database migrations
│       └── 001_initial_schema.sql
├── global.css                  # NativeWind global styles
├── tailwind.config.js          # Tailwind configuration
├── metro.config.js             # Metro bundler config
└── app.json                    # Expo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

```bash
# Clone the repository
cd StyleAI

# Install dependencies
npm install

# Start the development server
npx expo start

# Or with cache clear (recommended after config changes)
npx expo start -c
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase (required for auth and storage)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (required for wardrobe tagging and outfit suggestions)
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Fal.ai (Phase 2 - Virtual Try-On)
EXPO_PUBLIC_FAL_API_KEY=your-fal-api-key
```

### Running on Device

```bash
# Start Metro bundler
npx expo start

# On Android (USB debugging)
adb reverse tcp:8081 tcp:8081
npx expo start --android

# On iOS (macOS only)
npx expo start --ios

# Using Expo Go (scan QR code)
npx expo start
```

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| background | #F5F2EE | Main background (warm off-white) |
| surface | #FFFFFF | Cards, modals |
| text-primary | #1A1A1A | Headings, body text |
| text-secondary | #6B6B6B | Captions, hints |
| accent | #8B7355 | Buttons, active states (warm brown) |
| accent-light | #D4C5B0 | Borders, inactive states |
| error | #C0392B | Error states |
| success | #27AE60 | Success states |

### Typography

- Headings: `font-bold tracking-tight`
- Body: `font-normal`
- Captions: `font-light text-sm text-secondary`

### Component Guidelines

- Corner radius: `rounded-2xl` for cards, `rounded-full` for pills/buttons
- Shadows: `shadow-sm` (subtle), never heavy
- Bottom tab bar: floating, `rounded-full` container with frosted glass effect

## Database Schema

The app uses Supabase PostgreSQL with the following tables:

- **profiles** - User profiles (name, avatar, body photo, style preferences)
- **wardrobe_items** - User's clothing items with AI-generated tags
- **outfits** - AI-generated outfit suggestions

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## API Integrations

### Gemini 2.5 Flash - Wardrobe Tagger

Analyzes clothing photos and returns:
- category (upper|lower|dress|shoes|bag|accessory)
- sub_category, colors, style_tags, occasion_tags, fabric_guess

### Gemini 2.5 Flash - Outfit Suggestions

Generates outfit combinations based on:
- User's wardrobe items
- Current date and weather (via OpenMeteo)
- User's style preferences

### OpenMeteo (Free, No Key Required)

Weather API for outfit suggestions:
```
GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode
```

## Development Notes

### Current Status (March 2026)

- ✅ White screen bug fixed (auth deadlock, metro config, global.css import, nativewind preset)
- ✅ Auth bypassed for development (goes straight to main tabs)
- ⚠️ .env.local has placeholder values - replace with real Supabase/Gemini keys

### Recent Fixes Applied

1. **Auth Deadlock** - Extracted Supabase auth listener to run before loading gate
2. **Metro Config** - Enabled NativeWind v4's `withNativeWind()` wrapper
3. **Global CSS** - Changed from web-only IIFE to top-level import
4. **Tailwind Config** - Added `nativewind/preset`

### Known Limitations (Phase 1)

- Virtual try-on (CatVTON) - Stubbed with "Coming Soon"
- Background removal - Not implemented, uses original images
- No wardrobe item editing/deletion - Append-only
- No search functionality

## Troubleshooting

### White Screen on Launch

If you see a white screen after launching:
1. Clear Metro cache: `npx expo start -c`
2. Check `.env.local` has valid values
3. Verify metro.config.js is active (not .disabled)

### Expo Go Connection Issues

```bash
# Try LAN mode
npx expo start --lan

# Try tunnel mode (for firewalls)
npx expo start --tunnel

# Check for port conflicts
netstat -ano | findstr :8081
```

### TypeScript Errors

```bash
# Check for type errors
npx tsc --noEmit

# Or use Expo's built-in type checking
npx expo start --clear
```

## License

Private - All rights reserved

## Contributing

This is Phase 1 of the StyleAI project. For contribution guidelines, contact the development team.
