# Add Item Background Removal Service — Clean Reimplementation

## TL;DR

> **Quick Summary**: Reimplement the "Add Item to Wardrobe" flow with a clean architecture that integrates the rembg background removal service via the Go backend, with background processing UX (toast notifications), retry-with-fallback error handling, and TDD workflow. Extract business logic from screen components into proper store/lib layers.
> 
> **Deliverables**:
> - Go backend: rembg service client + async processing pipeline
> - React Native: Clean add-item screen (no business logic), background processing store
> - Tests: TDD for both frontend store logic and backend rembg handler
> - Toast notification system for processing completion
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Types → Backend rembg handler → Frontend store → Screen cleanup → Integration

---

## Context

### Original Request
User wants to reimplement the Add Item to Wardrobe feature with clean integration of a rembg background removal service (`https://rembg-service-fenilgemini2735-u98og5k0.leapcell.dev/remove-background`). The service accepts POST with multipart form data and returns a cutout image. Cost optimization is critical (free trial, limited resources).

### Interview Summary
**Key Discussions**:
- **Rembg call location**: Backend (Go) calls rembg service directly — not frontend
- **Processing UX**: Background with notification — start processing, let user browse, show toast when cutout ready
- **Failure handling**: Retry 2-3 times, then fall back to original image
- **Gemini tagging**: Keep mock tagging for full flow simulation
- **Test strategy**: TDD with Jest/bun test

**Research Findings**:
- Current `add-item.tsx` (642 lines) has business logic, direct Supabase queries, polling — all violate AGENTS.md
- `wardrobe.store.ts` uses `as any` anti-pattern for FormData
- Backend already has upload handler (`upload_handler.go`) and wardrobe CRUD (`handler.go`)
- Backend has unused edge function proxy (`edgefunction/handler.go`) — won't be needed with direct rembg call
- Types already have `processing_status` field but mock data is missing it (TypeScript errors)
- `wardrobe-image.ts` handles URL transformation for proxying images through backend

### Metis Review
**Identified Gaps** (addressed):
- **Image format validation**: Added Zod schema validation for uploaded images (JPEG/PNG only, max 10MB)
- **Concurrency handling**: Backend uses goroutine per request with semaphore for max concurrent rembg calls
- **Timeout handling**: 3-minute timeout per rembg call with proper context cancellation
- **Offline resilience**: Frontend stores pending uploads in Zustand, retries when connection restored
- **Storage cleanup**: Old temp images cleaned up after successful cutout upload
- **Duplicate prevention**: Debounce on add-item to prevent double-submission

---

## Work Objectives

### Core Objective
Clean reimplementation of Add Item flow: user captures/selects image → backend uploads to temp storage → backend calls rembg for background removal → cutout uploaded to permanent storage → DB updated → toast notification to user. All business logic extracted from screen components.

### Concrete Deliverables
- `backend/internal/handlers/wardrobe/rembg_handler.go` — rembg service client + async processing
- `backend/internal/services/rembg/client.go` — rembg HTTP client with retry logic
- `lib/store/wardrobe-processing.store.ts` — Background processing state management
- `app/(tabs)/wardrobe/add-item.tsx` — Cleaned screen (UI only, no business logic)
- `lib/store/wardrobe.store.ts` — Fixed `as any` anti-pattern, clean upload flow
- `__tests__/wardrobe-processing.test.ts` — TDD tests for processing store
- `__tests__/wardrobe-store.test.ts` — Updated tests for cleaned store
- `backend/internal/services/rembg/client_test.go` — Go tests for rembg client

### Definition of Done
- [ ] `bun test` passes all new and existing tests
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Go backend: `go test ./...` passes
- [ ] Add item flow works end-to-end: capture → upload → rembg → cutout → toast
- [ ] No business logic in screen components
- [ ] No `as any` or `@ts-ignore` in changed files
- [ ] No direct Supabase queries in screen components

### Must Have
- Backend calls rembg service (not frontend)
- Background processing with toast notification
- Retry 2-3 times with fallback to original image
- Mock Gemini tagging preserved
- TDD workflow (RED → GREEN → REFACTOR)
- All business logic in store/lib layers
- Proper TypeScript types (no `as any`)

### Must NOT Have (Guardrails)
- NO business logic in screen components (AGENTS.md violation)
- NO direct Supabase queries in screens (AGENTS.md violation)
- NO `as any`, `@ts-ignore`, `@ts-expect-error` (AGENTS.md violation)
- NO blocking UI during 2+ minute processing
- NO real Gemini API calls (mock only for this scope)
- NO changes to existing tab navigation or other screens
- NO new packages outside approved tech stack
- NO console.log in production code
- NO inline styles (use NativeWind className)
- NO StyleSheet.create (use NativeWind)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Jest + bun test for frontend, Go testing for backend)
- **Automated tests**: YES (TDD)
- **Framework**: bun test (frontend), go test (backend)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.

