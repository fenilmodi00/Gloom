# Outfit-Builder Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor outfit-builder components to eliminate dead code, fix anti-patterns, add test coverage, and implement performance optimizations.

**Architecture:** TDD approach — write failing tests first, then refactor. StyleSheet → NativeWind migration preserves exact visual appearance. Performance optimizations use memoization and data structures for O(1) lookups.

**Tech Stack:** React Native + Expo, NativeWind v4.1, TypeScript 5.8 strict, Zustand v5, Jest + jest-expo, bun package manager

---

## TL;DR

> **Quick Summary**: Delete 2 dead files, convert 12 components from StyleSheet.create to NativeWind, remove console.log statements, add comprehensive test coverage for outfit-scoring and outfit-builder store, and implement 5 performance optimizations.
>
> **Deliverables**:
> - 2 dead files deleted
> - 12 components migrated to NativeWind className
> - 4 console.log statements removed
> - Test coverage for outfit-scoring.ts (currently 0%)
> - Test coverage for outfit-builder.store.ts (currently 0%)
> - Performance optimizations: memoization, inverted index, priority queue
>
> **Estimated Effort**: Large (4-6 hours)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Tests → Delete Dead Code → StyleSheet Migration → Performance Optimizations

---

## Context

### Original Request

Refactor the `components/wardrobe/outfit-builder/` folder based on code review findings: dead code deletion, anti-pattern fixes (StyleSheet.create, console.log, missing null checks), and DSA-based performance optimizations.

### Interview Summary

**Key Discussions**:
- Dead code: `OutfitCombinationCarousel.tsx` and `OutfitCombinationGrid.tsx` not imported anywhere
- Anti-patterns: 12 files use StyleSheet.create (violates AGENTS.md), 4 console.log statements
- Test infrastructure: Jest configured, but 0% coverage for outfit-scoring.ts and outfit-builder.store.ts
- Performance: Memoization, inverted tag index, priority queue, precomputed color compatibility, early pruning

**Research Findings**:
- `lib/outfit-scoring.ts` EXISTS (288 lines) — needs tests before optimization
- `lib/store/outfit-builder.store.ts` EXISTS (335 lines) — needs tests
- `OutfitCombinationCard.tsx` already uses NativeWind (compliant, skip)
- No test fixtures exist — need mock WardrobeItem data

### Metis Review (Self-Analysis)

**Identified Gaps** (addressed):
- Gap: No test fixtures → Added Task 1-2 for fixture creation
- Gap: Visual regression risk → Added screenshot comparison notes in QA scenarios
- Gap: Performance optimization scope unclear → Moved to Wave 3 (after tests pass)
- Gap: Rollback strategy → Added git tags at each safe state

---

## Work Objectives

### Core Objective

Clean up outfit-builder codebase by removing dead code, fixing style anti-patterns, adding test coverage, and implementing performance optimizations — all while preserving exact visual appearance and behavior.

### Concrete Deliverables

- [ ] Delete `OutfitCombinationCarousel.tsx` (215 lines)
- [ ] Delete `OutfitCombinationGrid.tsx` (275 lines)
- [ ] Convert 11 components from StyleSheet.create to NativeWind className
- [ ] Remove 4 console.log statements from 2 files
- [ ] Create `__tests__/fixtures/wardrobe-items.ts` with mock data
- [ ] Create `__tests__/outfit-scoring.test.ts` with comprehensive coverage
- [ ] Create `__tests__/outfit-builder-store.test.ts` with action coverage
- [ ] Add null checks for `getBestMatchingItem` callers
- [ ] Implement pair score memoization in outfit-scoring.ts
- [ ] Implement inverted tag index for O(1) lookups
- [ ] Implement priority queue for top-K items per slot

### Definition of Done

- [ ] `bun test` passes with >80% coverage for outfit-scoring.ts
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Visual appearance unchanged (manual verification on device)
- [ ] No StyleSheet.create in any outfit-builder file
- [ ] No console.log in production code

### Must Have

- All 11 active components migrated to NativeWind className
- Test coverage for outfit-scoring.ts and outfit-builder.store.ts
- Dead files deleted

### Must NOT Have (Guardrails)

- NO visual changes — preserve exact appearance
- NO changes to `components/outfit-board/` (external dependency)
- NO changes to unrelated modules (wardrobe store, auth, etc.)
- NO `as any`, `@ts-ignore`, or `// @ts-expect-error`
- NO npm/yarn/pnpm — use bun only
- NO default exports — named exports only
- NO relative imports like `../lib/...` — use `@/lib/...`

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: YES (Jest + jest-expo configured)
- **Automated tests**: YES (TDD approach)
- **Framework**: jest-expo (bun test)
- **TDD Workflow**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy

