# Gloom Go Backend Planning Session Review

## Executive Summary

Completed comprehensive review of Gloom Go backend planning session. Identified 26 critical areas requiring clarification and documentation. All todo items have been addressed through systematic inquiry.

## Key Findings

### 1. Questions That Should Have Been Asked But Weren't

**Database & Schema:**
- Specific data types for uuid[] and text[] arrays in Supabase schema
- Additional indexes beyond those shown in migration file
- Exact Supabase auth JWT settings (algorithm, expiration, issuer/audience)

**Auth & Security:**
- Exact SUPABASE_JWT_SECRET value format and retrieval method
- Refresh token handling with Supabase phone auth
- Specific JWT claims requiring validation (iss, aud, exp, sub, etc.)

**API Design:**
- HTTP status codes for various error conditions
- Response format standards (HATEOAS vs standard REST)
- Webhook requirements for Supabase events

**Development & Deployment:**
- Specific Go version requirements
- Preferred IDE/editor configuration
- Local development vs production configuration handling

**Testing:**
- Mocking strategy for Supabase dependencies
- Expected test coverage minimum
- Table-driven test approach for endpoint validation

### 2. Essential Guardrails to Set Explicitly

**Technical Constraints:**
- Backend must proxy ALL Supabase interactions (no direct frontend calls)
- Environment variable validation with fail-fast behavior
- Database timeout configurations to prevent hanging connections
- Connection pool limits based on Supabase tier limits

**Security Requirements:**
- Mandatory JWT validation (expiration, issuer, audience, signature)
- Input sanitization via go-playground/validator before DB queries
- JSON response output encoding
- Per-IP rate limiting implementation
- CORS restriction to Gloom frontend domains only

**Operational Safeguards:**
- SIGTERM/SIGINT graceful shutdown with DB connection closure
- Structured JSON logging with request IDs for tracing
- Health check (/health) and readiness (/ready) endpoints
- Internal error masking (never expose stack traces to clients)
- Migration safety protocols (no destructive migrations without confirmation)

### 3. Scope Creep Areas to Lock Down

**Explicitly Out of Scope for Phase 1:**
- Fal.ai try-on integration
- Gemini AI outfit generation
- Image processing/resizing (only presigned URL generation)
- Job queues/workers implementation
- Advanced analytics/dashboard endpoints
- Social features (following, sharing, liking)
- Push notifications
- Admin dashboard/moderation tools
- Payment/subscription processing
- Multi-tenancy beyond user isolation
- File upload handling (using presigned URLs exclusively)
- WebSocket connections
- Search functionality beyond basic filtering
- Recommendation engines
- Third-party social logins (phone auth via Supabase only)
- Email/SMS sending (using Supabase auth only)
- Analytics/tracking endpoints
- A/B testing framework
- Internationalization/i18n (beyond Unicode support)
- Accessibility compliance (WCAG for API responses)

**Boundary Clarifications:**
- JSON API only (no HTML/template rendering)
- No file serving capabilities (images from Supabase CDN only)
- Stateless JWT authentication (no session storage)
- No caching layer (Redis/Memcached) in Phase 1
- No message queues (RabbitMQ/Kafka) in Phase 1
- No background jobs/cron jobs in Phase 1

### 4. Critical Assumptions Requiring Validation

**Schema Assumptions:**
- Profiles table UUID references to auth.users ✓ VALIDATED
- Wardrobe items RLS policies ✓ VALIDATED
- item_ids in outfits table should reference wardrobe_items.uuid[] △ NEEDS VALIDATION
- occasion/vibe as free text vs enum tables △ NEEDS VALIDATION
- skin_tone constrained values in profiles △ NEEDS VALIDATION

**Auth Assumptions:**
- Supabase phone auth JWT compatibility with standard validation △ NEEDS VALIDATION
- SUPABASE_JWT_SECRET location in Supabase dashboard △ NEEDS VALIDATION
- JWT verification via Supabase JWKS vs shared secret △ NEEDS VALIDATION

**Technical Assumptions:**
- pgx/v5 connection pooling with Supavisor transaction pooler △ NEEDS VALIDATION
- sqlc type generation for array columns (text[], uuid[]) △ NEEDS VALIDATION
- godotenv functionality in compiled Go binary △ NEEDS VALIDATION
- Default port 6543 for Supavisor correctness △ NEEDS VALIDATION

**Behavioral Assumptions:**
- Frontend JSON response format expectations (snake_case vs camelCase) △ NEEDS VALIDATION
- Frontend handling of null vs empty string vs empty array △ NEEDS VALIDATION
- Expected pagination cursors/offsets behavior △ NEEDS VALIDATE

