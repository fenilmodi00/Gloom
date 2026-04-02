# Background Removal Service Migration Plan

## TL;DR

> **Quick Summary**: Migrate from the current rembg service to the new GCP Cloud Run service (`https://outfit-extractor-787746538147.us-central1.run.app`) - which is **SYNCHRONOUS but SLOW (20-120s)**. No job IDs needed, just extended timeouts.
>
> **Deliverables**:
> - Updated Go backend with new GCP service URL and extended timeout
> - Go client updated to handle base64 response (transparent + white bg)
> - Skeleton view UI while processing (20-120s wait)
> - Fallback handling for timeouts
>
> **API Contract Found**:
> - `POST /extract-outfit` - Upload image (multipart)
> - `POST /extract-outfit/url` - Submit via URL (recommended)
> - Response: `{ transparent_image_b64, white_bg_image_b64, labels_found[], inference_time_ms }`
>
> **Estimated Effort**: Medium-Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Wave 1 → Wave 2 → Wave 3 → Final Verification

---

## Context

### Original Request
User wants to migrate to a new serverless background removal service deployed on Google Cloud Run. The new service is asynchronous, taking 20-120 seconds to respond (vs current ~30s sync). Two phases requested:
- **Phase 1**: Basic migration to new service
- **Phase 2**: Skeleton view UI while processing

### Current Architecture
```
[React Native] → [Go Backend] → [Current rembg service (sync)]
                     ↓
              [Supabase DB]
                     ↓
              [Background polling every 5s]
```

### New Architecture (Phase 1)
```
[React Native] → [Go Backend] → [GCP Cloud Run (sync but SLOW: 20-120s)]
                     ↓
              [Supabase DB]
                     ↓
              [Background polling (extended: 5 min)]
```
**Key insight**: Service is SYNCHRONOUS but slow - returns result in response after 20-120s. No job tracking needed!

### New Architecture (Phase 2)
```
[React Native] → [Go Backend] → [GCP Cloud Run (sync, slow)]
                     ↓
              [Supabase DB]
                     ↓
              [Polling + Skeleton UI + Move to category on complete]
```

---

## Work Objectives

### Core Objective
Migrate the background removal functionality to use the new GCP Cloud Run service (`https://outfit-extractor-787746538147.us-central1.run.app`) - which is **SYNCHRONOUS but SLOW (20-120s)**. No job tracking needed!

### Key Findings (from API inspection)
- **Service is SYNCHRONOUS**: Returns result in response after 20-120s (no job IDs, no polling)
- **Endpoint**: `POST /extract-outfit/url` with JSON body `{image_url: "..."}`
- **Response**: `{ transparent_image_b64, white_bg_image_b64, labels_found[], inference_time_ms }`
- **Database approach**: Use existing `wardrobe_items.processing_status` - NO new tables needed!

### Concrete Deliverables
- [ ] Updated Go backend with new GCP Cloud Run service URL
- [ ] Extended backend timeout (5+ minutes for 120s service + overhead)
- [ ] Handle base64 response (decode and upload to storage)
- [ ] Skeleton view component for processing state
- [ ] Fallback handling for timeouts

### Definition of Done
- [ ] `curl http://localhost:8080/api/v1/wardrobe/{id}/process-rembg` starts processing (returns 202)
- [ ] After 20-120s, item's `processing_status` = 'completed' with `cutout_url` populated
- [ ] Frontend shows skeleton view during the 20-120s wait
- [ ] Timeout after 5 minutes → status = 'fallback', use original image

### Must Have
- Graceful timeout handling (3+ minutes for 120s service)
- Fallback to original image if processing fails
- User notification on completion/failure
- No breaking changes to existing wardrobe functionality

### Must NOT Have
- Blocking the main thread/UI during processing
- Hard-coded URLs (must use environment variables)
- Lost items if processing fails mid-way
- Confusing states (show skeleton, then completed/failed)

---

## Verification Strategy