Every task MUST include agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun test) — Run tests, assert coverage

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — test infrastructure + fixtures):
├── Task 1: Create test fixtures directory and mock data [quick]
├── Task 2: Create wardrobe-items.ts fixture with mock WardrobeItem data [quick]
├── Task 3: Write failing tests for outfit-scoring.ts (Part 1: scoring functions) [unspecified-high]
├── Task 4: Write failing tests for outfit-scoring.ts (Part 2: filter/getBest) [unspecified-high]
└── Task 5: Write failing tests for outfit-builder.store.ts [unspecified-high]

Wave 2 (After Wave 1 — delete dead code + make tests pass):
├── Task 6: Delete OutfitCombinationCarousel.tsx [quick]
├── Task 7: Delete OutfitCombinationGrid.tsx [quick]
├── Task 8: Implement outfit-scoring tests (make them pass) [unspecified-high]
├── Task 9: Implement outfit-builder-store tests (make them pass) [unspecified-high]
└── Task 10: Create git tag: safe-state-after-tests [quick]

Wave 3 (After Wave 2 — StyleSheet → NativeWind migration):
├── Task 11: Migrate SelectItemsSection.tsx to NativeWind [visual-engineering]
├── Task 12: Migrate SelectedItemsBar.tsx to NativeWind [visual-engineering]
├── Task 13: Migrate StyleSelector.tsx to NativeWind [visual-engineering]
├── Task 14: Migrate OutfitCombinationsSection.tsx to NativeWind [visual-engineering]
├── Task 15: Migrate OutfitBoardSheet.tsx to NativeWind [visual-engineering]
├── Task 16: Migrate OutfitCombinationSlide.tsx to NativeWind [visual-engineering]
├── Task 17: Migrate FaceCarousel.tsx to NativeWind [visual-engineering]
├── Task 18: Migrate FaceSelectionBottomSheet.tsx to NativeWind [visual-engineering]
├── Task 19: Migrate app/outfit-builder.tsx to NativeWind [visual-engineering]
└── Task 20: Migrate app/outfit-combination.tsx to NativeWind [visual-engineering]

Wave 4 (After Wave 3 — console.log removal + null checks):
├── Task 21: Remove console.log from OutfitCombinationsSection.tsx [quick]
├── Task 22: Remove console.log from app/outfit-combination.tsx [quick]
├── Task 23: Add null checks for getBestMatchingItem callers [quick]
├── Task 24: Create git tag: safe-state-after-antipatterns [quick]
└── Task 25: Run full test suite + type check [quick]

Wave 5 (After Wave 4 — performance optimizations):
├── Task 26: Implement pair score memoization [deep]
├── Task 27: Implement inverted tag index [deep]
├── Task 28: Implement priority queue for top-K items [deep]
├── Task 29: Add tests for performance optimizations [unspecified-high]
└── Task 30: Create git tag: safe-state-after-perf [quick]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Visual QA on device (unspecified-high)
└── Task F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Blocked By | Blocks |
|------|------------|--------|
| 1-2 | None | 3-5 |
| 3-5 | 1-2 | 8-9 |
| 6-7 | None | None (safe to run anytime) |
| 8-9 | 3-5 | 10 |
| 10 | 8-9 | 11-20 |
| 11-20 | 10 | 21-24 |
| 21-23 | 11-20 | 24 |
| 24 | 21-23 | 25 |
| 25 | 24 | 26-29 |
| 26-28 | 25 | 29 |
| 29 | 26-28 | 30 |
| 30 | 29 | F1-F4 |
| F1-F4 | 30 | User approval |

### Agent Dispatch Summary

- **Wave 1**: 5 tasks — T1-T2 → `quick`, T3-T5 → `unspecified-high`
- **Wave 2**: 5 tasks — T6-T7 → `quick`, T8-T9 → `unspecified-high`, T10 → `quick`
- **Wave 3**: 10 tasks — All → `visual-engineering`
- **Wave 4**: 5 tasks — All → `quick`
- **Wave 5**: 5 tasks — T26-T28 → `deep`, T29 → `unspecified-high`, T30 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

---

- [ ] 1. Create test fixtures directory and mock data factory

