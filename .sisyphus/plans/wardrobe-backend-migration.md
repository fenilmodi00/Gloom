# Wardrobe Backend Migration Plan

## TL;DR

> **Quick Summary**: Migrate the wardrobe system from direct Supabase Storage client calls to routing ALL database and storage operations through the Go/Fiber backend API. Fix response contract mismatches, add auth headers, and clean up unused Supabase imports.
>
> **Deliverables**:
> - Backend response wrapping fix (`{ data: [...] }` contract)
> - Frontend image upload via presigned URL endpoint (no direct `supabase.storage`)
> - Authorization header on all wardrobe fetch calls
> - `EXPO_PUBLIC_BACKEND_URL` env var added
> - Unused Supabase imports removed from wardrobe code
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO - sequential (backend fix must precede frontend fixes)
> **Critical Path**: Backend response fix → Store auth headers → Image upload migration → Add-item flow migration → Cleanup

---

## Context

### Original Request
User wants to route all wardrobe database calls through the Go backend instead of direct Supabase client calls.

### Interview Summary
**Key Discussions**:
- Wardrobe CRUD (fetch/create/delete) already uses backend API but has bugs
- Image upload still uses `supabase.storage` directly in 2 files: `wardrobe.store.ts` and `add-item.tsx`
- Backend has a `POST /api/v1/presigned-url` handler ready but unused by frontend
- Dev auth bypass masks missing Authorization headers

**Research Findings**:
- Backend `response.Success()` returns raw data (no wrapper), but frontend expects `{ data: [...] }`
- `fetchItems` and `removeItem` don't send Authorization headers
- `EXPO_PUBLIC_BACKEND_URL` not in `.env.local` — code defaults to `http://localhost:8080`
- Presigned URL handler validates bucket (`wardrobe-images`) and file extension (`.jpg/.jpeg/.png/.webp`)
- Auth middleware has dev bypass: missing header → `00000000-0000-0000-0000-000000000000`

### Metis Review
**Identified Gaps** (addressed):
- JWT token availability: Auth store has `session` field containing the JWT. All fetch calls must include `Authorization: Bearer <session>`.
- Presigned URL response shape: Returns `{ url, path }` — frontend must PUT to `url`, then use `SUPABASE_URL/storage/v1/object/wardrobe-images/{path}` as public URL.
- Response contract: Backend `response.Success()` unwraps data. Fix: wrap all responses in `{ data: ... }` in backend.
- Upload failure rollback: If presigned upload succeeds but item creation fails, image is orphaned. Acceptable for v1 — cleanup jobs are Phase 2.

---

## Work Objectives

### Core Objective
Remove ALL direct Supabase client usage from wardrobe-related code and route everything through the Go/Fiber backend API.

### Concrete Deliverables
- Backend: Wrap all wardrobe handler responses in `{ data: ... }` envelope
- Frontend: `uploadImage` uses `POST /api/v1/presigned-url` + PUT to Supabase Storage
- Frontend: All fetch calls include `Authorization: Bearer <token>` header
- Frontend: `add-item.tsx` uses store's `uploadImage` instead of direct `supabase.storage`
- Config: `EXPO_PUBLIC_BACKEND_URL` added to `.env.local` and `.env.local.example`
- Cleanup: Remove unused `supabase` and `STORAGE_BUCKETS` imports from wardrobe code

### Definition of Done
- [ ] `grep -r "supabase" app/\(tabs\)/wardrobe/ lib/store/wardrobe.store.ts` returns 0 matches for storage calls
- [ ] `npx tsc --noEmit` passes
- [ ] All wardrobe API calls include Authorization header
- [ ] Image upload flow works: presigned URL → Supabase PUT → item creation with public URL

### Must Have
- No direct `supabase.storage` calls in wardrobe code
- Authorization header on all `fetch()` calls to backend
- Response contract consistency (`{ data: ... }` wrapper)
- Backend URL configurable via env var