### Test Infrastructure
- **Framework**: Jest (existing)
- **Tests**: Unit tests for Go handlers, integration tests for polling logic
- **QA**: Manual testing with real GCP service

### QA Policy
Every task includes agent-executed QA scenarios (no human intervention required):
- **Happy Path**: Submit item → Get 202 → Wait 120s → Verify completed status
- **Timeout**: Submit item → Wait 4 minutes → Verify fallback status
- **Failure**: Simulate service failure → Verify error handling

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - can run immediately):
├── T1: Update Go backend config with new GCP service URL
├── T2: Update Go rembg client for async service
├── T3: Update Go handler for job tracking
└── T4: Extend polling timeout to 3 minutes

Wave 2 (Core Logic):
├── T5: Update wardrobe-processing store (extended polling)
├── T6: Add skeleton view component
├── T7: Update add-item screen for skeleton view
└── T8: Add fallback handling for timeouts

Wave 3 (Integration & Polish):
├── T9: Test full flow end-to-end
├── T10: Update environment documentation
└── T11: Add unit tests

Wave FINAL (Verification):
├── F1: Plan compliance audit
├── F2: Code quality review
├── F3: Real manual QA
└── F4: Scope fidelity check
```

### Dependency Matrix
- T1 → T2 (config must be updated before client)
- T2 → T3 (client interface changes affect handler)
- T3, T4 → T5 (backend changes enable frontend changes)
- T6 → T7 (component before screen integration)
- T5, T7 → T8 (store + screen integration)

### Agent Dispatch Summary
- **Wave 1**: 4 tasks → `deep` (Go backend changes)
- **Wave 2**: 4 tasks → `visual-engineering` (UI) + `unspecified-high` (store)
- **Wave 3**: 3 tasks → `unspecified-high` (testing)

---

## TODOs

---

- [ ] 1. Update Go backend config with new GCP service URL

  **What to do**:
  - Add `EXPO_PUBLIC_REMBG_SERVICE_URL=https://outfit-extractor-787746538147.us-central1.run.app` to `backend/.env`
  - Add `REMBG_JOB_WEBHOOK_URL` for future webhook support (optional for Phase 1)
  - Document the new service endpoint requirements

  **Must NOT do**:
  - Remove old env var until migration complete
  - Commit actual service keys to git

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: Go backend familiarity
  - **Justification**: Simple env var update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T2
  - **Blocked By**: None

  **References**:
  - `backend/.env` - Current env var location
  - `backend/internal/config/config.go:34` - `RembgServiceURL` config
  - `backend/internal/services/rembg/client.go:22` - Client initialization

  **Acceptance Criteria**:
  - [ ] `EXPO_PUBLIC_REMBG_SERVICE_URL=https://outfit-extractor-787746538147.us-central1.run.app` in `backend/.env`
  - [ ] `backend/internal/config/config.go` reads the new env var
  - [ ] Service starts without errors

  **QA Scenarios**:
  ```
  Scenario: Service starts with new config
    Tool: Bash
    Preconditions: Fresh terminal, no services running
    Steps:
      1. cd backend && go build ./...
      2. Run: EXPO_PUBLIC_REMBG_SERVICE_URL=https://outfit-extractor-787746538147.us-central1.run.app go run cmd/server/main.go
    Expected Result: Server starts on port 8080 without errors
    Failure Indicators: "missing required env vars" error
    Evidence: .sisyphus/evidence/task-1-service-start.log
  ```

---

