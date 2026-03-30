# Go Backend Scaffold for Gloom

## TL;DR

> **Quick Summary**: Scaffold a complete Go backend in `/backend/` that replaces the frontend's direct Supabase calls. Uses Fiber v2 for HTTP, pgx/v5 for Postgres, Supabase JWT validation, and type-safe Go code for all CRUD operations.
>
> **Deliverables**:
> - Go project with complete module structure (cmd/, internal/, migrations/)
> - PostgreSQL migrations for profiles, wardrobe_items, outfits tables
> - JWT middleware validating Supabase tokens with golang-jwt/v5
> - 11 REST API endpoints across 3 resource groups + health check
> - Presigned URL endpoint for Supabase Storage image uploads
> - Input validation with go-playground/validator/v10
> - Makefile with dev commands (run, migrate, test, sqlc)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Config + DB → Handlers + Middleware → Server wiring

---

## Context

### Original Request
Scaffold a Go backend in a new `/backend` folder at the repo root. Tech stack: Go 1.23+, Fiber v2, pgx/v5 + pgxpool (direct to Supabase Postgres), sqlc, golang-migrate, golang-jwt/v5 for auth, godotenv for config, go-playground/validator/v10. Phase 1 scope: Profile CRUD, Wardrobe items CRUD, Outfits CRUD, JWT middleware. Leave Phase 2 TODO comments for Fal.ai, Gemini AI, Image processing, Job queues.

### Interview Summary
**Key Discussions**:
- **DB Connection**: Transaction pooler via Supavisor (port 6543) — best for persistent Go server
- **Image Handling**: Presigned URLs via Supabase Storage — backend generates upload URLs, frontend uploads directly
- **Category Mapping**: Frontend `types/wardrobe.ts` uses `tops/bottoms` but DB schema uses `upper/lower` — backend uses DB values
- **Auth**: Supabase phone auth → JWT → Go middleware validates with SUPABASE_JWT_SECRET (HS256)
- **RLS**: Currently disabled on Supabase — backend must enforce user-scoped access (WHERE user_id = $1)
- **JSON Naming**: snake_case — matches Supabase column names; frontend already works with snake_case from Supabase client

### Research Findings
- **Schema mismatch**: `types/wardrobe.ts` has `functional_tags`, `silhouette_tags`, `vibe_tags` not in DB — use DB schema as source of truth
- **Outfit nullability**: `outfit.store.ts` has non-nullable `occasion/vibe` but `supabase.ts` types allow null — use nullable (matches DB)
- **Frontend stores**: Wardrobe store queries `wardrobe_items` with `user_id` filter + `created_at DESC`; outfit store queries `outfits` similarly
- **Storage bucket**: `wardrobe-images` bucket in Supabase for image uploads
- **No existing Go code**: Pure greenfield — no existing backend to reconcile with

### Metis Review
**Identified Gaps** (addressed):
- **JWT claims validation**: Plan must validate `iss`, `aud`, `exp`, `sub` claims — addressed in middleware task
- **Connection pool limits**: Must configure max connections for Supavisor tier — addressed in DB task
- **Graceful shutdown**: SIGTERM handling with 5s timeout — addressed in server task
- **Rate limiting**: Not included in Phase 1 (Supabase handles basics) — noted as Phase 2
- **Race conditions on concurrent edits**: Accept for Phase 1, add optimistic locking in Phase 2
- **SQLC code generation**: Would require sqlc CLI — writing types directly instead, simpler for scaffold phase
- **Input validation scope**: All request bodies validated, path params validated as UUIDs
- **Error response format**: Standardized JSON error responses with code + message

---

## Work Objectives

### Core Objective
Create a production-ready Go backend scaffold that handles all Phase 1 CRUD operations with JWT auth, connecting directly to Supabase Postgres.

### Concrete Deliverables
- `backend/go.mod` + `go.sum` — Go module with all dependencies
- `backend/.env.example` — Environment variable template
- `backend/Makefile` — Dev commands (run, test, migrate-up, migrate-down, sqlc)
- `backend/migrations/000001_init_schema.up.sql` — Schema creation
- `backend/migrations/000001_init_schema.down.sql` — Schema rollback
- `backend/internal/config/config.go` — Environment configuration with validation
- `backend/internal/db/db.go` — pgxpool connection pool
- `backend/internal/db/types.go` — Go types matching DB schema
- `backend/internal/middleware/auth.go` — JWT validation middleware
- `backend/internal/middleware/cors.go` — CORS configuration
- `backend/internal/response/response.go` — Standardized JSON responses
- `backend/internal/handlers/profile/handler.go` — Profile CRUD (2 endpoints)
- `backend/internal/handlers/wardrobe/handler.go` — Wardrobe CRUD (5 endpoints)
- `backend/internal/handlers/outfit/handler.go` — Outfit CRUD (4 endpoints)
- `backend/internal/handlers/presigned/handler.go` — Presigned URL generation
- `backend/internal/server/server.go` — Fiber app setup + route registration
- `backend/cmd/server/main.go` — Entry point with graceful shutdown
- `backend/internal/handlers/*/handler_test.go` — Unit tests for all handlers

### Definition of Done
- [x] `go build ./...` compiles without errors
- [x] `go test ./...` passes all tests
- [x] Server starts and responds to `GET /health`
- [x] All 12 protected endpoints return 401 without valid JWT
- [x] All CRUD operations work end-to-end with test JWT
- [x] Migrations can be applied and rolled back

### Must Have
- JWT middleware validates Supabase tokens (HS256 with SUPABASE_JWT_SECRET)
- All endpoints enforce user-scoped access (WHERE user_id = $1)
- Input validation on all request bodies
- Standardized error response format: `{"error": {"code": "...", "message": "..."}}`
- Graceful shutdown on SIGTERM (5s timeout)
- Health check endpoint at `GET /health`
- CORS configured for frontend origins

### Must NOT Have (Guardrails)
- No Docker — connect directly to Supabase
- No ORM — use raw SQL via pgx
- No Phase 2 features (Fal.ai, Gemini, image processing, job queues) in implementation
- No `any` type in Go (use concrete types)
- No panics — all errors returned properly
- No hardcoded secrets — all via environment variables
- No direct file serving — images via Supabase CDN

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: Tests-after (scaffold first, tests alongside)
- **Framework**: Go standard `testing` package + `httptest`
- **Coverage**: Handler unit tests with mocked DB layer

### QA Policy
Every task includes agent-executed QA scenarios:
- **API**: Bash (curl) — send requests to running server, assert status + response fields
- **Compilation**: Bash (go build ./...) — verify all code compiles
- **Tests**: Bash (go test ./...) — run all unit tests

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — all parallel, no interdependencies):
├── Task 1: Go module init + .env.example + Makefile [quick]
├── Task 2: PostgreSQL migration files [quick]
├── Task 3: Config package (internal/config/) [quick]
├── Task 4: DB types (internal/db/types.go) [quick]
└── Task 5: Response helpers (internal/response/) [quick]

Wave 2 (Core layers — after Wave 1):
├── Task 6: DB connection pool (internal/db/db.go) [quick]
├── Task 7: JWT middleware (internal/middleware/auth.go) [quick]
├── Task 8: CORS middleware (internal/middleware/cors.go) [quick]
├── Task 9: Profile handlers [unspecified-high]
├── Task 10: Wardrobe handlers [unspecified-high]
├── Task 11: Outfit handlers [unspecified-high]
└── Task 12: Presigned URL handler [quick]