- **Frontend/Store**: Use Bash (bun test) — Run test suites, assert pass/fail
- **Backend**: Use Bash (go test) — Run Go test suites, assert pass/fail
- **TypeScript**: Use Bash (npx tsc --noEmit) — Zero errors
- **End-to-End**: Use Playwright — Navigate to add-item, select image, verify flow

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — types, schemas, test scaffolds):
├── Task 1: Fix TypeScript types + mock data errors [quick]
├── Task 2: Add Zod validation schemas for image upload [quick]
├── Task 3: Create TDD test scaffolds (failing tests) [quick]
└── Task 4: Define rembg service interface + types [quick]

Wave 2 (After Wave 1 — backend rembg + frontend store, MAX PARALLEL):
├── Task 5: Backend rembg HTTP client with retry [deep]
├── Task 6: Backend async processing handler [unspecified-high]
├── Task 7: Frontend wardrobe-processing store [deep]
├── Task 8: Fix wardrobe.store.ts `as any` anti-pattern [quick]
└── Task 9: Backend route registration + config [quick]

Wave 3 (After Wave 2 — screen cleanup + integration):
├── Task 10: Clean add-item.tsx screen (extract logic) [visual-engineering]
├── Task 11: Toast notification integration [quick]
├── Task 12: Wardrobe list shows processing state [visual-engineering]
└── Task 13: Integration: end-to-end flow test [deep]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

- **1-4**: — — 5-9
- **5**: 4 — 10, 13
- **6**: 5 — 10, 13
- **7**: 1, 2 — 10, 11, 12
- **8**: 1 — 10
- **9**: 5, 6 — 13
- **10**: 5, 6, 7, 8 — 11, 12, 13
- **11**: 7, 10 — 13
- **12**: 7, 10 — 13
- **13**: 5, 6, 9, 10, 11, 12 — F1-F4

### Agent Dispatch Summary

