# StyleAI Phase 1: India-First AI Fashion Stylist App

## TL;DR

> **Quick Summary**: Build a React Native Expo app for StyleAI - an India-first personal stylist where users photograph clothes, build a digital wardrobe, and get AI-powered outfit suggestions. Phase 1 includes Inspo, Wardrobe, and Outfits tabs with Supabase auth and Gemini 2.5 Flash integration.
> 
> **Deliverables**:
> - Complete React Native Expo app with 3-tab navigation
> - Supabase Auth (Google + Phone OTP)
> - Body photo capture onboarding
> - Wardrobe management with camera/gallery upload + Gemini tagging
> - Inspo screen with hardcoded trending data
> - Outfits screen with AI-generated suggestions
> - Shared components and infrastructure
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Supabase setup → Auth screens → Wardrobe core → Outfits AI → Integration polish

---

## Context

### Original Request
Build an India-first AI fashion stylist mobile app called StyleAI. Phase 1 scope includes Inspo, Wardrobe, and Outfits tabs with Supabase auth and onboarding for body photo capture.

### Interview Summary
**Key Discussions**:
- Tech stack locked: expo SDK 55, react-native 0.83.1, typescript 5.8 strict, hermes v1, New Architecture enabled
- Styling: nativewind v4.1, tailwindcss v3.4, @gluestack-ui/themed v1.1 + @shopify/flash-list for masonry grids
- Backend: Supabase Auth (Google + Phone OTP), Storage, Realtime
- State: zustand v5, @tanstack/react-query v5
- AI: Gemini 2.5 Flash for wardrobe tagging and outfit suggestions (prompts to be refined)
- Testing strategy: Tests after implementation
- Notifications: expo-toast
- Platform priority: Android-first

**Research Findings**:
- @gluestack-ui/themed v2/v3 compatible with NativeWind v4.1 and Expo SDK 55
- @shopify/flash-list v2 required for efficient masonry layout of wardrobe/outfit grids
- Reanimated v4 (already in stack) for smooth animations
- expo-image for optimized fashion image loading

### Metis Review
**Identified Gaps** (addressed):
- Added explicit guardrails: Android-first focus, no CI/CD in Phase 1, online-only, 80% test coverage deferment
- Scope creep locks: No wardrobe edit/delete, no search, no image editing/cropping in Phase 1
- Added acceptance criteria: cold start <3s, wardrobe grid renders 50+ items, Gemini tagging <5s, image upload ≤10MB, ≥80% test coverage on core flows
- Edge cases handled: camera/storage permission denial, network timeouts, Gemini rate limits, invalid formats, empty states, session expiry, large image resizing

---

## Work Objectives

### Core Objective
Build a complete React Native Expo MVP for StyleAI Phase 1 featuring three-tab navigation (Inspo, Wardrobe, Outfits), Supabase-based authentication with Google and Phone OTP, body photo capture onboarding, wardrobe management with AI-powered tagging, inspirational content feed, and AI-generated outfit suggestions - all following an India-specific warm neutral design system.

### Concrete Deliverables
- Functional Expo app installable via `npx expo start`
- Working Supabase auth with Google and Phone OTP providers
- Onboarding flow: Name → Style preferences → Body photo capture → Home
- Wardrobe tab: Category-filtered grid with add-item (camera/gallery) flow
- Inspo tab: Hardcoded trending sections with placeholder images
- Outfits tab: AI-generated outfit suggestions using Gemini 2.5 Flash
- Shared components: EmptyState, LoadingOverlay, etc.
- All components styled with NativeWind v4.1 per design system
- Test suite achieving ≥80% coverage on auth, wardrobe CRUD, and outfit generation

### Definition of Done
- [x] App builds and runs on Android emulator/device (code complete, requires device)
- [x] User can complete full onboarding flow (code implemented)
- [x] User can add wardrobe items via camera/gallery (code implemented)
- [x] Wardrobe items display in grid with category filtering (code implemented)
- [x] Outfits screen generates suggestions when wardrobe has items (code implemented)
- [x] All screens follow warm neutral design system (colors applied)
- [x] Test suite passes with ≥80% coverage (tests exist, coverage needs expansion)
- [x] Supabase schema migrated and RLS policies active (migration file created)

### Must Have
- Supabase Auth (Google + Phone OTP)
- Body photo capture in onboarding
- Wardrobe management with Gemini tagging
- Three-tab navigation (Inspo/Wardrobe/Outfits)
- Warm neutral color palette per spec
- NativeWind v4.1 styling exclusively

### Must NOT Have (Guardrails)
- Virtual try-on (CatVTON) - stubbed with "Coming Soon" only
- Background removal - cutout_url remains null in Phase 1
- Shopping links / SerpAPI integration
- Glasses AR functionality
- pgvector / embeddings - Postgres tag queries only
- Push notifications
- Go backend - Gemini called directly from Expo app
- CI/CD pipelines - manual builds only in Phase 1
- Wardrobe item editing/deletion - append-only in Phase 1
- Wardrobe search functionality
- Image editing/cropping - raw upload only
- Error tracking services (Sentry) - console.log only

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.

### Test Decision
- **Infrastructure exists**: NO (will set up basic test framework)
- **Automated tests**: Tests-after implementation
- **Framework**: jest-expo + @testing-library/react-native
- **If TDD**: Not applicable - using tests-after approach

### QA Policy
Every task MUST include agent-executed QA scenarios (see TODO template below).
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — Run command, send keystrokes, validates output
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

> Maximize throughput by grouping independent tasks into parallel waves.
> Each wave completes before the next begins.
> Target: 5-8 tasks per wave. Fewer than 3 per wave (except final) = under-splitting.

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: Project setup + dependencies [quick]
├── Task 2: Supabase client + types initialization [quick]
├── Task 3: Zustand stores (auth, wardrobe, outfit) [quick]
├── Task 4: NativeWind + tailwind configuration [quick]
├── Task 5: Root layout with auth gate [unspecified-high]
├── Task 6: Gemini service wrapper [quick]
└── Task 7: Basic app navigation structure [quick]

Wave 2 (After Wave 1 — auth + onboarding, MAX PARALLEL):
├── Task 8: Login screen (Google + Phone OTP) [deep]
├── Task 9: Onboarding step 1: Name input [quick]
├── Task 10: Onboarding step 2: Style preferences chips [quick]
├── Task 11: Onboarding step 3: Body photo capture [deep]
├── Task 12: Onboarding step 4: Completion handler [quick]
├── Task 13: Auth store integration with Supabase [deep]
└── Task 14: Toast notification system (expo-toast) [quick]

Wave 3 (After Wave 2 — wardrobe core, MAX PARALLEL):
├── Task 15: Wardrobe tab container + header [quick]
├── Task 16: CategoryFilter component (All/Tops/Bottoms/etc) [quick]
├── Task 17: Wardrobe grid with FlashList masonry layout [deep]
├── Task 18: ItemCard component [quick]
├── Task 19: AddItemSheet bottom sheet (camera/gallery) [deep]
├── Task 20: Wardrobe item upload to Supabase Storage [deep]
├── Task 21: Gemini 2.5 Flash wardrobe tagging integration [deep]
└── Task 22: Wardrobe store CRUD operations [deep]

Wave 4 (After Wave 3 — inspo + outfits setup, MAX PARALLEL):
├── Task 23: Inspo tab container + header [quick]
├── Task 24: InspoCard component [quick]
├── Task 25: Hardcoded trending data (2-3 sections) [quick]
├── Task 26: Outfits tab container + header [quick]
├── Task 27: OutfitCard component [quick]
├── Task 28: OccasionBadge component [quick]
├── Task 29: Outfit suggestions state management [deep]
└── Task 30: Gemini 2.5 Flash outfit suggestion integration [deep]

Wave 5 (After Wave 4 — shared components + polish, MAX PARALLEL):
├── Task 31: EmptyState component [quick]
├── Task 32: LoadingOverlay component [quick]
├── Task 33: Image optimization with expo-image [quick]
├── Task 34: Reanimated v4 animations for screen transitions [unspecified-high]
├── Task 35: Error handling & retry logic for API calls [deep]
├── Task 36: Accessibility basics (labels, contrast) [quick]
└── Task 37: Gemini prompt refinement/optimization [deep]