- [ ] 2. Update Go rembg client for sync (but slow) service

  **What to do**:
  - Modify `backend/internal/services/rembg/client.go` to:
    - Call new endpoint: `POST /extract-outfit/url` (recommended) or `POST /extract-outfit` (file upload)
    - Parse response: `{ transparent_image_b64, white_bg_image_b64, labels_found[], inference_time_ms }`
    - Extend timeout from 3 minutes to 5 minutes (for 120s service + overhead)
    - Use image URL input (the service has `/extract-outfit/url` endpoint)
    - Keep existing retry logic with exponential backoff

  **Must NOT do**:
  - Break existing tests
  - Remove retry logic (service may be slow/unavailable temporarily)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: Go, HTTP client patterns
  - **Justification**: Core service client change, requires understanding async patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T3
  - **Blocked By**: T1

  **References**:
  - `backend/internal/services/rembg/client.go` - Current sync client
  - `backend/internal/services/rembg/client_test.go` - Existing tests to maintain
  - GCP Cloud Run service docs (to be provided by user)

  **Acceptance Criteria**:
  - [ ] `Client.RemoveBackground()` calls new `/extract-outfit/url` endpoint
  - [ ] Response parsed: `transparent_image_b64`, `white_bg_image_b64`, `labels_found`
  - [ ] Timeout extended to 5 minutes
  - [ ] All existing tests pass

  **QA Scenarios**:
  ```
  Scenario: Call new GCP service directly
    Tool: Bash (curl)
    Preconditions: None
    Steps:
      1. curl -X POST "https://outfit-extractor-787746538147.us-central1.run.app/extract-outfit/url" \
         -H "Content-Type: application/json" \
         -d '{"image_url": "https://example.com/test-image.jpg"}'
    Expected Result: JSON with transparent_image_b64, white_bg_image_b64, labels_found
    Failure Indicators: 500 error, timeout
Evidence: .sisyphus/evidence/task-2-gcp-service-call.json
  ```

---

- [ ] 3. Update Go handler for new service response format

  **What to do**:
  - Modify `backend/internal/handlers/wardrobe/rembg_handler.go`:
    - Call new GCP endpoint (`/extract-outfit/url`) instead of old service
    - Parse new response: `{ transparent_image_b64, white_bg_image_b64, labels_found[] }`
    - Decode base64 response and upload to storage
    - Use `transparent_image_b64` as the cutout (or `white_bg_image_b64` if preferred)
    - Keep existing async processing (goroutine) but remove polling since service is sync
    - Store `labels_found` in DB for future use (optional)

  **Must NOT do**:
  - Break existing wardrobe endpoints
  - Remove auth middleware

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: Go, base64 decoding, HTTP client
  - **Justification**: Handler changes for new API response format

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T5
  - **Blocked By**: T2

  **References**:
  - `backend/internal/handlers/wardrobe/rembg_handler.go` - Current handler
  - `backend/internal/handlers/wardrobe/handler.go` - Other wardrobe handlers
  - GCP service response: `{ transparent_image_b64, white_bg_image_b64, labels_found }`

  **Acceptance Criteria**:
  - [ ] Handler calls new `/extract-outfit/url` endpoint
  - [ ] Base64 response decoded and uploaded to storage
  - [ ] `cutout_url` updated in wardrobe_items
  - [ ] Handler works with 20-120s response time

  **QA Scenarios**:
  ```
  Scenario: Full rembg flow with new service
    Tool: Bash (curl)
    Preconditions: Backend running, valid JWT token, test image in storage
    Steps:
      1. curl -X POST http://localhost:8080/api/v1/wardrobe/{test-item-id}/process-rembg
         -H "Authorization: Bearer {token}"
      2. Wait 20-120 seconds
      3. Check wardrobe_items table for cutout_url
    Expected Result: Item updated with cutout_url after processing
    Failure Indicators: 500 error, no cutout_url after timeout
    Evidence: .sisyphus/evidence/task-3-rembg-flow.json
  ```

---