- **1**: **4** — T1-T4 → `quick`
- **2**: **5** — T5 → `deep`, T6 → `unspecified-high`, T7 → `deep`, T8 → `quick`, T9 → `quick`
- **3**: **4** — T10 → `visual-engineering`, T11 → `quick`, T12 → `visual-engineering`, T13 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [ ] 1. Fix TypeScript Types + Mock Data Errors

  **What to do**:
  - Add `ProcessingStatus` union type to `types/wardrobe.ts`:
    ```typescript
    export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'fallback';
    ```
  - Update `WardrobeItem.processing_status` to use `ProcessingStatus` type instead of raw string
  - Add `processing_status` field to all mock wardrobe items in `lib/mock-wardrobe.ts`
  - Verify `types/wardrobe.ts` WardrobeItem interface has all required fields
  - Run `npx tsc --noEmit` to confirm zero errors
  - Write failing test: verify all mock items have processing_status

  **Must NOT do**:
  - Change any type definitions beyond adding missing fields
  - Modify any other files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple field additions across known files, no architectural changes
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Scope is too small for full TDD cycle

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: None

  **References**:
  - `types/wardrobe.ts:3-19` — WardrobeItem interface (has processing_status)
  - `lib/mock-wardrobe.ts:257-276, 340-415` — Mock items missing processing_status
  - `__tests__/wardrobe.test.ts` — Existing test patterns to follow

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` passes with zero errors
  - [ ] `bun test __tests__/wardrobe.test.ts` passes

  **QA Scenarios**:
  ```
  Scenario: TypeScript compilation passes
    Tool: Bash (npx tsc --noEmit)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert exit code is 0
      3. Assert no error output
    Expected Result: Zero TypeScript errors
    Evidence: .sisyphus/evidence/task-1-tsc-check.txt

  Scenario: Mock wardrobe items have processing_status
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe.test.ts`
      2. Assert all tests pass
    Expected Result: All wardrobe tests pass
    Evidence: .sisyphus/evidence/task-1-wardrobe-test.txt
  ```

  **Commit**: YES (groups with 2, 3, 4)
  - Message: `fix(types): add missing processing_status to mock wardrobe items`
  - Files: `lib/mock-wardrobe.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 2. Add Zod Validation Schemas for Image Upload

  **What to do**:
  - Create `lib/schemas/wardrobe.ts` validation for image upload (if not exists, extend existing)
  - Validate: file type (JPEG/PNG only), max size (10MB), required fields
  - Write failing test first: invalid file types rejected, valid files pass
  - Implement schema to make tests pass

  **Must NOT do**:
  - Add new dependencies
  - Change existing schema behavior for other features

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema additions following existing patterns
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: This task explicitly requires TDD workflow
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: This is frontend schema work, not backend

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:
  - `lib/schemas/wardrobe.ts` — Existing wardrobe Zod schemas
  - `lib/schemas/auth.ts` — Pattern reference for schema structure
  - `types/wardrobe.ts` — Source types for schema validation

  **Acceptance Criteria**:
  - [ ] Schema rejects non-image files
  - [ ] Schema rejects files > 10MB
  - [ ] Schema accepts valid JPEG/PNG
  - [ ] `bun test` passes for schema tests

  **QA Scenarios**:
  ```
  Scenario: Valid image passes validation
    Tool: Bash (bun test)
    Steps:
      1. Create test with valid JPEG metadata object
      2. Run schema.parse(validImage)
      3. Assert no error thrown
    Expected Result: Schema returns validated object
    Evidence: .sisyphus/evidence/task-2-valid-image.txt

  Scenario: Invalid file type rejected
    Tool: Bash (bun test)
    Steps:
      1. Create test with .pdf file metadata
      2. Run schema.parse(invalidFile)
      3. Assert ZodError thrown with correct message
    Expected Result: Schema rejects with "Invalid file type" error
    Evidence: .sisyphus/evidence/task-2-invalid-type.txt

  Scenario: File too large rejected
    Tool: Bash (bun test)
    Steps:
      1. Create test with 11MB file size
      2. Run schema.parse(largeFile)
      3. Assert ZodError thrown
    Expected Result: Schema rejects with "File too large" error
    Evidence: .sisyphus/evidence/task-2-too-large.txt
  ```

  **Commit**: YES (groups with 1, 3, 4)
  - Message: `feat(schemas): add image upload validation with Zod`
  - Files: `lib/schemas/wardrobe.ts`, `__tests__/wardrobe-schema.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 3. Create TDD Test Scaffolds (Failing Tests)

  **What to do**:
  - Create `__tests__/wardrobe-processing.test.ts` with failing tests for processing store
  - Create `__tests__/wardrobe-store.test.ts` updates for cleaned store
  - Tests should cover: upload flow, processing status transitions, retry logic, fallback behavior
  - All tests should FAIL initially (RED phase)

  **Must NOT do**:
  - Implement any production code yet (RED phase only)
  - Change test configuration

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Test file creation following existing patterns
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Core methodology for this task
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: Frontend tests, not backend

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: None

  **References**:
  - `__tests__/wardrobe.test.ts` — Existing test patterns, mock setup
  - `jest.setup.js` — Mock configuration for Supabase, Gemini
  - `lib/store/wardrobe.store.ts` — Current store (to understand what to test)
  - `lib/store/auth.store.ts` — Pattern reference for store testing

  **Acceptance Criteria**:
  - [ ] Test file created with describe/it blocks
  - [ ] Tests fail when run (RED phase confirmed)
  - [ ] Tests cover: upload, processing status, retry, fallback, notification

  **QA Scenarios**:
  ```
  Scenario: Test scaffold runs and fails (RED)
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts`
      2. Assert tests exist and fail (functions not yet implemented)
    Expected Result: Tests fail with "function not found" or similar
    Evidence: .sisyphus/evidence/task-3-red-phase.txt
  ```

  **Commit**: YES (groups with 1, 2, 4)
  - Message: `test(wardrobe): add failing test scaffolds for processing flow`
  - Files: `__tests__/wardrobe-processing.test.ts`
  - Pre-commit: `bun test __tests__/wardrobe-processing.test.ts`

---

- [ ] 4. Define Rembg Service Interface + Types

  **What to do**:
  - Create `types/rembg.ts` with RembgService interface
  - Define: RembgRequest, RembgResponse, RembgError types
  - Document the rembg service API contract (endpoint, request format, response format)
  - Note: `ProcessingStatus` union type is defined in Task 1 (`types/wardrobe.ts`)
  - Write failing test for type validation

  **Must NOT do**:
  - Implement the actual service client
  - Change existing types

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definition work, no implementation
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: Types are shared, not backend-specific

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: None

  **References**:
  - `types/wardrobe.ts` — Pattern reference for type definitions
  - `types/index.ts` — Re-export pattern
  - Rembg service: `https://rembg-service-fenilgemini2735-u98og5k0.leapcell.dev/remove-background`

  **Acceptance Criteria**:
  - [ ] `types/rembg.ts` created with all interfaces
  - [ ] `types/index.ts` exports rembg types
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: TypeScript types compile correctly
    Tool: Bash (npx tsc --noEmit)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert zero errors
    Expected Result: Clean compilation
    Evidence: .sisyphus/evidence/task-4-types-check.txt
  ```

  **Commit**: YES (groups with 1, 2, 3)
  - Message: `feat(types): add rembg service types and processing status`
  - Files: `types/rembg.ts`, `types/index.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 5. Backend Rembg HTTP Client with Retry Logic

  **What to do**:
  - Create `backend/internal/services/rembg/client.go`
  - HTTP client that calls: `POST https://rembg-service-fenilgemini2735-u98og5k0.leapcell.dev/remove-background`
  - Multipart form upload with `file` field
  - Retry logic: 3 attempts with exponential backoff + jitter (1s±500ms, 2s±1s, 4s±2s) to prevent thundering herd
  - Timeout: 3 minutes per attempt
  - Returns cutout image bytes on success, error on failure
  - TDD: Write failing test first, then implement

  **Must NOT do**:
  - Add new Go dependencies (use stdlib `net/http`)
  - Change existing handler code
  - Hardcode the rembg URL (use config/env)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend service with retry logic, HTTP client, error handling — needs careful implementation
  - **Skills**: [`senior-backend`]
    - `senior-backend`: Go HTTP client, retry patterns, error handling are core backend concerns
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Go testing is different from JS TDD, but still test-first

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Task 4

  **References**:
  - `backend/internal/handlers/wardrobe/upload_handler.go` — Existing upload pattern
  - `backend/internal/config/config.go` — Config pattern for env vars
  - `backend/internal/response/response.go` — Response pattern
  - `backend/internal/db/types.go` — DB type definitions

  **Acceptance Criteria**:
  - [ ] `go test ./internal/services/rembg/...` passes
  - [ ] Client retries on transient failures (max 3 attempts)
  - [ ] Client respects 3-minute timeout
  - [ ] Client returns image bytes on success
  - [ ] URL configurable via environment variable

  **QA Scenarios**:
  ```
  Scenario: Successful rembg call returns image bytes
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/services/rembg/... -v -run TestRembgClient_Success`
      2. Assert test passes
    Expected Result: Client returns non-empty byte slice
    Evidence: .sisyphus/evidence/task-5-success-test.txt

  Scenario: Retry on transient failure
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/services/rembg/... -v -run TestRembgClient_Retry`
      2. Assert test passes (retries 3 times before giving up)
    Expected Result: Client retries exactly 3 times on failure
    Evidence: .sisyphus/evidence/task-5-retry-test.txt

  Scenario: Timeout respected
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/services/rembg/... -v -run TestRembgClient_Timeout`
      2. Assert test passes (returns timeout error within expected window)
    Expected Result: Client returns timeout error after 3 minutes
    Evidence: .sisyphus/evidence/task-5-timeout-test.txt
  ```

  **Commit**: YES (groups with 6, 9)
  - Message: `feat(backend): add rembg HTTP client with retry logic`
  - Files: `backend/internal/services/rembg/client.go`, `backend/internal/services/rembg/client_test.go`
  - Pre-commit: `go test ./internal/services/rembg/...`

---

- [ ] 6. Backend Async Processing Handler

  **What to do**:
  - Create `backend/internal/handlers/wardrobe/rembg_handler.go`
  - Endpoint: `POST /api/v1/wardrobe/:id/process-rembg`
  - Flow: Accepts item ID → fetches image from temp storage → calls rembg client → uploads cutout to permanent storage → updates DB (cutout_url, processing_status)
  - Async: Spawns goroutine, returns 202 Accepted immediately
  - Concurrency: Semaphore limiting max 2 concurrent rembg calls (cost control)
  - On failure after retries: updates processing_status to 'fallback' (uses original image)
  - TDD: Write failing test first

  **Must NOT do**:
  - Block the HTTP response waiting for rembg
  - Change existing wardrobe CRUD endpoints
  - Add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Async processing, goroutines, DB updates, storage operations — complex backend work
  - **Skills**: [`senior-backend`]
    - `senior-backend`: Go async patterns, DB operations, storage integration
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Go testing patterns differ from JS TDD

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 7, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 10, 13
  - **Blocked By**: Task 4, Task 5

  **References**:
  - `backend/internal/handlers/wardrobe/handler.go` — Existing handler patterns
  - `backend/internal/handlers/wardrobe/upload_handler.go` — Storage upload pattern
  - `backend/internal/db/db.go` — Database query patterns
  - `backend/internal/db/types.go` — WardrobeItem type definition
  - `types/wardrobe.ts` — Frontend type contract (processing_status values)

  **Acceptance Criteria**:
  - [ ] `go test ./internal/handlers/wardrobe/... -run TestRembg` passes
  - [ ] Endpoint returns 202 Accepted immediately
  - [ ] Goroutine processes image in background
  - [ ] DB updated with cutout_url on success
  - [ ] DB updated with processing_status='fallback' on failure
  - [ ] Max 2 concurrent rembg calls (semaphore)

  **QA Scenarios**:
  ```
  Scenario: Processing endpoint returns 202 immediately
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/handlers/wardrobe/... -v -run TestRembgHandler_AcceptsImmediately`
      2. Assert response status is 202
    Expected Result: Handler returns 202 Accepted without waiting
    Evidence: .sisyphus/evidence/task-6-202-test.txt

  Scenario: Background processing updates DB on success
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/handlers/wardrobe/... -v -run TestRembgHandler_UpdatesDB`
      2. Assert DB row has cutout_url populated
    Expected Result: wardrobe_items.cutout_url updated after processing
    Evidence: .sisyphus/evidence/task-6-db-update-test.txt

  Scenario: Fallback on rembg failure
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/handlers/wardrobe/... -v -run TestRembgHandler_Fallback`
      2. Assert processing_status = 'fallback' after all retries exhausted
    Expected Result: Item marked as fallback, original image preserved
    Evidence: .sisyphus/evidence/task-6-fallback-test.txt
  ```

  **Commit**: YES (groups with 5, 9)
  - Message: `feat(backend): add async rembg processing handler with fallback`
  - Files: `backend/internal/handlers/wardrobe/rembg_handler.go`, `backend/internal/handlers/wardrobe/rembg_handler_test.go`
  - Pre-commit: `go test ./internal/handlers/wardrobe/...`

