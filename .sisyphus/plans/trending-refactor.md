# Plan: Refactor Trending Components

## TODOs

### 1. Add Missing Store Selectors
- [ ] Add `useTrendingError` selector to trending.store.ts
- [ ] Create `__tests__/trending.store.test.ts` for TDD approach

### 2. Connect InspoScreen to Trending Store
- [ ] Update `app/(tabs)/inspo/index.tsx` to use `useTrendingSections()` and `useTrendingLoading()`
- [ ] Replace hardcoded `TRENDING_SECTIONS` with store data
- [ ] Add error state UI using `useTrendingError()`

### 3. Update Trending Store for Supabase Config
- [ ] Modify trending.store.ts to fetch config from Supabase Storage instead of GitHub URL
- [ ] Add loading and error states for config fetching with timeout handling
- [ ] Ensure config file structure matches expected format (Jane protocol)
- [ ] Implement config validation and fallback to mock data on failure
- [ ] Add cache invalidation strategy for config updates

### 4. Create Supabase Storage Bucket for Config
- [ ] Create a storage bucket for trending config file (`trending-config`)
- [ ] Upload initial config file with Jane protocol format (`trending-ideas.json`)
- [ ] Set up public read access rules for the bucket
- [ ] Configure appropriate CORS policies if needed

### 5. Verify Model Carousel Integration
- [ ] Confirm ModelDetailPopup works correctly with trending data
- [ ] Ensure clicking items opens the model carousel/popup
- [ ] Verify swipe functionality works between model and outfit views
- [ ] Test carousel functionality with various data sets from config

## Implementation Details

### 1. Trending Store Updates
- Modify `useTrendingStore` in `lib/store/trending.store.ts`:
  - Replace `TRENDING_JSON_URL` with Supabase Storage URL using `supabase.storage.from('trending-config').download('trending-ideas.json')`
  - Use `supabase` client from `lib/supabase.ts` to fetch file
  - Add timeout handling for network requests (10 seconds default)
  - Maintain same loading/error state pattern as existing implementation
  - Keep existing fallback sections for offline/resilience
  - Validate JSON structure matches expected format before updating state
  - Fallback to mock data with error logging on any failure
  - Use existing zustand persist middleware for caching with cache invalidation on successful fetch

### 2. Store Selector Enhancement
- Add `useTrendingError` selector: `() => useTrendingStore((s) => s.error)`
- Create `__tests__/trending.store.test.ts` with TDD:
  - Test fallback data on network failure
  - Test timeout handling (10 seconds)
  - Test JSON structure validation
  - Test cache invalidation
  - Test error state propagation

### 3. InspoScreen Integration
- Replace hardcoded `TRENDING_SECTIONS` with `useTrendingSections()`
- Add loading UI using `useTrendingLoading()` and skeleton screens
- Add error state UI using `useTrendingError()` with retry button
- Maintain existing `onTryOnPress` and `onIndexChange` handlers

### 4. Config File Structure (Jane Protocol)
- JSON format matching existing store expectations:
  ```json
  {
    "sections": [
      {
        "id": "string",
        "title": "string",
        "items": [
          {
            "id": "string",
            "imageUrl": "string",
            "outfitName": "string"
          }
        ]
      }
    ]
  }
  ```
- This matches the `TrendingSection[]` type from `types/inspo.ts`
- Required fields: `sections` array, each section needs `id`, `title`, `items` array
- Each item needs `id`, `imageUrl`, `outfitName`
- Optional fields can be ignored for backward compatibility

### 5. Supabase Integration
- Create storage bucket: `trending-config` (public read access)
- Upload config file: `trending-ideas.json` with initial data matching current mock data
- Use `supabase.storage.from('trending-config').download('trending-ideas.json')` to fetch
- Convert response to JSON using `JSON.parse()` and update store state
- Handle network errors, timeouts, and invalid JSON gracefully

