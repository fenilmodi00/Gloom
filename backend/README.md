# StyleAI Backend

The backend for StyleAI is built with Go, utilizing the Fiber v2 web framework and PostgreSQL for data persistence. It serves the frontend Expo application via RESTful APIs.

## Architecture

- **Language:** Go (1.23+)
- **HTTP Framework:** Fiber v2 (`github.com/gofiber/fiber/v2`)
- **Database:** PostgreSQL accessed using `pgx/v5` with raw SQL queries (No ORM). Connects directly to the Supavisor transaction pooler.
- **Authentication:** Validates Supabase JWT tokens via `golang-jwt/v5` using the HS256 algorithm.

## Environment Variables

The backend requires the following environment variables to be set (usually in a `.env` file at the `backend/` directory root):

```env
# Server Configuration
PORT=8080
GO_ENV=development # development | production

# Database
DATABASE_URL=postgres://user:password@host:port/dbname

# Authentication
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Supabase Storage (if applicable for file uploads)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Running the Server

A `Makefile` is provided to simplify common tasks. All commands should be run from within the `backend/` directory.

- **Run in Development:**
  ```bash
  make run
  ```
  *Starts the server using `go run cmd/server/main.go`.*

- **Build Production Binary:**
  ```bash
  make build
  ```
  *Compiles the application into `bin/server`.*

- **Run Tests:**
  ```bash
  make test
  ```
  *Executes the test suite using standard Go testing (`go test -v ./...`).*

## Database Migrations

Database migrations are managed using the `golang-migrate` tool.

- **Apply all up migrations:**
  ```bash
  make migrate-up
  ```

- **Revert all down migrations:**
  ```bash
  make migrate-down
  ```

*Make sure the `DATABASE_URL` environment variable is available when running migrations.*

## API Guidelines

### Response Formats

All API responses follow a standardized JSON envelope structure.

**Success Responses (200 OK, 201 Created):**
```json
{
  "data": {
    "key": "value"
  }
}
```

**Error Responses:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description."
  }
}
```

### Development Guidelines
- **Typing:** Strictly prohibit the use of `any` types.
- **Nullability:** Use pointer types (e.g., `*string`, `*float64`) for nullable database columns.
- **Arrays:** Initialize empty slices (e.g., `[]string{}`) instead of returning `nil` for optional arrays.
- **JSON Tags:** Always use `snake_case` for JSON struct tags.
- **Graceful Shutdown:** The Fiber server implements context-aware graceful shutdown handling `SIGINT`/`SIGTERM` signals.