### Must NOT Have (Guardrails)
- Changes to backend presigned URL handler (already works)
- Changes to auth token generation/refresh flow
- Changes to other features (profiles, outfits, favorites)
- New npm packages
- Changes to Supabase RLS policies or database schema

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (bun test configured)
- **Automated tests**: Tests-after (add tests for store methods after implementation)
- **Framework**: bun test
- **Agent-Executed QA**: YES — all tasks include QA scenarios

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/`.

- **Frontend/UI**: Playwright (navigate wardrobe, trigger add-item flow)
- **API/Backend**: Bash (curl to test endpoints, verify response shape)
- **Store logic**: Bash (bun test for store method behavior)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sequential — backend fix first):
└── Task 1: Fix backend response wrapping (response.Success → { data: ... })

Wave 2 (After Wave 1 — frontend fixes, can run in parallel):
├── Task 2: Add EXPO_PUBLIC_BACKEND_URL to env files
├── Task 3: Fix fetchItems response parsing + add auth header
├── Task 4: Fix removeItem to include auth header
└── Task 5: Migrate uploadImage to presigned URL flow

Wave 3 (After Wave 2 — integration):
├── Task 6: Migrate add-item.tsx handleSave to use store uploadImage
└── Task 7: Clean up unused Supabase imports from wardrobe code

Final: Verification wave
```

### Dependency Matrix
- **1** → 3, 4, 5 (backend response shape must be correct before frontend fixes)
- **2** → — (independent, env config)
- **3** → — (independent after 1)
- **4** → — (independent after 1)
- **5** → 6 (store uploadImage must work before add-item uses it)
- **6** → 7 (add-item must be migrated before removing imports)
- **7** → — (final cleanup, no dependents)

### Agent Dispatch Summary
- **1**: `deep` — Backend Go code, response contract fix
- **2**: `quick` — Env file edit
- **3**: `quick` — Store method fix
- **4**: `quick` — Store method fix
- **5**: `deep` — Store uploadImage rewrite
- **6**: `deep` — Add-item flow refactor
- **7**: `quick` — Import cleanup

---

## TODOs

- [ ] 1. Fix backend response wrapping — all wardrobe handlers return `{ data: ... }`

  **What to do**:
  - Modify `backend/internal/response/response.go`: Change `Success` to wrap data: `return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": data})`
  - Modify `Created` similarly: `return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": data})`
  - Verify `NoContent`, `BadRequest`, `Unauthorized`, `NotFound`, `ValidationError`, `InternalError` return error shapes (they use `ErrorResponse` struct — already correct)
  - Run `go build ./...` from `backend/` to verify compilation

  **Must NOT do**:
  - Change presigned URL handler (already works)
  - Change error response shapes
  - Change other handlers (profile, outfit) — only wardrobe is in scope

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Go backend code, needs understanding of Fiber response patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential, must complete before frontend fixes)
  - **Blocks**: Tasks 3, 4, 5
  - **Blocked By**: None

  **References**:
  - `backend/internal/response/response.go:17-19` — `Success()` currently returns raw data, must wrap
  - `backend/internal/response/response.go:21-23` — `Created()` same issue
  - `backend/internal/handlers/wardrobe/handler.go:73` — `ListItems` calls `response.Success(c, items)` — returns array
  - `backend/internal/handlers/wardrobe/handler.go:104` — `CreateItem` calls `response.Created(c, item)` — returns object
  - `backend/internal/handlers/wardrobe/handler.go:125` — `GetItem` calls `response.Success(c, item)` — returns object
  - `backend/internal/handlers/wardrobe/handler.go:214` — `UpdateItem` calls `response.Success(c, item)` — returns object

  **Acceptance Criteria**:
  - [ ] `response.Success()` wraps data in `{ "data": ... }` JSON
  - [ ] `response.Created()` wraps data in `{ "data": ... }` JSON
  - [ ] `go build ./...` from `backend/` succeeds
  - [ ] `go test ./internal/handlers/wardrobe/` passes (handler tests exist)

  **QA Scenarios**:

  ```
  Scenario: Backend returns wrapped wardrobe list
    Tool: Bash (curl)
    Preconditions: Backend running on localhost:8080
    Steps:
      1. curl -X GET http://localhost:8080/api/v1/wardrobe
      2. Verify response is valid JSON with "data" key containing array
    Expected Result: { "data": [...] } — even if empty array
    Failure Indicators: Response is raw array [...] without wrapper, or 500 error
    Evidence: .sisyphus/evidence/task-1-wrapped-response.json

  Scenario: Backend returns wrapped created item
    Tool: Bash (curl)
    Preconditions: Backend running, valid test payload
    Steps:
      1. curl -X POST http://localhost:8080/api/v1/wardrobe -H "Content-Type: application/json" -d '{"image_url":"https://example.com/img.jpg","category":"tops"}'
      2. Verify response has "data" key with item object
    Expected Result: { "data": { "id": "...", "image_url": "...", ... } }
    Failure Indicators: Response is raw object without wrapper
    Evidence: .sisyphus/evidence/task-1-created-response.json
  ```

  **Commit**: YES (grouped with Wave 1)
  - Message: `fix(backend): wrap wardrobe responses in { data: [...] } envelope`
  - Files: `backend/internal/response/response.go`