Wave 3 (Integration — after Wave 2):
├── Task 13: Server setup + route registration [unspecified-high]
├── Task 14: Main entry point + graceful shutdown [quick]
└── Task 15: Handler unit tests [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real API QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix
- **1-5**: None — Wave 1, all start immediately
- **6**: 3, 4 — needs config + types
- **7**: 3 — needs config for JWT secret
- **8**: — none
- **9-12**: 4, 5, 6, 7 — needs types, responses, DB, auth
- **13**: 8, 9, 10, 11, 12 — needs all middleware + handlers
- **14**: 3, 13 — needs config + server
- **15**: 9, 10, 11, 12 — needs all handlers
- **F1-F4**: All tasks complete

### Agent Dispatch Summary
- **Wave 1**: 5 agents — T1-T5 → `quick`
- **Wave 2**: 7 agents — T6-T8 → `quick`, T9-T11 → `unspecified-high`, T12 → `quick`
- **Wave 3**: 3 agents — T13 → `unspecified-high`, T14 → `quick`, T15 → `unspecified-high`
- **FINAL**: 4 agents — F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Go module init + .env.example + Makefile

  **What to do**:
  - Create `backend/go.mod` with Go 1.23+ and all required dependencies:
    - `github.com/gofiber/fiber/v2` (HTTP framework)
    - `github.com/jackc/pgx/v5` (Postgres driver)
    - `github.com/golang-jwt/jwt/v5` (JWT validation)
    - `github.com/joho/godotenv` (env loading)
    - `github.com/go-playground/validator/v10` (input validation)
    - `github.com/google/uuid` (UUID generation)
  - Run `go mod tidy` to generate `go.sum`
  - Create `backend/.env.example` with all required env vars:
    - `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
    - `DATABASE_URL` (transaction pooler format)
    - `PORT` (default 8080), `GO_ENV` (development/production)
    - `FRONTEND_URL` (for CORS)
  - Create `backend/Makefile` with targets: `run`, `build`, `test`, `migrate-up`, `migrate-down`, `sqlc`

  **Must NOT do**:
  - No Docker-related files (Dockerfile, docker-compose)
  - No `any` types in Go code

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation, no complex logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: All tasks (project must exist)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):
  - None (greenfield — follow Go conventions)

  **Acceptance Criteria**:
  - [ ] `backend/go.mod` exists with Go 1.23+ directive
  - [ ] All 6 required dependencies listed in go.mod
  - [ ] `backend/.env.example` exists with all 6 env vars documented
  - [ ] `backend/Makefile` exists with all 6 targets
  - [ ] `go mod tidy` succeeds without errors

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Go module compiles
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `cd backend && go build ./...`
    Expected Result: No compilation errors
    Failure Indicators: "cannot find module", "no required module provides"
    Evidence: .sisyphus/evidence/task-1-go-build.log

  Scenario: Makefile targets work
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `cd backend && make build`
    Expected Result: Binary created, no errors
    Failure Indicators: "make: *** No rule", "command not found"
    Evidence: .sisyphus/evidence/task-1-make-build.log
  ```

  **Commit**: YES (grouped)
  - Message: `chore(backend): init Go module with deps and Makefile`
  - Files: `backend/go.mod`, `backend/go.sum`, `backend/.env.example`, `backend/Makefile`

---

- [x] 2. PostgreSQL migration files

  **What to do**:
  - Create `backend/migrations/000001_init_schema.up.sql`:
    - `profiles` table: id UUID PK (FK auth.users), name TEXT, avatar_url TEXT, body_photo_url TEXT, skin_tone TEXT, style_tags TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW()
    - `wardrobe_items` table: id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL (FK auth.users), image_url TEXT NOT NULL, cutout_url TEXT, category TEXT NOT NULL, sub_category TEXT, colors TEXT[] DEFAULT '{}', style_tags TEXT[] DEFAULT '{}', occasion_tags TEXT[] DEFAULT '{}', fabric_guess TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    - `outfits` table: id UUID PK DEFAULT gen_random_uuid(), user_id UUID NOT NULL (FK auth.users), item_ids TEXT[] NOT NULL DEFAULT '{}', occasion TEXT, vibe TEXT, color_reasoning TEXT, ai_score DOUBLE PRECISION DEFAULT 0.8, cover_image_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    - Indexes: `idx_wardrobe_items_user_id`, `idx_outfits_user_id`, `idx_wardrobe_items_category`, `idx_wardrobe_items_created_at` (DESC), `idx_outfits_created_at` (DESC)
  - Create `backend/migrations/000001_init_schema.down.sql`:
    - DROP TABLE in reverse order: outfits → wardrobe_items → profiles
  - Migration naming: golang-migrate format (`{version}_{name}.{direction}.sql`)

  **Must NOT do**:
  - No RLS policies (handled by backend)
  - No triggers (Supabase manages timestamps)
  - No custom enum types (use TEXT constraints for flexibility)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure SQL file creation, no Go logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: None (migrations are optional for scaffold — existing Supabase DB)
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:19-129` — Database type definitions showing exact column names, types, and nullability for all 3 tables. Use this as the source of truth for the schema.
  - `types/wardrobe.ts:1` — Category type union showing all values. Note: types use `tops/bottoms` but DB uses `upper/lower` — use DB values.
  - `types/outfit.ts:22-42` — Occasion and Vibe unions for reference (TEXT, not enum in DB)

  **Acceptance Criteria**:
  - [ ] `backend/migrations/000001_init_schema.up.sql` creates all 3 tables
  - [ ] `backend/migrations/000001_init_schema.down.sql` drops all 3 tables
  - [ ] Column names match frontend Supabase types exactly
  - [ ] All array columns use TEXT[] with DEFAULT '{}'
  - [ ] 4 indexes created (user_id, category, created_at)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Migration SQL is syntactically valid
    Tool: Bash
    Preconditions: PostgreSQL connection available
    Steps:
      1. Validate SQL syntax by running `psql -f migrations/000001_init_schema.up.sql --set ON_ERROR_STOP=on` against test DB
    Expected Result: Tables created without errors
    Failure Indicators: "syntax error", "relation already exists"
    Evidence: .sisyphus/evidence/task-2-migration-up.log

  Scenario: Rollback migration works
    Tool: Bash
    Preconditions: Tables exist from UP migration
    Steps:
      1. Run `psql -f migrations/000001_init_schema.down.sql --set ON_ERROR_STOP=on`
    Expected Result: All tables dropped without errors
    Failure Indicators: "cannot drop table", "depends on"
    Evidence: .sisyphus/evidence/task-2-migration-down.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add initial database migration`
  - Files: `backend/migrations/000001_init_schema.up.sql`, `backend/migrations/000001_init_schema.down.sql`

---

- [x] 3. Config package (internal/config/)

  **What to do**:
  - Create `backend/internal/config/config.go`:
    - `Config` struct with all env vars: `DatabaseURL`, `SupabaseURL`, `SupabaseJWTSecret`, `SupabaseServiceRoleKey`, `Port`, `GoEnv`, `FrontendURL`
    - `Load() (*Config, error)` function that:
      1. Calls `godotenv.Load()` (ignores error if .env not found in prod)
      2. Reads each env var with `os.Getenv()`
      3. Applies defaults: Port="8080", GoEnv="development"
      4. Validates required vars exist (DatabaseURL, SupabaseJWTSecret, SupabaseServiceRoleKey)
      5. Returns error listing all missing vars
    - `IsDevelopment() bool` helper method

  **Must NOT do**:
  - No global state — Config is returned as a value/pointer
  - No logging — let caller decide how to handle errors

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple env loading, standard Go pattern
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 6, 7, 14 (need config)
  - **Blocked By**: None (can write independently, only needs Go module)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:1-12` — Shows env var names used by frontend: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY. Backend uses different vars (server-side).

  **Acceptance Criteria**:
  - [ ] `backend/internal/config/config.go` exists
  - [ ] `Config` struct has all 7 fields
  - [ ] `Load()` validates required vars and returns descriptive error
  - [ ] `godotenv.Load()` called (silent fail in production)
  - [ ] Port defaults to "8080"

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Config loads with all env vars set
    Tool: Bash (Go test)
    Preconditions: None
    Steps:
      1. Create test that sets env vars, calls config.Load()
      2. Assert all fields populated correctly
    Expected Result: Config struct with correct values
    Failure Indicators: "missing required env var" error
    Evidence: .sisyphus/evidence/task-3-config-test.log

  Scenario: Config fails fast with missing required vars
    Tool: Bash (Go test)
    Preconditions: DATABASE_URL not set
    Steps:
      1. Create test that unsets DATABASE_URL, calls config.Load()
    Expected Result: Error containing "DATABASE_URL"
    Failure Indicators: Config loads without error
    Evidence: .sisyphus/evidence/task-3-config-fail.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add config package with env validation`
  - Files: `backend/internal/config/config.go`

---

- [x] 4. DB types (internal/db/types.go)

  **What to do**:
  - Create `backend/internal/db/types.go` with Go structs matching the DB schema:
    - `Profile` struct: `ID uuid.UUID`, `Name *string`, `AvatarURL *string`, `BodyPhotoURL *string`, `SkinTone *string`, `StyleTags []string`, `CreatedAt time.Time`
    - `WardrobeItem` struct: `ID uuid.UUID`, `UserID uuid.UUID`, `ImageURL string`, `CutoutURL *string`, `Category string`, `SubCategory *string`, `Colors []string`, `StyleTags []string`, `OccasionTags []string`, `FabricGuess *string`, `CreatedAt time.Time`
    - `Outfit` struct: `ID uuid.UUID`, `UserID uuid.UUID`, `ItemIDs []string`, `Occasion *string`, `Vibe *string`, `ColorReasoning *string`, `AIScore float64`, `CoverImageURL *string`, `CreatedAt time.Time`
    - Request types: `UpdateProfileRequest`, `CreateWardrobeItemRequest`, `UpdateWardrobeItemRequest`, `CreateOutfitRequest`
    - Use `json` struct tags matching frontend field names (snake_case)
    - Use `validate` struct tags for go-playground/validator

  **Must NOT do**:
  - No `any` types — use `*string` for nullable, `[]string` for arrays
  - No custom marshal/unmarshal — rely on standard JSON encoding
  - No database-specific types (no `pgtype`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definitions, no logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 6, 9, 10, 11 (need types)
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:19-129` — Full Database type definitions. Match column names and types exactly. Note which fields are nullable (*string) vs required (string).
  - `types/wardrobe.ts:1-46` — WardrobeItem interface with all fields. Has extra fields (functional_tags, silhouette_tags, vibe_tags) NOT in DB — exclude those.
  - `types/outfit.ts:1-42` — Outfit interface. Note: types have nullable occasion/vibe — match this.
  - `types/user.ts:1-32` — UserProfile interface. Fields match profiles table exactly.

  **Acceptance Criteria**:
  - [ ] `backend/internal/db/types.go` exists with all 3 model structs
  - [ ] All 4 request structs defined
  - [ ] Nullable fields use `*string` (Name, AvatarURL, etc.)
  - [ ] Array fields use `[]string` (StyleTags, Colors, etc.)
  - [ ] JSON tags match frontend field names (snake_case)
  - [ ] Validate tags on required request fields
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Types compile and serialize correctly
    Tool: Bash (Go test)
    Preconditions: None
    Steps:
      1. Create test: marshal WardrobeItem to JSON, unmarshal back
      2. Assert field values preserved
    Expected Result: JSON round-trip preserves all data
    Failure Indicators: nil pointers, wrong field names, missing fields
    Evidence: .sisyphus/evidence/task-4-types-test.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add DB types matching Supabase schema`
  - Files: `backend/internal/db/types.go`

---

- [x] 5. Response helpers (internal/response/)

  **What to do**:
  - Create `backend/internal/response/response.go`:
    - `Error` struct: `Code string`, `Message string`
    - `ErrorResponse` struct: `Error Error`
    - `Success(c *fiber.Ctx, data interface{})` — returns 200 with data
    - `Created(c *fiber.Ctx, data interface{})` — returns 201 with data
    - `NoContent(c *fiber.Ctx)` — returns 204
    - `BadRequest(c *fiber.Ctx, msg string)` — returns 400
    - `Unauthorized(c *fiber.Ctx, msg string)` — returns 401
    - `Forbidden(c *fiber.Ctx, msg string)` — returns 403
    - `NotFound(c *fiber.Ctx, msg string)` — returns 404
    - `Conflict(c *fiber.Ctx, msg string)` — returns 409
    - `ValidationError(c *fiber.Ctx, errs []string)` — returns 422 with error list
    - `InternalError(c *fiber.Ctx, msg string)` — returns 500
  - All error responses use `ErrorResponse` format
  - Never expose internal errors/stack traces to clients in production

  **Must NOT do**:
  - No logging in response helpers (log in handlers/middleware)
  - No `fmt.Println` — use structured approach only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple helper functions, standard pattern
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 9, 10, 11, 12 (need response helpers)
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - `lib/store/wardrobe.store.ts:55-56` — Error handling pattern: `if (error) throw error;`. Backend should return structured errors instead.
  - Metis review: Standardized error response format `{"error": {"code": "...", "message": "..."}}`

  **Acceptance Criteria**:
  - [ ] `backend/internal/response/response.go` exists
  - [ ] All 10 response functions defined
  - [ ] All error responses use `ErrorResponse` format
  - [ ] ValidationError returns 422 with string array
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Error responses use correct format
    Tool: Bash (Go test)
    Preconditions: None
    Steps:
      1. Create test Fiber app, call response.BadRequest()
      2. Assert status 400, body has {"error": {"code": "bad_request", "message": "..."}}
    Expected Result: Correct JSON structure and status code
    Failure Indicators: Wrong format, missing fields
    Evidence: .sisyphus/evidence/task-5-response-test.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add standardized response helpers`
  - Files: `backend/internal/response/response.go`

---

- [x] 6. DB connection pool (internal/db/db.go)

  **What to do**:
  - Create `backend/internal/db/db.go`:
    - `DB` struct wrapping `*pgxpool.Pool`
    - `New(ctx context.Context, databaseURL string) (*DB, error)`:
      1. Parse connection config from URL
      2. Set pool config: MaxConns=10, MinConns=2, MaxConnLifetime=30min, MaxConnIdleTime=5min
      3. Create pool with `pgxpool.New(ctx, config)`
      4. Ping to verify connectivity
      5. Return `*DB` wrapper
    - `Close()` — closes the pool
    - `Pool()` — returns underlying `*pgxpool.Pool` for queries
    - Convenience methods:
      - `QueryRow(ctx, sql, args...)` — delegates to pool
      - `Query(ctx, sql, args...)` — delegates to pool
      - `Exec(ctx, sql, args...)` — delegates to pool
    - All methods use pgx standard interface for sqlc compatibility

  **Must NOT do**:
  - No global DB instance — pass via dependency injection
  - No connection string in code — from config package
  - No `pgx` v4 — must use v5

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard connection pool setup, well-documented pattern
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10, 11, 12)
  - **Blocks**: Tasks 9, 10, 11 (need DB for queries)
  - **Blocked By**: Task 3 (needs config for DATABASE_URL), Task 4 (needs types)

  **References** (CRITICAL - Be Exhaustive):
  - Supavisor transaction pooler: Max connections vary by plan. Default 10 is safe for most tiers.
  - `lib/supabase.ts:1-12` — Frontend uses Supabase client. Backend replaces this with direct Postgres access.

  **Acceptance Criteria**:
  - [ ] `backend/internal/db/db.go` exists
  - [ ] `New()` creates pool with correct config
  - [ ] `Close()` properly shuts down pool
  - [ ] Pool settings: MaxConns=10, MinConns=2
  - [ ] Convenience methods delegate to pool
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: DB connection pool compiles and has correct interface
    Tool: Bash (Go test)
    Preconditions: None
    Steps:
      1. Verify DB struct has New, Close, QueryRow, Query, Exec methods
      2. Verify pool config values are set
    Expected Result: All methods exist, pool config correct
    Failure Indicators: Missing methods, wrong config
    Evidence: .sisyphus/evidence/task-6-db-test.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add pgxpool connection wrapper`
  - Files: `backend/internal/db/db.go`

---

- [x] 7. JWT middleware (internal/middleware/auth.go)

  **What to do**:
  - Create `backend/internal/middleware/auth.go`:
    - `AuthRequired(jwtSecret string) fiber.Handler`:
      1. Extract `Authorization: Bearer <token>` header
      2. Parse and validate JWT with `golang-jwt/jwt/v5`
      3. Validate claims: `exp` (not expired), `sub` (non-empty user ID)
      4. Use HS256 algorithm with `SUPABASE_JWT_SECRET`
      5. Extract `sub` claim as user UUID
      6. Store in Fiber context: `c.Locals("userID", uuid)`
      7. Call `c.Next()`
    - `GetUserID(c *fiber.Ctx) uuid.UUID` — convenience function to extract userID from context
    - Return 401 `{"error": {"code": "unauthorized", "message": "..."}}` for:
      - Missing Authorization header
      - Invalid format (not "Bearer ...")
      - Invalid/expired token
      - Missing sub claim
    - Parse user ID as `uuid.UUID` — return 401 if invalid UUID format

  **Must NOT do**:
  - No RS256 — Supabase uses HS256 with shared secret
  - No token refresh logic — frontend handles that
  - No role-based access control — Phase 2

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard JWT middleware, well-documented pattern
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10, 11, 12)
  - **Blocks**: Tasks 9, 10, 11, 12 (need auth middleware)
  - **Blocked By**: Task 3 (needs config for JWT_SECRET)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/store/auth.store.ts:52-53` — Frontend: `supabase.auth.onAuthStateChange(async (_event, session) => { setSession(session?.access_token || null); })`. Shows JWT is stored as access_token.
  - `app/_layout.tsx:52-78` — Full auth flow: onAuthStateChange → fetch profile from profiles table → setUser. Backend replaces the profile fetch.
  - Supabase JWT: Uses HS256 with project's JWT secret. Claims include: `sub` (user ID), `exp`, `iss`, `aud`.
  - `app/(auth)/login.tsx` — Shows phone auth flow (frontend handles login, backend validates token).

  **Acceptance Criteria**:
  - [ ] `backend/internal/middleware/auth.go` exists
  - [ ] `AuthRequired()` middleware validates HS256 JWT
  - [ ] Invalid tokens return 401 with standardized error format
  - [ ] Valid tokens store `userID` in Fiber context as `uuid.UUID`
  - [ ] `GetUserID()` extracts userID from context
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Valid JWT passes through middleware
    Tool: Bash
    Preconditions: Test JWT created with HS256 + test secret
    Steps:
      1. Create test Fiber app with AuthRequired middleware
      2. Send request with valid Bearer token
      3. Assert handler receives userID in context
    Expected Result: 200 response, userID extracted correctly
    Failure Indicators: 401 response, nil userID
    Evidence: .sisyphus/evidence/task-7-auth-valid.log

  Scenario: Missing auth header returns 401
    Tool: Bash
    Preconditions: None
    Steps:
      1. Send request without Authorization header
      2. Assert 401 response with error format
    Expected Result: {"error": {"code": "unauthorized", "message": "missing authorization header"}}
    Failure Indicators: 200 response, different error format
    Evidence: .sisyphus/evidence/task-7-auth-missing.log

  Scenario: Expired JWT returns 401
    Tool: Bash
    Preconditions: Test JWT with exp in the past
    Steps:
      1. Send request with expired token
      2. Assert 401 response
    Expected Result: 401 with "token expired" message
    Failure Indicators: 200 response
    Evidence: .sisyphus/evidence/task-7-auth-expired.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add JWT auth middleware for Supabase tokens`
  - Files: `backend/internal/middleware/auth.go`

---

- [x] 8. CORS middleware (internal/middleware/cors.go)

  **What to do**:
  - Create `backend/internal/middleware/cors.go`:
    - `CORS(frontendURL string) fiber.Handler`
    - Use Fiber's built-in CORS middleware with:
      - AllowOrigins: frontendURL from config
      - AllowMethods: GET, POST, PATCH, PUT, DELETE, OPTIONS
      - AllowHeaders: Origin, Content-Type, Accept, Authorization
      - AllowCredentials: true
      - MaxAge: 86400 (24 hours)
    - In development mode: AllowOrigins = "*" for easier testing

  **Must NOT do**:
  - No wildcard origins in production
  - No custom CORS implementation — use Fiber's built-in

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: One-liner using Fiber's CORS middleware
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10, 11, 12)
  - **Blocks**: Task 13 (needs CORS middleware)
  - **Blocked By**: None

  **References** (CRITICAL - Be Exhaustive):
  - Fiber CORS docs: `cors.New(cors.Config{...})`

  **Acceptance Criteria**:
  - [ ] `backend/internal/middleware/cors.go` exists
  - [ ] CORS middleware configured with frontendURL
  - [ ] Development mode allows all origins
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: CORS headers present on response
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. Send OPTIONS request to /api/v1/profile
      2. Assert Access-Control-Allow-Origin header present
      3. Assert Access-Control-Allow-Methods includes GET, POST, PATCH, DELETE
    Expected Result: CORS headers present on preflight response
    Failure Indicators: Missing CORS headers
    Evidence: .sisyphus/evidence/task-8-cors.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add CORS middleware`
  - Files: `backend/internal/middleware/cors.go`

---

- [x] 9. Profile handlers (internal/handlers/profile/)

  **What to do**:
  - Create `backend/internal/handlers/profile/handler.go`:
    - `Handler` struct with `*db.DB` dependency
    - `New(db *db.DB) *Handler` constructor
    - `RegisterRoutes(router fiber.Router)` — registers under `/api/v1`
      - `GET /profile` — authenticated
      - `PATCH /profile` — authenticated
    - `GetProfile(c *fiber.Ctx)`:
      1. Get userID from context via `middleware.GetUserID(c)`
      2. Query `SELECT * FROM profiles WHERE id = $1`
      3. Return 404 if not found
      4. Return 200 with profile data
    - `UpdateProfile(c *fiber.Ctx)`:
      1. Parse and validate request body (`UpdateProfileRequest`)
      2. Build dynamic UPDATE query (only update provided fields)
      3. Use COALESCE for partial updates (only update non-nil fields)
      4. Return 200 with updated profile
    - Handle `pgx.ErrNoRows` → 404
    - Log errors with structured context (userID, operation)

  **Must NOT do**:
  - No hardcoded user IDs — always from JWT context
  - No SQL string concatenation — use parameterized queries
  - No creating profiles — profiles created by Supabase trigger on signup

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CRUD logic with SQL queries, validation, error handling
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10, 11, 12)
  - **Blocks**: Task 13 (needs all handlers for route registration)
  - **Blocked By**: Tasks 4, 5, 6, 7 (needs types, responses, DB, auth)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:22-50` — Profile Row/Insert/Update types. Shows exact column names and nullability.
  - `lib/store/auth.store.ts:56-64` — Frontend fetches profile: `SELECT * FROM profiles WHERE id = session.user.id`. Backend replicates this.
  - `types/user.ts:1-17` — UserProfile and UserProfileInput interfaces.
  - `lib/schemas/profile.ts:1-9` — ProfileSchema validation: name min 2 chars, skinTone optional string, styleTags optional array.
  - `app/_layout.tsx:57-61` — Profile fetch on auth state change.
  - `lib/store/auth.store.ts:22-25` — Onboarding check: name exists AND length >= 2 AND style_tags.length > 0.

  **Acceptance Criteria**:
  - [ ] `backend/internal/handlers/profile/handler.go` exists
  - [ ] `GET /api/v1/profile` returns profile for authenticated user
  - [ ] `PATCH /api/v1/profile` updates only provided fields
  - [ ] Both endpoints require JWT (use auth middleware)
  - [ ] Returns 404 for non-existent profile
  - [ ] Request body validated with go-playground/validator
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: GET profile returns user's profile
    Tool: Bash (curl)
    Preconditions: Server running, test user with profile in DB
    Steps:
      1. curl -H "Authorization: Bearer <test-jwt>" http://localhost:8080/api/v1/profile
      2. Assert status 200
      3. Assert response has id, name, style_tags fields
    Expected Result: Full profile object returned
    Failure Indicators: 404, missing fields, wrong user
    Evidence: .sisyphus/evidence/task-9-profile-get.log

  Scenario: PATCH profile updates only provided fields
    Tool: Bash (curl)
    Preconditions: Server running, test user with profile
    Steps:
      1. curl -X PATCH -H "Authorization: Bearer <test-jwt>" -d '{"name":"New Name"}' http://localhost:8080/api/v1/profile
      2. Assert status 200
      3. Assert name updated, other fields unchanged
    Expected Result: Partial update works correctly
    Failure Indicators: Other fields nullified, 500 error
    Evidence: .sisyphus/evidence/task-9-profile-patch.log

  Scenario: GET profile without JWT returns 401
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl http://localhost:8080/api/v1/profile
      2. Assert status 401
    Expected Result: {"error":{"code":"unauthorized",...}}
    Failure Indicators: 200 response
    Evidence: .sisyphus/evidence/task-9-profile-noauth.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add profile CRUD handlers`
  - Files: `backend/internal/handlers/profile/handler.go`

---

- [x] 10. Wardrobe handlers (internal/handlers/wardrobe/)

  **What to do**:
  - Create `backend/internal/handlers/wardrobe/handler.go`:
    - `Handler` struct with `*db.DB` dependency
    - `RegisterRoutes(router fiber.Router)`:
      - `GET /wardrobe` — list items (authenticated, user-scoped)
      - `POST /wardrobe` — create item (authenticated)
      - `GET /wardrobe/:id` — get single item (authenticated, user-scoped)
      - `PATCH /wardrobe/:id` — update item (authenticated, user-scoped)
      - `DELETE /wardrobe/:id` — delete item (authenticated, user-scoped)
    - `ListItems(c *fiber.Ctx)`:
      1. Query with `WHERE user_id = $1 ORDER BY created_at DESC`
      2. Optional `?category=` filter query param
      3. Return 200 with array (empty array if none, never null)
    - `CreateItem(c *fiber.Ctx)`:
      1. Validate request body (`CreateWardrobeItemRequest`)
      2. Validate category against allowed values: upper, lower, dress, shoes, bag, accessory
      3. Insert with `user_id` from JWT context
      4. Return 201 with created item
    - `GetItem(c *fiber.Ctx)`:
      1. Parse `:id` as UUID
      2. Query with `WHERE id = $1 AND user_id = $2`
      3. Return 404 if not found
    - `UpdateItem(c *fiber.Ctx)`:
      1. Parse `:id` as UUID
      2. Verify ownership: `WHERE id = $1 AND user_id = $2`
      3. Build dynamic UPDATE for provided fields only
      4. Return 200 with updated item
    - `DeleteItem(c *fiber.Ctx)`:
      1. Parse `:id` as UUID
      2. Delete with `WHERE id = $1 AND user_id = $2`
      3. Return 204 No Content

  **Must NOT do**:
  - No access to other users' items — always filter by user_id
  - No hard delete cascading outfits — Phase 2 concern
  - No image upload handling — use presigned URL endpoint

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Most complex handler group — 5 endpoints, validation, dynamic queries
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 11, 12)
  - **Blocks**: Task 13 (needs all handlers)
  - **Blocked By**: Tasks 4, 5, 6, 7 (needs types, responses, DB, auth)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:51-90` — WardrobeItem Row/Insert/Update types. Exact column names and allowed category values.
  - `lib/store/wardrobe.store.ts:31-58` — Frontend insert pattern: inserts with user_id, category, sub_category, colors, style_tags, occasion_tags, fabric_guess.
  - `lib/store/wardrobe.store.ts:77-100` — Frontend fetch pattern: `SELECT * FROM wardrobe_items WHERE user_id = user.id ORDER BY created_at DESC`.
  - `types/wardrobe.ts:1-46` — WardrobeItem interface with all fields. Has extra fields NOT in DB (functional_tags, silhouette_tags, vibe_tags) — exclude.
  - `lib/schemas/wardrobe.ts:1-15` — AddItemSchema: imageUrl (URL), category (enum), subCategory, colors, styleTags, occasionTags (all optional arrays).
  - `types/wardrobe.ts:1` — Category type: `tops | bottoms | shoes | accessories | outerwear | fullbody | bags` — but DB uses `upper | lower | dress | shoes | bag | accessory`.

  **Acceptance Criteria**:
  - [ ] `backend/internal/handlers/wardrobe/handler.go` exists
  - [ ] All 5 endpoints registered and functional
  - [ ] `GET /api/v1/wardrobe` returns user's items (never null)
  - [ ] `GET /api/v1/wardrobe?category=upper` filters correctly
  - [ ] `POST /api/v1/wardrobe` validates category enum
  - [ ] All endpoints enforce user-scoped access (WHERE user_id = $1)
  - [ ] `DELETE` returns 204 No Content
  - [ ] Invalid UUID in path returns 400
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: POST wardrobe item creates and returns item
    Tool: Bash (curl)
    Preconditions: Server running, valid JWT
    Steps:
      1. curl -X POST -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d '{"image_url":"https://example.com/img.jpg","category":"upper","colors":["red"],"style_tags":["casual"]}' http://localhost:8080/api/v1/wardrobe
      2. Assert status 201
      3. Assert response has id, user_id, image_url, category="upper"
    Expected Result: Item created with auto-generated ID
    Failure Indicators: 500 error, wrong category, missing user_id
    Evidence: .sisyphus/evidence/task-10-wardrobe-create.log

  Scenario: GET wardrobe returns empty array for new user
    Tool: Bash (curl)
    Preconditions: Server running, fresh user JWT
    Steps:
      1. curl -H "Authorization: Bearer <jwt>" http://localhost:8080/api/v1/wardrobe
      2. Assert status 200
      3. Assert response is [] (empty array, not null)
    Expected Result: Empty array returned
    Failure Indicators: null response, 500 error
    Evidence: .sisyphus/evidence/task-10-wardrobe-empty.log

  Scenario: DELETE wardrobe item removes it
    Tool: Bash (curl)
    Preconditions: Server running, user has at least 1 item
    Steps:
      1. First create item via POST, note the returned id
      2. curl -X DELETE -H "Authorization: Bearer <jwt>" http://localhost:8080/api/v1/wardrobe/{id}
      3. Assert status 204
      4. curl GET /api/v1/wardrobe/{id} — assert 404
    Expected Result: Item deleted, subsequent GET returns 404
    Failure Indicators: DELETE returns 200, GET still returns item
    Evidence: .sisyphus/evidence/task-10-wardrobe-delete.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add wardrobe CRUD handlers`
  - Files: `backend/internal/handlers/wardrobe/handler.go`

---

- [x] 11. Outfit handlers (internal/handlers/outfit/)

  **What to do**:
  - Create `backend/internal/handlers/outfit/handler.go`:
    - `Handler` struct with `*db.DB` dependency
    - `RegisterRoutes(router fiber.Router)`:
      - `GET /outfits` — list outfits (authenticated, user-scoped)
      - `POST /outfits` — create outfit (authenticated)
      - `GET /outfits/:id` — get single outfit (authenticated, user-scoped)
      - `DELETE /outfits/:id` — delete outfit (authenticated, user-scoped)
    - `ListOutfits(c *fiber.Ctx)`:
      1. Query with `WHERE user_id = $1 ORDER BY created_at DESC`
      2. Optional `?occasion=` and `?vibe=` filter query params
      3. Return 200 with array
    - `CreateOutfit(c *fiber.Ctx)`:
      1. Validate request body (`CreateOutfitRequest`)
      2. item_ids must not be empty array
      3. ai_score must be between 0.0 and 1.0 if provided
      4. Insert with `user_id` from JWT context
      5. Return 201 with created outfit
    - `GetOutfit(c *fiber.Ctx)`:
      1. Parse `:id` as UUID
      2. Query with `WHERE id = $1 AND user_id = $2`
      3. Return 404 if not found
    - `DeleteOutfit(c *fiber.Ctx)`:
      1. Parse `:id` as UUID
      2. Delete with `WHERE id = $1 AND user_id = $2`
      3. Return 204 No Content

  **Must NOT do**:
  - No PATCH endpoint (outfits are immutable once created — delete and recreate)
  - No outfit generation logic — that's Phase 2 (Gemini AI)
  - No cascading deletes — outfit deletion doesn't delete wardrobe items

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CRUD logic with validation, array handling for item_ids
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 10, 12)
  - **Blocks**: Task 13 (needs all handlers)
  - **Blocked By**: Tasks 4, 5, 6, 7 (needs types, responses, DB, auth)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:92-126` — Outfit Row/Insert/Update types. Shows exact column names and nullability.
  - `lib/store/outfit.store.ts:59-80` — Frontend saveOutfit: inserts outfit with item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url.
  - `lib/store/outfit.store.ts:31-51` — Frontend fetchOutfits: `SELECT * FROM outfits WHERE user_id = user.id ORDER BY created_at DESC`.
  - `types/outfit.ts:1-42` — Outfit interface, Occasion and Vibe union types.
  - `lib/gemini.ts:92-156` — Mock outfit generation. Returns `item_ids`, `occasion`, `vibe`, `color_reasoning`, `ai_score`. This is Phase 2 — note the field shape for compatibility.

  **Acceptance Criteria**:
  - [ ] `backend/internal/handlers/outfit/handler.go` exists
  - [ ] All 4 endpoints registered and functional
  - [ ] `GET /api/v1/outfits` returns user's outfits (never null)
  - [ ] `POST /api/v1/outfits` validates item_ids not empty
  - [ ] `POST /api/v1/outfits` validates ai_score range (0.0-1.0)
  - [ ] All endpoints enforce user-scoped access
  - [ ] `DELETE` returns 204 No Content
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: POST outfit creates and returns outfit
    Tool: Bash (curl)
    Preconditions: Server running, valid JWT, user has wardrobe items
    Steps:
      1. curl -X POST -H "Authorization: Bearer <jwt>" -H "Content-Type: application/json" -d '{"item_ids":["uuid1","uuid2"],"occasion":"casual","vibe":"minimalist","ai_score":0.85}' http://localhost:8080/api/v1/outfits
      2. Assert status 201
      3. Assert response has id, user_id, item_ids, occasion="casual"
    Expected Result: Outfit created with all fields
    Failure Indicators: 500 error, missing fields
    Evidence: .sisyphus/evidence/task-11-outfit-create.log

  Scenario: POST outfit with empty item_ids returns 422
    Tool: Bash (curl)
    Preconditions: Server running, valid JWT
    Steps:
      1. curl -X POST -H "Authorization: Bearer <jwt>" -d '{"item_ids":[],"occasion":"casual"}' http://localhost:8080/api/v1/outfits
      2. Assert status 422
    Expected Result: Validation error about empty item_ids
    Failure Indicators: 201 response, 500 error
    Evidence: .sisyphus/evidence/task-11-outfit-validation.log

  Scenario: DELETE outfit removes it
    Tool: Bash (curl)
    Preconditions: Server running, user has outfit
    Steps:
      1. Create outfit, note id
      2. curl -X DELETE -H "Authorization: Bearer <jwt>" http://localhost:8080/api/v1/outfits/{id}
      3. Assert status 204
    Expected Result: Outfit deleted
    Failure Indicators: 200 response, item still exists
    Evidence: .sisyphus/evidence/task-11-outfit-delete.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add outfit CRUD handlers`
  - Files: `backend/internal/handlers/outfit/handler.go

