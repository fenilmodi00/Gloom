# Draft: Add Item Background Removal Service

## User Requirements (confirmed)
- Integrate rembg service at: `https://rembg-service-fenilgemini2735-u98og5k0.leapcell.dev/remove-background`
- Service accepts: `POST` with multipart form data (`file=@image.png`)
- Returns: cutout image (background removed)
- **Cost optimization critical** — on free trial, limited resources
- **Temporary storage pattern**: Upload original → trigger rembg → poll/wait → replace with cutout
- **Skip Gemini tagging for testing** — focus on rembg service invocation only
- Want clean, clear reimplementation (existing code works but messy)

## Current Implementation Issues Found

### Architecture Problems
1. **Business logic in screen**: `add-item.tsx` has `pollForProcessingCompletion()` and `triggerBackgroundRemoval()` — should be in store/lib
2. **Direct Supabase queries in screen**: `supabase.from('wardrobe_items').select(...)` — violates AGENTS.md ("NO direct Supabase queries in screens")
3. **Dual upload paths**: Screen generates file path, store uploads — coordination is fragile
4. **`as any` anti-pattern**: `wardrobe.store.ts:67` uses `as any` for FormData — forbidden by AGENTS.md

### Flow Problems
5. **Blocking UI**: Entire flow is synchronous — user waits 2+ minutes with loading overlay
6. **Complex proxy chain**: App → Backend Proxy → Edge Function → Supabase → Rembg (5 hops!)
7. **Polling in UI**: `pollForProcessingCompletion()` runs in screen component with 30 attempts × 2s = 60s max
8. **Error handling**: Background removal failures are silently ignored ("continue anyway")

### Code Quality
9. **Inconsistent auth handling**: Screen gets session one way, store gets it another
10. **Mixed concerns**: Upload, DB insert, rembg trigger, polling, Gemini tagging all in one function
11. **Hardcoded URLs**: Backend URL scattered across files

## Proposed Architecture

### Clean Flow
```
1. User selects/captures image
2. Upload ORIGINAL to temp bucket (via backend proxy)
3. Create DB record with image_url = original, processing_status = 'processing'
4. Call rembg service DIRECTLY (not through Edge Function)
5. Upload cutout result to permanent bucket
6. Update DB: cutout_url = cutout URL, processing_status = 'completed'
7. (Later) Gemini tagging on cutout image
```

### Key Decisions Needed
- Should rembg be called from frontend or backend?
- How to handle the 2-minute wait without blocking UI?
- Should we use websockets, polling, or optimistic UI?
- What happens if rembg fails? Retry? Fallback to original?

## Research Findings
- No existing rembg-related files in codebase
- Backend has `edgefunction/handler.go` — currently unused for rembg
- Backend has `wardrobe/upload_handler.go` — handles temp uploads
- Supabase schema has `processing_status` column (supports: pending, processing, completed, failed)

## User Decisions (confirmed)
- **Rembg call location**: BACKEND calls rembg (not frontend direct)
- **Processing UX**: Background with notification — start processing, let user browse, show toast when done
- **Failure handling**: Retry with fallback — retry 2-3 times, then fall back to original image
- **Gemini tagging**: Keep mock tagging for full flow simulation

## Test Strategy Decision
- **Infrastructure exists**: YES (Jest, bun test)
- **Automated tests**: YES (TDD)
- **Agent-Executed QA**: ALWAYS (mandatory for all tasks)

## Open Questions
- None — all requirements clear