---

- [ ] 2. Add EXPO_PUBLIC_BACKEND_URL to env files

  **What to do**:
  - Add `EXPO_PUBLIC_BACKEND_URL=http://localhost:8080` to `.env.local`
  - Add `EXPO_PUBLIC_BACKEND_URL=http://your-backend-host:8080` to `.env.local.example`
  - Verify no other env files need updating

  **Must NOT do**:
  - Change the default fallback in store code (keep `|| 'http://localhost:8080'`)
  - Add env vars for other services

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line edit in 2 files
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 4, 5)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `.env.local` — current Supabase config, add backend URL after Gemini section
  - `.env.local.example` — example file, add matching entry with placeholder

  **Acceptance Criteria**:
  - [ ] `.env.local` contains `EXPO_PUBLIC_BACKEND_URL=http://localhost:8080`
  - [ ] `.env.local.example` contains `EXPO_PUBLIC_BACKEND_URL=http://your-backend-host:8080`

  **QA Scenarios**:

  ```
  Scenario: Backend URL is readable from env
    Tool: Bash
    Preconditions: None
    Steps:
      1. grep EXPO_PUBLIC_BACKEND_URL .env.local
      2. Verify value is http://localhost:8080
    Expected Result: Line found with correct value
    Failure Indicators: Line missing or wrong value
    Evidence: .sisyphus/evidence/task-2-env-check.txt
  ```

  **Commit**: YES (grouped with Wave 2)
  - Message: `config: add EXPO_PUBLIC_BACKEND_URL to env files`
  - Files: `.env.local`, `.env.local.example`

---