---

- [x] 12. Presigned URL handler (internal/handlers/presigned/)

  **What to do**:
  - Create `backend/internal/handlers/presigned/handler.go`:
    - `Handler` struct with `*db.DB`, `supabaseURL`, `serviceRoleKey` dependencies
    - `RegisterRoutes(router fiber.Router)`:
      - `POST /presigned-url` — generate presigned upload URL (authenticated)
    - `GenerateUploadURL(c *fiber.Ctx)`:
      1. Parse request body: `{"bucket": "wardrobe-images", "path": "user-id/filename.jpg"}`
      2. Validate bucket name against allowed list
      3. Call Supabase Storage API to create presigned upload URL
      4. Return 200 with `{ "url": "...", "path": "..." }`
    - Use Supabase Storage REST API:
      - `POST {SUPABASE_URL}/storage/v1/object/upload/sign/{bucket}/{path}`
      - Header: `Authorization: Bearer {SERVICE_ROLE_KEY}`
      - Body: `{"expiresIn": 3600}`
    - Validate filename has allowed extension (.jpg, .jpeg, .png, .webp)

  **Must NOT do**:
  - No direct image upload handling — only generate URLs
  - No image processing/resizing — Phase 2
  - No public URL generation — only presigned upload

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple API proxy, no complex logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9, 10, 11)
  - **Blocks**: Task 13 (needs all handlers)
  - **Blocked By**: Tasks 4, 5, 7 (needs types, responses, auth)

  **References** (CRITICAL - Be Exhaustive):
  - `lib/supabase.ts:14-17` — Storage bucket: `STORAGE_BUCKETS = { WARDROBE_IMAGES: 'wardrobe-images' }`. Backend uses this bucket name.
  - `lib/store/wardrobe.store.ts:31-58` — Frontend inserts with `image_url` field. Presigned URL flow: get URL → upload to Supabase → insert item with resulting URL.
  - Supabase Storage API: https://supabase.com/docs/guides/storage/uploads#generating-presigned-upload-urls

  **Acceptance Criteria**:
  - [ ] `backend/internal/handlers/presigned/handler.go` exists
  - [ ] `POST /api/v1/presigned-url` generates presigned URL
  - [ ] Only allows `wardrobe-images` bucket
  - [ ] Validates file extension (.jpg, .jpeg, .png, .webp)
  - [ ] Returns 200 with `{ "url": "...", "path": "..." }`
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: POST presigned-url returns valid URL
    Tool: Bash (curl)
    Preconditions: Server running, valid JWT, Supabase configured
    Steps:
      1. curl -X POST -H "Authorization: Bearer <jwt>" -d '{"bucket":"wardrobe-images","path":"test-user/photo.jpg"}' http://localhost:8080/api/v1/presigned-url
      2. Assert status 200
      3. Assert response has "url" and "path" fields
    Expected Result: Presigned URL returned
    Failure Indicators: 500 error, missing URL field
    Evidence: .sisyphus/evidence/task-12-presigned.log

  Scenario: POST presigned-url rejects invalid bucket
    Tool: Bash (curl)
    Preconditions: Server running, valid JWT
    Steps:
      1. curl -X POST -H "Authorization: Bearer <jwt>" -d '{"bucket":"invalid-bucket","path":"test/photo.jpg"}' http://localhost:8080/api/v1/presigned-url
      2. Assert status 400 or 422
    Expected Result: Validation error for invalid bucket
    Failure Indicators: 200 response
    Evidence: .sisyphus/evidence/task-12-presigned-invalid.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add presigned URL handler for Supabase Storage`
  - Files: `backend/internal/handlers/presigned/handler.go`

---

- [x] 13. Server setup + route registration (internal/server/)

  **What to do**:
  - Create `backend/internal/server/server.go`:
    - `Server` struct with `*fiber.App`, `*config.Config`, `*db.DB`
    - `New(cfg *config.Config, database *db.DB) *Server`:
      1. Create Fiber app with:
         - `fiber.Config{AppName: "Gloom Backend", ReadTimeout: 10s, WriteTimeout: 10s}`
         - JSON encoder: `jsoniter` for performance (or stdlib)
         - Error handler: custom handler returning standardized error format
         - Body limit: 10MB
      2. Apply global middleware:
         - CORS middleware (Task 8)
         - Logger middleware (Fiber built-in)
         - Recovery middleware (Fiber built-in, catch panics)
      3. Register health check: `GET /health` → `{"status": "ok", "version": "0.1.0"}`
      4. Register API group `/api/v1` with auth middleware
      5. Register all handler routes:
         - profile.New(database).RegisterRoutes(apiV1)
         - wardrobe.New(database).RegisterRoutes(apiV1)
         - outfit.New(database).RegisterRoutes(apiV1)
         - presigned.New(database, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey).RegisterRoutes(apiV1)
      6. Add 404 handler for unmatched routes
      7. Add Phase 2 TODO comments before each handler registration
    - `Listen(addr string) error` — starts Fiber server
    - `Shutdown() error` — graceful shutdown

  **Must NOT do**:
  - No global handler instances — use constructor pattern
  - No hardcoded port — from config
  - No middleware bypass — all API routes go through auth

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration layer connecting all components, Fiber app configuration
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 14, 15)
  - **Blocks**: Task 14 (main needs server)
  - **Blocked By**: Tasks 3, 7, 8, 9, 10, 11, 12 (needs config, middleware, all handlers)

  **References** (CRITICAL - Be Exhaustive):
  - Fiber v2 docs: App configuration, middleware, route grouping, graceful shutdown
  - `app/_layout.tsx:1-197` — Full app structure for understanding route organization

  **Acceptance Criteria**:
  - [ ] `backend/internal/server/server.go` exists
  - [ ] Fiber app configured with 10MB body limit, 10s timeouts
  - [ ] Health check at `GET /health` returns `{"status":"ok"}`
  - [ ] All 12 API endpoints registered under `/api/v1` with auth
  - [ ] CORS, Logger, Recovery middleware applied globally
  - [ ] 404 handler returns standardized error format
  - [ ] Phase 2 TODO comments present
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Health check returns ok
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl http://localhost:8080/health
      2. Assert status 200
      3. Assert body has {"status":"ok"}
    Expected Result: Health check passes
    Failure Indicators: 404, connection refused
    Evidence: .sisyphus/evidence/task-13-health.log

  Scenario: 404 for unknown route
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl http://localhost:8080/nonexistent
      2. Assert status 404
      3. Assert error format
    Expected Result: Standardized 404 error response
    Failure Indicators: Different error format
    Evidence: .sisyphus/evidence/task-13-404.log

  Scenario: All API routes require auth
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. For each of the 12 API endpoints, send GET/POST without auth
      2. Assert all return 401
    Expected Result: Every protected route rejects unauthenticated requests
    Failure Indicators: Any route returns 200 without auth
    Evidence: .sisyphus/evidence/task-13-auth-check.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add server setup with route registration`
  - Files: `backend/internal/server/server.go`