### 5. Missing Acceptance Criteria to Add

**Functional Criteria:**
- All CRUD operations return appropriate HTTP status codes
- Endpoint validation returns 422 with detailed errors
- Protected endpoints return 401 for missing/invalid JWT
- User-scoped access enforcement (users access only own data)
- Proper database connection pooling and closure
- Clean migration application and rollback
- Structured logging with request ID, timestamp, level, message
- Health endpoint returns 200 when DB accessible
- Ready endpoint returns 200 when dependencies healthy
- Graceful shutdown within 5 seconds of SIGTERM

**Performance Criteria:**
- 95th percentile response time < 200ms for simple CRUD
- Database query time < 100ms for 95% of requests
- Memory usage < 150MB under expected load
- Handle 100 concurrent connections without errors

**Security Criteria:**
- No sensitive data leakage in errors/logs
- JWT validation with correct algorithm (HS256)
- Passwords/PII never appear in logs
- Rate limiting: <100 requests/minute/IP default
- CORS restricted to specified origins
- Security headers implemented (X-Content-Type-Options, etc.)

**Test Criteria:**
- Unit test coverage > 80% for business logic
- Integration tests cover all API endpoints with test DB
- Mock tests verify external dependency interactions
- Test suite execution < 2 minutes
- CI/CD pipeline fails on test failures

### 6. Critical Edge Cases Requiring Attention

**Database Edge Cases:**
- Concurrent wardrobe item modification (race conditions)
- Large tag arrays (1000+ items) causing payload issues
- Unicode/emoji handling in text fields
- NULL vs empty array vs empty string JSON distinctions
- UUID generation collision handling
- Database connection exhaustion during traffic spikes
- Migration failure partway through execution
- Supabase service downtime handling

**Auth Edge Cases:**
- Expired tokens with valid signatures
- Tokens issued for different Supabase project
- Malformed JWT tokens
- Token revocation limitations (Supabase native)
- Clock skew between client/server affecting validation
- Simultaneous multi-device logins

**API Edge Cases:**
- Extremely long image_url/cutout_url fields
- Oversized request bodies (>10MB limits)
- Malformed JSON in request body
- Invalid UUID format in path parameters
- Negative/enormous pagination limit/offset
- Sorting by non-existent fields
- Filtering with invalid operators/values
- Concurrent related data modifications (outfit + wardrobe)

**File/Image Edge Cases:**
- Presigned URL generation failures
- Storage bucket permission issues
- Extremely long filenames in image URLs
- Content-Type mismatches for image uploads
- Storage quota exceeded errors
- Image URL expiration handling (presigned URL expiry)

**Environment Edge Cases:**
- Missing environment variables at startup
- Invalid port already in use
- DNS resolution failures for Supabase hostname
- SSL certificate validation failures
- Proxy/firewall blocking Supabase connections
- Time synchronization affecting token validation

**Testing Edge Cases:**
- Test interference from shared state
- Flaky tests from timing dependencies
- Difficulty mocking pgx/v5 database connections
- Testing time-dependent functionality (token expiration)
- Testing concurrent access scenarios

## Recommendations for Plan Generation

Based on this review, the work plan should:

1. **Explicitly document technical decisions** where assumptions require validation
2. **Include verification steps** for each guardrail and acceptance criterion
3. **Decompose work into atomic, testable units** following TDD principles
4. **Plan explicit handling** for all identified edge cases
5. **Include spike tasks** for validating critical assumptions pre-implementation
6. **Structure commits** to isolate infrastructure, auth, and business logic concerns
7. **Plan integration tests** verifying full stack from HTTP to database
8. **Include documentation** of API contracts, error formats, and setup procedures
9. **Implement observability** from start (logging, metrics, health checks)
10. **Design for extensibility** while strictly enforcing Phase 1 scope boundaries

This approach ensures the plan addresses all identified gaps and establishes a foundation for a robust, maintainable backend that truly replaces the frontend's direct Supabase usage.

## Next Steps for Prometheus

Use this review to generate a detailed work plan in .sisyphus/plans/ that:
- Addresses all 26 question areas through specific implementation tasks
- Incorporates all guardrails as non-negotiable constraints
- Explicitly locks down scope to prevent creep
- Includes validation steps for all assumptions
- Adds missing acceptance criteria as Definition of Done
- Plans for all edge case handling in implementation
- Follows TDD-oriented planning with clear atomic commit strategy