- [ ] 4. Extend backend timeout to handle slow service (20-120s)

  **What to do**:
  - Update `lib/store/wardrobe-processing.store.ts`:
    - Change `MAX_POLL_ATTEMPTS` from 60 to 180 (3 min @ 1s interval) OR
    - Change `POLL_INTERVAL_MS` to 5000ms but allow for 120s service + 60s buffer
    - Recommendation: Keep 5s interval, set MAX_POLL_ATTEMPTS to 36 (3 min)
    - For safety: Allow up to 5 minutes (60 attempts @ 5s)
  - Update `backend/internal/handlers/wardrobe/rembg_handler.go`:
    - Change `5*time.Minute` context timeout to `10*time.Minute`

  **Must NOT do**:
  - Set timeout too short (service takes 20-120s)
  - Set timeout too long (user experience)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Justification**: Simple constant updates

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T5
  - **Blocked By**: None

  **References**:
  - `lib/store/wardrobe-processing.store.ts:30-31` - Current polling config
  - `backend/internal/handlers/wardrobe/rembg_handler.go:93` - Backend timeout

  **Acceptance Criteria**:
  - [ ] `MAX_POLL_ATTEMPTS` = 60 (5 minutes @ 5s interval)
  - [ ] Backend context timeout = 10 minutes
  - [ ] Client timeout = 5 minutes

  **QA Scenarios**:
  ```
  Scenario: Polling continues for full 5 minutes
    Tool: Bash
    Preconditions: Backend returns "processing" for all polls
    Steps:
      1. Submit item for processing
      2. Verify polling continues for 5 minutes before timeout
    Expected Result: Item marked as 'failed' after 5 minutes of "processing" status
    Failure Indicators: Polling stops early, immediate timeout
    Evidence: .sisyphus/evidence/task-4-polling-timeout.log
  ```

---

- [ ] 5. Update wardrobe-processing store for extended polling

  **What to do**:
  - Ensure `lib/store/wardrobe-processing.store.ts`:
    - Correctly handles extended polling (5 minutes)
    - Shows appropriate toast messages for long processing
    - Handles fallback gracefully after timeout
    - Updates local state when status changes

  **Must NOT do**:
  - Change the store interface
  - Remove existing functionality

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: Zustand, React Native state management
  - **Justification**: Store logic changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T6, T7, T8)
  - **Blocks**: T7
  - **Blocked By**: T3, T4

  **References**:
  - `lib/store/wardrobe-processing.store.ts` - Current implementation
  - `lib/store/wardrobe.store.ts` - Related store

  **Acceptance Criteria**:
  - [ ] Store handles 5-minute polling without issues
  - [ ] Toast message updates show progress
  - [ ] Fallback handling works after timeout

  **QA Scenarios**:
  ```
  Scenario: Store handles 5-minute processing
    Tool: Unit test
    Preconditions: Mock Supabase returns "processing" for 60 polls, then "completed"
    Steps:
      1. startProcessing(testItemId)
      2. Verify polling runs for 5 minutes
      3. Verify completion callback is called
    Expected Result: onProcessingComplete called with cutout URL
    Failure Indicators: Polling stops early, timeout error thrown
    Evidence: .sisyphus/evidence/task-5-store-test.log
  ```

---

- [ ] 6. Add skeleton view component for processing state

  **What to do**:
  - Create `components/shared/SkeletonCard.tsx`:
    - Animated skeleton/shimmer effect
    - Matches `ItemCard` dimensions
    - Shows "Processing..." text
    - Uses brand colors from design tokens
  - Use `react-native-reanimated` for smooth animations

  **Must NOT do**:
  - Use hardcoded colors (use design tokens)
  - Break on different screen sizes

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: NativeWind, Reanimated, design system
  - **Justification**: UI component with animations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T7, T8)
  - **Blocks**: T7
  - **Blocked By**: None (foundation task)

  **References**:
  - `components/shared/ItemCard.tsx` - Dimensions to match
  - `components/shared/LoadingOverlay.tsx` - Existing loading pattern
  - Design tokens from AGENTS.md

  **Acceptance Criteria**:
  - [ ] `SkeletonCard` component created
  - [ ] Shimmer animation runs smoothly
  - [ ] Matches `ItemCard` dimensions

  **QA Scenarios**:
  ```
  Scenario: Skeleton card renders correctly
    Tool: Playwright (if web) or manual
    Preconditions: Component mounted
    Steps:
      1. Render SkeletonCard
      2. Verify shimmer animation is visible
      3. Check dimensions match ItemCard
    Expected Result: Animated skeleton with correct styling
    Failure Indicators: Static display, wrong dimensions
    Evidence: .sisyphus/evidence/task-6-skeleton.png
  ```