**What to do**:
- Create `__tests__/fixtures/` directory
- Create `__tests__/fixtures/index.ts` barrel file
- Export mock factory functions for test reuse

**Must NOT do**:
- DO NOT import production code in fixtures
- DO NOT create overly complex mock data

**Recommended Agent Profile**:
- **Category**: `quick`
- Reason: Simple directory structure creation, no complex logic
- **Skills**: `[]`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 2-5)
- **Blocks**: Tasks 2-5 (need fixtures directory)
- **Blocked By**: None (can start immediately)

**References**:
- `types/wardrobe.ts:WardrobeItem` — Interface to mock
- `types/outfit.ts:Outfit` — Interface to mock

**Acceptance Criteria**:
- [ ] Directory `__tests__/fixtures/` exists
- [ ] File `__tests__/fixtures/index.ts` exists with exports

**QA Scenarios**:
```
Scenario: Verify fixtures directory structure
Tool: Bash
Steps:
  1. ls -la __tests__/fixtures/
Expected Result: Directory exists with index.ts file
Evidence: .sisyphus/evidence/task-01-fixtures-dir.txt
```

**Commit**: YES
- Message: `test: create fixtures directory for test mocks`
- Files: `__tests__/fixtures/index.ts`

---

- [ ] 2. Create wardrobe-items.ts fixture with mock WardrobeItem data

**What to do**:
- Create `__tests__/fixtures/wardrobe-items.ts`
- Export `mockWardrobeItems: WardrobeItem[]` array with 10+ diverse items
- Export `createMockItem(overrides?)` factory function
- Include items with various: categories (top, bottom, shoes, accessories), colors, tags, occasions

**Must NOT do**:
- DO NOT use `any` types
- DO NOT create items missing required fields

**Recommended Agent Profile**:
- **Category**: `quick`
- Reason: Data structure creation, straightforward TypeScript
- **Skills**: `[]`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1, 3-5)
- **Blocks**: Tasks 3-5 (need mock data for tests)
- **Blocked By**: Task 1 (needs fixtures directory)

**References**:
- `types/wardrobe.ts:WardrobeItem` — Interface definition
- `types/wardrobe.ts:ItemCategory` — Category enum/union
- `lib/store/wardrobe.store.ts` — Real usage patterns

**Acceptance Criteria**:
- [ ] File `__tests__/fixtures/wardrobe-items.ts` exists
- [ ] Exports `mockWardrobeItems` with 10+ items
- [ ] Exports `createMockItem` factory function
- [ ] All items pass TypeScript validation

**QA Scenarios**:
```
Scenario: Verify mock data structure
Tool: Bash
Steps:
  1. npx tsc --noEmit __tests__/fixtures/wardrobe-items.ts
Expected Result: No TypeScript errors
Evidence: .sisyphus/evidence/task-02-fixtures-types.txt
```

**Commit**: YES
- Message: `test: add wardrobe-items fixture with mock data`
- Files: `__tests__/fixtures/wardrobe-items.ts`, `__tests__/fixtures/index.ts`

---

- [ ] 3. Write failing tests for outfit-scoring.ts (Part 1: scoring functions)

**What to do**:
- Create `__tests__/outfit-scoring.test.ts`
- Write failing tests for:
  - `calculateStyleScore(item1, item2)` — matching tags
  - `calculateVibeScore(item1, item2)` — vibe compatibility
  - `calculateOccasionScore(item1, item2)` — occasion overlap
  - `calculateColorScore(item1, item2)` — COLOR_COMBINATIONS lookup
- Import mock data from fixtures

**Must NOT do**:
- DO NOT modify production code yet
- DO NOT skip edge cases (null, empty, mismatched)

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
- Reason: Test writing requires understanding scoring logic
- **Skills**: `[]`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1-2, 4-5)
- **Blocks**: Task 8 (needs failing tests to make pass)
- **Blocked By**: Task 2 (needs fixtures)

**References**:
- `lib/outfit-scoring.ts:calculateStyleScore` — Function to test
- `lib/outfit-scoring.ts:calculateVibeScore` — Function to test
- `lib/outfit-scoring.ts:calculateOccasionScore` — Function to test
- `lib/outfit-scoring.ts:calculateColorScore` — Function to test
- `lib/outfit-scoring.ts:COLOR_COMBINATIONS` — Color lookup table

