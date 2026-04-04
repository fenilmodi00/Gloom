# StyleAI / Gloom

An India-centric AI fashion app focusing on local brands and occasion wear like weddings and festivals.

## Tech Stack

### Frontend
- **Framework:** React Native via Expo (SDK 55), React 19.2, TypeScript 5.8
- **Routing:** Expo Router v7 (File-based routing)
- **State Management:** Zustand (Stores located in `lib/store/*.store.ts`)
- **Data Fetching:** `@tanstack/react-query`
- **Styling:** NativeWind (Tailwind CSS 3.4), `@gluestack-ui/themed`
- **UI Components:** `@shopify/flash-list`, `@gorhom/bottom-sheet`, `lucide-react-native`
- **Typography:** Custom typography system using Google Fonts (Bodoni Moda, Playfair Display, Cormorant Garamond, Instrument Sans, DM Sans)
- **Authentication/Backend Services:** Supabase (Google + Phone OTP)

### Backend
- **Framework:** Go (Fiber v2 HTTP Framework)
- **Database:** PostgreSQL (accessed via `pgx/v5` using raw SQL, directly connecting to Supavisor transaction pooler)
- **AI Integration:** Gemini 2.5 Flash API (via `lib/gemini.ts`) for wardrobe item tagging
- **Authentication:** `golang-jwt/v5` via HS256 and Supabase JWT tokens.

## Project Structure

```
StyleAI/
├── app/                    # Expo Router pages (file-based routing)
├── assets/                 # Static assets (images, fonts)
├── backend/                # Go Fiber API server
├── components/             # Reusable UI components
├── constants/              # Application constants (Typography, Themes)
├── lib/                    # Business logic & utilities
│   ├── store/              # Zustand stores
│   ├── hooks/              # Custom React hooks
│   ├── schemas/            # Zod validation schemas
│   └── api/                # API clients
├── types/                  # TypeScript type definitions
└── __tests__/              # Jest test suites
```

## Setup & Execution

### Prerequisites
- Node.js (v20+)
- Bun or npm
- Go 1.23+

### Frontend (Expo / React Native)

1. **Install dependencies:**
   ```bash
   bun install
   ```
2. **Start the development server:**
   ```bash
   bun run start
   ```
3. **Run on specific platforms:**
   ```bash
   bun run ios      # iOS Simulator
   bun run android  # Android Emulator
   bun run web      # Web version in browser
   ```

### Backend (Go)

Detailed backend documentation can be found in `backend/README.md`.

To run the backend server:
```bash
cd backend
make run
```

## Testing

The project uses Jest for frontend testing and Go's standard `testing` package for the backend.

### Frontend
```bash
bun run test
```
*Note: Always use `bun run test` to execute the Jest test suite correctly, as native `bun test` lacks full support for Jest features.*

### Backend
```bash
cd backend
make test
```

## Development Guidelines

- **Typography & Styling:** Exclusively use NativeWind `className` for styling. Do not use `StyleSheet.create` or inline styles. Typography is strictly enforced via semantic Tailwind classes.
- **State Management:** Data fetching in Zustand stores implements in-memory caching to optimize network calls.
- **AI Tagging:** The `EXPO_PUBLIC_GEMINI_API_KEY` environment variable is required for AI wardrobe item tagging.
- **API Communication:** Frontend API calls point to `EXPO_PUBLIC_BACKEND_URL` and must include an `Authorization: Bearer <token>` header for authenticated requests.

Please refer to `AGENTS.md` for more comprehensive architectural rules and code style guidelines.