- [ ] 3. Fix fetchItems — handle `{ data: [...] }` response + add Authorization header

  **What to do**:
  - In `lib/store/wardrobe.store.ts`, `fetchItems` method (line 117):
    - Add Authorization header: `headers: { 'Authorization': 'Bearer ' + (useAuthStore.getState().session || '') }`
    - Fix response parsing: `const json = await response.json(); set({ items: (json.data || []) ... })` (backend now returns `{ data: [...] }`)
  - Import `useAuthStore` (already imported on line 6)

  **Must NOT do**:
  - Change the method signature or return type
  - Add error toast or UI notification (store just sets `error` state)
  - Modify other store methods in this task

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small targeted edit in one method
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 4, 5)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `lib/store/wardrobe.store.ts:117-143` — current `fetchItems` implementation
  - `lib/store/wardrobe.store.ts:46-48` — `addItem` already shows the `backendUrl` pattern
  - `lib/store/auth.store.ts:9` — `session` field contains the JWT token

  **Acceptance Criteria**:
  - [ ] `fetchItems` sends `Authorization: Bearer <token>` header
  - [ ] Response is parsed as `json.data` (not raw array)
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: fetchItems includes auth header and parses response.data
    Tool: Bash (code inspection)
    Preconditions: None
    Steps:
      1. Read wardrobe.store.ts fetchItems method
      2. Verify Authorization header is in fetch options
      3. Verify response.json().data is used for items
    Expected Result: Header present, response parsed via .data
    Failure Indicators: Missing header, raw array destructuring
    Evidence: .sisyphus/evidence/task-3-code-check.txt
  ```

  **Commit**: YES (grouped with Wave 2)
  - Message: `fix(wardrobe): parse response.data + add auth header to fetchItems`
  - Files: `lib/store/wardrobe.store.ts`

---

- [ ] 4. Fix removeItem — add Authorization header

  **What to do**:
  - In `lib/store/wardrobe.store.ts`, `removeItem` method (line 87):
    - Add Authorization header to the DELETE fetch call
    - Pattern: `headers: { 'Authorization': 'Bearer ' + (useAuthStore.getState().session || '') }`

  **Must NOT do**:
  - Change the method signature
  - Modify error handling beyond ensuring it still works

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Same pattern as Task 3, single header addition
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 5)
  - **Blocks**: None
  - **Blocked By**: Task 1

  **References**:
  - `lib/store/wardrobe.store.ts:87-109` — current `removeItem` implementation
  - `lib/store/wardrobe.store.ts:46-48` — `addItem` shows the auth header pattern

  **Acceptance Criteria**:
  - [ ] `removeItem` sends `Authorization: Bearer <token>` header
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: removeItem includes auth header
    Tool: Bash (code inspection)
    Preconditions: None
    Steps:
      1. Read wardrobe.store.ts removeItem method
      2. Verify Authorization header is in fetch options
    Expected Result: Header present in DELETE request
    Failure Indicators: Missing Authorization header
    Evidence: .sisyphus/evidence/task-4-code-check.txt
  ```

  **Commit**: YES (grouped with Wave 2)
  - Message: `fix(wardrobe): add auth header to removeItem`
  - Files: `lib/store/wardrobe.store.ts`

---

- [ ] 5. Migrate uploadImage to presigned URL flow via backend

  **What to do**:
  - In `lib/store/wardrobe.store.ts`, rewrite `uploadImage` method (line 145):
    1. Remove all `supabase.storage` calls
    2. Remove `import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from '../supabase'` (only if no other code in this file uses it)
    3. New flow:
       a. Get presigned URL: `POST ${backendUrl}/api/v1/presigned-url` with `{ bucket: 'wardrobe-images', path: '${userId}/${timestamp}.jpg' }`
       b. Parse response: `{ url, path }`
       c. Fetch the local image URI to get a blob
       d. PUT the blob to the presigned `url`
       e. Construct public URL: `https://owdserrhktdarvbtadwy.supabase.co/storage/v1/object/wardrobe-images/${path}`
       f. Return the public URL
    4. Add Authorization header to presigned URL request
    5. Import supabase URL from env (`process.env.EXPO_PUBLIC_SUPABASE_URL`)

  **Must NOT do**:
  - Change the method signature (`uploadImage(uri: string) => Promise<string>`)
  - Add progress tracking (not in scope)
  - Modify the presigned URL backend handler

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-step upload flow with error handling, needs careful implementation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 2, 3, 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1

  **References**:
  - `lib/store/wardrobe.store.ts:145-172` — current `uploadImage` with direct Supabase calls
  - `backend/internal/handlers/presigned/handler.go:46-109` — presigned URL handler (returns `{ url, path }`)
  - `backend/internal/handlers/presigned/handler.go:33-36` — request shape: `{ bucket, path }`
  - `backend/internal/handlers/presigned/handler.go:60-62` — validates bucket must be `wardrobe-images`
  - `backend/internal/handlers/presigned/handler.go:64-74` — validates file extension `.jpg/.jpeg/.png/.webp`
  - `lib/supabase.ts:3` — `supabaseUrl` env var for constructing public URL

  **Acceptance Criteria**:
  - [ ] `uploadImage` does NOT import or use `supabase.storage`
  - [ ] `uploadImage` calls `POST /api/v1/presigned-url` with correct bucket and path
  - [ ] `uploadImage` PUTs image blob to the signed URL
  - [ ] `uploadImage` returns a valid public URL string
  - [ ] `npx tsc --noEmit` passes
  - [ ] `grep "supabase.storage" lib/store/wardrobe.store.ts` returns no matches

  **QA Scenarios**:

  ```
  Scenario: uploadImage uses presigned URL flow
    Tool: Bash (code inspection)
    Preconditions: None
    Steps:
      1. Read wardrobe.store.ts uploadImage method
      2. Verify no supabase.storage references exist
      3. Verify POST to /api/v1/presigned-url is present
      4. Verify PUT to signed URL is present
      5. Verify public URL construction from path
    Expected Result: No direct Supabase storage calls, full presigned URL flow
    Failure Indicators: Any supabase.storage reference remains
    Evidence: .sisyphus/evidence/task-5-code-check.txt
  ```

  **Commit**: YES (grouped with Wave 2)
  - Message: `feat(wardrobe): migrate uploadImage to presigned URL via backend`
  - Files: `lib/store/wardrobe.store.ts`