---

- [ ] 7. Update add-item screen for skeleton view

  **What to do**:
  - Modify `app/(tabs)/wardrobe/add-item.tsx`:
    - Show skeleton card in wardrobe after item added
    - Item shows in "Processing" state with skeleton UI
    - Navigate to wardrobe tab after save
    - Add item to wardrobe store immediately (optimistic)

  **Must NOT do**:
  - Block UI while processing
  - Remove camera/gallery functionality

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Justification**: Screen integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6, T8)
  - **Blocks**: T8
  - **Blocked By**: T5, T6

  **References**:
  - `app/(tabs)/wardrobe/add-item.tsx` - Current implementation
  - `app/(tabs)/wardrobe/index.tsx` - Wardrobe list screen
  - `components/shared/SkeletonCard.tsx` - New component (T6)

  **Acceptance Criteria**:
  - [ ] Item added to wardrobe store immediately
  - [ ] Skeleton shown for processing items
  - [ ] Screen navigates to wardrobe after save

  **QA Scenarios**:
  ```
  Scenario: Add item shows skeleton
    Tool: Playwright / Manual test
    Preconditions: Logged in, wardrobe screen
    Steps:
      1. Click "Add" button
      2. Select/capture image
      3. Click "Analyze & Save"
      4. Verify navigate to wardrobe
      5. Verify item shows skeleton UI
    Expected Result: Skeleton card visible with "Processing..." text
    Failure Indicators: No navigation, item not visible, no skeleton
    Evidence: .sisyphus/evidence/task-7-add-item.mp4
  ```

---

- [ ] 8. Add fallback handling for timeouts

  **What to do**:
  - Update error handling in store and backend:
    - If polling times out after 5 minutes → set `processing_status: 'fallback'`
    - Use original `image_url` if `cutout_url` is null and status is 'fallback'
    - Show appropriate toast: "Using original image (processing took too long)"
  - Update `lib/wardrobe-image.ts`:
    - Fall back to `image_url` if `cutout_url` is null and status is 'fallback'

  **Must NOT do**:
  - Lose the original image
  - Show broken image placeholders

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Justification**: Error handling enhancement

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T5, T6, T7)
  - **Blocks**: T9
  - **Blocked By**: T5, T7

  **References**:
  - `lib/wardrobe-image.ts` - Image URL utility
  - `lib/store/wardrobe-processing.store.ts` - Store fallback logic
  - `types/wardrobe.ts` - `ProcessingStatus` type

  **Acceptance Criteria**:
  - [ ] Timeout after 5 minutes → status = 'fallback'
  - [ ] Fallback items show original image
  - [ ] User notified appropriately

  **QA Scenarios**:
  ```
  Scenario: Processing times out gracefully
    Tool: Manual / Mock
    Preconditions: Service configured to never complete
    Steps:
      1. Add item for processing
      2. Wait 5 minutes
      3. Verify status = 'fallback'
      4. Verify original image displayed
    Expected Result: "Using original image" toast, original image shown
    Failure Indicators: Broken image, no toast, app crash
    Evidence: .sisyphus/evidence/task-8-fallback.png
  ```

---

- [ ] 9. Test full flow end-to-end

  **What to do**:
  - Run complete integration test:
    1. Add item via camera/gallery
    2. Verify item saved with 'processing' status
    3. Wait for GCP service to complete
    4. Verify item status updates to 'completed'
    5. Verify cutout image displayed
  - Test with real GCP service (if available)

  **Must NOT do**:
  - Skip edge cases
  - Only test happy path

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Justification**: Integration testing

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential)
  - **Parallel Group**: Wave 3 (with T10, T11)
  - **Blocks**: None (final integration)
  - **Blocked By**: T5, T6, T7, T8

  **References**:
  - Full stack context from all previous tasks

  **Acceptance Criteria**:
  - [ ] End-to-end flow works with real GCP service
  - [ ] Performance acceptable (no UI lag)
  - [ ] Error states handled gracefully

  **QA Scenarios**:
  ```
  Scenario: Full flow with real GCP service
    Tool: Manual testing
    Preconditions: Backend running, GCP service deployed
    Steps:
      1. Start backend: cd backend && go run cmd/server/main.go
      2. Start Expo: bun start
      3. Add item via app
      4. Monitor logs for job submission
      5. Wait for GCP service completion
      6. Verify final state in app
    Expected Result: Item processed successfully, cutout displayed
    Failure Indicators: Any step fails
    Evidence: .sisyphus/evidence/task-9-e2e.mp4
  ```

