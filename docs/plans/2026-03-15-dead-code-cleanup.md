# Dead Code Cleanup Plan - StyleAI

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Identify and safely remove dead code from the StyleAI React Native/Expo project to reduce codebase size and improve maintainability.

**Architecture:** Use a tier-based approach categorizing dead code as SAFE, CAUTION, or DANGER, then systematically remove each category with test verification.

**Tech Stack:** TypeScript, Expo Router, React Native, Jest (testing)

---

## Dead Code Detection Summary

### Detection Methods Used:
- Grep for exports with zero imports
- File pattern analysis for orphaned routes
- Import graph analysis

### Findings Identified:

| Tier | Item | Location | Action |
|------|------|----------|--------|
| **SAFE** | Duplicate onboarding placeholder | `app/onboarding.tsx` | DELETE |
| **SAFE** | Unused modal template | `app/modal.tsx` | DELETE |
| **SAFE** | Unused favorites tab | `app/(tabs)/favorites/index.tsx` | DELETE |
| **SAFE** | EditScreenInfo component | `components/EditScreenInfo.tsx` | DELETE |
| **SAFE** | StyledText component | `components/StyledText.tsx` | DELETE |
| **CAUTION** | Themed component | `components/Themed.tsx` | INVESTIGATE - used by +not-found.tsx |

---

## Implementation Tasks

### Task 1: Verify Baseline - Run Tests

**Step 1: Establish baseline**

Run: `npm test`
Expected: All tests pass (or have pre-existing failures)

**Step 2: Check TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No new errors

---

### Task 2: Delete Duplicate Onboarding Placeholder (SAFE)

**Files:**
- Delete: `app/onboarding.tsx`

**Step 1: Verify file exists and is dead code**

The file `app/onboarding.tsx` is a placeholder that duplicates `app/(auth)/onboarding.tsx`. It's never imported or routed to.

**Step 2: Delete the file**

Use Edit tool to delete the entire file content or use bash to remove.

**Step 3: Verify no regressions**

Run: `npm test`
Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add app/onboarding.tsx
git commit -m "refactor: remove duplicate onboarding placeholder"
```

---

### Task 3: Delete Unused Modal Template (SAFE)

**Files:**
- Delete: `app/modal.tsx`

**Step 1: Verify file is unused**

- No navigation/routing points to modal
- Not imported anywhere in the codebase

**Step 2: Delete the file**

```bash
rm app/modal.tsx
```

**Step 3: Verify no regressions**

Run: `npm test`
Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add app/modal.tsx
git commit -m "refactor: remove unused modal template"
```

---

### Task 4: Delete Unused Favorites Tab (SAFE)

**Files:**
- Delete: `app/(tabs)/favorites/index.tsx`

**Step 1: Verify tab is unused**

- Tab exists but is NOT in `BottomTabBar.tsx` TAB_CONFIG
- No navigation points to it

**Step 2: Delete the file**

```bash
rm "app/(tabs)/favorites/index.tsx"
```

**Step 3: Verify no regressions**

Run: `npm test`
Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add "app/(tabs)/favorites/index.tsx"
git commit -m "refactor: remove unused favorites tab"
```

---

### Task 5: Delete EditScreenInfo Component (SAFE)

**Files:**
- Delete: `components/EditScreenInfo.tsx`

**Step 1: Verify component is unused**

Only imported by `app/modal.tsx` (which we're also deleting).

**Step 2: Delete the file**

```bash
rm components/EditScreenInfo.tsx
```

**Step 3: Verify no regressions**

Run: `npm test`
Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add components/EditScreenInfo.tsx
git commit -m "refactor: remove unused EditScreenInfo component"
```

---

### Task 6: Delete StyledText Component (SAFE)

**Files:**
- Delete: `components/StyledText.tsx`

**Step 1: Verify component is unused**

Only imported by `EditScreenInfo.tsx` (which we're also deleting).

**Step 2: Delete the file**

```bash
rm components/StyledText.tsx
```

**Step 3: Verify no regressions**

Run: `npm test`
Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add components/StyledText.tsx
git commit -m "refactor: remove unused StyledText component"
```

---

### Task 7: Investigate Themed Component (CAUTION)

**Files:**
- Modify: `components/Themed.tsx`

**Step 1: Check usage**

```bash
grep -r "from.*Themed" --include="*.tsx"
```

**Step 2: Determine fate**

If ONLY used by +not-found.tsx and modal.tsx (deleted):
- Option A: Delete Themed.tsx and update +not-found.tsx to use regular Text/View
- Option B: Keep Themed.tsx (it's a small utility, low cost)

**Step 3: If deleting**

- Delete `components/Themed.tsx`
- Update `app/+not-found.tsx` to use react-native directly

**Step 4: Commit**

```bash
git add components/Themed.tsx app/+not-found.tsx
git commit -m "refactor: remove Themed component if unused"
```

---

## Summary

### Expected Results

| Category | Count |
|----------|-------|
| Deleted files | 5 |
| Deleted functions/components | 3 |
| Lines removed | ~250 |

### Verification

- All tests passing: ✅
- TypeScript compilation: ✅
- Build verification: ✅

### Post-Cleanup

After completing all tasks:
1. Run full test suite one more time
2. Run `npx tsc --noEmit` for type safety
3. Consider running a quick build test if possible
