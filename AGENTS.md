# AGENTS.md for StyleAI

This document serves as the primary guide for AI agents operating within the StyleAI repository. It defines the operational environment, build processes, and coding standards to ensure consistency and quality across all contributions.

## 📁 Project Structure

```
StyleAI/
├── app/                    # Expo Router pages (file-based routing)
│   └── (tabs)/            # Tab-based navigation structure
├── components/            # Reusable UI components
│   ├── shared/           # Cross-feature components
│   ├── ui/               # Base UI primitives
│   └── [feature]/        # Feature-specific components
├── lib/                   # Business logic & utilities
│   ├── store/            # Zustand stores (*.store.ts)
│   ├── hooks/            # Custom React hooks
│   ├── schemas/          # Zod validation schemas
│   ├── api/              # API clients & utilities
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
├── backend/               # Go Fiber API server
│   ├── cmd/server/       # Entry point (main.go)
│   └── internal/
│       ├── config/       # Configuration management
│       ├── db/           # Database connections & queries
│       ├── handlers/     # HTTP request handlers
│       ├── middleware/   # HTTP middleware (auth, cors)
│       ├── response/     # Response formatting helpers
│       └── services/     # Business logic services
└── __mocks__/            # Jest mock implementations
```

---

## 🛠 Build & Execution Commands

### Frontend (Expo/React Native)

| Command | Description |
|---------|-------------|
| `npm run start` | Start Expo dev server |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run web version |
| `npx expo prebuild` | Generate native project files |

### Testing (Frontend)

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npx jest <pattern>` | Run specific test file or pattern |
| `npx jest --coverage` | Run with coverage report |

**Example:** `npx jest src/hooks/useAuth.test.ts`

### Backend (Go)

| Command | Description |
|---------|-------------|
| `cd backend && go run ./cmd/server` | Run development server |
| `cd backend && go test ./...` | Run all Go tests |
| `cd backend && go test -v ./internal/handlers/...` | Run handler tests verbosely |
| `cd backend && go build -o server ./cmd/server` | Build production binary |

---

## 🎨 Code Style Guidelines

### 1. Imports

**Frontend (TypeScript/React):**
- **ALWAYS** use absolute imports with the `@/` prefix
- ✅ `import { Button } from '@/components/ui/Button';`
- ❌ `import { Button } from '../../components/ui/Button';`
- Use `import type` for types to avoid circular dependencies
- ✅ `import type { WardrobeItem } from '@/types/wardrobe';`

**Backend (Go):**
- Use standard Go import paths
- Group stdlib imports separately from external packages
- ✅ `import "fmt" / "net/http" / "github.com/gofiber/fiber/v2"`

### 2. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components/Files | PascalCase | `ItemCard.tsx`, `OutfitBoard.tsx` |
| Hooks | camelCase + `use` prefix | `useTabAnimation.ts`, `useAuth.ts` |
| Zustand Stores | camelCase + `.store.ts` | `auth.store.ts`, `wardrobe.store.ts` |
| Types/Interfaces | PascalCase | `interface WardrobeItem { ... }` |
| Constants | UPPER_SNAKE_CASE | `THEME_COLORS`, `MAX_OUTFIT_SLOTS` |
| Go Functions | PascalCase (exported) / camelCase (unexported) | `func HandleUpload()` / `func processItem()` |
| Go Files | snake_case | `rembg_handler.go`, `auth_middleware.go` |

### 3. TypeScript Standards

- Use `interface` for object structures
- Use `type` for unions, intersections, or aliases
- **NEVER** use `as any`, `@ts-ignore`, or `@ts-expect-error`
- Enable strict mode in tsconfig.json

### 4. Error Handling

**Frontend:**
- All API responses MUST be validated using Zod schemas in `lib/schemas/`
- NEVER use empty `catch` blocks
- Always show user feedback via Toast system
- Wrap async operations in try/catch

```typescript
try {
  const result = await apiCall();
} catch (error) {
  console.error('Operation failed:', error);
  showToast({ type: 'error', message: 'Failed to save item' });
}
```

**Backend (Go):**
- Use consistent error response format via `response/` package
- Log errors with appropriate levels (Info, Warn, Error)
- Return proper HTTP status codes

---

## 🧪 Testing Guidelines

### Frontend Testing

- Test files co-located with components: `Component.tsx` → `Component.test.tsx`
- Use `@testing-library/react-native` for component tests
- Mock Expo modules via `__mocks__/` directory
- Run `npm test` before commits to ensure no regressions

### Backend Testing

- Test files in same package: `handler.go` → `handler_test.go`
- Use `stretchr/testify` for assertions
- Run `go test ./...` before commits

---

## ⚠️ Critical Patterns

### UUID in React Native

**IMPORTANT:** The `uuid` package requires `crypto.getRandomValues()` which is not available in React Native by default. Use these alternatives:

1. **Use `react-native-uuid`:**
   ```bash
   npm install react-native-uuid
   ```
   ```typescript
   import uuid from 'react-native-uuid';
   const id = uuid.v4() as string;
   ```

2. **Or use Expo's Secure Store for random values**

Never use `crypto.getRandomValues()` directly in React Native code.

### Supabase Patterns

- Always use service role key for server-side operations
- Use client-side auth token for user-authenticated requests
- Implement Row Level Security (RLS) policies in database

---

## 🔒 Security Guidelines

- Never commit secrets to version control
- Use `.env` files for local development
- Validate all user inputs with Zod schemas
- Sanitize file uploads and external data
- Use parameterized queries (ORM handles this)

---

## 📦 Dependency Management

### Adding Frontend Dependencies

```bash
# Production dependency
npm install <package-name>

# Dev dependency
npm install -D <package-name>
```

### Adding Backend Dependencies

```bash
cd backend
go get github.com/package/name@v1.2.3
go mod tidy
```

---

## 🏗 Architecture Notes

### State Management

- Use **Zustand** for global state (stores in `lib/store/`)
- Use **React Query** (`@tanstack/react-query`) for server state
- Avoid prop drilling; use context for shared UI state

### Styling

- Use **NativeWind** (Tailwind CSS) for styling
- Create component variants with `tailwind-variants`
- Keep custom styles minimal; prefer utility classes

### Navigation

- Use **Expo Router** for file-based routing
- Routes defined in `app/` directory
- Use `(groups)` for tab/drawer layouts

---

## 🤖 Agentic Instructions

- **Pattern Adherence:** Check existing files in the same directory for local style
- **Verification:** Run tests before marking tasks complete
- **Minimalism:** Fix bugs minimally; avoid unsolicited refactors
- **Documentation:** Update this file when introducing new patterns

---

## 📋 Quick Reference

| Task | Command/Pattern |
|------|-----------------|
| Run frontend | `npm run start` |
| Run backend | `cd backend && go run ./cmd/server` |
| Run tests | `npm test` / `go test ./...` |
| Type check | `npx tsc --noEmit` |
| Add component | Create in `components/[feature]/` |
| Add store | Create in `lib/store/` with `.store.ts` suffix |
| Add type | Add to `types/` directory |
| Add API handler | Add to `backend/internal/handlers/` |