---

- [ ] 10. Update environment documentation

  **What to do**:
  - Update `.env.local.example` with new variables:
    - `EXPO_PUBLIC_REMBG_SERVICE_URL=https://outfit-extractor-787746538147.us-central1.run.app`
    - `REMBG_JOB_WEBHOOK_URL` (for future webhook support)
  - Update README or docs with new service information
  - Document the async nature of the new service

  **Must NOT do**:
  - Commit actual secrets
  - Remove old variables (for rollback)

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Justification**: Documentation update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T11)
  - **Blocks**: None
  - **Blocked By**: T1

  **References**:
  - `.env.local.example` - Template file
  - `backend/.env` - Current config

  **Acceptance Criteria**:
  - [ ] `.env.local.example` updated
  - [ ] Documentation reflects new service
  - [ ] Migration steps documented

---

- [ ] 11. Add unit tests

  **What to do**:
  - Add tests for:
    - Go rembg client async methods
    - Handler job tracking
    - Store polling logic
    - Skeleton component rendering
  - Use existing test infrastructure

  **Must NOT do**:
  - Skip tests for critical paths
  - Write brittle tests

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Justification**: Testing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10)
  - **Blocks**: None
  - **Blocked By**: T2, T3, T5

  **References**:
  - `backend/internal/services/rembg/client_test.go` - Existing client tests
  - `__tests__/wardrobe-processing.test.ts` - Existing store tests

  **Acceptance Criteria**:
  - [ ] All new code has test coverage
  - [ ] Existing tests still pass
  - [ ] `bun test` passes

  **QA Scenarios**:
  ```
  Scenario: Run all tests
    Tool: Bash
    Preconditions: All code implemented
    Steps:
      1. cd backend && go test ./...
      2. bun test
    Expected Result: All tests pass
    Failure Indicators: Any test failures
    Evidence: .sisyphus/evidence/task-11-tests.log
  ```

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search for forbidden patterns.

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `go build` + linter for Go, `npx tsc --noEmit` for TypeScript. Review for: error handling, logging, type safety.

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test with real GCP service if available.

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: verify everything in spec was built. Check "Must NOT do" compliance. Detect any unaccounted changes.

---

## Commit Strategy

- **Wave 1**: `feat(backend): migrate to async GCP Cloud Run rembg service`
  - Files: `backend/.env`, `backend/internal/services/rembg/client.go`, `backend/internal/handlers/wardrobe/rembg_handler.go`
  - Pre-commit: `go build ./...`

- **Wave 2**: `feat(frontend): add skeleton view for processing items`
  - Files: `components/shared/SkeletonCard.tsx`, `lib/store/wardrobe-processing.store.ts`, `app/(tabs)/wardrobe/add-item.tsx`, `lib/wardrobe-image.ts`
  - Pre-commit: `npx tsc --noEmit`

- **Wave 3**: `test: add integration tests for rembg flow`
  - Files: `backend/internal/services/rembg/client_test.go`, `__tests__/wardrobe-processing.test.ts`
  - Pre-commit: `bun test`

---

## Success Criteria

### Verification Commands
```bash
# Backend
cd backend && go build ./...  # Should build without errors
go test ./...  # Should pass

# Frontend
npx tsc --noEmit  # Should pass
bun test  # Should pass
bun start  # App should start
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Migration verified with real GCP service