### 6. Component Integration
- No changes needed to `TrendingGrid.tsx` or `InspoBottomSheet.tsx` as they already accept sections prop
- Store selectors will provide data to components via InspoScreen
- Model carousel (`ModelDetailPopup`) already exists and works with trending items
- Add loading state UI to show skeleton screens while config is fetching
- Add error state UI to show retry button or fallback notification

## Loading and Error Handling
- Loading state: Show skeleton/UI while fetching config (10 second timeout)
- Error state: Fallback to existing mock data, show error toast with retry option
- Success state: Update sections with fetched data and update timestamp
- Persistence: Use existing zustand persist middleware for caching (offline support)
- Cache invalidation: Automatically invalidated on successful config fetch
- Retry mechanism: Allow user to retry failed config fetches
- UI Feedback: Visual indicators for loading, success, and error states

## TDD Approach & Atomic Commit Strategy

### Test-Driven Development Process
1. **Write failing test first** for each new feature/behavior
2. **Implement minimal code** to pass the test
3. **Refactor while maintaining** test pass
4. **Repeat until complete**

### Atomic Commit Guidelines
Each commit must:
- Address exactly one logical change
- Pass all existing tests
- Pass linting (TypeScript, ESLint)
- Include meaningful commit message following conventional commits
- Be small enough to review easily (<= 200 lines changed)
- Follow format: `type(scope): description`
  - Types: feat, fix, test, refactor, chore, infra, docs
  - Scopes: trending, inspo, supabase, test, etc.

### Suggested Atomic Commit Sequence
1. **test**: Setup trending store test file (`__tests__/trending.store.test.ts`)
2. **test(trending)**: Add test for Supabase storage download call
3. **feat(trending)**: Implement Supabase storage download for trending config
4. **test(trending)**: Add test for JSON structure validation
5. **feat(trending)**: Add JSON structure validation
6. **test(trending)**: Add test for fallback on network failure
7. **fix(trending)**: Implement error handling with fallback to mock data
8. **test(trending)**: Add test for cache invalidation on successful fetch
9. **feat(trending)**: Implement cache invalidation via zustand persist
10. **test(trending)**: Add test for useTrendingError selector
11. **feat(trending)**: Add useTrendingError selector
12. **test(inspo)**: Add test for error state UI in InspoScreen
13. **feat(inspo)**: Add error state UI with retry button
14. **test(inspo)**: Add test for store data connection
15. **feat(inspo)**: Connect to trending store for sections data
16. **test(inspo)**: Add test for loading UI
17. **feat(inspo)**: Add loading UI with skeleton screens
18. **test(inspo)**: Add test for retry button functionality
19. **feat(inspo)**: Implement retry button for failed config fetch
20. **infra**: Create trending-config storage bucket with public read access
21. **infra**: Upload initial trending-ideas.json to trending-config bucket
22. **infra**: Verify CORS policies for trending-config bucket
23. **test(inspo)**: Add test for ModelDetailPopup integration
24. **chore(inspo)**: Verify ModelDetailPopup integration with trending data
25. **test(inspo)**: Add test for swipe functionality between views
26. **chore(inspo)**: Verify swipe functionality with config data
27. **test(e2e)**: Add end-to-end test for trending config flow
28. **feat(e2e)**: Verify end-to-end trending config flow
29. **refactor(trending)**: Remove unused GitHub URL fetch code
30. **test**: Run full test suite to verify refactor
31. **chore**: Fix linting and type errors

## Estimated Task Breakdown
- Store implementation: 9 atomic commits
- Selector enhancement: 3 atomic commits  
- InspoScreen connection: 6 atomic commits
- Supabase setup: 3 atomic commits
- Verification: 6 atomic commits
- Cleanup: 3 atomic commits
- **Total: ~30 atomic commits**

This plan enables parallel execution while maintaining strict TDD and atomic commit principles. Each step is small, verifiable, and builds upon the previous committed state.