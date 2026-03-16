# Dead Code Cleanup Plan for StyleAI

## Overview
This plan outlines the process for identifying and removing dead code from the StyleAI React Native/Expo project. The goal is to clean up unused dependencies, exports, and files while ensuring the application remains functional.

## Phase 1: Detection

### Unused Dependencies (via depcheck)
The following packages are reported as unused by depcheck:
- `@gluestack-ui/themed`
- `@shopify/flash-list`
- `base64-arraybuffer`
- `expo-file-system`
- `expo-image-manipulator`
- `expo-media-library`
- `expo-symbols`
- `expo-toast`

### Unused DevDependencies (via depcheck)
- `@testing-library/jest-native`
- `@types/jest`
- `autoprefixer`
- `typescript`

*Note: devDependencies require careful verification as they may be used indirectly.*

### Potential Unused Exports & Orphaned Files
Initial scan identified several files that appear to have no imports:
- `components/inspo/InspoCard.tsx` (component defined but not imported; InspoScreen uses local component)
- `components/ui/button.tsx` and related UI components (need verification)
- Various type files and utility files

## Phase 2: Tier Classification

| Tier | Criteria | Examples from StyleAI |
|------|----------|-----------------------|
| **SAFE** | Unused utilities, test helpers, internal functions with no external consumers | Unused dependencies, orphaned utility files |
| **CAUTION** | Components, API routes, middleware - verify no dynamic imports or external consumers | UI components, navigation components, store files |
| **DANGER** | Config files, entry points, type definitions - investigate before touching | `app/_layout.tsx`, `types/*`, `lib/supabase.ts` |

### Preliminary Classification

**SAFE (High Confidence):**
- `@gluestack-ui/themed` (no imports found)
- `@shopify/flash-list` (no imports found)
- `base64-arraybuffer` (no imports found)
- `expo-file-system` (no imports found)
- `expo-image-manipulator` (no imports found)
- `expo-media-library` (no imports found)
- `expo-symbols` (no imports found)
- `expo-toast` (no imports found)
- `components/inspo/InspoCard.tsx` (local component used in InspoScreen; this file is unused)
- `components/useClientOnlyValue.ts` and `.web.ts` (need verification)
- `components/useColorScheme.web.ts` (need verification)

**CAUTION (Requires Verification):**
- `@testing-library/jest-native` (check test files)
- `@types/jest` (likely used by Jest)
- `autoprefixer` (check PostCSS config)
- `typescript` (obviously used)
- UI component exports (Button, Fab, Heading, Text) - verify if used elsewhere
- `components/wardrobe/AddItemSheet.tsx` and `ItemCard.tsx` (wardrobe screen uses them)
- `components/outfits/OutfitCard.tsx` and `OccasionBadge.tsx` (outfits screen uses them)
- `components/shared/` components (BottomTabBar, EmptyState, LoadingOverlay, Toast)

**DANGER (Do Not Touch Without Deep Verification):**
- All files in `app/` (routing and screens)
- All files in `lib/` (supabase, gemini, stores)
- All files in `types/` (TypeScript interfaces)
- `app/_layout.tsx` (root layout)
- `app/(tabs)/_layout.tsx` (tab layout)
- `tailwind.config.js`, `postcss.config.js`, `babel.config.js`, `metro.config.js`
- `global.css`, `expo-env.d.ts`, `nativewind-env.d.ts`
- `app.json`

## Phase 3: Safe Deletion Process

### Prerequisites
1. Establish test suite baseline:
   - Run `npm test` and note which tests fail due to missing environment variables (expected)
   - Note which tests fail due to actual code issues (unexpected)
   - Only proceed if unexpected failures are zero or acceptable

2. For each SAFE item:
   - Delete the item (dependency, file, or export)
   - Run the test suite
   - If tests pass (ignoring expected env-related failures), keep the deletion
   - If tests fail unexpectedly, revert the deletion and mark item as CAUTION

### Order of Deletion (SAFEST FIRST)
1. Remove unused dependencies from `package.json`
2. Remove unused devDependencies that are verified safe
3. Remove orphaned files (starting with utility files)
4. Remove unused exports within files (refactor to remove dead code)
5. Handle CAUTION items after SAFE items are cleared

### Verification Steps for Each Deletion
1. **Dependency Removal:**
   - Remove from `package.json`
   - Run `npm install` to clean up
   - Run `npm test` and verify no new failures (beyond expected env var issues)
   - Run expo web/build to ensure no runtime errors

2. **File Removal:**
   - Delete the file
   - Run `npm test`
   - Verify no import errors in development build

3. **Export Removal (within file):**
   - Remove unused export statement
   - Keep the file if it contains other used code
   - Run `npm test`
   - Verify TypeScript compiles (`npx tsc --noEmit`)

## Phase 4: Consolidation of Duplicates
After dead code removal:
1. Scan for near-duplicate functions (>80% similar)
2. Consolidate redundant type definitions
3. Inline wrapper functions that add no value
4. Remove unnecessary re-exports

## Phase 5: Estimated Impact
- **Dependencies to remove:** 8 packages (~500KB saved in node_modules)
- **DevDependencies to remove:** Up to 4 packages (after verification)
- **Files to remove:** 1-5 orphaned files (e.g., `components/inspo/InspoCard.tsx`)
- **Lines of code to remove:** Estimated 200-500 lines (mostly dependency-related code and unused component files)
- **Expected outcome:** Cleaner dependency tree, reduced bundle size, faster installs

## Phase 6: Summary Report Template
After execution, report:
- Deleted: X unused dependencies
- Deleted: X unused devDependencies
- Deleted: X unused files
- Skipped: X items (tests failed or uncertain)
- Saved: ~X lines removed
- All tests passing: [Yes/No] (with note on expected env-related failures)

## Important Rules
1. Never delete without running tests first
2. One deletion at a time - atomic changes
3. Skip if uncertain - better to keep than break
4. Don't refactor while cleaning - separate concerns
5. Use build/type-check as verification if test suite is incomplete

## Next Steps
1. Verify each item's classification through manual inspection
2. Establish test baseline
3. Begin SAFE deletion loop