**Acceptance Criteria**:
- [ ] File `__tests__/outfit-scoring.test.ts` exists
- [ ] Contains 4+ describe blocks for scoring functions
- [ ] Each function has 2+ test cases (happy path + edge case)
- [ ] `bun test __tests__/outfit-scoring.test.ts` FAILS (expected)

**QA Scenarios**:
```
Scenario: Verify tests fail (TDD RED phase)
Tool: Bash
Steps:
  1. bun test __tests__/outfit-scoring.test.ts
Expected Result: Tests FAIL with "not implemented" or similar
Evidence: .sisyphus/evidence/task-03-tests-fail.txt
```

**Commit**: YES
- Message: `test: add failing tests for outfit-scoring functions`
- Files: `__tests__/outfit-scoring.test.ts`

---

- [ ] 4. Write failing tests for outfit-scoring.ts (Part 2: filter/getBest)

**What to do**:
- Append to `__tests__/outfit-scoring.test.ts`
- Write failing tests for:
  - `filterByStyle(items, style)` — STYLE_TAG_MAP lookup
  - `getBestMatchingItem(items, selectedItem)` — top-3 random selection
  - `calculateItemPairScore(item1, item2, weights)` — weighted scoring
  - `calculateOutfitScore(items, weights)` — pair-wise averaging

**Must NOT do**:
- DO NOT modify production code yet
- DO NOT test implementation details — test behavior

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
- Reason: Test writing for complex filtering/scoring logic
- **Skills**: `[]`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1-3, 5)
- **Blocks**: Task 8 (needs failing tests)
- **Blocked By**: Task 2 (needs fixtures)

**References**:
- `lib/outfit-scoring.ts:filterByStyle` — Function to test
- `lib/outfit-scoring.ts:getBestMatchingItem` — Function to test (NOTE: returns null)
- `lib/outfit-scoring.ts:calculateItemPairScore` — Weighted scoring
- `lib/outfit-scoring.ts:calculateOutfitScore` — Outfit-level scoring
- `lib/outfit-scoring.ts:STYLE_TAG_MAP` — Style to tag mapping

**Acceptance Criteria**:
- [ ] Additional test cases in `__tests__/outfit-scoring.test.ts`
- [ ] Tests for null-return case in `getBestMatchingItem`
- [ ] `bun test __tests__/outfit-scoring.test.ts` FAILS (expected)

**QA Scenarios**:
```
Scenario: Verify null handling test exists
Tool: Bash
Steps:
  1. grep -n "null" __tests__/outfit-scoring.test.ts
Expected Result: At least one test case for null return
Evidence: .sisyphus/evidence/task-04-null-test.txt
```

**Commit**: YES
- Message: `test: add failing tests for filter and getBestMatchingItem`
- Files: `__tests__/outfit-scoring.test.ts`

---

- [ ] 5. Write failing tests for outfit-builder.store.ts

**What to do**:
- Create `__tests__/outfit-builder-store.test.ts`
- Write failing tests for:
  - `toggleItem(item, slot)` — select/deselect, one-per-slot
  - `removeItem(slot)` / `removeSelection()` / `clearSelection()`
  - `setSelectedStyle(style)` + `generateCombinations()` integration
  - Selector hooks: `useSelectedItems`, `useCombinations`

**Must NOT do**:
- DO NOT modify production code yet
- DO NOT test Zustand internals — test store behavior

**Recommended Agent Profile**:
- **Category**: `unspecified-high`
- Reason: Zustand store testing requires understanding state management
- **Skills**: `[]`

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1-4)
- **Blocks**: Task 9 (needs failing tests)
- **Blocked By**: Task 2 (needs fixtures)

**References**:
- `lib/store/outfit-builder.store.ts:toggleItem` — Core selection action
- `lib/store/outfit-builder.store.ts:generateCombinations` — Combination generation
- `lib/store/outfit-builder.store.ts:useOutfitBuilderStore` — Main hook

**Acceptance Criteria**:
- [ ] File `__tests__/outfit-builder-store.test.ts` exists
- [ ] Tests for all major actions
- [ ] `bun test __tests__/outfit-builder-store.test.ts` FAILS (expected)

**QA Scenarios**:
```
Scenario: Verify store tests exist
Tool: Bash
Steps:
  1. ls -la __tests__/outfit-builder-store.test.ts
Expected Result: File exists
Evidence: .sisyphus/evidence/task-05-store-tests.txt
```

**Commit**: YES
- Message: `test: add failing tests for outfit-builder store`
- Files: `__tests__/outfit-builder-store.test.ts`

---