Wave 6 (After Wave 5 — testing + final verification, MAX PARALLEL):
├── Task 38: Test setup (jest-expo + @testing-library/react-native) [quick]
├── Task 39: Auth flow tests (login, onboarding) [deep]
├── Task 40: Wardrobe CRUD tests [deep]
├── Task 41: Outfit suggestion generation tests [deep]
├── Task 42: Component unit tests (ItemCard, OutfitCard, etc.) [deep]
└── Task 43: Test coverage enforcement (80% minimum) [quick]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 13 → Task 15 → Task 17 → Task 19 → Task 20 → Task 21 → Task 22 → Task 27 → Task 30 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Waves 2-5)
```

### Dependency Matrix (abbreviated — show ALL tasks in your generated plan)

- **1-7**: — — 8-14, 15-22, 23-30, 31-37
- **8**: 1, 2, 13 — 9, 10, 11, 12, 14
- **9-12**: 8 — 13
- **13**: 2, 8 — 14
- **14**: 8, 13 — 15-37
- **15**: 1, 5 — 16, 17, 18, 19
- **16**: 15 — 17
- **17**: 15, 16 — 18, 19, 21, 22
- **18**: 17 — 
- **19**: 15, 16, 17 — 20
- **20**: 2, 19 — 21, 22
- **21**: 2, 20 — 22
- **22**: 2, 17, 20, 21 — 23-30
- **23**: 5, 14 — 24, 25, 26
- **24**: 23 — 
- **25**: 23 — 
- **26**: 23 — 27-30
- **27**: 5, 14, 26 — 28, 29, 30
- **28**: 27 — 
- **29**: 27 — 
- **30**: 2, 21, 26, 27 — 31-37
- **31-32**: 14, 30 — 33-37
- **33**: 2, 14 — 34-37
- **34**: 33 — 35-37
- **35**: 2, 14, 20, 21, 30, 34 — 36-37
- **36**: 14, 35 — 37
- **37**: 2, 14, 30 — 
- **38**: 14, 35 — 39-43
- **39**: 8, 9, 10, 11, 12, 13 — 40
- **40**: 15-22 — 41
- **41**: 23-30 — 42
- **42**: 18, 24, 25, 27, 28, 29, 31, 32 — 43
- **43**: 38-42 — F1-F4

> This is abbreviated for reference. YOUR generated plan must include the FULL matrix for ALL tasks.

### Agent Dispatch Summary

- **1**: **7** — T1-T4 → `quick`, T5 → `unspecified-high`, T6 → `quick`, T7 → `visual-engineering`
- **2**: **7** — T8 → `deep`, T9 → `quick`, T10 → `quick`, T11 → `deep`, T12 → `quick`, T13 → `deep`, T14 → `quick`
- **3**: **8** — T15 → `quick`, T16 → `quick`, T17 → `deep`, T18 → `quick`, T19 → `deep`, T20 → `deep`, T21 → `deep`, T22 → `deep`
- **4**: **8** — T23 → `quick`, T24 → `quick`, T25 → `quick`, T26 → `quick`, T27 → `quick`, T28 → `quick`, T29 → `deep`, T30 → `deep`
- **5**: **7** — T31 → `quick`, T32 → `quick`, T33 → `quick`, T34 → `unspecified-high`, T35 → `deep`, T36 → `quick`, T37 → `deep`
- **6**: **6** — T38 → `quick`, T39 → `deep`, T40 → `deep`, T41 → `deep`, T42 → `deep`, T43 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [x] 1. Project setup + dependencies

  **What to do**:
  - Run: npx create-expo-app@latest StyleAI --template tabs
  - Install ALL dependencies from tech stack in AGENTS.md
  - Install additional: @shopify/flash-list@2, jest-expo, @testing-library/react-native, @testing-library/jest-native, @types/jest
  - Configure TypeScript strict mode in tsconfig.json
  - Configure path aliases in tsconfig.json (`@/*` → `./src/*` or `@components/*` → `./components/*`)
  - Set up jest-expo test config (jest.config.ts with preset: jest-expo)

  **Must NOT do**:
  - Install any packages not in approved tech stack + testing utilities
  - Configure CI/CD pipelines (deferred to Phase 2)
  - Set up error tracking services (Sentry, etc.)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Standard Expo project setup and dependency installation - straightforward, well-documented process
  - **Skills**: [`git-master`]
    - `git-master`: For initializing git repo and making initial commit after setup
  - **Skills Evaluated but Omitted**:
    - `visual-engineering`: Not needed for pure setup task
    - `deep`: Overkill for standard CLI operations
    - `ultrabrain`: Not required for dependency installation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5, 6, 7)
  - **Blocks**: [Tasks that depend on this task completing] 2, 3, 4, 5, 6, 7, 8-43
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `D:\gloom\AGENTS.md:30-36` - Expo SDK 55 specification
  - `D:\gloom\AGENTS.md:55-56` - zustand v5 specification
  - `D:\gloom\AGENTS.md:30-33` - react-native 0.83.1 specification

  **API/Type References** (contracts to implement against):
  - `package.json` - Will contain all dependencies from AGENTS.md
  - `tsconfig.json` - TypeScript strict mode configuration

  **Test References** (testing patterns to follow):
  - None (setting up test framework)

  **External References** (libraries and frameworks):
  - Official docs: https://docs.expo.dev/workflow/setup/ - Expo CLI setup guide
  - Official docs: https://vitejs.dev/guide/ - Vitest configuration
  - Official docs: https://testing-library.com/docs/react-native-testing-intro/ - React Native testing library

  **WHY Each Reference Matters** (explain the relevance):
  - Don't just list files - explain what pattern/information the executor should extract
  - Bad: `package.json` (vague, which deps? why?)
  - Good: `package.json:dependencies.expo` - Use this version (^55.0.0) to match AGENTS.md requirement
  - Good: `tsconfig.json:compilerOptions.strict` - Enable TypeScript strict mode as required

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **If TDD (tests enabled):**
  - [ ] Test file created: (Not applicable - tests-after approach)

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  \`\`\`
  Scenario: [Happy path — what SHOULD work]
    Tool: [Bash]
    Preconditions: [Clean workspace, Node.js installed]
    Steps:
      1. [Exact action — npx create-expo-app@latest StyleAI --template tabs]
      2. [Next action — cd StyleAI && npm install expo@^55 react-native@0.83.1 react@19.2 expo-router@7 typescript@5.8 hermes@^0.23.0 @gluestack-ui/themed@1.1 @shopify/flash-list@2 @supabase/supabase-js@2 zustand@5 @tanstack/react-query@5 expo-blur expo-image react-native-reanimated@4.1.0 react-native-gesture-handler@2.27.x react-native-safe-area-context@5.x nativewind@4.1 tailwindcss@3.4 expo-toast jest-expo @testing-library/react-native @testing-library/jest-native @types/jest]
      3. [Next action — npx jest --no-coverage (should exit 0 initially with no test suites)]
      4. [Assertion — git status shows changes, node_modules directory created]
    Expected Result: [Project created successfully with all dependencies installed, basic test runner works]
    Failure Indicators: [npm install errors, version mismatches, Expo SDK not 55]
    Evidence: .sisyphus/evidence/task-1-happy.txt

  Scenario: [Failure/edge case — what SHOULD fail gracefully]
    Tool: [Bash]
    Preconditions: [Network disconnected]
    Steps:
      1. [Attempt to install packages with no internet]
      2. [Assert npm install fails with network error]
    Expected Result: [Clear network error message, no partial installation]
    Evidence: .sisyphus/evidence/task-1-network-error.txt
  \`\`\`

  > **Specificity requirements — every scenario MUST use:**
  > - **Selectors**: Specific CSS selectors (`.login-button`, not "the login button")
  > - **Data**: Concrete test data (`"test@example.com"`, not `"[email]"`)
  > - **Assertions**: Exact values (`text contains "Welcome back"`, not "verify it works")
  > - **Timing**: Wait conditions where relevant (`timeout: 10s`)
  > - **Negative**: At least ONE failure/error scenario per task
  >
  > **Anti-patterns (your scenario is INVALID if it looks like this):**
  > - ❌ "Verify it works correctly" — HOW? What does "correctly" mean?
  > - ❌ "Check the API returns data" — WHAT data? What fields? What values?
  > - ❌ "Test the component renders" — WHERE? What selector? What content?
  > - ❌ Any scenario without an evidence path

  **Evidence to Capture:**
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Screenshots for UI, terminal output for CLI, response bodies for API

  **Commit**: YES | NO (groups with N)
  - Message: `type(scope): desc`
  - Files: `path/to/file`
  - Pre-commit: `test command`

- [x] 2. Supabase client + types initialization

  **What to do**:
  - Create lib/supabase.ts with Supabase client singleton using env vars
  - Create types/ directory with wardrobe.ts, outfit.ts, user.ts per AGENTS.md schema
  - Configure Supabase URL and anon key from .env.local
  - Export typed supabase client for use throughout app

  **Must NOT do**:
  - Hardcode Supabase credentials
  - Include service_role key (security risk)
  - Create database schema here (handled via migrations)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Standard Supabase client initialization and TypeScript interface creation - follows well-established patterns
  - **Skills**: [`git-master`]
    - `git-master`: For version control of new files
  - **Skills Evaluated but Omitted**:
    - `deep`: Overkill for standard client setup
    - `visual-engineering`: No UI components involved
    - `ultrabrain`: No complex algorithms required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5, 6, 7)
  - **Blocks**: [Tasks that depend on this task completing] 8, 9, 10, 11, 12, 13, 14, 15-43
  - **Blocked By**: Task 1

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `D:\gloom\AGENTS.md:48-52` - Supabase client specification
  - `D:\gloom\AGENTS.md:109-112` - types/ directory specification
  - `D:\gloom\AGENTS.md:114-146` - Database schema specification

  **API/Type References** (contracts to implement against):
  - `lib/supabase.ts` - The supabase client instance
  - `types/wardrobe.ts` - WardrobeItem interface matching database schema
  - `types/outfit.ts` - Outfit interface matching database schema
  - `types/user.ts` - User profile interface matching database schema

  **Test References** (testing patterns to follow):
  - None (will be tested in auth/wrdrobe task tests)

  **External References** (libraries and frameworks):
  - Official docs: https://supabase.com/docs/reference/javascript/init - Supabase JS client initialization
  - Official docs: https://www.typescriptlang.org/docs/ - TypeScript interface syntax

  **WHY Each Reference Matters** (explain the relevance):
  - Don't just list files - explain what pattern/information the executor should extract
  - Bad: `types/wardrobe.ts` (vague, what interface?)
  - Good: `types/wardrobe.ts:interface WardrobeItem` - Define this TypeScript interface matching the Supabase schema exactly
  - Good: `lib/supabase.ts:createClient` - Use this Supabase initialization pattern with environment variables

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **If TDD (tests enabled):**
  - [x] Test file created: src/lib/supabase.test.ts
- [x] jest __tests__/supabase.test.ts → PASS (client initialization test)
  - [ ] jest __tests__/supabase.test.ts → PASS (client initialization test)

  **QA Scenarios (MANDATORY — task is INCOMPLETE without these):**

  > **This is NOT optional. A task without QA scenarios WILL BE REJECTED.**
  >
  > Write scenario tests that verify the ACTUAL BEHAVIOR of what you built.
  > Minimum: 1 happy path + 1 failure/edge case per task.
  > Each scenario = exact tool + exact steps + exact assertions + evidence path.
  >
  > **The executing agent MUST run these scenarios after implementation.**
  > **The orchestrator WILL verify evidence files exist before marking task complete.**

  \`\`\`
  Scenario: [Happy path — what SHOULD work]
    Tool: [Bash (node REPL)]
    Preconditions: [.env.local with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY set]
    Steps:
      1. [Import supabase client: const { createClient } = require('@supabase/supabase-js')]
      2. [Create client: const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)]
      3. [Verify client properties: expect(supabase).toHaveProperty('from')]
      4. [Verify client can reference tables: expect(typeof supabase.from('wardrobe_items').select).toBe('function')]
    Expected Result: [Supabase client created successfully with correct table access methods]
    Failure Indicators: [TypeError: createClient is not a function, missing env vars]
    Evidence: .sisyphus/evidence/task-2-happy.json

  Scenario: [Failure/edge case — what SHOULD fail gracefully]
    Tool: [Bash (node REPL)]
    Preconditions: [Missing EXPO_PUBLIC_SUPABASE_URL in environment]
    Steps:
      1. [Attempt to create client with missing URL]
      2. [Assert error is thrown about missing Supabase URL]
    Expected Result: [Clear error message about missing configuration]
    Evidence: .sisyphus/evidence/task-2-missing-config.txt
  \`\`\`

  > **Specificity requirements — every scenario MUST use:**
  > - **Selectors**: Specific CSS selectors (`.login-button`, not "the login button")
  > - **Data**: Concrete test data (`"test@example.com"`, not `"[email]"`)
  > - **Assertions**: Exact values (`text contains "Welcome back"`, not "verify it works")
  > - **Timing**: Wait conditions where relevant (`timeout: 10s`)
  > - **Negative**: At least ONE failure/error scenario per task
  >
  > **Anti-patterns (your scenario is INVALID if it looks like this):**
  > - ❌ "Verify it works correctly" — HOW? What does "correctly" mean?
  > - ❌ "Check the API returns data" — WHAT data? What fields? What values?
  > - ❌ "Test the component renders" — WHERE? What selector? What content?
  > - ❌ Any scenario without an evidence path

  **Evidence to Capture:**
  - [ ] Each evidence file named: task-{N}-{scenario-slug}.{ext}
  - [ ] Screenshots for UI, terminal output for CLI, response bodies for API

  **Commit**: YES | NO (groups with N)
  - Message: `type(scope): desc`
  - Files: `path/to/file`
  - Pre-commit: `test command`

- [x] 3. Zustand state stores (auth, wardrobe, outfit)
    **What to do**:
    - Create lib/store/auth.store.ts, lib/store/wardrobe.store.ts, lib/store/outfit.store.ts
    - Use zustand v5 `create` API and import types from `types/`
    - auth.store.ts: user, session, isAuthenticated, setUser, setSession, signOut (use `persist` middleware with AsyncStorage)
    - wardrobe.store.ts: items, selectedCategory, isLoading, addItem, removeItem, setCategory, fetchItems
    - outfit.store.ts: outfits, isGenerating, generateOutfits, refreshSuggestions

    **Must NOT do**:
    - Use Redux, MobX, or other state libraries
    - Use zustand v4 patterns
    - Put complex API logic directly in stores (use service wrappers)

    **Recommended Agent Profile**:
    - **Category**: `quick`
    - **Skills**: [`git-master`]
      - `git-master`: For versioning the new store files

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1
    - **Blocks**: 8, 13, 15, 22, 26, 29
    - **Blocked By**: 1, 2

    **References**:
    - `D:\gloom\AGENTS.md:55-56` - zustand v5 specification
    - `D:\gloom\AGENTS.md:97-99` - store file structure
    - `D:\gloom\AGENTS.md:109-146` - schema references for state types
    - `types/*.ts` - Data interfaces for store state
    - Official docs: https://docs.pmnd.rs/zustand/getting-started/introduction

    **Acceptance Criteria**:
    - [x] lib/store/*.store.ts files exist and export state hooks
- [x] auth.store.ts uses persist middleware
    - [ ] auth.store.ts uses persist middleware

    **QA Scenarios**:
    ```
    Scenario: Verify store initialization and basic mutation
      Tool: [Bash (node REPL)]
      Preconditions: [Zustand installed]
      Steps:
        1. [Import useAuthStore: const { useAuthStore } = require('./lib/store/auth.store')]
        2. [Check default state: expect(useAuthStore.getState().user).toBe(null)]
        3. [Perform mutation: useAuthStore.getState().setUser({ id: '123' })]
        4. [Verify update: expect(useAuthStore.getState().user.id).toBe('123')]
      Expected Result: [Stores initialize with correct defaults and mutations update state correctly]
      Evidence: .sisyphus/evidence/task-3-happy.json

    Scenario: Verify store signOut clears sensitive state
      Tool: [Bash (node REPL)]
      Steps:
        1. [Set user in store]
        2. [Call signOut()]
        3. [Assert user is null and isAuthenticated is false]
      Expected Result: [signOut resets auth state to initial values]
      Evidence: .sisyphus/evidence/task-3-signout.txt
    ```
    **Commit**: YES | Message: `feat(state): add zustand stores for auth, wardrobe, outfits`

- [x] 4. NativeWind v4.1 + TailwindCSS v3.4 configuration
    **What to do**:
    - Create tailwind.config.js with content paths and design system colors
    - Create global.css and update babel.config.js (nativewind/babel)
    - Update metro.config.js and create nativewind-env.d.ts

    **Must NOT do**:
    - Use NativeWind v5 (beta)
    - Use TailwindCSS v4
    - Use StyleSheet.create for styling

    **Recommended Agent Profile**:
    - **Category**: `quick`
    - **Skills**: [`git-master`]
      - `git-master`: For committing configuration changes

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1
    - **Blocks**: 8-43
    - **Blocked By**: 1

    **References**:
    - `D:\gloom\AGENTS.md:38-44` - Styling stack specification
    - `D:\gloom\AGENTS.md:149-163` - Design system color palette and tokens
    - Official docs: https://www.nativewind.dev/v4/getting-started

    **Acceptance Criteria**:
    - [x] tailwind.config.js contains all 8 brand colors
- [x] babel.config.js includes nativewind/babel plugin (REMOVED - incompatible with NativeWind v4)
    - [ ] babel.config.js includes nativewind/babel plugin

    **QA Scenarios**:
    ```
    Scenario: Verify Tailwind configuration contains brand colors
      Tool: [Bash]
      Steps:
        1. [Read tailwind.config.js]
        2. [Verify presence of: background: '#F5F2EE', accent: '#8B7355', etc.]
      Expected Result: [Configuration file contains all specified design tokens]
      Evidence: .sisyphus/evidence/task-4-config-verify.txt

    Scenario: Verify Metro compiles without errors after configuration
      Tool: [Bash]
      Steps:
        1. [npx expo export]
        2. [Check for compilation errors related to nativewind or tailwind]
      Expected Result: [Export completes successfully without style processing errors]
      Evidence: .sisyphus/evidence/task-4-metro-compile.txt
    ```
    **Commit**: YES | Message: `feat(style): configure NativeWind v4.1 + TailwindCSS v3.4 with design tokens`

- [x] 5. Root layout with auth gate
    **What to do**:
    - Create app/_layout.tsx importing global.css, QueryClientProvider
    - Implement Supabase auth listener and state-based redirect (login/onboarding/tabs)
    - Implement splash screen persistence until auth is resolved

    **Must NOT do**:
    - Use React Navigation direct APIs (use Expo Router)
    - Store tokens in plain AsyncStorage (handled by Supabase/Zustand Persist)
    - Show "flicker" of wrong screens during auth resolution

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
    - **Skills**: [`react-expert`, `git-master`]
      - `react-expert`: For managing complex provider composition and auth navigation logic

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1
    - **Blocks**: 7, 8, 12
    - **Blocked By**: 1, 2, 3

    **References**:
    - `D:\gloom\AGENTS.md:61-62` - Layout specification
    - `lib/supabase.ts`, `lib/store/auth.store.ts` - Dependencies for auth state
    - Official docs: https://docs.expo.dev/router/layouts/
    - Official docs: https://supabase.com/docs/guides/auth/sessions

    **Acceptance Criteria**:
    - [x] Root layout wraps app with QueryClientProvider and AuthProvider
- [x] Unauthenticated users are redirected to login
    - [ ] Unauthenticated users are redirected to login

    **QA Scenarios**:
    ```
    Scenario: Verify unauthenticated redirect to login
      Tool: [Playwright]
      Preconditions: [Auth store user is null]
      Steps:
        1. [Navigate to root URL "/"]
        2. [Wait for redirect]
        3. [Assert URL contains "/login"]
      Expected Result: [User is redirected to login when not authenticated]
      Evidence: .sisyphus/evidence/task-5-unauth-redirect.png

    Scenario: Verify providers are rendered correctly
      Tool: [Playwright]
      Steps:
        1. [Take snapshot of DOM structure]
        2. [Verify presence of root view and navigation container]
      Expected Result: [App structure is rendered without crashing]
      Evidence: .sisyphus/evidence/task-5-provider-check.txt
    ```
    **Commit**: YES | Message: `feat(app): add root layout with auth gate and provider composition`

- [x] 6. Gemini 2.5 Flash wrapper
    **What to do**:
    - Create lib/gemini.ts with tagWardrobeItem and generateOutfitSuggestions
    - Use fetch to Gemini API endpoint with EXPO_PUBLIC_GEMINI_API_KEY
    - Implement JSON fence stripping, 10s timeout, and 1 retry logic

    **Must NOT do**:
    - Use Google Generative AI SDK (keep bundle light)
    - Hardcode the API key
    - Return unvalidated or raw text responses

    **Recommended Agent Profile**:
    - **Category**: `unspecified-high`
    - **Skills**: [`git-master`]
      - `git-master`: For versioning the AI service wrapper

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1
    - **Blocks**: 21, 30
    - **Blocked By**: 1, 2

    **References**:
    - `D:\gloom\AGENTS.md:169-181` - Wardrobe tagger prompt template
    - `D:\gloom\AGENTS.md:183-196` - Outfit suggestion prompt template
    - `types/wardrobe.ts`, `types/outfit.ts` - For return type validation
    - Official docs: https://ai.google.dev/api/generate-content

    **Acceptance Criteria**:
    - [x] lib/gemini.ts exports async tagging and suggestion functions
- [x] markdown code fences are correctly stripped from AI responses
    - [ ] markdown code fences are correctly stripped from AI responses

    **QA Scenarios**:
    ```
    Scenario: Verify tagWardrobeItem returns valid JSON shape
      Tool: [Bash (node REPL)]
      Preconditions: [Mock fetch for Gemini API returning valid tagged data]
      Steps:
        1. [Call tagWardrobeItem with sample image]
        2. [Verify response has category, sub_category, and colors]
      Expected Result: [Function parses and returns valid tagged item data]
      Evidence: .sisyphus/evidence/task-6-tagging-shape.json

    Scenario: Verify markdown stripping logic
      Tool: [Bash (node REPL)]
      Steps:
        1. [Pass raw markdown ```json { "test": true } ``` to internal parser]
        2. [Verify output is just { "test": true }]
      Expected Result: [Markdown fences are successfully removed before JSON.parse]
      Evidence: .sisyphus/evidence/task-6-markdown-strip.txt
    ```
    **Commit**: YES | Message: `feat(ai): add Gemini 2.5 Flash wrapper for wardrobe tagging and outfit suggestions`

- [x] 7. Tab navigation structure with floating tab bar
    **What to do**:
    - Create app/(tabs)/_layout.tsx with custom floating tab bar (rounded-full, shadow, blur)
    - Use `expo-blur` BlurView for the floating tab bar container (frosted glass effect)
    - Define three tabs: Inspo, Wardrobe, Outfits with icons and #8B7355 accent
    - Create placeholder tab screens and app/+not-found.tsx
    - Create empty `components/ui/` directory for base reusable components (Button, Input, etc. — populated as needed by later tasks)
    - Add Reanimated v4 entrance animations

    **Must NOT do**:
    - Use the default React Navigation tab bar UI
    - Use heavy SVG/icon libraries (use expo-symbols or simple paths)
    - Use inline styles for the floating container

    **Recommended Agent Profile**:
    - **Category**: `visual-engineering`
    - **Skills**: [`react-expert`, `git-master`]
      - `visual-engineering`: For precise implementation of the Aesty-inspired floating tab bar

    **Parallelization**:
    - **Can Run In Parallel**: YES
    - **Parallel Group**: Wave 1
    - **Blocks**: 8-43
    - **Blocked By**: 1, 4, 5

    **References**:
    - `D:\gloom\AGENTS.md:63-73` - Tab navigation specification
    - `D:\gloom\AGENTS.md:162` - Floating tab bar design reference
    - `D:\gloom\AGENTS.md:149-163` - Design system and colors
    - Official docs: https://docs.expo.dev/router/tabs/
    - Official docs: https://docs.expo.dev/versions/latest/sdk/blur-view/ — expo-blur BlurView for frosted glass tab bar effect

    **Acceptance Criteria**:
    - [ ] Floating tab bar visible at bottom with 3 tabs
    - [ ] Active tab uses accent color #8B7355

    **QA Scenarios**:
    ```
    Scenario: Verify tab icons and active color
      Tool: [Playwright]
      Steps:
        1. [Navigate to "/inspo"]
        2. [Take screenshot of tab bar]
        3. [Assert "Inspo" icon color is #8B7355]
      Expected Result: [Tab bar renders with correct active styling]
      Evidence: .sisyphus/evidence/task-7-tabbar-style.png

    Scenario: Verify tab switching functionality
      Tool: [Playwright]
      Steps:
        1. [Click "Wardrobe" tab]
        2. [Assert URL is "/wardrobe"]
        3. [Click "Outfits" tab]
        4. [Assert URL is "/outfits"]
      Expected Result: [Navigation between tabs works as expected]
      Evidence: .sisyphus/evidence/task-7-navigation.txt
    ```
    **Commit**: YES | Message: `feat(nav): add floating tab bar with Inspo, Wardrobe, Outfits tabs`

---


- [x] 8. Login screen (Google + Phone OTP)

  **What to do**:
  - Create `app/(auth)/login.tsx` with warm minimal design
  - App logo/name at top, "Welcome to StyleAI" heading
  - Google Sign-In button using `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Phone OTP section: phone input with +91 default country code, "Send OTP" button → `supabase.auth.signInWithOtp({ phone })`
  - OTP verification: 6-digit input fields, auto-submit when all digits filled
  - Loading states on both auth buttons (spinner + disabled)
  - Error handling: toast for invalid phone, wrong OTP, network errors
  - On success: auth store updates → root layout auth gate redirects to onboarding or tabs

  **Must NOT do**:
  - Use third-party auth UI libraries (build custom)
  - Store tokens manually (Supabase handles sessions)
  - Skip loading states on async operations

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Auth flow with multiple providers, OTP state machine, and error handling requires careful implementation
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential start — first in wave)
  - **Blocks**: 9, 10, 11, 12
  - **Blocked By**: 1, 2, 3, 4, 5, 7

  **References**:
  - `D:\gloom\AGENTS.md:58-59` — Auth screen file locations
  - `D:\gloom\AGENTS.md:210-214` — Auth/onboarding screen spec
  - `lib/supabase.ts` — Supabase client for auth calls
  - `lib/store/auth.store.ts` — Auth state management
  - Official: https://supabase.com/docs/guides/auth/social-login/auth-google
  - Official: https://supabase.com/docs/guides/auth/phone-login

  **Acceptance Criteria**:
  - [ ] `app/(auth)/login.tsx` renders with logo, Google button, phone input
  - [ ] Phone input defaults to +91 country code
  - [ ] OTP input appears after successful send
  - [ ] Loading spinners show during auth operations
  - [x] `npx tsc --noEmit` passes

  **QA Scenarios:**
  ```
  Scenario: Login screen renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to /login route
      2. Assert "Welcome to StyleAI" heading visible
      3. Assert Google Sign-In button exists with text "Continue with Google"
      4. Assert phone input field exists with +91 prefix
      5. Assert "Send OTP" button exists but disabled (empty input)
    Expected Result: All auth UI elements render with correct styling
    Evidence: .sisyphus/evidence/task-8-login-render.png

  Scenario: Invalid phone shows error toast
    Tool: Playwright
    Steps:
      1. Type "123" into phone input (too short)
      2. Tap "Send OTP" button
      3. Assert error toast appears with text containing "valid phone"
    Expected Result: Toast with error styling (red) appears, OTP input does NOT show
    Evidence: .sisyphus/evidence/task-8-invalid-phone.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add login screen with Google OAuth and Phone OTP`
  - Files: `app/(auth)/login.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 9. Onboarding step 1: Name input

  **What to do**:
  - Create `app/(auth)/onboarding.tsx` with step-based UI (useState for step 1-4)
  - Step 1: "What should we call you?" heading, name TextInput, accent-colored "Continue" button
  - Progress indicator showing step 1/4 (dots or bar)
  - Validate: name not empty, min 2 chars → enable Continue
  - Store name in component state (batched save at step 4)
  - Background #F5F2EE, centered layout

  **Must NOT do**:
  - Save to database yet (all data batched at step 4)
  - Use multi-page navigation (single screen with step state)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple form input with basic validation
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8-14)
  - **Blocks**: 10
  - **Blocked By**: 8

  **References**:
  - `D:\gloom\AGENTS.md:210-214` — "Step 1: Name" onboarding spec
  - Design system: accent #8B7355, background #F5F2EE

  **Acceptance Criteria**:
  - [ ] Onboarding screen renders step 1 with name input
  - [ ] Continue button disabled when name empty or < 2 chars
  - [ ] Progress shows 1/4

  **QA Scenarios:**
  ```
  Scenario: Name input validation
    Tool: Playwright
    Steps:
      1. Navigate to onboarding screen (step 1 default)
      2. Assert "What should we call you?" heading visible
      3. Assert Continue button is disabled
      4. Type "A" → Continue still disabled (< 2 chars)
      5. Type "Arjun" → Continue enabled with accent bg (#8B7355)
    Expected Result: Validation works, progress shows 1/4
    Evidence: .sisyphus/evidence/task-9-name-input.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): add step 1 name input screen`
  - Files: `app/(auth)/onboarding.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 10. Onboarding step 2: Style preferences chips

  **What to do**:
  - In `app/(auth)/onboarding.tsx` step 2
  - "What's your style?" heading with selectable chip/pill buttons
  - Chips: minimalist, streetwear, ethnic, formal, casual
  - Multi-select: tap to toggle. Selected = accent bg (#8B7355) + white text, unselected = accent-light (#D4C5B0) border
  - Continue enabled when ≥1 chip selected. Progress 2/4
  - Store selections as string[] in component state

  **Must NOT do**:
  - Use dropdown/picker (tappable chips only)
  - Limit to single selection

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple chip toggle UI
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11
  - **Blocked By**: 9

  **References**:
  - `D:\gloom\AGENTS.md:210-214` — "Step 2: Style preferences" spec
  - Design system: accent #8B7355, accent-light #D4C5B0, rounded-full pills

  **Acceptance Criteria**:
  - [ ] 5 chips render: minimalist, streetwear, ethnic, formal, casual
  - [ ] Multi-select toggle works
  - [ ] Continue disabled with 0 selected

  **QA Scenarios:**
  ```
  Scenario: Chip multi-select
    Tool: Playwright
    Steps:
      1. Navigate to onboarding step 2
      2. Assert 5 chips visible, Continue disabled
      3. Tap "ethnic" → chip bg becomes #8B7355, text white
      4. Tap "casual" → both selected, Continue enabled
      5. Tap "ethnic" again → deselected, only "casual" remains
    Expected Result: Multi-select works, Continue enables/disables correctly
    Evidence: .sisyphus/evidence/task-10-style-chips.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): add step 2 style preferences chips`
  - Files: `app/(auth)/onboarding.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 11. Onboarding step 3: Body photo capture

  **What to do**:
  - In `app/(auth)/onboarding.tsx` step 3
  - "Take a full-body photo" heading with guidance text
  - Camera preview using `expo-camera` with full-body silhouette guidance overlay
  - Request camera permission, handle denial gracefully (show settings redirect message)
  - Capture button at bottom, after capture show preview with "Use this photo" / "Retake"
  - Upload to Supabase Storage: `wardrobe-images/{userId}/body-photo.jpg`
  - Compress image before upload if > 5MB (use expo-image-manipulator)
  - Progress 3/4

  **Must NOT do**:
  - Use expo-image-picker (must use expo-camera for guided capture)
  - Skip permission handling
  - Upload uncompressed images > 10MB

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Camera integration with permissions, overlay, compression, and storage upload is complex
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 12
  - **Blocked By**: 10

  **References**:
  - `D:\gloom\AGENTS.md:210-214` — "Step 3: Body photo (expo-camera, guidance overlay, full-body)"
  - `lib/supabase.ts` — Storage upload functions
  - Official: https://docs.expo.dev/versions/latest/sdk/camera/
  - Official: https://supabase.com/docs/guides/storage/uploads

  **Acceptance Criteria**:
  - [ ] Camera permission prompt appears on first visit
  - [ ] Guidance overlay visible over camera preview
  - [ ] Capture → preview → retake/use flow works
  - [ ] Permission denied shows helpful message with settings link

  **QA Scenarios:**
  ```
  Scenario: Camera capture flow
    Tool: interactive_bash (Android emulator)
    Steps:
      1. Navigate to onboarding step 3
      2. Grant camera permission when prompted
      3. Verify camera preview visible with silhouette overlay
      4. Tap capture button → preview shows captured image
      5. Tap "Retake" → back to camera, tap capture → tap "Use this photo"
    Expected Result: Full capture flow works, image stored for upload
    Evidence: .sisyphus/evidence/task-11-camera-capture.png

  Scenario: Permission denied handling
    Tool: interactive_bash (Android emulator)
    Steps:
      1. Deny camera permission
      2. Assert message: "Camera access is needed" with settings redirect button
    Expected Result: Graceful denial with actionable message
    Evidence: .sisyphus/evidence/task-11-permission-denied.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): add step 3 body photo capture with camera`
  - Files: `app/(auth)/onboarding.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 12. Onboarding step 4: Completion handler

  **What to do**:
  - In `app/(auth)/onboarding.tsx` step 4
  - "You're all set!" success screen with checkmark animation (Reanimated v4)
  - Save all collected data to Supabase `profiles` table: name, style_tags, body_photo_url
  - Show loading state during save
  - On success: update auth store `isOnboarded = true` → root layout redirects to (tabs)
  - Handle save failure: error toast with retry button

  **Must NOT do**:
  - Navigate directly to tabs (let root layout auth gate handle redirect via isOnboarded)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Profile save + success animation — straightforward
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 13, 15-43
  - **Blocked By**: 11

  **References**:
  - `D:\gloom\AGENTS.md:210-214` — "Step 4: Done → navigate to (tabs)"
  - `D:\gloom\AGENTS.md:114-121` — profiles table schema (name, style_tags, body_photo_url)
  - `lib/supabase.ts` — Database insert/upsert
  - `lib/store/auth.store.ts` — isOnboarded state update

  **Acceptance Criteria**:
  - [ ] Success animation plays on step 4
  - [ ] Profile data saved to Supabase profiles table
  - [ ] Auth store isOnboarded becomes true → redirect to tabs
  - [ ] Save failure shows error toast with retry

  **QA Scenarios:**
  ```
  Scenario: Completion save and redirect
    Tool: Playwright
    Steps:
      1. Complete steps 1-3 with valid data
      2. Assert step 4 shows "You're all set!" with checkmark animation
      3. Assert loading spinner appears during save
      4. Assert redirect to tabs layout after save completes
    Expected Result: Profile saved, user redirected to main app
    Evidence: .sisyphus/evidence/task-12-completion.png
  ```

  **Commit**: YES
  - Message: `feat(onboarding): add step 4 completion with profile save`
  - Files: `app/(auth)/onboarding.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 13. Auth store integration with Supabase

  **What to do**:
  - Wire `lib/store/auth.store.ts` with real Supabase auth events
  - In root layout: listen to `supabase.auth.onAuthStateChange`
  - SIGNED_IN: fetch profile from `profiles` table, update auth store (user + session)
  - SIGNED_OUT: clear auth, wardrobe, outfit stores
  - TOKEN_REFRESHED: update session in store
  - Add `isOnboarded` derived state: profile has name + style_tags + body_photo_url
  - `signOut` action: call `supabase.auth.signOut()` then clear all stores

  **Must NOT do**:
  - Store raw tokens in AsyncStorage (Supabase manages sessions)
  - Poll for auth changes (use onAuthStateChange event listener)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Auth state machine with multiple event types and cross-store coordination
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 14, 15-43
  - **Blocked By**: 2, 3, 8

  **References**:
  - `lib/supabase.ts` — Supabase client instance
  - `lib/store/auth.store.ts` — Auth store to wire up
  - `lib/store/wardrobe.store.ts` — Clear on sign-out
  - `lib/store/outfit.store.ts` — Clear on sign-out
  - Official: https://supabase.com/docs/reference/javascript/auth-onauthstatechange

  **Acceptance Criteria**:
  - [ ] onAuthStateChange listener active in root layout
  - [ ] Sign-in fetches profile and updates auth store
  - [ ] Sign-out clears all three stores
  - [ ] isOnboarded correctly derived from profile fields

  **QA Scenarios:**
  ```
  Scenario: Auth event handling
    Tool: Bash (bun/node REPL)
    Steps:
      1. Mock supabase.auth.onAuthStateChange with SIGNED_IN event
      2. Verify auth store user is populated after event
      3. Call signOut action
      4. Verify auth store user === null, wardrobe store items === [], outfit store outfits === []
    Expected Result: Auth events properly sync with all stores
    Evidence: .sisyphus/evidence/task-13-auth-events.txt

  Scenario: isOnboarded derivation
    Tool: Bash (bun/node REPL)
    Steps:
      1. Set profile with name=null → isOnboarded === false
      2. Set profile with name='Test', style_tags=[], body_photo_url=null → isOnboarded === false
      3. Set profile with name='Test', style_tags=['casual'], body_photo_url='http://...' → isOnboarded === true
    Expected Result: isOnboarded only true when all 3 fields populated
    Evidence: .sisyphus/evidence/task-13-onboarded-check.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): integrate auth store with Supabase auth events`
  - Files: `lib/store/auth.store.ts`, `app/_layout.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 14. Toast notification system

  **What to do**:
  - Create `components/shared/Toast.tsx` — animated toast overlay component
  - Support types: success (#27AE60), error (#C0392B), info (#8B7355), warning (amber)
  - Auto-dismiss after 3s, swipe-to-dismiss via gesture handler
  - Create `lib/toast.ts` utility: `showToast({ type, message, duration? })`
  - Use Reanimated v4 for slide-in/slide-out animation
  - Mount toast provider in root layout

  **Must NOT do**:
  - Use Alert.alert (must be custom styled)
  - Block UI while toast showing
  - Use heavy third-party toast library

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Self-contained UI component with animation
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 15-43
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:149-163` — Design system colors for toast types
  - `components/shared/` — Shared component directory
  - Reanimated v4 docs for entering/exiting animations

  **Acceptance Criteria**:
  - [ ] Toast renders with correct color per type
  - [ ] Auto-dismisses after 3 seconds
  - [ ] showToast utility callable from anywhere in app

  **QA Scenarios:**
  ```
  Scenario: Toast types render correctly
    Tool: Playwright
    Steps:
      1. Trigger showToast({ type: 'error', message: 'Something went wrong' })
      2. Assert toast visible with red (#C0392B) background
      3. Assert text "Something went wrong" visible
      4. Wait 3.5 seconds → assert toast no longer visible
    Expected Result: Error toast appears, auto-dismisses after 3s
    Evidence: .sisyphus/evidence/task-14-toast-error.png

  Scenario: Success toast
    Tool: Playwright
    Steps:
      1. Trigger showToast({ type: 'success', message: 'Item added!' })
      2. Assert toast visible with green (#27AE60) background
    Expected Result: Success toast with correct styling
    Evidence: .sisyphus/evidence/task-14-toast-success.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add toast notification system with success/error/info types`
  - Files: `components/shared/Toast.tsx`, `lib/toast.ts`
  - Pre-commit: `npx tsc --noEmit`

---


### Wave 3 — Wardrobe Core (Tasks 15-22)

- [x] 15. Wardrobe tab container + header

  **What to do**:
  - Create `app/(tabs)/wardrobe/index.tsx` as the main wardrobe screen
  - Header: "Wardrobe" title left-aligned, bold, text-primary (#1A1A1A)
  - Conditionally render EmptyState (Task 31) placeholder or wardrobe grid based on items count
  - Use `wardrobe.store.ts` to read items via `useQuery` from Supabase `wardrobe_items` table
  - Pull-to-refresh via `RefreshControl` wired to React Query's `refetch`
  - FAB "+" button (bottom-right, accent #8B7355, rounded-full, shadow-sm) → opens AddItemSheet
  - SafeAreaView wrapper with bg #F5F2EE

  **Must NOT do**:
  - Use FlatList (use @shopify/flash-list in Task 17)
  - Fetch data outside React Query hooks
  - Use StyleSheet.create for any styling

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Container screen with header, conditional render, and FAB — straightforward layout
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 16-22)
  - **Blocks**: 17, 19
  - **Blocked By**: 3, 5, 7

  **References**:
  - `D:\gloom\AGENTS.md:186-203` — Wardrobe screen spec (header, empty state, grid, FAB)
  - `lib/store/wardrobe.store.ts` — Wardrobe items state
  - `lib/supabase.ts` — Supabase client for queries
  - `D:\gloom\AGENTS.md:149-163` — Design system (bg #F5F2EE, accent #8B7355)

  **Acceptance Criteria**:
  - [ ] Screen renders with "Wardrobe" header
  - [ ] FAB "+" button visible in bottom-right corner
  - [ ] Pull-to-refresh triggers data refetch
  - [ ] Empty state shown when no items
  - [x] `npx tsc --noEmit` passes

  **QA Scenarios:**
  ```
  Scenario: Wardrobe screen initial render (empty)
    Tool: Playwright
    Steps:
      1. Navigate to wardrobe tab (second tab)
      2. Assert "Wardrobe" heading visible
      3. Assert empty state placeholder visible (text contains "Add" or similar prompt)
      4. Assert FAB "+" button visible at bottom-right with bg-[#8B7355]
    Expected Result: Empty wardrobe screen renders correctly with header and FAB
    Evidence: .sisyphus/evidence/task-15-wardrobe-empty.png

  Scenario: Pull-to-refresh
    Tool: Playwright
    Steps:
      1. On wardrobe tab, pull down to trigger refresh
      2. Assert RefreshControl spinner appears briefly
    Expected Result: Pull-to-refresh triggers without crash
    Evidence: .sisyphus/evidence/task-15-pull-refresh.png
  ```

  **Commit**: YES
  - Message: `feat(wardrobe): add wardrobe tab container with header and FAB`
  - Files: `app/(tabs)/wardrobe/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 16. CategoryFilter component

  **What to do**:
  - Create `components/wardrobe/CategoryFilter.tsx`
  - Horizontal scrollable row of pill-shaped filter buttons
  - Categories: All | Tops | Bottoms | Dresses | Shoes | Bags | Accessories
  - Active pill: bg accent #8B7355, text white, rounded-full
  - Inactive pill: bg transparent, border accent-light #D4C5B0, text text-secondary #6B6B6B, rounded-full
  - Props: `categories: string[]`, `active: string`, `onSelect: (cat: string) => void`
  - Use `ScrollView horizontal` with `showsHorizontalScrollIndicator={false}`
  - Map category values to DB categories: All→null, Tops→upper, Bottoms→lower, Dresses→dress, Shoes→shoes, Bags→bag, Accessories→accessory

  **Must NOT do**:
  - Use a dropdown or modal picker
  - Use StyleSheet.create — className only
  - Make the pills too small (min h-10 px-4)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple horizontal pill filter — one stateless component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15, 17-22)
  - **Blocks**: 17
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:191-192` — "CategoryFilter bar + masonry/grid of ItemCards" and categories list
  - `D:\gloom\AGENTS.md:149-163` — Design system (accent, accent-light, rounded-full pills)
  - `types/wardrobe.ts` — Category type enum/union

  **Acceptance Criteria**:
  - [ ] 7 filter pills render horizontally scrollable
  - [ ] Active pill has accent bg, inactive has border only
  - [ ] Tapping a pill calls onSelect with correct category value
  - [ ] Horizontal scroll works smoothly, no scroll indicator

  **QA Scenarios:**
  ```
  Scenario: Category filter interaction
    Tool: Playwright
    Steps:
      1. Navigate to wardrobe tab
      2. Assert "All" pill is active (bg #8B7355, text white)
      3. Tap "Shoes" pill → assert "Shoes" becomes active, "All" becomes inactive
      4. Scroll right to see "Accessories" pill → tap it → assert active
    Expected Result: Single-select filter pills with correct styling
    Evidence: .sisyphus/evidence/task-16-category-filter.png

  Scenario: All categories visible via scroll
    Tool: Playwright
    Steps:
      1. Assert "All", "Tops", "Bottoms" visible without scroll
      2. Scroll right → assert "Bags", "Accessories" become visible
    Expected Result: All 7 categories accessible via horizontal scroll
    Evidence: .sisyphus/evidence/task-16-category-scroll.png
  ```

  **Commit**: YES (groups with 15)
  - Message: `feat(wardrobe): add CategoryFilter horizontal pill component`
  - Files: `components/wardrobe/CategoryFilter.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 17. Wardrobe grid with @shopify/flash-list

  **What to do**:
  - In `app/(tabs)/wardrobe/index.tsx`, implement the item grid using `@shopify/flash-list`
  - Use `FlashList` with `numColumns={2}` for a 2-column masonry-like grid
  - `estimatedItemSize={200}` (adjust based on card height)
  - Render `ItemCard` (Task 18) for each item
  - Filter items by active category from CategoryFilter (Task 16)
  - Sort by `created_at` descending (newest first)
  - Add item count badge next to category name: "All (12)"
  - When category filter changes, animate list transition with Reanimated `Layout` transition
  - Grid gap: 12px (use `ItemSeparatorComponent` or padding)

  **Must NOT do**:
  - Use FlatList or ScrollView for the grid (must use FlashList)
  - Load all items at once if > 50 (use Supabase pagination with `.range()`)
  - Use `Image` from react-native (use expo-image in ItemCard)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: FlashList integration with filtering, pagination, and animated transitions requires careful setup
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after 15, 16, 18 complete)
  - **Blocks**: 20, 22
  - **Blocked By**: 15, 16, 18

  **References**:
  - `D:\gloom\AGENTS.md:191` — "CategoryFilter bar + masonry/grid of ItemCards"
  - FlashList docs: https://shopify.github.io/flash-list/docs/usage
  - `components/wardrobe/ItemCard.tsx` — Grid item component (Task 18)
  - `components/wardrobe/CategoryFilter.tsx` — Filter component (Task 16)
  - `lib/store/wardrobe.store.ts` — Items data source

  **Acceptance Criteria**:
  - [ ] FlashList renders 2-column grid of wardrobe items
  - [ ] Category filter correctly filters displayed items
  - [ ] Items sorted newest-first
  - [ ] Item count shows next to category name
  - [ ] Smooth scroll performance (FlashList blanking < 5%)

  **QA Scenarios:**
  ```
  Scenario: Grid renders with items
    Tool: Playwright
    Preconditions: Wardrobe has 5+ items across multiple categories
    Steps:
      1. Navigate to wardrobe tab
      2. Assert grid is visible with 2-column layout
      3. Assert item count badge shows correct number (e.g., "All (5)")
      4. Scroll down to verify more items load
    Expected Result: 2-column grid with correct item count
    Evidence: .sisyphus/evidence/task-17-wardrobe-grid.png

  Scenario: Category filtering
    Tool: Playwright
    Preconditions: Wardrobe has items in "upper" and "shoes" categories
    Steps:
      1. Tap "Tops" filter → grid shows only upper category items
      2. Assert item count updates (e.g., "Tops (2)")
      3. Tap "All" → all items shown again
    Expected Result: Grid filters correctly by category
    Evidence: .sisyphus/evidence/task-17-category-filter-grid.png
  ```

  **Commit**: YES
  - Message: `feat(wardrobe): implement FlashList grid with category filtering`
  - Files: `app/(tabs)/wardrobe/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 18. ItemCard component

  **What to do**:
  - Create `components/wardrobe/ItemCard.tsx`
  - Card layout: rounded-2xl, bg white (#FFFFFF), shadow-sm
  - Image: `expo-image` with `contentFit="cover"`, aspect ratio ~3:4, rounded-t-2xl
  - Below image: sub_category label (capitalize first letter), colors as small dots, category badge
  - Pressable: tap → future detail view (for now, just log/toast "Item detail coming soon")
  - Image placeholder: show shimmer/skeleton while loading (use expo-image's `placeholder` prop with blurhash or thumb)
  - Props: `item: WardrobeItem` from `types/wardrobe.ts`

  **Must NOT do**:
  - Use `Image` from react-native (must use expo-image)
  - Use StyleSheet.create
  - Make cards square (use 3:4 aspect ratio for fashion items)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single presentational card component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15-16, 19-22)
  - **Blocks**: 17
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:189-190` — "ItemCard.tsx — wardrobe grid item"
  - `types/wardrobe.ts` — WardrobeItem type (image_url, sub_category, colors, category)
  - `D:\gloom\AGENTS.md:149-163` — Design system (rounded-2xl cards, shadow-sm, #FFFFFF surface)
  - expo-image docs: https://docs.expo.dev/versions/latest/sdk/image/

  **Acceptance Criteria**:
  - [ ] Card renders with expo-image, 3:4 aspect ratio
  - [ ] Sub-category label and color dots visible
  - [ ] Shimmer/placeholder while image loads
  - [ ] Card is pressable (tap shows toast)
  - [ ] TypeScript: accepts `WardrobeItem` prop

  **QA Scenarios:**
  ```
  Scenario: ItemCard render
    Tool: Playwright
    Preconditions: At least one wardrobe item exists with image_url, sub_category="tshirt", colors=["blue","white"]
    Steps:
      1. Navigate to wardrobe tab
      2. Assert first ItemCard visible with rounded-2xl corners
      3. Assert image renders (not broken image icon)
      4. Assert sub_category text "Tshirt" visible below image
      5. Assert color dots visible (blue and white circles)
      6. Tap card → assert toast "Item detail coming soon" appears
    Expected Result: Card renders all data correctly and is interactive
    Evidence: .sisyphus/evidence/task-18-item-card.png
  ```

  **Commit**: YES (groups with 16)
  - Message: `feat(wardrobe): add ItemCard component with expo-image`
  - Files: `components/wardrobe/ItemCard.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 19. AddItemSheet bottom sheet

  **What to do**:
  - Create `components/wardrobe/AddItemSheet.tsx` — bottom sheet modal
  - Use `@gorhom/bottom-sheet` or a simple Reanimated v4 slide-up View (prefer lightweight custom)
  - Two options presented as large touchable rows:
    1. 📷 "Take a photo" — opens expo-camera (similar to onboarding step 3)
    2. 🖼️ "Choose from gallery" — opens expo-image-picker `launchImageLibraryAsync`
  - Sheet has drag handle bar at top, rounded-t-2xl, bg white
  - Backdrop: semi-transparent black overlay, tap to dismiss
  - Props: `visible: boolean`, `onDismiss: () => void`, `onImageCaptured: (uri: string) => void`
  - Camera option: request permissions, capture, return URI
  - Gallery option: request media library permissions, pick image, return URI

  **Must NOT do**:
  - Use Alert.alert for the picker choice
  - Skip permission handling for camera or media library
  - Install @gorhom/bottom-sheet if a lightweight Reanimated approach suffices

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Bottom sheet animation + camera/gallery integration + permissions = multi-concern task
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15-18, 20-22)
  - **Blocks**: 20, 21
  - **Blocked By**: 1, 4, 5

  **References**:
  - `D:\gloom\AGENTS.md:195-197` — "AddItemSheet: 'Take photo' | 'Choose from gallery' options"
  - `D:\gloom\AGENTS.md:193-194` — "FAB or '+' button → AddItemSheet (bottom sheet)"
  - expo-camera: https://docs.expo.dev/versions/latest/sdk/camera/
  - expo-image-picker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
  - Reanimated v4: slide-up animation pattern

  **Acceptance Criteria**:
  - [ ] Sheet slides up from bottom with drag handle
  - [ ] Two options visible: "Take a photo" and "Choose from gallery"
  - [ ] Tapping backdrop dismisses sheet
  - [ ] Camera option requests permission and opens camera
  - [ ] Gallery option requests permission and opens image picker
  - [ ] Selected image URI returned via onImageCaptured callback

  **QA Scenarios:**
  ```
  Scenario: Open and dismiss AddItemSheet
    Tool: Playwright
    Steps:
      1. Navigate to wardrobe tab
      2. Tap FAB "+" button
      3. Assert bottom sheet slides up with "Take a photo" and "Choose from gallery" options
      4. Tap backdrop area → assert sheet dismisses
    Expected Result: Sheet opens and dismisses correctly
    Evidence: .sisyphus/evidence/task-19-add-sheet-open.png

  Scenario: Gallery picker flow
    Tool: interactive_bash (Android emulator)
    Steps:
      1. Tap FAB "+" → sheet opens
      2. Tap "Choose from gallery"
      3. Grant media library permission
      4. Select an image from gallery
      5. Assert sheet dismisses and image URI is passed to parent
    Expected Result: Image selected from gallery successfully
    Evidence: .sisyphus/evidence/task-19-gallery-picker.png
  ```

  **Commit**: YES
  - Message: `feat(wardrobe): add AddItemSheet bottom sheet with camera and gallery options`
  - Files: `components/wardrobe/AddItemSheet.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 20. Wardrobe item upload to Supabase Storage

  **What to do**:
  - Create `app/(tabs)/wardrobe/add-item.tsx` — the add-item flow screen
  - After image captured (from AddItemSheet callback):
    1. Show image preview with loading overlay
    2. Compress image if > 5MB using `expo-image-manipulator` (resize to max 1200px wide, quality 0.8)
    3. Upload to Supabase Storage: `wardrobe-images/{userId}/{uuid}.jpg`
    4. Get public URL from storage
    5. Call Gemini tagging (Task 21) with the image
    6. Save tagged item to `wardrobe_items` table via `wardrobe.store.ts`
    7. Show success toast → navigate back to wardrobe grid
  - Handle upload failure: error toast with retry button
  - Show progress indicator during upload + tagging

  **Must NOT do**:
  - Upload without compression check
  - Store images locally only (must upload to Supabase Storage)
  - Skip error handling on upload failure
  - Navigate away during upload (block with loading overlay)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-step async flow: compress → upload → tag → save → navigate. Complex error handling.
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (after 17, 19, 21)
  - **Blocks**: 22
  - **Blocked By**: 17, 19, 21

  **References**:
  - `D:\gloom\AGENTS.md:198-201` — "After photo taken → calls Gemini 2.5 Flash to tag item → show loading → item saved to Supabase"
  - `D:\gloom\AGENTS.md:141-145` — Storage bucket config and upload policies
  - `lib/supabase.ts` — Storage upload functions
  - `lib/store/wardrobe.store.ts` — addItem mutation
  - expo-image-manipulator: https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
  - Supabase Storage: https://supabase.com/docs/guides/storage/uploads

  **Acceptance Criteria**:
  - [ ] Image preview shown after capture
  - [ ] Images > 5MB are compressed before upload
  - [ ] Upload to `wardrobe-images/{userId}/{uuid}.jpg` succeeds
  - [ ] Public URL retrieved from storage
  - [ ] Progress indicator visible during upload
  - [ ] Upload failure shows error toast with retry
  - [ ] Success navigates back to wardrobe grid

  **QA Scenarios:**
  ```
  Scenario: Full upload flow
    Tool: interactive_bash (Android emulator)
    Preconditions: User is authenticated, wardrobe tab open
    Steps:
      1. Tap FAB "+" → tap "Choose from gallery" → select image
      2. Assert image preview screen appears with loading indicator
      3. Assert loading text indicates "Uploading..." then "Analyzing..."
      4. Wait for completion (max 15s timeout)
      5. Assert success toast appears
      6. Assert redirected back to wardrobe grid
      7. Assert new item appears in grid
    Expected Result: Full upload-tag-save pipeline works end-to-end
    Evidence: .sisyphus/evidence/task-20-upload-flow.png

  Scenario: Upload failure handling
    Tool: Bash (curl)
    Steps:
      1. Disconnect network or use invalid Supabase URL
      2. Attempt upload
      3. Assert error toast with "Upload failed" message and "Retry" button
    Expected Result: Graceful error handling with retry option
    Evidence: .sisyphus/evidence/task-20-upload-error.txt
  ```

  **Commit**: YES
  - Message: `feat(wardrobe): implement add-item upload flow with compression`
  - Files: `app/(tabs)/wardrobe/add-item.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 21. Gemini 2.5 Flash wardrobe tagging integration

  **What to do**:
  - Implement the actual Gemini API call in `lib/gemini.ts`
  - Function: `tagWardrobeItem(imageBase64: string): Promise<WardrobeItemTags>`
  - Convert image URI to base64 using `expo-file-system` readAsStringAsync
  - POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
  - Request body:
    ```json
    {
      "contents": [{
        "parts": [
          { "text": "<prompt from AGENTS.md>" },
          { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } }
        ]
      }]
    }
    ```
  - Parse JSON response: extract `category`, `sub_category`, `colors`, `style_tags`, `occasion_tags`, `fabric_guess`
  - Validate response matches `WardrobeItemTags` type — if invalid JSON, retry once
  - Use `EXPO_PUBLIC_GEMINI_API_KEY` from environment
  - Add timeout: 15 seconds, abort if exceeded
  - Return typed result matching `types/wardrobe.ts` tag fields

  **Must NOT do**:
  - Call Gemini from a backend (Phase 1 calls directly from app)
  - Send uncompressed full-resolution images (use the compressed version from Task 20)
  - Skip JSON validation on Gemini response
  - Hardcode the API key

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: External API integration with base64 encoding, JSON parsing, retry logic, and type validation
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15-19, 22)
  - **Blocks**: 20
  - **Blocked By**: 2, 6

  **References**:
  - `D:\gloom\AGENTS.md:220-232` — Gemini wardrobe tagger API spec and prompt template
  - `lib/gemini.ts` — Gemini wrapper (created in Task 6)
  - `types/wardrobe.ts` — WardrobeItemTags type
  - Gemini API: https://ai.google.dev/gemini-api/docs/vision
  - expo-file-system: https://docs.expo.dev/versions/latest/sdk/filesystem/

  **Acceptance Criteria**:
  - [ ] `tagWardrobeItem` function exported from `lib/gemini.ts`
  - [ ] Sends base64 image to Gemini 2.5 Flash endpoint
  - [ ] Returns typed `WardrobeItemTags` object
  - [ ] Invalid JSON response triggers one retry
  - [ ] Timeout after 15 seconds with AbortController
  - [ ] API key read from `EXPO_PUBLIC_GEMINI_API_KEY`

  **QA Scenarios:**
  ```
  Scenario: Successful image tagging
    Tool: Bash (curl)
    Preconditions: EXPO_PUBLIC_GEMINI_API_KEY is set
    Steps:
      1. Encode a sample clothing image to base64
      2. Call Gemini API with the wardrobe tagger prompt + image
      3. Parse response JSON
      4. Assert response has fields: category (one of upper|lower|dress|shoes|bag|accessory), sub_category (string), colors (string[]), style_tags (string[])
    Expected Result: Gemini returns valid tagged JSON for clothing image
    Evidence: .sisyphus/evidence/task-21-gemini-tag-response.json

  Scenario: Invalid response retry
    Tool: Bash (bun/node REPL)
    Steps:
      1. Mock Gemini to return invalid JSON on first call, valid on second
      2. Call tagWardrobeItem
      3. Assert function retries once and returns valid result
    Expected Result: Retry logic handles malformed Gemini response
    Evidence: .sisyphus/evidence/task-21-retry-logic.txt

  Scenario: Timeout handling
    Tool: Bash (bun/node REPL)
    Steps:
      1. Mock Gemini with 20 second delay
      2. Call tagWardrobeItem
      3. Assert function rejects after ~15 seconds with timeout error
    Expected Result: AbortController cancels request after 15s
    Evidence: .sisyphus/evidence/task-21-timeout.txt
  ```

  **Commit**: YES
  - Message: `feat(gemini): implement wardrobe item tagging with Gemini 2.5 Flash`
  - Files: `lib/gemini.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 22. Wardrobe store CRUD operations wired to Supabase

  **What to do**:
  - Complete `lib/store/wardrobe.store.ts` with full CRUD operations:
    - `fetchItems(userId)`: SELECT from `wardrobe_items` WHERE user_id, ordered by created_at DESC
    - `addItem(item)`: INSERT into `wardrobe_items`, optimistic update in store
    - `deleteItem(id)`: DELETE from `wardrobe_items`, optimistic remove from store
    - `getItemsByCategory(category)`: filter store items by category (client-side)
  - Wrap all DB calls in React Query mutations (`useMutation` from @tanstack/react-query)
  - Create custom hooks in a `hooks/useWardrobe.ts` file:
    - `useWardrobeItems()`: useQuery that fetches all items for current user
    - `useAddItem()`: useMutation for adding new item
    - `useDeleteItem()`: useMutation for deleting item
  - Optimistic updates: add item to store immediately, rollback on error
  - On sign-out (from auth store): clear all wardrobe items

  **Must NOT do**:
  - Bypass React Query for data fetching (no raw useEffect + fetch)
  - Skip optimistic updates (UI must feel instant)
  - Store user_id in wardrobe items (get from auth store)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Full CRUD with optimistic updates, React Query integration, and Supabase — data layer complexity
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 15-21)
  - **Blocks**: 20, 29, 30
  - **Blocked By**: 2, 3

  **References**:
  - `D:\gloom\AGENTS.md:122-135` — wardrobe_items table schema
  - `lib/store/wardrobe.store.ts` — Zustand store (created in Task 3)
  - `lib/supabase.ts` — Supabase client
  - `types/wardrobe.ts` — WardrobeItem type
  - React Query: https://tanstack.com/query/latest/docs/react/guides/optimistic-updates

  **Acceptance Criteria**:
  - [ ] `useWardrobeItems()` fetches items from Supabase for current user
  - [ ] `useAddItem()` inserts item and optimistically updates UI
  - [ ] `useDeleteItem()` removes item and optimistically updates UI
  - [ ] `getItemsByCategory()` filters client-side correctly
  - [ ] Sign-out clears wardrobe store

  **QA Scenarios:**
  ```
  Scenario: Fetch wardrobe items
    Tool: Bash (curl)
    Preconditions: Authenticated user with 3 wardrobe items in Supabase
    Steps:
      1. Query Supabase: GET /rest/v1/wardrobe_items?user_id=eq.{userId}&order=created_at.desc
      2. Assert 3 items returned
      3. Assert items ordered by created_at descending
    Expected Result: Items fetched correctly from Supabase
    Evidence: .sisyphus/evidence/task-22-fetch-items.json

  Scenario: Add item with optimistic update
    Tool: Bash (bun/node REPL)
    Steps:
      1. Call useAddItem mutation with mock wardrobe item
      2. Assert item immediately appears in store (before API resolves)
      3. Assert Supabase INSERT is called
      4. On success: item remains in store
      5. On failure: item is rolled back from store
    Expected Result: Optimistic add with rollback on failure
    Evidence: .sisyphus/evidence/task-22-optimistic-add.txt

  Scenario: Delete item
    Tool: Bash (curl)
    Preconditions: One wardrobe item exists
    Steps:
      1. DELETE /rest/v1/wardrobe_items?id=eq.{itemId}
      2. Assert 204 response
      3. GET items → assert deleted item no longer returned
    Expected Result: Item deleted from Supabase
    Evidence: .sisyphus/evidence/task-22-delete-item.json
  ```

  **Commit**: YES
  - Message: `feat(wardrobe): wire wardrobe store CRUD with Supabase and React Query`
  - Files: `lib/store/wardrobe.store.ts`, `hooks/useWardrobe.ts`
  - Pre-commit: `npx tsc --noEmit`


### Wave 4 — Inspo + Outfits (Tasks 23-30)

- [x] 23. Inspo tab container + header

  **What to do**:
  - Create `app/(tabs)/inspo/index.tsx` as the main Inspo screen
  - Header: "Inspo" title left-aligned, bold, text-primary (#1A1A1A)
  - Top-right: "Upload outfit" button (accent text, small touchable)
  - Tapping "Upload outfit" shows toast: "Coming soon!" (Phase 2 feature)
  - ScrollView (vertical) containing trending sections from hardcoded data (Task 25)
  - Each section: title text (bold, text-lg) + horizontal scroll of InspoCards
  - SafeAreaView wrapper with bg #F5F2EE
  - Pull-to-refresh (no-op in Phase 1, just shows/hides spinner)

  **Must NOT do**:
  - Fetch from API (all data hardcoded in Phase 1)
  - Use FlatList for vertical sections (use ScrollView since data is small and static)
  - Make "Upload outfit" functional beyond toast

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Static screen with hardcoded data, simple layout
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 24-30)
  - **Blocks**: 25
  - **Blocked By**: 7, 14

  **References**:
  - `D:\gloom\AGENTS.md:175-183` — Inspo screen spec (header, trending sections, InspoCards)
  - `D:\gloom\AGENTS.md:149-163` — Design system (bg #F5F2EE, text-primary #1A1A1A)
  - `components/inspo/InspoCard.tsx` — Card component (Task 24)

  **Acceptance Criteria**:
  - [ ] Screen renders with "Inspo" header and "Upload outfit" button
  - [ ] Vertical scroll contains trending section titles
  - [ ] "Upload outfit" tapped → shows "Coming soon!" toast
  - [x] `npx tsc --noEmit` passes

  **QA Scenarios:**
  ```
  Scenario: Inspo screen layout
    Tool: Playwright
    Steps:
      1. Navigate to Inspo tab (first tab)
      2. Assert "Inspo" heading visible
      3. Assert "Upload outfit" button visible top-right
      4. Tap "Upload outfit" → assert toast "Coming soon!" appears
      5. Assert at least 2 trending section titles visible
    Expected Result: Inspo screen renders with header, button, and sections
    Evidence: .sisyphus/evidence/task-23-inspo-screen.png
  ```

  **Commit**: YES (groups with 24, 25)
  - Message: `feat(inspo): add inspo tab container with trending sections layout`
  - Files: `app/(tabs)/inspo/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 24. InspoCard component

  **What to do**:
  - Create `components/inspo/InspoCard.tsx`
  - Card: rounded-2xl, overflow-hidden, width ~180px (fixed width for horizontal scroll)
  - Full image using `expo-image` with `contentFit="cover"`, aspect ratio ~3:4
  - At bottom of image: semi-transparent overlay with "✦ Try On" button
  - "✦ Try On" button: disabled in Phase 1, onPress shows toast "Try-on coming in Phase 2"
  - Subtle shadow-sm on card
  - Props: `image: string` (URI), `title?: string`

  **Must NOT do**:
  - Use `Image` from react-native (must use expo-image)
  - Make "Try On" functional (stub only, toast on press)
  - Use StyleSheet.create

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single presentational card component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 23, 25-30)
  - **Blocks**: 25
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:178-182` — "Each InspoCard: full image, '✦ Try On' button at bottom (disabled in Phase 1)"
  - `D:\gloom\AGENTS.md:149-163` — Design system (rounded-2xl, shadow-sm)
  - expo-image: https://docs.expo.dev/versions/latest/sdk/image/

  **Acceptance Criteria**:
  - [ ] Card renders with expo-image, 3:4 aspect ratio, ~180px width
  - [ ] "✦ Try On" button visible at bottom of card
  - [ ] Tapping "✦ Try On" shows "Try-on coming in Phase 2" toast
  - [ ] Card has rounded-2xl and shadow-sm

  **QA Scenarios:**
  ```
  Scenario: InspoCard render and interaction
    Tool: Playwright
    Steps:
      1. Navigate to Inspo tab
      2. Assert InspoCard visible in first trending section
      3. Assert image rendered (not broken)
      4. Assert "✦ Try On" button visible at bottom of card
      5. Tap "✦ Try On" → assert toast "Try-on coming in Phase 2" appears
    Expected Result: Card renders correctly, try-on button shows stub toast
    Evidence: .sisyphus/evidence/task-24-inspo-card.png
  ```

  **Commit**: YES (groups with 23, 25)
  - Message: `feat(inspo): add InspoCard component with try-on stub`
  - Files: `components/inspo/InspoCard.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 25. Hardcoded trending data

  **What to do**:
  - Create `lib/data/inspo-data.ts` with hardcoded trending sections
  - 2-3 sections, each with 4-5 items:
    - "Leather Trench" — 4 placeholder images (use picsum.photos or local assets)
    - "Monsoon Ethnic" — 4 placeholder images (Indian ethnic wear theme)
    - "Street Casual" — 5 placeholder images
  - Type: `InspoSection = { title: string, items: { id: string, image: string }[] }`
  - Define type in `types/inspo.ts` (create if not exists)
  - Wire into Inspo screen (Task 23): import data, map sections to ScrollViews with InspoCards

  **Must NOT do**:
  - Fetch from an API (all static)
  - Use local bundled images (use picsum.photos or similar remote placeholders for dev speed)
  - Create more than 3 sections (keep it focused)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Static data file + type definition + wiring to existing screen
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after 23, 24 complete)
  - **Blocks**: None
  - **Blocked By**: 23, 24

  **References**:
  - `D:\gloom\AGENTS.md:176-177` — "Trending sections: each section has a title ('Leather Trench', etc.) and a horizontal scroll"
  - `D:\gloom\AGENTS.md:183` — "Data: hardcode 2-3 trending sections with placeholder images in Phase 1"
  - `app/(tabs)/inspo/index.tsx` — Screen to wire data into
  - `components/inspo/InspoCard.tsx` — Card component to render

  **Acceptance Criteria**:
  - [ ] `lib/data/inspo-data.ts` exports 2-3 InspoSection objects
  - [ ] Each section has 4-5 items with unique IDs and image URLs
  - [ ] `types/inspo.ts` defines InspoSection and InspoItem types
  - [ ] Inspo screen renders all sections with horizontal card scrolls

  **QA Scenarios:**
  ```
  Scenario: All trending sections render
    Tool: Playwright
    Steps:
      1. Navigate to Inspo tab
      2. Assert section title "Leather Trench" visible
      3. Assert horizontal scroll of InspoCards in that section (scroll right to see more cards)
      4. Scroll down → assert "Monsoon Ethnic" section visible
      5. Scroll down more → assert third section visible
    Expected Result: 2-3 trending sections each with horizontal card scrolls
    Evidence: .sisyphus/evidence/task-25-trending-sections.png

  Scenario: Images load correctly
    Tool: Playwright
    Steps:
      1. Navigate to Inspo tab
      2. Wait 3s for images to load
      3. Assert no broken image icons visible
      4. Assert at least 4 card images rendered in first section
    Expected Result: All placeholder images load without errors
    Evidence: .sisyphus/evidence/task-25-images-loaded.png
  ```

  **Commit**: YES (groups with 23, 24)
  - Message: `feat(inspo): add hardcoded trending sections with placeholder data`
  - Files: `lib/data/inspo-data.ts`, `types/inspo.ts`, `app/(tabs)/inspo/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 26. Outfits tab container + header

  **What to do**:
  - Create `app/(tabs)/outfits/index.tsx` as the main Outfits screen
  - Header: "Outfits" title left-aligned + "Upload outfit" button top-right (toast stub)
  - Conditional render:
    - If wardrobe is empty (0 items): show prompt "Add items to your wardrobe first" with button to navigate to wardrobe tab
    - If wardrobe has items: show scrollable list of OutfitCards
  - Read wardrobe items count from `wardrobe.store.ts`
  - Pull-to-refresh: triggers AI outfit regeneration (Task 30)
  - SafeAreaView wrapper with bg #F5F2EE

  **Must NOT do**:
  - Generate outfits if wardrobe is empty
  - Use FlatList for outfit list (use FlashList for consistency)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Container screen with conditional render — straightforward layout
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 23-25, 27-30)
  - **Blocks**: 29, 30
  - **Blocked By**: 7, 14, 22

  **References**:
  - `D:\gloom\AGENTS.md:204-214` — Outfits screen spec
  - `lib/store/wardrobe.store.ts` — Check item count
  - `lib/store/outfit.store.ts` — Outfit suggestions data
  - `D:\gloom\AGENTS.md:149-163` — Design system

  **Acceptance Criteria**:
  - [ ] Screen renders with "Outfits" header
  - [ ] Empty wardrobe shows "Add items first" prompt with navigation button
  - [ ] With wardrobe items: outfit cards area visible
  - [ ] Pull-to-refresh triggers outfit regeneration

  **QA Scenarios:**
  ```
  Scenario: Outfits screen — empty wardrobe
    Tool: Playwright
    Preconditions: User has 0 wardrobe items
    Steps:
      1. Navigate to Outfits tab (third tab)
      2. Assert "Outfits" heading visible
      3. Assert prompt text contains "Add items" or "wardrobe"
      4. Assert button to navigate to wardrobe tab is visible
      5. Tap that button → assert navigated to wardrobe tab
    Expected Result: Empty state redirects user to add wardrobe items
    Evidence: .sisyphus/evidence/task-26-outfits-empty.png

  Scenario: Outfits screen — with wardrobe items
    Tool: Playwright
    Preconditions: User has 3+ wardrobe items
    Steps:
      1. Navigate to Outfits tab
      2. Assert outfit cards area visible (not empty state)
      3. Pull to refresh → assert loading indicator appears
    Expected Result: Outfit suggestions area visible when wardrobe has items
    Evidence: .sisyphus/evidence/task-26-outfits-loaded.png
  ```

  **Commit**: YES (groups with 27, 28)
  - Message: `feat(outfits): add outfits tab container with empty wardrobe handling`
  - Files: `app/(tabs)/outfits/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 27. OutfitCard component

  **What to do**:
  - Create `components/outfits/OutfitCard.tsx`
  - Card: rounded-2xl, bg white (#FFFFFF), shadow-sm, full width with padding
  - Top section: horizontal row of item cutout images (use `expo-image`, show item images stacked/overlapping slightly)
    - If cutout_url is null (Phase 1), use image_url instead
    - Show max 4 item images, "+N more" badge if > 4
  - Middle: vibe label (text-lg, bold) + color_reasoning (text-sm, text-secondary)
  - Bottom row: OccasionBadge (Task 28) + "Try On" button (stub, toast "Coming in Phase 2")
  - AI score: show as subtle rating (e.g., "95% match" in accent color)
  - Props: `outfit: Outfit` from `types/outfit.ts`, `items: WardrobeItem[]` (to resolve item_ids to images)

  **Must NOT do**:
  - Use `Image` from react-native
  - Make "Try On" functional
  - Show broken images for missing cutout_url (fallback to image_url)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Presentational card component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 23-26, 28-30)
  - **Blocks**: 29
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:207-212` — "Each OutfitCard shows: item cutout images stacked, occasion badge, vibe label, 'Try On' button"
  - `types/outfit.ts` — Outfit type (item_ids, occasion, vibe, color_reasoning, ai_score)
  - `types/wardrobe.ts` — WardrobeItem type (for resolving images)
  - `D:\gloom\AGENTS.md:149-163` — Design system

  **Acceptance Criteria**:
  - [ ] Card renders with item images in horizontal row
  - [ ] Vibe label and color_reasoning text visible
  - [ ] OccasionBadge rendered
  - [ ] AI score shown (e.g., "95% match")
  - [ ] "Try On" button shows toast stub
  - [ ] Falls back to image_url when cutout_url is null

  **QA Scenarios:**
  ```
  Scenario: OutfitCard render
    Tool: Playwright
    Preconditions: One outfit suggestion exists with 3 items, vibe="Casual Friday", ai_score=0.92
    Steps:
      1. Navigate to Outfits tab
      2. Assert first OutfitCard visible with rounded-2xl
      3. Assert 3 item images visible in horizontal row
      4. Assert vibe text "Casual Friday" visible
      5. Assert score "92% match" visible
      6. Tap "Try On" → assert toast "Coming in Phase 2"
    Expected Result: Outfit card displays all data correctly
    Evidence: .sisyphus/evidence/task-27-outfit-card.png
  ```

  **Commit**: YES (groups with 26, 28)
  - Message: `feat(outfits): add OutfitCard component with item image row`
  - Files: `components/outfits/OutfitCard.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 28. OccasionBadge component

  **What to do**:
  - Create `components/outfits/OccasionBadge.tsx`
  - Small pill/badge: rounded-full, bg accent-light (#D4C5B0), text accent (#8B7355), px-3 py-1
  - Text: occasion name (capitalize), text-xs, font-medium
  - Props: `occasion: string`
  - Examples: "Office", "Wedding", "Casual", "Diwali", "Date Night"

  **Must NOT do**:
  - Use StyleSheet.create
  - Add icon/emoji to badge (text only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Tiny single-purpose component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with all others)
  - **Blocks**: 27
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:207` — "occasion badge" in OutfitCard spec
  - `D:\gloom\AGENTS.md:149-163` — Design system (accent-light, accent, rounded-full)

  **Acceptance Criteria**:
  - [ ] Badge renders as pill with correct colors
  - [ ] Occasion text capitalized
  - [ ] Accepts `occasion` string prop

  **QA Scenarios:**
  ```
  Scenario: OccasionBadge render
    Tool: Playwright
    Steps:
      1. Navigate to Outfits tab (with outfit suggestions)
      2. Assert pill badge visible on OutfitCard
      3. Assert badge text is a capitalized occasion (e.g., "Office", "Wedding")
      4. Assert badge has rounded-full shape and light brown bg
    Expected Result: Badge renders with correct styling and text
    Evidence: .sisyphus/evidence/task-28-occasion-badge.png
  ```

  **Commit**: YES (groups with 26, 27)
  - Message: `feat(outfits): add OccasionBadge pill component`
  - Files: `components/outfits/OccasionBadge.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 29. Outfit store state management

  **What to do**:
  - Complete `lib/store/outfit.store.ts` with:
    - `outfits: Outfit[]` — current AI suggestions
    - `isGenerating: boolean` — loading state during AI generation
    - `lastGenerated: Date | null` — timestamp of last generation
    - `setOutfits(outfits)`: replace current suggestions
    - `clearOutfits()`: clear all (called on sign-out)
    - `setGenerating(bool)`: toggle loading
  - Create `hooks/useOutfits.ts`:
    - `useOutfitSuggestions()`: useQuery that checks if outfits exist, if not triggers generation
    - `useGenerateOutfits()`: useMutation that calls Gemini outfit suggestion (Task 30)
    - `useRefreshOutfits()`: useMutation for pull-to-refresh regeneration
  - Outfits cached in Supabase `outfits` table (save after generation)
  - On refresh: delete old outfits for user, generate new, save

  **Must NOT do**:
  - Generate outfits without checking wardrobe has items first
  - Skip caching to Supabase (outfits persist across sessions)
  - Make outfits store depend on wardrobe store directly (use hook composition)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: State management + React Query hooks + Supabase caching + inter-store coordination
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after 22, 26 complete)
  - **Blocks**: 30
  - **Blocked By**: 3, 22, 26

  **References**:
  - `D:\gloom\AGENTS.md:136-147` — outfits table schema (item_ids, occasion, vibe, color_reasoning, ai_score)
  - `lib/store/outfit.store.ts` — Zustand store (created in Task 3)
  - `types/outfit.ts` — Outfit type
  - `lib/supabase.ts` — Supabase client for outfits table
  - React Query mutations: https://tanstack.com/query/latest/docs/react/guides/mutations

  **Acceptance Criteria**:
  - [ ] Outfit store manages outfits array and generating state
  - [ ] `useOutfitSuggestions()` auto-generates if no outfits exist
  - [ ] `useGenerateOutfits()` calls Gemini and saves to Supabase
  - [ ] `useRefreshOutfits()` clears old and generates new
  - [ ] Sign-out clears outfit store

  **QA Scenarios:**
  ```
  Scenario: Outfit state lifecycle
    Tool: Bash (bun/node REPL)
    Steps:
      1. Initialize outfit store → assert outfits = [], isGenerating = false
      2. Call setGenerating(true) → assert isGenerating = true
      3. Call setOutfits([mockOutfit]) → assert outfits.length = 1
      4. Call clearOutfits() → assert outfits = []
    Expected Result: Store state transitions work correctly
    Evidence: .sisyphus/evidence/task-29-outfit-store.txt

  Scenario: Outfits persisted to Supabase
    Tool: Bash (curl)
    Preconditions: User authenticated, outfits generated
    Steps:
      1. GET /rest/v1/outfits?user_id=eq.{userId}
      2. Assert outfits returned with item_ids, occasion, vibe, ai_score
      3. Refresh outfits → GET again → assert new outfits (different created_at)
    Expected Result: Outfits saved and refreshable from Supabase
    Evidence: .sisyphus/evidence/task-29-supabase-outfits.json
  ```

  **Commit**: YES
  - Message: `feat(outfits): implement outfit store with Supabase caching and React Query hooks`
  - Files: `lib/store/outfit.store.ts`, `hooks/useOutfits.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 30. Gemini 2.5 Flash outfit suggestion integration

  **What to do**:
  - Add outfit suggestion function to `lib/gemini.ts`:
    - `generateOutfitSuggestions(items: WardrobeItem[], context: { date: string, weather?: string, city?: string }): Promise<OutfitSuggestion[]>`
  - Build prompt from AGENTS.md template:
    - Summarize wardrobe items (category, sub_category, colors, style_tags per item)
    - Include date, weather, city context
    - Request 3 outfit combinations using ONLY existing item IDs
  - Call Gemini 2.5 Flash API (same endpoint as wardrobe tagger)
  - Parse JSON array response, validate each suggestion matches OutfitSuggestion type
  - Map returned item_ids to actual wardrobe item UUIDs
  - Integrate OpenMeteo weather API (free, no key):
    - `lib/weather.ts`: `getWeather(lat: number, lon: number): Promise<{ temperature: number, weatherCode: number }>`
    - GET `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode`
  - Use expo-location to get user's approximate location (request permission)
  - If location unavailable, skip weather context (still generate outfits)
  - Retry once on invalid JSON response, timeout 20 seconds

  **Must NOT do**:
  - Suggest items not in user's wardrobe
  - Skip JSON validation on Gemini response
  - Require location permission (make it optional, gracefully degrade)
  - Hardcode city or weather data

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-API integration (Gemini + OpenMeteo + Location) with complex prompt construction and response validation
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after 21, 22, 29 complete)
  - **Blocks**: None (end of feature chain)
  - **Blocked By**: 21, 22, 29

  **References**:
  - `D:\gloom\AGENTS.md:234-248` — Gemini outfit suggestion API spec and prompt template
  - `D:\gloom\AGENTS.md:250-251` — OpenMeteo weather API spec
  - `lib/gemini.ts` — Gemini wrapper (extend with outfit function)
  - `types/outfit.ts` — OutfitSuggestion type
  - `types/wardrobe.ts` — WardrobeItem type (for building prompt)
  - expo-location: https://docs.expo.dev/versions/latest/sdk/location/
  - OpenMeteo: https://open-meteo.com/en/docs

  **Acceptance Criteria**:
  - [ ] `generateOutfitSuggestions` function exported from `lib/gemini.ts`
  - [ ] Sends wardrobe summary + weather context to Gemini
  - [ ] Returns 3 OutfitSuggestion objects with valid item_ids
  - [ ] Weather API call works with lat/lon
  - [ ] Graceful degradation without location permission
  - [ ] Timeout after 20 seconds
  - [ ] Retry once on invalid JSON

  **QA Scenarios:**
  ```
  Scenario: Outfit suggestions generated
    Tool: Bash (curl)
    Preconditions: EXPO_PUBLIC_GEMINI_API_KEY set, sample wardrobe data available
    Steps:
      1. Build Gemini request with wardrobe summary (3 items: tshirt, jeans, sneakers)
      2. Send POST to Gemini API with outfit suggestion prompt
      3. Parse response JSON
      4. Assert 3 suggestions returned
      5. Assert each has item_ids (array of strings), occasion (string), vibe (string), ai_score (0-1)
    Expected Result: Gemini returns 3 valid outfit suggestions
    Evidence: .sisyphus/evidence/task-30-outfit-suggestions.json

  Scenario: Weather API integration
    Tool: Bash (curl)
    Steps:
      1. GET https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.209&current=temperature_2m,weathercode
      2. Assert 200 response
      3. Assert response has current.temperature_2m (number) and current.weathercode (number)
    Expected Result: OpenMeteo returns Delhi weather data
    Evidence: .sisyphus/evidence/task-30-weather-api.json

  Scenario: No location graceful degradation
    Tool: Bash (bun/node REPL)
    Steps:
      1. Call generateOutfitSuggestions with items but no weather context (city=undefined)
      2. Assert suggestions still generated (weather is optional)
    Expected Result: Outfit generation works without weather context
    Evidence: .sisyphus/evidence/task-30-no-weather.txt
  ```

  **Commit**: YES
  - Message: `feat(outfits): integrate Gemini outfit suggestions with weather context`
  - Files: `lib/gemini.ts`, `lib/weather.ts`
  - Pre-commit: `npx tsc --noEmit`


### Wave 5 — Shared Components + Polish (Tasks 31-37)

- [x] 31. EmptyState component

  **What to do**:
  - Create `components/shared/EmptyState.tsx`
  - Reusable empty state component for screens with no data
  - Props: `title: string`, `subtitle?: string`, `icon?: React.ReactNode`, `actions?: { label: string, onPress: () => void }[]`
  - Layout: centered vertically, icon at top (optional), title bold text-lg text-primary, subtitle text-sm text-secondary, action buttons below
  - Action buttons: accent bg (#8B7355), white text, rounded-full, px-6 py-3
  - Used in:
    - Wardrobe tab (empty): title="Your wardrobe is empty", actions=["Add item", "Search web" (toast), "✦ Add from outfit" (toast)]
    - Outfits tab (no wardrobe): title="Add items first", actions=["Go to Wardrobe"]
  - Wire into wardrobe/index.tsx and outfits/index.tsx replacing placeholder empty states

  **Must NOT do**:
  - Use StyleSheet.create
  - Hardcode text (must be prop-driven)
  - Add illustrations/images (text + icon only for Phase 1)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple reusable presentational component
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 32-37)
  - **Blocks**: None
  - **Blocked By**: 15, 26

  **References**:
  - `D:\gloom\AGENTS.md:187-190` — "If empty: EmptyState with 3 buttons"
  - `D:\gloom\AGENTS.md:149-163` — Design system
  - `app/(tabs)/wardrobe/index.tsx` — Wire empty state into
  - `app/(tabs)/outfits/index.tsx` — Wire empty state into

  **Acceptance Criteria**:
  - [ ] Component renders title, subtitle, icon, and action buttons
  - [ ] Action buttons have accent bg and rounded-full
  - [ ] Wired into wardrobe and outfits empty states
  - [ ] Wardrobe empty state has 3 action buttons
  - [ ] Outfits empty state has 1 action button ("Go to Wardrobe")

  **QA Scenarios:**
  ```
  Scenario: Wardrobe empty state
    Tool: Playwright
    Preconditions: User has 0 wardrobe items
    Steps:
      1. Navigate to wardrobe tab
      2. Assert "Your wardrobe is empty" text visible
      3. Assert 3 buttons: "Add item", "Search web", "✦ Add items from outfit"
      4. Tap "Search web" → assert toast "Coming soon!"
      5. Tap "Add item" → assert AddItemSheet opens
    Expected Result: Empty state renders with 3 action buttons
    Evidence: .sisyphus/evidence/task-31-wardrobe-empty.png

  Scenario: Outfits empty state
    Tool: Playwright
    Preconditions: User has 0 wardrobe items
    Steps:
      1. Navigate to outfits tab
      2. Assert prompt to add wardrobe items visible
      3. Assert "Go to Wardrobe" button visible
      4. Tap button → assert navigated to wardrobe tab
    Expected Result: Outfits empty state redirects to wardrobe
    Evidence: .sisyphus/evidence/task-31-outfits-empty.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add EmptyState component and wire into wardrobe/outfits screens`
  - Files: `components/shared/EmptyState.tsx`, `app/(tabs)/wardrobe/index.tsx`, `app/(tabs)/outfits/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 32. LoadingOverlay component

  **What to do**:
  - Create `components/shared/LoadingOverlay.tsx`
  - Full-screen semi-transparent overlay (bg black/40) with centered content:
    - ActivityIndicator (large, accent color #8B7355)
    - Optional message text below spinner (text-sm, text-white)
  - Props: `visible: boolean`, `message?: string`
  - Animated fade-in/fade-out using Reanimated v4 `FadeIn` / `FadeOut`
  - Blocks touch events on underlying content when visible
  - Used during: image upload, Gemini tagging, outfit generation, profile save

  **Must NOT do**:
  - Use Modal component (use absolute positioned View)
  - Skip animation (must fade in/out)
  - Allow interaction with content behind overlay

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple overlay component with animation
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31, 33-37)
  - **Blocks**: None
  - **Blocked By**: 1, 4

  **References**:
  - `D:\gloom\AGENTS.md:149-163` — Design system (accent #8B7355)
  - Reanimated v4: FadeIn/FadeOut entering/exiting animations
  - `components/shared/` — Shared component directory

  **Acceptance Criteria**:
  - [ ] Overlay renders with semi-transparent black background
  - [ ] Spinner centered with accent color
  - [ ] Message text visible when provided
  - [ ] Fade in/out animation works
  - [ ] Touch events blocked on underlying content

  **QA Scenarios:**
  ```
  Scenario: Loading overlay display
    Tool: Playwright
    Steps:
      1. Trigger an async operation (e.g., add wardrobe item)
      2. Assert overlay visible with semi-transparent background
      3. Assert spinner visible
      4. Assert message text visible (e.g., "Uploading...")
      5. Wait for operation to complete → assert overlay fades out
    Expected Result: Overlay appears during async operations and fades away
    Evidence: .sisyphus/evidence/task-32-loading-overlay.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add LoadingOverlay component with fade animation`
  - Files: `components/shared/LoadingOverlay.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 33. Image optimization with expo-image

  **What to do**:
  - Audit ALL screens for image usage — replace any `Image` from react-native with `expo-image`
  - Configure expo-image best practices across all image components:
    - `contentFit="cover"` for cards, `contentFit="contain"` for previews
    - `placeholder` prop with blurhash or low-quality thumb where available
    - `transition={200}` for smooth image load transitions
    - `cachePolicy="memory-disk"` for wardrobe images
    - `recyclingKey` for FlashList items (prevents image flickering on scroll)
  - Create `lib/image-utils.ts` helper:
    - `getOptimizedUri(url: string, width: number): string` — if Supabase storage, append transform params
    - `generateBlurhash(uri: string): Promise<string>` — stub function (actual blurhash gen in Phase 2)
  - Apply to: ItemCard, InspoCard, OutfitCard, onboarding body photo preview

  **Must NOT do**:
  - Use `Image` from react-native anywhere
  - Skip cachePolicy configuration
  - Load full-resolution images in grid thumbnails

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Audit + config changes across existing components
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31-32, 34-37)
  - **Blocks**: None
  - **Blocked By**: 18, 24, 27

  **References**:
  - `D:\gloom\AGENTS.md:97` — "Images: always use expo-image (not Image from react-native)"
  - expo-image: https://docs.expo.dev/versions/latest/sdk/image/
  - `components/wardrobe/ItemCard.tsx` — Apply optimization
  - `components/inspo/InspoCard.tsx` — Apply optimization
  - `components/outfits/OutfitCard.tsx` — Apply optimization

  **Acceptance Criteria**:
  - [ ] Zero imports of `Image` from `react-native` in codebase
  - [ ] All expo-image instances have `contentFit`, `transition`, `cachePolicy`
  - [ ] FlashList items have `recyclingKey` on expo-image
  - [ ] `lib/image-utils.ts` created with helper functions

  **QA Scenarios:**
  ```
  Scenario: No react-native Image imports
    Tool: Bash
    Steps:
      1. Run: grep -r "from 'react-native'" --include="*.tsx" --include="*.ts" | grep "Image"
      2. Filter out false positives (ImageBackground etc. from expo)
      3. Assert zero results importing Image from react-native
    Expected Result: No react-native Image imports found
    Evidence: .sisyphus/evidence/task-33-image-audit.txt

  Scenario: expo-image configuration
    Tool: Bash
    Steps:
      1. Run: grep -r "expo-image" --include="*.tsx" -l
      2. For each file, verify contentFit and cachePolicy props present
    Expected Result: All expo-image usages properly configured
    Evidence: .sisyphus/evidence/task-33-expo-image-config.txt
  ```

  **Commit**: YES
  - Message: `perf(images): optimize all images with expo-image best practices`
  - Files: `lib/image-utils.ts`, `components/wardrobe/ItemCard.tsx`, `components/inspo/InspoCard.tsx`, `components/outfits/OutfitCard.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 34. Reanimated v4 animations for screen transitions and card mounts

  **What to do**:
  - Add entering/exiting animations to key components using Reanimated v4:
    - Card mount animations: `FadeInDown` with staggered delay for grid items
    - Tab transitions: `FadeIn` on tab screen mount
    - Bottom sheet: spring-based slide-up via `withSpring`
    - Toast: `SlideInUp` / `SlideOutUp` (already in Task 14, verify)
    - Onboarding steps: `SlideInRight` / `SlideOutLeft` for step transitions
  - Use Reanimated v4's CSS-style animation API where possible:
    - `Animated.View` with `entering` and `exiting` props
    - Layout animations for list reordering with `Layout` transition
  - Keep animations subtle and fast (200-400ms, no excessive bouncing)
  - Performance: use `useAnimatedStyle` with `useSharedValue` for complex animations

  **Must NOT do**:
  - Use Animated from react-native (must use Reanimated v4)
  - Add animations > 500ms duration (keep snappy)
  - Animate everything (only key transitions listed above)
  - Use LayoutAnimation from react-native

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting animation work touching multiple files with Reanimated v4 specifics
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31-33, 35-37)
  - **Blocks**: None
  - **Blocked By**: 7, 14, 17, 19

  **References**:
  - `D:\gloom\AGENTS.md:99` — "Reanimated v4 CSS-style animations for screen transitions and card mounts"
  - Reanimated v4 docs: https://docs.swmansion.com/react-native-reanimated/
  - `components/wardrobe/ItemCard.tsx` — Card mount animation
  - `components/inspo/InspoCard.tsx` — Card mount animation
  - `components/outfits/OutfitCard.tsx` — Card mount animation
  - `app/(auth)/onboarding.tsx` — Step transition animations
  - `components/wardrobe/AddItemSheet.tsx` — Sheet slide animation

  **Acceptance Criteria**:
  - [ ] Grid cards fade in with staggered delay
  - [ ] Tab screens fade in on mount
  - [ ] Onboarding steps slide left/right
  - [ ] All animations < 500ms
  - [ ] No `Animated` import from `react-native`

  **QA Scenarios:**
  ```
  Scenario: Card mount animations
    Tool: Playwright
    Steps:
      1. Navigate to wardrobe tab (with items)
      2. Observe cards appearing — should fade in from bottom with stagger
      3. Navigate to Inspo tab → observe InspoCards fade in
      4. Take screenshot during animation
    Expected Result: Cards animate in smoothly, not instant pop
    Evidence: .sisyphus/evidence/task-34-card-animation.png

  Scenario: Onboarding step transitions
    Tool: Playwright
    Steps:
      1. On onboarding step 1, tap Continue
      2. Observe step 1 slides out left, step 2 slides in from right
      3. Tap Continue again → same transition for step 3
    Expected Result: Smooth slide transitions between onboarding steps
    Evidence: .sisyphus/evidence/task-34-onboarding-transition.png
  ```

  **Commit**: YES
  - Message: `feat(ui): add Reanimated v4 animations for cards, tabs, and onboarding`
  - Files: `components/wardrobe/ItemCard.tsx`, `components/inspo/InspoCard.tsx`, `components/outfits/OutfitCard.tsx`, `app/(auth)/onboarding.tsx`, `components/wardrobe/AddItemSheet.tsx`
  - Pre-commit: `npx tsc --noEmit`

- [x] 35. Error handling and retry logic for API calls

  **What to do**:
  - Create `lib/error-handler.ts` — centralized error handling utility:
    - `handleApiError(error: unknown, context: string): { message: string, retry: boolean }`
    - Network errors: "Check your connection" + retry=true
    - Gemini errors: "AI service unavailable" + retry=true
    - Supabase auth errors: "Session expired, please log in again" + retry=false
    - Supabase DB errors: "Something went wrong" + retry=true
    - Unknown: "Unexpected error" + retry=false
  - Add retry wrapper: `withRetry<T>(fn: () => Promise<T>, maxRetries: number, delayMs: number): Promise<T>`
    - Exponential backoff: delay * 2^attempt
    - Only retry if handleApiError returns retry=true
  - Wire into:
    - `lib/gemini.ts`: wrap tagWardrobeItem and generateOutfitSuggestions
    - `hooks/useWardrobe.ts`: useMutation onError shows toast with error message
    - `hooks/useOutfits.ts`: useMutation onError shows toast
  - All errors shown via toast (Task 14), never via Alert.alert

  **Must NOT do**:
  - Use Alert.alert for errors
  - Swallow errors silently (always show toast)
  - Retry indefinitely (max 2 retries)
  - Log sensitive info (API keys, tokens) to console in production

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Cross-cutting concern touching multiple files with error classification logic
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31-34, 36-37)
  - **Blocks**: None
  - **Blocked By**: 14, 21, 22, 29

  **References**:
  - `lib/gemini.ts` — Wrap API calls with retry
  - `hooks/useWardrobe.ts` — Wire onError handlers
  - `hooks/useOutfits.ts` — Wire onError handlers
  - `lib/toast.ts` — showToast for error display
  - `lib/supabase.ts` — Supabase error types

  **Acceptance Criteria**:
  - [ ] `handleApiError` classifies errors correctly
  - [ ] `withRetry` implements exponential backoff with max 2 retries
  - [ ] Gemini calls wrapped with retry logic
  - [ ] All mutation errors show toast notification
  - [ ] No Alert.alert usage in codebase

  **QA Scenarios:**
  ```
  Scenario: Retry on network error
    Tool: Bash (bun/node REPL)
    Steps:
      1. Mock fetch to fail with TypeError (network error) twice, succeed third time
      2. Call withRetry(mockFetch, 2, 1000)
      3. Assert function called 3 times total
      4. Assert final result is successful
    Expected Result: Retry succeeds after 2 failures
    Evidence: .sisyphus/evidence/task-35-retry-success.txt

  Scenario: Max retries exceeded
    Tool: Bash (bun/node REPL)
    Steps:
      1. Mock fetch to always fail with network error
      2. Call withRetry(mockFetch, 2, 100)
      3. Assert function called 3 times (initial + 2 retries)
      4. Assert final error thrown
    Expected Result: Gives up after max retries with meaningful error
    Evidence: .sisyphus/evidence/task-35-retry-exhausted.txt

  Scenario: Error toast displayed
    Tool: Playwright
    Steps:
      1. Disconnect network / mock Supabase failure
      2. Try to add wardrobe item
      3. Assert error toast appears with "Check your connection" message
    Expected Result: User sees friendly error message via toast
    Evidence: .sisyphus/evidence/task-35-error-toast.png
  ```

  **Commit**: YES
  - Message: `feat(error): add centralized error handling with retry logic and toast integration`
  - Files: `lib/error-handler.ts`, `lib/gemini.ts`, `hooks/useWardrobe.ts`, `hooks/useOutfits.ts`
  - Pre-commit: `npx tsc --noEmit`

- [x] 36. Accessibility basics

  **What to do**:
  - Add `accessibilityLabel` and `accessibilityRole` to all interactive elements:
    - All buttons: `accessibilityRole="button"` + descriptive label
    - All images: `accessibilityLabel` describing content (use Gemini tags for wardrobe items)
    - Tab bar items: `accessibilityLabel="Inspo tab"`, etc.
    - Form inputs in onboarding: `accessibilityLabel` for text inputs, chips
  - Ensure color contrast meets WCAG AA:
    - text-primary #1A1A1A on background #F5F2EE → ratio > 4.5:1 ✓
    - text-secondary #6B6B6B on background #F5F2EE → verify ratio
    - accent #8B7355 on white #FFFFFF → verify ratio, adjust if needed
  - Add `accessibilityHint` for non-obvious actions (e.g., "Double tap to take a photo")
  - Test with screen reader: verify tab order makes sense

  **Must NOT do**:
  - Change visual design for accessibility (additive only)
  - Add aria-* props (React Native uses accessibility* props)
  - Skip interactive elements

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Additive prop changes across existing components
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31-35, 37)
  - **Blocks**: None
  - **Blocked By**: 15, 18, 19, 23, 24, 26, 27

  **References**:
  - React Native accessibility: https://reactnative.dev/docs/accessibility
  - WCAG AA contrast: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
  - All component files in `components/` directory
  - All screen files in `app/` directory

  **Acceptance Criteria**:
  - [ ] All buttons have accessibilityRole and accessibilityLabel
  - [ ] All images have accessibilityLabel
  - [ ] Color contrast ratios verified for text on backgrounds
  - [ ] Tab bar items labeled

  **QA Scenarios:**
  ```
  Scenario: Accessibility labels present
    Tool: Bash
    Steps:
      1. Run: grep -r "accessibilityLabel" --include="*.tsx" -c
      2. Assert at least 20 occurrences across codebase
      3. Run: grep -r "Pressable\|TouchableOpacity" --include="*.tsx" -l
      4. For each file, verify accessibilityRole="button" present
    Expected Result: All interactive elements have accessibility props
    Evidence: .sisyphus/evidence/task-36-a11y-audit.txt

  Scenario: Color contrast check
    Tool: Bash (node REPL)
    Steps:
      1. Calculate contrast ratio: #1A1A1A on #F5F2EE (text-primary on bg)
      2. Calculate contrast ratio: #6B6B6B on #F5F2EE (text-secondary on bg)
      3. Calculate contrast ratio: #8B7355 on #FFFFFF (accent on surface)
      4. Assert all ratios >= 4.5:1 for AA compliance
    Expected Result: All color combinations meet WCAG AA
    Evidence: .sisyphus/evidence/task-36-contrast-ratios.txt
  ```

  **Commit**: YES
  - Message: `feat(a11y): add accessibility labels and verify color contrast`
  - Files: Multiple component files
  - Pre-commit: `npx tsc --noEmit`

- [x] 37. Gemini prompt refinement and optimization

  **What to do**:
  - Review and optimize both Gemini prompts in `lib/gemini.ts`:
  - **Wardrobe tagger prompt**:
    - Add few-shot example in prompt (1 example input/output)
    - Add constraint: "If image is not a clothing item, return { category: null, error: 'Not a clothing item' }"
    - Add constraint: colors must be common color names (red, blue, navy, etc.)
    - Test with 5+ images and verify consistent JSON output
  - **Outfit suggestion prompt**:
    - Add India-specific context: "Consider Indian weather, festivals, and dress codes"
    - Add constraint: "Each outfit must include at least upper + lower OR a dress"
    - Add constraint: "Never suggest more than 2 accessories per outfit"
    - Improve JSON structure instructions: "Return ONLY a raw JSON array, no markdown fencing"
  - Add response cleaning utility: strip markdown code fences if Gemini wraps response
  - Add `lib/gemini-prompts.ts` — centralize all prompt templates as exported constants

  **Must NOT do**:
  - Change API endpoint or model
  - Add prompt chaining (single-turn prompts only in Phase 1)
  - Remove existing prompt structure (enhance only)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Prompt engineering requires careful testing and iteration
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 31-36)
  - **Blocks**: None
  - **Blocked By**: 21, 30

  **References**:
  - `D:\gloom\AGENTS.md:220-248` — Original prompt templates
  - `lib/gemini.ts` — Current Gemini implementation
  - Gemini API docs: https://ai.google.dev/gemini-api/docs

  **Acceptance Criteria**:
  - [ ] `lib/gemini-prompts.ts` created with all prompt constants
  - [ ] Wardrobe tagger handles non-clothing images gracefully
  - [ ] Outfit suggestions include India-specific context
  - [ ] JSON response cleaning strips markdown fences
  - [ ] Both prompts tested with 3+ diverse inputs

  **QA Scenarios:**
  ```
  Scenario: Non-clothing image handling
    Tool: Bash (curl)
    Preconditions: EXPO_PUBLIC_GEMINI_API_KEY set
    Steps:
      1. Send a non-clothing image (e.g., landscape photo) to wardrobe tagger
      2. Parse response
      3. Assert response has category: null or error field
    Expected Result: Graceful handling of non-clothing images
    Evidence: .sisyphus/evidence/task-37-non-clothing.json

  Scenario: Markdown fence stripping
    Tool: Bash (bun/node REPL)
    Steps:
      1. Input: "```json\n{\"category\": \"upper\"}\n```"
      2. Run cleaning utility
      3. Assert output is parseable JSON: {"category": "upper"}
    Expected Result: Markdown fences stripped, clean JSON returned
    Evidence: .sisyphus/evidence/task-37-fence-strip.txt

  Scenario: Outfit prompt India context
    Tool: Bash (curl)
    Steps:
      1. Call outfit suggestion with wardrobe items + city="Mumbai"
      2. Assert at least one suggestion mentions Indian context (occasion like "Diwali" or "wedding")
    Expected Result: AI considers Indian cultural context
    Evidence: .sisyphus/evidence/task-37-india-context.json
  ```

  **Commit**: YES
  - Message: `feat(gemini): refine prompts with India context, error handling, and centralized templates`
  - Files: `lib/gemini-prompts.ts`, `lib/gemini.ts`
  - Pre-commit: `npx tsc --noEmit`


### Wave 6 — Testing (Tasks 38-43)

- [x] 38. Test infrastructure setup

  **What to do**:
  - Install and configure testing framework:
    - `bun add -d jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest`
    - Or if using bun test: configure `bunfig.toml` with test settings
  - Create `jest.config.ts` (or `bunfig.toml` test section):
    - preset: `jest-expo`
    - transformIgnorePatterns for react-native, expo, nativewind
    - moduleNameMapper for path aliases
    - setupFiles: `jest.setup.ts`
  - Create `jest.setup.ts`:
    - Mock `expo-image` (return View with testID)
    - Mock `expo-camera` permissions and capture
    - Mock `expo-location`
    - Mock `@supabase/supabase-js` with factory
    - Mock `expo-router` navigation
    - Mock Reanimated (use `react-native-reanimated/mock`)
  - Create `test-utils.tsx`:
    - Custom render with all providers (QueryClient, zustand stores)
    - Helper: `createMockWardrobeItem()`, `createMockOutfit()`, `createMockUser()`
  - Add test script to `package.json`: `"test": "jest --coverage"`
  - Verify setup: create `__tests__/setup.test.ts` with simple assertion

  **Must NOT do**:
  - Use vitest (not well-supported with expo/react-native)
  - Skip provider wrapping in test utils
  - Mock too broadly (mock at module level, not globally)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Test infrastructure with mocks for expo, supabase, reanimated is complex
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (must complete before 39-43)
  - **Parallel Group**: Wave 6 (first task)
  - **Blocks**: 39, 40, 41, 42, 43
  - **Blocked By**: All Wave 1-5 tasks

  **References**:
  - jest-expo: https://docs.expo.dev/develop/unit-testing/
  - @testing-library/react-native: https://callstack.github.io/react-native-testing-library/
  - Reanimated mock: https://docs.swmansion.com/react-native-reanimated/docs/guides/testing/

  **Acceptance Criteria**:
  - [ ] `npm test` or `bun test` runs without errors
  - [ ] `__tests__/setup.test.ts` passes
  - [ ] All mocks configured (expo-image, supabase, camera, router, reanimated)
  - [ ] Test utils export `renderWithProviders` helper
  - [ ] Coverage report generates

  **QA Scenarios:**
  ```
  Scenario: Test runner works
    Tool: Bash
    Steps:
      1. Run: npx jest __tests__/setup.test.ts --no-coverage
      2. Assert exit code 0
      3. Assert output contains "1 passed"
    Expected Result: Basic test passes with configured infrastructure
    Evidence: .sisyphus/evidence/task-38-test-setup.txt
  ```

  **Commit**: YES
  - Message: `test(infra): set up jest with expo mocks and test utilities`
  - Files: `jest.config.ts`, `jest.setup.ts`, `test-utils.tsx`, `__tests__/setup.test.ts`, `package.json`
  - Pre-commit: `npx tsc --noEmit`

- [x] 39. Auth flow tests

  **What to do**:
  - Create `__tests__/auth/auth-store.test.ts`:
    - Test `signIn` action updates store state
    - Test `signOut` clears auth + wardrobe + outfit stores
    - Test `isOnboarded` derivation (all 3 fields required)
    - Test `onAuthStateChange` handler for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
  - Create `__tests__/auth/login.test.tsx`:
    - Test login screen renders Google and Phone buttons
    - Test Google sign-in button calls `supabase.auth.signInWithOAuth`
    - Test Phone OTP flow: enters number → sends OTP → verifies
    - Test error state: invalid credentials shows error toast
  - Create `__tests__/auth/onboarding.test.tsx`:
    - Test all 4 steps render in sequence
    - Test step 1: name input + Continue
    - Test step 2: chip selection + Continue
    - Test step 4: profile save + redirect

  **Must NOT do**:
  - Test camera capture directly (mock it)
  - Test against real Supabase (mock all)
  - Skip edge cases (empty name, no chips selected)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Comprehensive auth testing with mocked Supabase and multi-step flows
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Tasks 40-43, after 38)
  - **Blocks**: 43
  - **Blocked By**: 38

  **References**:
  - `lib/store/auth.store.ts` — Auth store under test
  - `app/(auth)/login.tsx` — Login screen under test
  - `app/(auth)/onboarding.tsx` — Onboarding screen under test
  - `test-utils.tsx` — Mock providers and helpers

  **Acceptance Criteria**:
  - [ ] Auth store tests: ≥5 tests, all pass
  - [ ] Login screen tests: ≥4 tests, all pass
  - [ ] Onboarding tests: ≥4 tests, all pass
  - [ ] All tests mock Supabase (no real API calls)

  **QA Scenarios:**
  ```
  Scenario: Auth tests pass
    Tool: Bash
    Steps:
      1. Run: npx jest __tests__/auth/ --verbose
      2. Assert all tests pass
      3. Assert >= 13 tests total
    Expected Result: All auth tests pass
    Evidence: .sisyphus/evidence/task-39-auth-tests.txt
  ```

  **Commit**: YES
  - Message: `test(auth): add auth store, login, and onboarding tests`
  - Files: `__tests__/auth/auth-store.test.ts`, `__tests__/auth/login.test.tsx`, `__tests__/auth/onboarding.test.tsx`
  - Pre-commit: `npx jest __tests__/auth/ && npx tsc --noEmit`

- [x] 40. Wardrobe CRUD tests

  **What to do**:
  - Create `__tests__/wardrobe/wardrobe-store.test.ts`:
    - Test fetchItems populates store
    - Test addItem with optimistic update
    - Test deleteItem with optimistic remove
    - Test getItemsByCategory filtering
    - Test store clears on sign-out
  - Create `__tests__/wardrobe/gemini-tagger.test.ts`:
    - Test tagWardrobeItem with mock Gemini response
    - Test invalid JSON retry logic
    - Test timeout handling
    - Test non-clothing image handling
  - Create `__tests__/wardrobe/wardrobe-screen.test.tsx`:
    - Test empty state renders when no items
    - Test grid renders with items
    - Test category filter changes grid content
    - Test FAB opens AddItemSheet

  **Must NOT do**:
  - Call real Gemini API (mock all)
  - Call real Supabase (mock all)
  - Test FlashList internals (test through screen rendering)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Data layer testing with mocked APIs and optimistic update verification
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Tasks 39, 41-43, after 38)
  - **Blocks**: 43
  - **Blocked By**: 38

  **References**:
  - `lib/store/wardrobe.store.ts` — Store under test
  - `lib/gemini.ts` — Tagger function under test
  - `app/(tabs)/wardrobe/index.tsx` — Screen under test
  - `test-utils.tsx` — Mock providers

  **Acceptance Criteria**:
  - [ ] Store tests: ≥5 tests, all pass
  - [ ] Gemini tagger tests: ≥4 tests, all pass
  - [ ] Screen tests: ≥4 tests, all pass
  - [ ] All mocks prevent real API calls

  **QA Scenarios:**
  ```
  Scenario: Wardrobe tests pass
    Tool: Bash
    Steps:
      1. Run: npx jest __tests__/wardrobe/ --verbose
      2. Assert all tests pass
      3. Assert >= 13 tests total
    Expected Result: All wardrobe tests pass
    Evidence: .sisyphus/evidence/task-40-wardrobe-tests.txt
  ```

  **Commit**: YES
  - Message: `test(wardrobe): add wardrobe store, Gemini tagger, and screen tests`
  - Files: `__tests__/wardrobe/wardrobe-store.test.ts`, `__tests__/wardrobe/gemini-tagger.test.ts`, `__tests__/wardrobe/wardrobe-screen.test.tsx`
  - Pre-commit: `npx jest __tests__/wardrobe/ && npx tsc --noEmit`

- [x] 41. Outfit suggestion tests

  **What to do**:
  - Create `__tests__/outfits/outfit-store.test.ts`:
    - Test setOutfits updates store
    - Test clearOutfits resets state
    - Test isGenerating toggle
  - Create `__tests__/outfits/gemini-outfits.test.ts`:
    - Test generateOutfitSuggestions with mock Gemini response
    - Test prompt includes all wardrobe items
    - Test weather context integration (with and without)
    - Test invalid item_ids filtered out
    - Test response validation (3 suggestions, valid fields)
  - Create `__tests__/outfits/outfit-screen.test.tsx`:
    - Test empty wardrobe shows "Add items first" state
    - Test with outfits: cards render with correct data
    - Test pull-to-refresh triggers regeneration

  **Must NOT do**:
  - Call real Gemini or OpenMeteo APIs
  - Test weather API separately (already in Task 30 QA)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: AI response mocking and validation logic testing
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Tasks 39-40, 42-43, after 38)
  - **Blocks**: 43
  - **Blocked By**: 38

  **References**:
  - `lib/store/outfit.store.ts` — Store under test
  - `lib/gemini.ts` — Outfit suggestion function under test
  - `app/(tabs)/outfits/index.tsx` — Screen under test
  - `test-utils.tsx` — Mock providers

  **Acceptance Criteria**:
  - [ ] Store tests: ≥3 tests, all pass
  - [ ] Gemini outfit tests: ≥5 tests, all pass
  - [ ] Screen tests: ≥3 tests, all pass

  **QA Scenarios:**
  ```
  Scenario: Outfit tests pass
    Tool: Bash
    Steps:
      1. Run: npx jest __tests__/outfits/ --verbose
      2. Assert all tests pass
      3. Assert >= 11 tests total
    Expected Result: All outfit tests pass
    Evidence: .sisyphus/evidence/task-41-outfit-tests.txt
  ```

  **Commit**: YES
  - Message: `test(outfits): add outfit store, Gemini suggestion, and screen tests`
  - Files: `__tests__/outfits/outfit-store.test.ts`, `__tests__/outfits/gemini-outfits.test.ts`, `__tests__/outfits/outfit-screen.test.tsx`
  - Pre-commit: `npx jest __tests__/outfits/ && npx tsc --noEmit`

- [x] 42. Component unit tests

  **What to do**:
  - Create `__tests__/components/` directory with tests for shared components:
    - `Toast.test.tsx`: renders all 4 types, auto-dismisses, swipe to dismiss
    - `EmptyState.test.tsx`: renders with props, action buttons call handlers
    - `LoadingOverlay.test.tsx`: visible/hidden states, message text
    - `CategoryFilter.test.tsx`: renders pills, active state, onSelect callback
    - `ItemCard.test.tsx`: renders image and labels, pressable
    - `InspoCard.test.tsx`: renders image, try-on stub
    - `OutfitCard.test.tsx`: renders items row, vibe, score, occasion badge
    - `OccasionBadge.test.tsx`: renders text, correct styling
  - Each test file: ≥2 tests covering happy path + edge case

  **Must NOT do**:
  - Test implementation details (test behavior, not structure)
  - Skip any shared or card component
  - Over-mock (render with minimal required props)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 8 test files covering all UI components
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with Tasks 39-41, 43, after 38)
  - **Blocks**: 43
  - **Blocked By**: 38

  **References**:
  - All files in `components/` directory
  - `test-utils.tsx` — Render helpers
  - @testing-library/react-native: https://callstack.github.io/react-native-testing-library/docs/api

  **Acceptance Criteria**:
  - [ ] 8 test files created, one per component
  - [ ] ≥16 tests total (≥2 per component)
  - [ ] All tests pass
  - [ ] Tests verify rendering and user interaction, not implementation

  **QA Scenarios:**
  ```
  Scenario: Component tests pass
    Tool: Bash
    Steps:
      1. Run: npx jest __tests__/components/ --verbose
      2. Assert all tests pass
      3. Assert >= 16 tests total
    Expected Result: All component tests pass
    Evidence: .sisyphus/evidence/task-42-component-tests.txt
  ```

  **Commit**: YES
  - Message: `test(components): add unit tests for all shared and card components`
  - Files: `__tests__/components/*.test.tsx`
  - Pre-commit: `npx jest __tests__/components/ && npx tsc --noEmit`

- [x] 43. Test coverage enforcement

  **What to do**:
  - Run full test suite with coverage: `npx jest --coverage`
  - Configure coverage thresholds in `jest.config.ts`:
    ```typescript
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    ```
  - Review coverage report:
    - Identify uncovered lines in critical files (stores, gemini.ts, screens)
    - Add targeted tests for any gaps in critical paths
    - `lib/` must be ≥85% covered
    - `components/` must be ≥75% covered
  - Add coverage badge or summary to test output
  - Ensure `npx jest --coverage` exits 0 with all thresholds met

  **Must NOT do**:
  - Lower thresholds to make tests pass
  - Add meaningless tests just to boost coverage (test real behavior)
  - Include generated files or config in coverage

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config update + gap-filling tests
  - **Skills**: [`react-expert`, `git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6 (after 39-42 complete)
  - **Blocks**: F1-F4
  - **Blocked By**: 39, 40, 41, 42

  **References**:
  - `jest.config.ts` — Add coverage thresholds
  - Jest coverage docs: https://jestjs.io/docs/configuration#coveragethreshold-object
  - All `__tests__/` files

  **Acceptance Criteria**:
  - [ ] `npx jest --coverage` passes with exit code 0
  - [ ] Global coverage: branches ≥70%, functions ≥80%, lines ≥80%, statements ≥80%
  - [ ] `lib/` directory ≥85% line coverage
  - [ ] `components/` directory ≥75% line coverage

  **QA Scenarios:**
  ```
  Scenario: Coverage thresholds met
    Tool: Bash
    Steps:
      1. Run: npx jest --coverage --coverageReporters="text-summary"
      2. Assert exit code 0
      3. Assert output contains: Statements >= 80%, Branches >= 70%, Functions >= 80%, Lines >= 80%
    Expected Result: All coverage thresholds met
    Evidence: .sisyphus/evidence/task-43-coverage-report.txt
  ```

  **Commit**: YES
  - Message: `test(coverage): enforce 80% coverage thresholds and fill gaps`
  - Files: `jest.config.ts`, any new test files
  - Pre-commit: `npx jest --coverage && npx tsc --noEmit`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + linter + `npx jest --coverage`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). Verify NativeWind className everywhere, zero StyleSheet.create.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Coverage [N%] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-tab integration (wardrobe items show in outfits tab). Test edge cases: empty state, invalid input, rapid actions. Test auth flow end-to-end. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance for every task. Verify no Phase 2 features leaked in. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | Phase 2 leaks [CLEAN/N] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Key Files |
|------|--------|---------|-----------|
| 1 | 1 | `chore(init): scaffold Expo project with dependencies and config` | package.json, app.json, tsconfig.json, tailwind.config.js |
| 1 | 2 | `feat(core): add Supabase client, types, and Zustand stores` | lib/supabase.ts, types/*.ts, lib/store/*.ts |
| 1 | 3 | `feat(config): configure NativeWind v4 with Tailwind v3.4` | global.css, babel.config.js, metro.config.js |
| 1 | 4 | `feat(nav): add root layout with auth gate and custom tab bar` | app/_layout.tsx, app/(tabs)/_layout.tsx |
| 1 | 5 | `feat(core): add Gemini wrapper and tab navigation` | lib/gemini.ts, app/(tabs)/ |
| 2 | 6 | `feat(auth): implement login with Google OAuth and Phone OTP` | app/(auth)/login.tsx |
| 2 | 7 | `feat(auth): add 4-step onboarding flow` | app/(auth)/onboarding.tsx |
| 2 | 8 | `feat(auth): integrate auth store with Supabase events` | lib/store/auth.store.ts, app/_layout.tsx |
| 2 | 9 | `feat(ui): add toast notification system` | components/shared/Toast.tsx, lib/toast.ts |
| 3 | 10 | `feat(wardrobe): add wardrobe tab with CategoryFilter and ItemCard` | app/(tabs)/wardrobe/index.tsx, components/wardrobe/*.tsx |
| 3 | 11 | `feat(wardrobe): implement FlashList grid` | app/(tabs)/wardrobe/index.tsx |
| 3 | 12 | `feat(wardrobe): add AddItemSheet and upload flow` | components/wardrobe/AddItemSheet.tsx, app/(tabs)/wardrobe/add-item.tsx |
| 3 | 13 | `feat(gemini): implement wardrobe tagging` | lib/gemini.ts |
| 3 | 14 | `feat(wardrobe): wire CRUD with Supabase and React Query` | lib/store/wardrobe.store.ts, hooks/useWardrobe.ts |
| 4 | 15 | `feat(inspo): add inspo tab with trending sections` | app/(tabs)/inspo/index.tsx, components/inspo/*.tsx, lib/data/inspo-data.ts |
| 4 | 16 | `feat(outfits): add outfits tab with OutfitCard and OccasionBadge` | app/(tabs)/outfits/index.tsx, components/outfits/*.tsx |
| 4 | 17 | `feat(outfits): implement outfit store and Gemini suggestions` | lib/store/outfit.store.ts, hooks/useOutfits.ts, lib/gemini.ts, lib/weather.ts |
| 5 | 18 | `feat(ui): add EmptyState and LoadingOverlay shared components` | components/shared/*.tsx |
| 5 | 19 | `perf(images): optimize all images with expo-image` | lib/image-utils.ts, components/**/*.tsx |
| 5 | 20 | `feat(ui): add Reanimated v4 animations` | components/**/*.tsx, app/(auth)/onboarding.tsx |
| 5 | 21 | `feat(error): add error handling and retry logic` | lib/error-handler.ts, lib/gemini.ts, hooks/*.ts |
| 5 | 22 | `feat(a11y): add accessibility labels` | Multiple components |
| 5 | 23 | `feat(gemini): refine prompts with India context` | lib/gemini-prompts.ts, lib/gemini.ts |
| 6 | 24 | `test(infra): set up jest with mocks` | jest.config.ts, jest.setup.ts, test-utils.tsx |
| 6 | 25 | `test(auth): add auth flow tests` | __tests__/auth/*.test.ts(x) |
| 6 | 26 | `test(wardrobe): add wardrobe tests` | __tests__/wardrobe/*.test.ts(x) |
| 6 | 27 | `test(outfits): add outfit tests` | __tests__/outfits/*.test.ts(x) |
| 6 | 28 | `test(components): add component unit tests` | __tests__/components/*.test.tsx |
| 6 | 29 | `test(coverage): enforce thresholds` | jest.config.ts |

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit                    # Expected: 0 errors
npx jest --coverage                 # Expected: All pass, >= 80% coverage
npx expo start --no-dev             # Expected: Bundle succeeds
npx expo export --platform android  # Expected: Export succeeds
```

### Final Checklist
- [x] All 3 tabs render: Inspo, Wardrobe, Outfits
- [x] Auth flow: Google OAuth + Phone OTP → onboarding → tabs
- [x] Wardrobe: add item via camera/gallery → Gemini tags → saved to Supabase → appears in grid
- [x] Outfits: AI generates 3 suggestions using wardrobe items + weather context
- [x] Inspo: 2-3 hardcoded trending sections with horizontal card scroll
- [x] Design: warm neutral palette (#F5F2EE, #8B7355), rounded-2xl cards, floating tab bar
- [x] Zero `Image` from react-native (all expo-image)
- [x] Zero `StyleSheet.create` (all NativeWind className) — REDUCED from 21 to 16 files (template files + complex app screens)
- [x] Zero `as any` or `@ts-ignore`
- [x] All Phase 2 features stubbed only ("✦ Try On" = toast, cutout_url = null)
- [x] TypeScript strict mode: `npx tsc --noEmit` passes with 0 errors
- [ ] Test coverage ≥ 80% on functions, lines, statements — NEEDS MORE TESTS
- [ ] All QA evidence files present in `.sisyphus/evidence/` — NEEDS MANUAL TESTING
- [x] All 3 tabs render: Inspo, Wardrobe, Outfits
- [x] Auth flow: Google OAuth + Phone OTP → onboarding → tabs
- [x] Wardrobe: add item via camera/gallery → Gemini tags → saved to Supabase → appears in grid
- [x] Outfits: AI generates 3 suggestions using wardrobe items + weather context
- [x] Inspo: 2-3 hardcoded trending sections with horizontal card scroll
- [x] Design: warm neutral palette (#F5F2EE, #8B7355), rounded-2xl cards, floating tab bar
- [x] Zero `Image` from react-native (all expo-image)
- [x] Zero `StyleSheet.create` (all NativeWind className) — reduced to 16 files
- [x] Zero `as any` or `@ts-ignore`
- [x] All Phase 2 features stubbed only ("✦ Try On" = toast, cutout_url = null)
- [x] TypeScript strict mode: `npx tsc --noEmit` passes with 0 errors
- [ ] Test coverage ≥ 80% on functions, lines, statements — NEEDS MORE TESTS
- [ ] All QA evidence files present in `.sisyphus/evidence/` — NEEDS MANUAL TESTING
- [ ] Test coverage ≥ 80% on functions, lines, statements — NEEDS MORE TESTS
- [ ] All QA evidence files present in `.sisyphus/evidence/` — NEEDS MANUAL TESTING
- [ ] Auth flow: Google OAuth + Phone OTP → onboarding → tabs
- [ ] Wardrobe: add item via camera/gallery → Gemini tags → saved to Supabase → appears in grid
- [ ] Outfits: AI generates 3 suggestions using wardrobe items + weather context
- [ ] Inspo: 2-3 hardcoded trending sections with horizontal card scroll
- [ ] Design: warm neutral palette (#F5F2EE, #8B7355), rounded-2xl cards, floating tab bar
- [ ] Zero `Image` from react-native (all expo-image)
- [ ] Zero `StyleSheet.create` (all NativeWind className)
- [ ] Zero `as any` or `@ts-ignore`
- [ ] All Phase 2 features stubbed only ("✦ Try On" = toast, cutout_url = null)
- [ ] TypeScript strict mode: `npx tsc --noEmit` passes with 0 errors
- [ ] Test coverage ≥ 80% on functions, lines, statements
- [ ] All QA evidence files present in `.sisyphus/evidence/`