---

- [x] 14. Main entry point + graceful shutdown (cmd/server/)

  **What to do**:
  - Create `backend/cmd/server/main.go`:
    - `main()` function:
      1. Load config with `config.Load()`
      2. Create DB connection pool with `db.New(ctx, cfg.DatabaseURL)`
      3. Create server with `server.New(cfg, database)`
      4. Start server in goroutine: `go server.Listen(":" + cfg.Port)`
      5. Wait for interrupt signal (SIGINT, SIGTERM)
      6. On signal: log shutdown message, call `server.Shutdown()` with 5s timeout
      7. Close DB pool
      8. Exit
    - Use `os/signal.NotifyContext` for signal handling
    - Log startup message with port and environment
    - Fatal on config load failure, DB connection failure

  **Must NOT do**:
  - No `log.Fatal` after server starts — use graceful shutdown
  - No global variables
  - No deferred close without context

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Go entry point pattern, minimal logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 15)
  - **Blocks**: None (final integration point)
  - **Blocked By**: Tasks 3, 6, 13 (needs config, DB, server)

  **References** (CRITICAL - Be Exhaustive):
  - Go standard: `os/signal`, `context.WithTimeout`, `net/http` graceful shutdown patterns
  - Fiber: `app.Shutdown()` for graceful shutdown

  **Acceptance Criteria**:
  - [ ] `backend/cmd/server/main.go` exists
  - [ ] Config loaded at startup, fatal on failure
  - [ ] DB pool created at startup, fatal on failure
  - [ ] Server starts on configured port
  - [ ] SIGTERM triggers graceful shutdown (5s timeout)
  - [ ] DB pool closed on shutdown
  - [ ] `go build ./...` compiles

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Server starts on configured port
    Tool: Bash
    Preconditions: .env file with DATABASE_URL set
    Steps:
      1. Run `go run cmd/server/main.go`
      2. Wait 2 seconds
      3. curl http://localhost:8080/health
      4. Assert server is responding
    Expected Result: Server starts and responds to health check
    Failure Indicators: "address already in use", connection refused
    Evidence: .sisyphus/evidence/task-14-start.log

  Scenario: Server shuts down gracefully on SIGTERM
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. Start server in background
      2. Send SIGTERM (kill -TERM <pid>)
      3. Assert server logs shutdown message
      4. Assert port released (new server can start)
    Expected Result: Clean shutdown within 5 seconds
    Failure Indicators: Port still in use, no shutdown log
    Evidence: .sisyphus/evidence/task-14-shutdown.log
  ```

  **Commit**: YES (grouped)
  - Message: `feat(backend): add main entry point with graceful shutdown`
  - Files: `backend/cmd/server/main.go`

---

- [x] 15. Handler unit tests

  **What to do**:
  - Create test files for all handlers:
    - `backend/internal/handlers/profile/handler_test.go`
    - `backend/internal/handlers/wardrobe/handler_test.go`
    - `backend/internal/handlers/outfit/handler_test.go`
    - `backend/internal/middleware/auth_test.go`
  - For each test file:
    - Use Go standard `testing` package
    - Use `httptest` for HTTP testing
    - Use table-driven tests for multiple scenarios
    - Create mock DB interface (define minimal interface, don't mock pgx directly)
    - Test happy path + error cases for each endpoint
    - Generate test JWTs using the test secret
  - Auth middleware tests:
    - Valid token passes through
    - Missing header returns 401
    - Expired token returns 401
    - Invalid signature returns 401
    - Missing sub claim returns 401
  - Profile tests:
    - GET profile returns existing profile
    - GET profile returns 404 for missing profile
    - PATCH profile updates fields
    - PATCH profile with invalid body returns 422
  - Wardrobe tests:
    - GET items returns user's items
    - GET items with category filter
    - POST item creates and returns item
    - POST item with invalid category returns 422
    - GET single item returns 404 for wrong user
    - DELETE item returns 204
  - Outfit tests:
    - GET outfits returns user's outfits
    - POST outfit with empty item_ids returns 422
    - POST outfit with invalid ai_score returns 422
    - DELETE outfit returns 204

  **Must NOT do**:
  - No integration tests against real Supabase — mock the DB layer
  - No test helpers that modify production code
  - No skipped tests without TODO comment

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test suite with mocks, table-driven tests, JWT generation
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13, 14)
  - **Blocks**: Final verification (F2 code quality review needs passing tests)
  - **Blocked By**: Tasks 7, 9, 10, 11 (needs middleware and handlers to test)

  **References** (CRITICAL - Be Exhaustive):
  - Go testing: `testing.T`, `httptest.NewRecorder`, `httptest.NewRequest`
  - Table-driven tests: Go idiom for testing multiple scenarios
  - JWT test generation: Create tokens with `golang-jwt/jwt/v5` + test secret

  **Acceptance Criteria**:
  - [ ] All 4 test files exist
  - [ ] `go test ./...` passes all tests
  - [ ] Each handler has ≥3 test cases (happy path + 2 error cases)
  - [ ] Auth middleware has ≥5 test cases
  - [ ] All tests use mock DB (no real Supabase connection)
  - [ ] Test JWTs generated with known test secret

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: All tests pass
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run `cd backend && go test ./... -v`
      2. Assert all tests pass
      3. Assert output shows ≥15 test cases total
    Expected Result: All tests pass, good coverage
    Failure Indicators: Test failures, panics, skipped tests
    Evidence: .sisyphus/evidence/task-15-tests.log
  ```

  **Commit**: YES (grouped)
  - Message: `test(backend): add handler unit tests`
  - Files: `backend/internal/handlers/*/handler_test.go`, `backend/internal/middleware/auth_test.go

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check all files exist at expected paths. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `go vet ./...` + `go test ./...` + `staticcheck` if available. Review all files for: `any` type usage, empty catches/ignores, hardcoded secrets, missing error handling, TODO/FIXME comments. Check Go best practices: proper error wrapping, context propagation, interface segregation.
  Output: `Build [PASS/FAIL] | Vet [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [x] F3. **Real API QA** — `unspecified-high`
  Start server on test port. Execute curl commands for every endpoint: health check, protected endpoints without JWT (expect 401), protected endpoints with JWT (expect 200/404), CRUD happy paths with test data. Capture all responses as evidence.
  Output: `Endpoints [N/N pass] | Auth [N/N] | CRUD [N/N] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual file contents. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Flag any unaccounted files or Phase 2 features.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Single commit**: `feat(backend): scaffold Go backend with Phase 1 CRUD API` — all backend files, `go test ./...`

---

## Success Criteria

### Verification Commands
```bash
cd backend && go build ./...                    # Expected: no errors
cd backend && go test ./...                     # Expected: PASS
cd backend && go run cmd/server/main.go         # Expected: server starts on :8080
curl http://localhost:8080/health               # Expected: {"status":"ok"}
curl http://localhost:8080/api/v1/profile       # Expected: 401 Unauthorized
```

### Final Checklist
- [x] All "Must Have" features implemented
- [x] All "Must NOT Have" absent
- [x] All tests pass
- [x] Server starts and responds
- [x] JWT middleware rejects unauthorized requests
- [x] Phase 2 TODO comments present