---

- [ ] 6. Migrate add-item.tsx handleSave to use store uploadImage

  **What to do**:
  - In `app/(tabs)/wardrobe/add-item.tsx`, rewrite `handleSave` (line 154):
    1. Remove direct `supabase.storage` upload code (lines 165-173)
    2. Remove `import { supabase, STORAGE_BUCKETS } from '@/lib/supabase'` (line 19)
    3. Use `uploadImage` from `useWardrobeStore()` instead:
       ```typescript
       const { uploadImage, addItem } = useWardrobeStore();
       // ...
       const publicUrl = await uploadImage(photoUri);
       ```
    4. Keep the rest of the flow: Gemini tagging -> addItem with tags
    5. Add proper error handling for upload failure

  **Must NOT do**:
  - Change the camera/gallery capture flow
  - Change the Gemini tagging flow
  - Change the UI/layout
  - Modify how `addItem` is called (just the image URL source changes)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Screen component with multi-step flow, needs careful refactor without breaking UI
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: Task 7
  - **Blocked By**: Task 5

  **References**:
  - `app/(tabs)/wardrobe/add-item.tsx:154-211` — current `handleSave` implementation
  - `app/(tabs)/wardrobe/add-item.tsx:165-173` — direct `supabase.storage` calls to remove
  - `app/(tabs)/wardrobe/add-item.tsx:19` — `supabase` import to remove
  - `lib/store/wardrobe.store.ts:145` — `uploadImage` method to use (after Task 5 migration)

  **Acceptance Criteria**:
  - [ ] `handleSave` calls `uploadImage(photoUri)` instead of `supabase.storage`
  - [ ] No `supabase` import in add-item.tsx
  - [ ] `npx tsc --noEmit` passes
  - [ ] `grep "supabase" app/\(tabs\)/wardrobe/add-item.tsx` returns no matches

  **QA Scenarios**:

  ```
  Scenario: handleSave uses store uploadImage
    Tool: Bash (code inspection)
    Preconditions: None
    Steps:
      1. Read add-item.tsx handleSave method
      2. Verify no supabase.storage references
      3. Verify uploadImage from store is called
      4. Verify publicUrl is used in addItem call
    Expected Result: Store method handles upload, screen just uses result
    Failure Indicators: Direct supabase.storage call remains
    Evidence: .sisyphus/evidence/task-6-code-check.txt
  ```

  **Commit**: YES (grouped with Wave 3)
  - Message: `refactor(wardrobe): route add-item upload through backend presigned URL`
  - Files: `app/(tabs)/wardrobe/add-item.tsx`