---

- [ ] 7. Frontend Wardrobe Processing Store

  **What to do**:
  - Create `lib/store/wardrobe-processing.store.ts`
  - Zustand store managing: processing queue, status polling, notification state
  - Actions: `startProcessing(itemId)`, `checkStatus(itemId)`, `onProcessingComplete(itemId, cutoutUrl)`, `onProcessingFailed(itemId, error)`
  - Polling: Check processing status every 5 seconds, max 60 attempts (5 min)
  - On complete: Update wardrobe store with cutout_url, trigger toast
  - On failure: Update wardrobe store with fallback status, trigger error toast
  - TDD: Tests already scaffolded in Task 3, now make them pass

  **Must NOT do**:
  - Add UI components
  - Call rembg service directly (backend handles this)
  - Mutate wardrobe store directly (use its setters)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: New store with async polling, state transitions, cross-store coordination
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Making scaffolded tests pass (GREEN phase)
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: This is frontend Zustand store work

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 8, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 10, 11, 12
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `lib/store/wardrobe.store.ts` — Existing store patterns, persist middleware
  - `lib/store/auth.store.ts` — Store pattern reference
  - `__tests__/wardrobe.test.ts` — Test patterns, mock setup
  - `components/shared/Toast` — Toast component for notifications
  - `lib/supabase.ts` — Supabase client for status polling

  **Acceptance Criteria**:
  - [ ] `bun test __tests__/wardrobe-processing.test.ts` passes
  - [ ] Store tracks processing state per item
  - [ ] Polling starts/stops correctly
  - [ ] Toast triggered on completion/failure
  - [ ] Wardrobe store updated with cutout_url

  **QA Scenarios**:
  ```
  Scenario: Processing store tracks item status
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "tracks processing status"`
      2. Assert store reflects correct status transitions
    Expected Result: Status flows: pending → processing → completed
    Evidence: .sisyphus/evidence/task-7-status-tracking.txt

  Scenario: Polling stops on completion
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "stops polling on completion"`
      2. Assert polling interval cleared after completion
    Expected Result: No further poll attempts after completed/failed
    Evidence: .sisyphus/evidence/task-7-polling-stop.txt

  Scenario: Fallback status on failure
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "handles failure with fallback"`
      2. Assert store updates to fallback status
    Expected Result: Status transitions to 'fallback', original image preserved
    Evidence: .sisyphus/evidence/task-7-fallback.txt
  ```

  **Commit**: YES
  - Message: `feat(store): add wardrobe processing store with polling and notifications`
  - Files: `lib/store/wardrobe-processing.store.ts`
  - Pre-commit: `bun test __tests__/wardrobe-processing.test.ts`

---

- [ ] 8. Fix wardrobe.store.ts `as any` Anti-Pattern

  **What to do**:
  - Replace `as any` in `lib/store/wardrobe.store.ts:67` with proper typing
  - Use `ReactNativeFile` type from `react-native` or define proper FormData interface
  - Clean up ALL `as any` occurrences in the file
  - Ensure FormData construction is type-safe
  - Write test to verify upload works without type assertion

  **Must NOT do**:
  - Change upload logic or flow
  - Add new dependencies for this fix alone
  - Introduce `@ts-ignore` as alternative

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Targeted type fix, well-scoped
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Too small for full TDD cycle, but will add assertion test

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 7, 9)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **References**:
  - `lib/store/wardrobe.store.ts:60-79` — Current FormData with `as any`
  - `lib/store/wardrobe.store.ts:293-298` — Second `as any` occurrence
  - `AGENTS.md` — Anti-patterns: "NEVER use as any"

  **Acceptance Criteria**:
  - [ ] Zero `as any` in `lib/store/wardrobe.store.ts`
  - [ ] `npx tsc --noEmit` passes
  - [ ] `bun test __tests__/wardrobe.test.ts` passes

  **QA Scenarios**:
  ```
  Scenario: No `as any` in wardrobe store
    Tool: Bash (grep)
    Steps:
      1. Run `grep -n "as any" lib/store/wardrobe.store.ts`
      2. Assert zero matches
    Expected Result: No `as any` found
    Evidence: .sisyphus/evidence/task-8-no-as-any.txt

  Scenario: TypeScript compilation passes
    Tool: Bash (npx tsc --noEmit)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert zero errors
    Expected Result: Clean compilation
    Evidence: .sisyphus/evidence/task-8-tsc-check.txt
  ```

  **Commit**: YES
  - Message: `fix(store): remove as any anti-pattern from wardrobe store`
  - Files: `lib/store/wardrobe.store.ts`
  - Pre-commit: `npx tsc --noEmit && bun test __tests__/wardrobe.test.ts`

---

- [ ] 9. Backend Route Registration + Config

  **What to do**:
  - Add `EXPO_PUBLIC_REMBG_SERVICE_URL` to backend config (`backend/internal/config/config.go`)
  - Register rembg processing route in wardrobe handler routes
  - Add env var to `.env.local.example`
  - Wire rembg handler into server setup (`backend/cmd/server/main.go`)
  - Write test to verify route is registered

  **Must NOT do**:
  - Change existing routes
  - Add new config files
  - Modify server structure beyond route registration

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config additions and route wiring
  - **Skills**: [`senior-backend`]
    - `senior-backend`: Go config patterns, route registration
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Simple wiring, not complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 7, 8)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `backend/internal/config/config.go` — Config pattern
  - `backend/cmd/server/main.go` — Server setup, handler wiring
  - `backend/internal/handlers/wardrobe/handler.go:37-49` — Route registration pattern
  - `.env.local.example` — Environment variable documentation

  **Acceptance Criteria**:
  - [ ] `go build ./...` succeeds
  - [ ] Route `/api/v1/wardrobe/:id/process-rembg` registered
  - [ ] `EXPO_PUBLIC_REMBG_SERVICE_URL` in config and .env.local.example
  - [ ] `go test` passes for affected packages

  **QA Scenarios**:
  ```
  Scenario: Backend builds successfully
    Tool: Bash (go build)
    Steps:
      1. Run `go build ./...` in backend/
      2. Assert exit code 0
    Expected Result: Clean build
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: Route is registered
    Tool: Bash (go test)
    Steps:
      1. Run `go test ./internal/handlers/wardrobe/... -v -run TestRouteRegistration`
      2. Assert route exists
    Expected Result: Route registration confirmed
    Evidence: .sisyphus/evidence/task-9-route-test.txt
  ```

  **Commit**: YES (groups with 5, 6)
  - Message: `feat(backend): register rembg processing route and config`
  - Files: `backend/internal/config/config.go`, `backend/cmd/server/main.go`, `.env.local.example`
  - Pre-commit: `go build ./...`

---

- [ ] 10. Clean Add-Item Screen (Extract Business Logic)

  **What to do**:
  - Refactor `app/(tabs)/wardrobe/add-item.tsx` to UI-only component
  - Remove: `pollForProcessingCompletion()`, `triggerBackgroundRemoval()`, direct Supabase queries
  - Remove: All business logic — delegate to wardrobe store and processing store
  - Screen should only: capture/select image, show preview, call store action, display loading overlay
  - After save: trigger processing via store, show "Processing in background" toast, navigate back
  - Keep all UI/UX intact (camera, gallery, preview, animations)
  - Take snapshot test BEFORE refactoring to detect unintended UI changes
  - TDD: Write test for screen behavior first

  **Must NOT do**:
  - Change UI appearance or animations
  - Add new UI components
  - Keep any Supabase client imports
  - Keep any direct API calls

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Screen refactoring that must preserve UI/UX while changing internal architecture
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Test screen behavior before refactoring
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: This is frontend screen work

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 5, 6, 7, 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 11, 12, 13
  - **Blocked By**: Tasks 5, 6, 7, 8

  **References**:
  - `app/(tabs)/wardrobe/add-item.tsx` — Current implementation (642 lines)
  - `lib/store/wardrobe.store.ts` — Store actions to delegate to
  - `lib/store/wardrobe-processing.store.ts` — New processing store
  - `components/shared/LoadingOverlay` — Loading overlay component
  - `components/shared/Toast` — Toast notification component
  - `lib/gemini.ts:26-168` — tagWardrobeItem (mock) to keep

  **Acceptance Criteria**:
  - [ ] Screen has zero Supabase imports
  - [ ] Screen has zero direct fetch/API calls
  - [ ] Screen delegates all logic to stores
  - [ ] UI appearance unchanged
  - [ ] `npx tsc --noEmit` passes
  - [ ] Screen under 200 lines (was 642)

  **QA Scenarios**:
  ```
  Scenario: Screen has no business logic
    Tool: Bash (grep)
    Steps:
      1. Run `grep -n "supabase\|fetch(" app/\(tabs\)/wardrobe/add-item.tsx`
      2. Assert zero matches
    Expected Result: No supabase or fetch calls in screen
    Evidence: .sisyphus/evidence/task-10-no-business-logic.txt

  Scenario: Screen renders correctly
    Tool: Bash (npx tsc --noEmit)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert zero errors
    Expected Result: Clean compilation
    Evidence: .sisyphus/evidence/task-10-tsc-check.txt

  Scenario: Screen line count reduced
    Tool: Bash (wc)
    Steps:
      1. Run `wc -l app/\(tabs\)/wardrobe/add-item.tsx`
      2. Assert line count < 200
    Expected Result: Screen under 200 lines
    Evidence: .sisyphus/evidence/task-10-line-count.txt
  ```

  **Commit**: YES
  - Message: `refactor(screen): extract business logic from add-item screen`
  - Files: `app/(tabs)/wardrobe/add-item.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 11. Toast Notification Integration

  **What to do**:
  - Wire up toast notifications in processing store for:
    - "Background removal started" (info toast on save)
    - "Image processed successfully" (success toast with cutout preview)
    - "Using original image (processing failed)" (warning toast on fallback)
  - Use existing `components/shared/Toast` component
  - Integrate with wardrobe-processing store's onComplete/onFailed callbacks

  **Must NOT do**:
  - Create new Toast component
  - Change Toast component API
  - Add notification dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Wiring existing component to store callbacks
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `visual-engineering`: No UI changes, just wiring

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 7, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 7, 10

  **References**:
  - `components/shared/Toast` — Existing toast component
  - `lib/store/wardrobe-processing.store.ts` — Store with onComplete/onFailed
  - `lib/gemini.ts` — Pattern for showing toasts after operations

  **Acceptance Criteria**:
  - [ ] Toast shows on processing start
  - [ ] Toast shows on processing complete
  - [ ] Toast shows on processing failure/fallback
  - [ ] Toast messages match design tokens

  **QA Scenarios**:
  ```
  Scenario: Toast shows on processing start
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "toast on start"`
      2. Assert toast triggered with correct message
    Expected Result: Info toast "Processing image in background..."
    Evidence: .sisyphus/evidence/task-11-start-toast.txt

  Scenario: Toast shows on completion
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "toast on complete"`
      2. Assert success toast triggered
    Expected Result: Success toast "Image processed successfully"
    Evidence: .sisyphus/evidence/task-11-complete-toast.txt

  Scenario: Toast shows on fallback
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-processing.test.ts -t "toast on fallback"`
      2. Assert warning toast triggered
    Expected Result: Warning toast "Using original image (processing unavailable)"
    Evidence: .sisyphus/evidence/task-11-fallback-toast.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): integrate toast notifications for background processing`
  - Files: `lib/store/wardrobe-processing.store.ts`
  - Pre-commit: `bun test __tests__/wardrobe-processing.test.ts`

---

- [ ] 12. Wardrobe List Shows Processing State

  **What to do**:
  - Update wardrobe list screen to show processing indicators for items with `processing_status !== 'ready'`
  - Show loading skeleton/overlay on items being processed
  - Show cutout image when available (cutout_url), fallback to original (image_url)
  - Use `lib/wardrobe-image.ts` getWardrobeItemImageUrl() for URL resolution
  - Auto-refresh list when processing completes (via store subscription)

  **Must NOT do**:
  - Change wardrobe list layout
  - Add new components beyond processing indicator
  - Modify other tabs

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI updates to show processing state, must match design system
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `test-driven-development`: Visual changes, harder to TDD

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 7, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 13
  - **Blocked By**: Tasks 7, 10

  **References**:
  - `app/(tabs)/wardrobe/index.tsx` — Wardrobe list screen
  - `lib/wardrobe-image.ts` — URL transformation utilities
  - `types/wardrobe.ts:18` — processing_status field
  - `lib/store/wardrobe-processing.store.ts` — Processing state
  - Design tokens: `Colors.light.primary` for loading indicators

  **Acceptance Criteria**:
  - [ ] Items with processing_status='processing' show loading indicator
  - [ ] Items with cutout_url display cutout image
  - [ ] Items with processing_status='fallback' show original image
  - [ ] List auto-updates when processing completes
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: Processing item shows loading indicator
    Tool: Bash (npx tsc --noEmit)
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert zero errors
    Expected Result: Clean compilation
    Evidence: .sisyphus/evidence/task-12-tsc-check.txt

  Scenario: Cutout image displayed when available
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe.test.ts -t "displays cutout image"`
      2. Assert wardrobe list uses cutout_url when available
    Expected Result: Item renders with cutout_url, not image_url
    Evidence: .sisyphus/evidence/task-12-cutout-display.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): show processing state in wardrobe list`
  - Files: `app/(tabs)/wardrobe/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 13. Integration: End-to-End Flow Test

  **What to do**:
  - Create integration test that verifies the complete flow:
    1. User selects image
    2. Image uploaded to temp storage
    3. Item created with processing_status='processing'
    4. Backend rembg processing triggered
    5. Cutout uploaded, DB updated
    6. Frontend receives notification, updates UI
  - Mock rembg service response for testing
  - Mock Supabase storage for testing
  - Test both success path and failure/fallback path

  **Must NOT do**:
  - Call real rembg service
  - Call real Supabase
  - Test unrelated features

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Full integration test spanning frontend store, backend handler, and mock services
  - **Skills**: [`test-driven-development`]
    - `test-driven-development`: Integration test creation
  - **Skills Evaluated but Omitted**:
    - `senior-backend`: Integration test is primarily frontend-focused

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on ALL previous tasks)
  - **Parallel Group**: Wave 3 (final implementation task)
  - **Blocks**: Final Verification Wave
  - **Blocked By**: Tasks 5, 6, 7, 9, 10, 11, 12

  **References**:
  - `__tests__/wardrobe.test.ts` — Existing integration test patterns
  - `jest.setup.js` — Mock configuration
  - `lib/store/wardrobe.store.ts` — Store to test
  - `lib/store/wardrobe-processing.store.ts` — Processing store to test
  - `app/(tabs)/wardrobe/add-item.tsx` — Screen flow to verify

  **Acceptance Criteria**:
  - [ ] Integration test passes for success path
  - [ ] Integration test passes for failure/fallback path
  - [ ] `bun test __tests__/wardrobe-integration.test.ts` passes
  - [ ] All existing tests still pass

  **QA Scenarios**:
  ```
  Scenario: Full success flow end-to-end
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-integration.test.ts -t "success flow"`
      2. Assert: upload → processing → completion → toast → UI update
    Expected Result: All steps execute, item shows cutout image
    Evidence: .sisyphus/evidence/task-13-success-flow.txt

  Scenario: Full failure flow with fallback
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test __tests__/wardrobe-integration.test.ts -t "fallback flow"`
      2. Assert: upload → processing → failure → fallback toast → original image
    Expected Result: Item preserved with original image, warning toast shown
    Evidence: .sisyphus/evidence/task-13-fallback-flow.txt

  Scenario: All tests pass
    Tool: Bash (bun test)
    Steps:
      1. Run `bun test`
      2. Assert all tests pass
    Expected Result: 0 failures across all test files
    Evidence: .sisyphus/evidence/task-13-all-tests.txt
  ```

  **Commit**: YES
  - Message: `test(integration): add end-to-end flow tests for add-item with rembg`
  - Files: `__tests__/wardrobe-integration.test.ts`
  - Pre-commit: `bun test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1 (Tasks 1-4)**: `fix(types): add missing processing_status and validation schemas`
  - Files: `types/rembg.ts`, `types/index.ts`, `lib/schemas/wardrobe.ts`, `lib/mock-wardrobe.ts`, `__tests__/wardrobe-processing.test.ts`
  - Pre-commit: `npx tsc --noEmit && bun test`

- **Wave 2 (Tasks 5-6, 9)**: `feat(backend): add rembg processing pipeline with retry and fallback`
  - Files: `backend/internal/services/rembg/client.go`, `backend/internal/services/rembg/client_test.go`, `backend/internal/handlers/wardrobe/rembg_handler.go`, `backend/internal/handlers/wardrobe/rembg_handler_test.go`, `backend/internal/config/config.go`, `backend/cmd/server/main.go`, `.env.local.example`
  - Pre-commit: `go test ./... && go build ./...`

- **Wave 2 (Tasks 7-8)**: `feat(store): add processing store and fix type anti-patterns`
  - Files: `lib/store/wardrobe-processing.store.ts`, `lib/store/wardrobe.store.ts`
  - Pre-commit: `npx tsc --noEmit && bun test __tests__/wardrobe-processing.test.ts`

- **Wave 3 (Tasks 10-12)**: `refactor(frontend): clean add-item screen and integrate processing UX`
  - Files: `app/(tabs)/wardrobe/add-item.tsx`, `app/(tabs)/wardrobe/index.tsx`
  - Pre-commit: `npx tsc --noEmit`

- **Wave 3 (Task 13)**: `test(integration): add end-to-end flow tests`
  - Files: `__tests__/wardrobe-integration.test.ts`
  - Pre-commit: `bun test`

---

## Success Criteria

### Verification Commands
```bash
npx tsc --noEmit              # Expected: zero errors
bun test                       # Expected: all tests pass, 0 failures
go test ./...                  # Expected: all Go tests pass
go build ./...                 # Expected: clean build in backend/
grep -rn "as any" lib/         # Expected: zero matches
grep -rn "supabase" app/       # Expected: zero matches (no direct queries in screens)
```

### Final Checklist
- [ ] All "Must Have" present (backend rembg, background processing, retry/fallback, mock tagging, TDD, clean architecture, proper types)
- [ ] All "Must NOT Have" absent (no business logic in screens, no as any, no direct Supabase in screens, no blocking UI, no real Gemini, no new packages)
- [ ] All tests pass (frontend + backend)
- [ ] TypeScript compilation clean
- [ ] Screen reduced from 642 lines to under 200
- [ ] Evidence files captured for all QA scenarios
