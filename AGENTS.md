# AGENTS.md for StyleAI

This document serves as the primary guide for AI agents operating within the StyleAI repository. It defines the operational environment, build processes, and coding standards to ensure consistency and quality across all contributions.

## 🛠 Build & Execution Commands

### General Development
- **Start Dev Server:** `npm run start` (or `npx expo start`)
- **Android Execution:** `npm run android` (or `npx expo run:android`)
- **iOS Execution:** `npm run ios` (or `npx expo run:ios`)
- **Web Execution:** `npm run web` (or `npx expo start --web`)
- **Prebuild/Native Setup:** `npx expo prebuild`

### Testing
- **Run All Tests:** `npm test` (Executes `jest`)
- **Watch Mode:** `npm run test:watch` (Executes `jest --watch`)
- **Single Test/Pattern:** `npx jest <<patternpattern>` (e.g., `npx jest src/hooks/useAuth.test.ts`)

### Linting & Formatting
- **Formatting:** Use Prettier. Run via editor integration or `npx prettier --write .`
- **Linting:** No dedicated lint scripts configured; rely on TypeScript compiler (`tsc`) for type-checking.

---

## 🎨 Code Style Guidelines

### 1. Imports
- **Absolute Imports:** ALWAYS use absolute imports with the `@/` prefix as configured in `tsconfig.json`.
  - ✅ `import { Button } from '@/components/ui/Button';`
  - ❌ `import { Button } from '../../components/ui/Button';`
- **Type-Only Imports:** Use `import type` for types to optimize build performance and avoid circular dependencies.
  - ✅ `import type { WardrobeItem } from '@/types/wardrobe';`

### 2. Naming Conventions
- **Components & Files:** PascalCase for React components and their corresponding files.
  - Example: `ItemCard.tsx`, `OutfitBoard.tsx`
- **Hooks:** camelCase with the `use` prefix.
  - Example: `useTabAnimation.ts`, `useAuth.ts`
- **Stores (Zustand):** camelCase with the `.store.ts` suffix.
  - Example: `auth.store.ts`, `wardrobe.store.ts`
- **Types & Interfaces:** PascalCase, exported from domain-specific files in the `types/` directory.
  - Example: `interface WardrobeItem { ... }` in `types/wardrobe.ts`
- **Constants:** UPPER_SNAKE_CASE for global constants.
  - Example: `THEME_COLORS`, `MAX_OUTFIT_SLOTS`

### 3. TypeScript Standards
- **Object Types:** Use `interface` for defining object structures.
- **Union/Alias Types:** Use `type` for unions, intersections, or simple aliases.
  - Example: `type Category = 'tops' | 'bottoms' | 'shoes';`
- **Strictness:** Avoid `as any` or `@ts-ignore`. Resolve type errors properly.

### 4. Error Handling & Validation
- **API Validation:** All external API responses MUST be validated using Zod schemas located in `lib/schemas/`.
- **Catch Blocks:** Never use empty `catch` blocks. Errors must be logged or handled.
- **User Feedback:** Communicate errors to the user via the `Toast` component/system.
  - Example: `showToast({ type: 'error', message: 'Failed to upload image' });`
- **Async Flow:** Wrap asynchronous operations in `try/catch` blocks to prevent app crashes.

### 5. Component Architecture
- **UI Components:** Keep shared UI elements in `components/shared/` or `components/ui/`.
- **Feature Components:** Group components by feature in `components/[feature-name]/`.
- **Logic Separation:** Extract complex logic into custom hooks in `lib/hooks/`.

---

## 🤖 Agentic Instructions
- **Pattern Adherence:** When creating new files, check existing files in the same directory to match the local style.
- **Verification:** After any implementation, run `npx jest` to ensure no regressions were introduced.
- **Minimalism:** Fix bugs minimally. Do not perform unsolicited refactors during a bug-fix task.
- **Documentation:** If a new architectural pattern is introduced, update this `AGENTS.md` file.