---

- [ ] 7. Clean up unused Supabase imports from wardrobe code

  **What to do**:
  - In `lib/store/wardrobe.store.ts`: Remove `import { supabase, isSupabaseConfigured, STORAGE_BUCKETS } from '../supabase'` (line 4) — verify no other code in file uses these after Task 5
  - In `app/(tabs)/wardrobe/add-item.tsx`: Remove `import { supabase, STORAGE_BUCKETS } from '@/lib/supabase'` (line 19) — already handled in Task 6, but verify
  - Run `npx tsc --noEmit` to confirm no broken imports

  **Must NOT do**:
  - Remove imports from other files (only wardrobe-related files)
  - Remove `supabase.ts` itself (other features may use it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Delete unused import lines
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 6

  **References**:
  - `lib/store/wardrobe.store.ts:4` — import to remove
  - `app/(tabs)/wardrobe/add-item.tsx:19` — import to remove

  **Acceptance Criteria**:
  - [ ] `grep "supabase" lib/store/wardrobe.store.ts` returns 0 matches
  - [ ] `grep "supabase" app/\(tabs\)/wardrobe/add-item.tsx` returns 0 matches
  - [ ] `npx tsc --noEmit` passes

  **QA Scenarios**:

  ```
  Scenario: No Supabase imports in wardrobe code
    Tool: Bash (grep)
    Preconditions: None
    Steps:
      1. grep "supabase" lib/store/wardrobe.store.ts
      2. grep "supabase" app/(tabs)/wardrobe/add-item.tsx
      3. Verify both return no matches
    Expected Result: Zero matches
    Failure Indicators: Any supabase reference found
    Evidence: .sisyphus/evidence/task-7-cleanup-check.txt
  ```

  **Commit**: YES (grouped with Wave 3)
  - Message: `chore(wardrobe): remove unused Supabase imports`
  - Files: `lib/store/wardrobe.store.ts`, `app/(tabs)/wardrobe/add-item.tsx`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns — reject if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `go build ./...` from backend/. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log, commented-out code, unused imports. Check for direct `supabase.storage` references in wardrobe code.
  Output: `TypeScript [PASS/FAIL] | Go Build [PASS/FAIL] | SupabaseRefs [CLEAN/N found] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test: image upload via presigned URL, wardrobe item creation with backend, auth header presence. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `fix(backend): wrap wardrobe responses in { data: [...] } envelope` — backend/internal/response/response.go
- **Wave 2**: `feat(wardrobe): migrate to backend API with auth headers` — lib/store/wardrobe.store.ts, .env.local, .env.local.example
- **Wave 3**: `refactor(wardrobe): route uploads through presigned URL + cleanup` — app/(tabs)/wardrobe/add-item.tsx, lib/store/wardrobe.store.ts

## Success Criteria

### Verification Commands
```bash
# No direct supabase storage calls in wardrobe code
grep -r "supabase.storage\|STORAGE_BUCKETS" lib/store/wardrobe.store.ts app/\(tabs\)/wardrobe/ — Expected: no matches

# TypeScript passes
npx tsc --noEmit — Expected: no errors

# Backend returns wrapped responses
curl -H "Authorization: Bearer dev" http://localhost:8080/api/v1/wardrobe — Expected: { "data": [...] }

# Presigned URL endpoint works
curl -X POST http://localhost:8080/api/v1/presigned-url -H "Content-Type: application/json" -d '{"bucket":"wardrobe-images","path":"test/123.jpg"}' — Expected: { "url": "...", "path": "..." }
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] `npx tsc --noEmit` passes
- [ ] Zero direct `supabase.storage` calls in wardrobe code
- [ ] All fetch calls include Authorization header
