# Wardrobe Image Processing System Backend Code Review

## Executive Summary

The wardrobe image processing system has several critical issues that cause user experience problems and potential data inconsistencies. The dual-endpoint architecture creates confusion, status transitions are inconsistent, and image cleanup is unreliable. The system needs consolidation and improved error handling.

## Critical Issues Found

### 1. Dual Endpoint Problem (HIGH PRIORITY)

**Issue:** Two processing endpoints exist with different, conflicting flows:
- `/process-parallel`: Gemini → Rembg → Complete
- `/process-rembg`: Rembg → Gemini → Complete

**Impact:**
- Inconsistent AI analysis (Gemini sees original vs cutout)
- Confusing status transitions
- Race conditions if both endpoints called simultaneously
- Frontend must choose wrong endpoint

**Evidence:**
```go
// parallel_handler.go - Gemini first on original
categorizeWithGeminiOnOriginal(ctx, itemID, userID, imageURL)

// rembg_handler.go - Gemini on cutout after processing
h.categorizeWithGemini(ctx, itemID, userID, cutoutURL)
```

### 2. Status State Confusion (HIGH PRIORITY)

**Issue:** 'analyzing' status means different things in different handlers:
- Parallel handler: Gemini complete, Rembg running
- Rembg handler: Rembg complete, Gemini running

**Impact:**
- Frontend can't reliably interpret processing progress
- Inconsistent user feedback
- Status-based logic breaks

**Evidence:**
```go
// parallel_handler.go:148
// Sets status to 'analyzing' after Gemini completes but before Rembg starts

// rembg_handler.go:129
// Sets status to 'analyzing' after Rembg completes but before Gemini starts
```

### 3. Image Lifecycle Problems (MEDIUM PRIORITY)

**Issue:** Both original and cutout images are permanently stored, temp cleanup unreliable.

**Problems:**
- Storage waste (2x images)
- Cleanup only in defer, fails on early panics
- No rollback on processing failures
- Race condition between upload and deletion

**Evidence:**
```go
// Both handlers delete temp in defer
defer func() {
    <-h.semaphore
    h.deleteTempImage(imageURL)  // Only deletes temp, keeps both permanent
}()
```

### 4. Race Condition in Parallel Processing (MEDIUM PRIORITY)

**Issue:** No coordination between concurrent processing attempts on same item.

**Impact:**
- Multiple goroutines can process same item simultaneously
- Conflicting DB updates
- Resource waste
- Potential data corruption

### 5. Error Handling Inconsistencies (MEDIUM PRIORITY)

**Issue:** Different error handling patterns and 'fallback' status misuse.

**Problems:**
- Some errors set 'fallback', others don't
- No distinction between temporary vs permanent failures
- Fallback status used for both processing failures and timeouts

## Database Schema Assessment

**Current Schema:**
```sql
wardrobe_items (
    image_url TEXT NOT NULL,           -- Original image
    cutout_url TEXT,                   -- Processed cutout
    processing_status TEXT DEFAULT 'ready'  -- Status enum
)
```

**Issues:**
- No processing start timestamp
- No error details storage
- No processing attempt counter
- Status enum allows invalid values

**Recommendations:**
- Add processing metadata fields
- Use proper enum constraints
- Add indexes for processing queries

## Recommended Solutions

### Solution 1: Consolidate to Single Endpoint

**Recommendation:** Keep only `/process-parallel` endpoint with this flow:
1. Gemini on original (fast, 1-2s)
2. Update category immediately
3. Rembg processing (slow, 20-30s)
4. Upload cutout and complete

**Code Changes:**
- Remove `rembg_handler.go` entirely
- Update routing to use only parallel handler
- Standardize status transitions

### Solution 2: Fix Status State Machine

**New Status Flow:**
```
pending → processing → analyzing → completed
    ↓         ↓           ↓          ↓
   timeout   error      error      success
```

**Status Meanings:**
- `pending`: Queued for processing
- `processing`: Rembg running
- `analyzing`: Gemini running (after Rembg)
- `completed`: All done, cutout ready
- `failed`: Processing failed permanently
- `fallback`: Using original image

### Solution 3: Improve Image Lifecycle

**Changes:**
- Only store cutout permanently, delete original after processing
- Move temp cleanup to dedicated cleanup function with retries
- Add processing transaction rollback on failures
- Use atomic operations for image replacement

### Solution 4: Add Processing Coordination

**Implementation:**
- Add processing lock per item (database or Redis)
- Prevent concurrent processing of same item
- Add processing timeout and cleanup
- Queue duplicate requests

## Code-Level Fixes

### Fix 1: Remove Duplicate Endpoint

**Action:** Delete `rembg_handler.go` and update routing.

**File:** `backend/internal/handlers/wardrobe/handler.go` (assuming exists)
```go
// Remove rembg handler registration
// router.Post("/wardrobe/:id/process-rembg", rembgHandler.ProcessRembg)
```

### Fix 2: Standardize Status Transitions

**File:** `parallel_handler.go`

```go
// Update processParallelInBackground
func (h *ParallelHandler) processParallelInBackground(itemID uuid.UUID, userID uuid.UUID, imageURL string) {
    // ... existing setup ...
    
    // Step 1: Set processing (Rembg starting)
    _, err = h.db.Exec(context.Background(), `
        UPDATE wardrobe_items SET processing_status = 'processing'
        WHERE id = $1`, itemID)
    
    // Step 2: Run Gemini on original (fast)
    h.categorizeWithGeminiOnOriginal(ctx, itemID, userID, imageURL)
    
    // Step 3: Run Rembg
    cutoutBytes, err := h.rembgClient.RemoveBackgroundFromURL(ctx, imageURL)
    if err != nil {
        h.updateFailed(itemID)
        return
    }
    
    // Step 4: Set analyzing (Gemini on cutout)
    _, err = h.db.Exec(context.Background(), `
        UPDATE wardrobe_items SET processing_status = 'analyzing'
        WHERE id = $1`, itemID)
    
    // Step 5: Run Gemini on cutout
    h.categorizeWithGeminiOnCutout(ctx, itemID, userID, cutoutURL)
    
    // Step 6: Complete
    _, err = h.db.Exec(context.Background(), `
        UPDATE wardrobe_items 
        SET cutout_url = $1, processing_status = 'completed',
            image_url = NULL  -- Remove original
        WHERE id = $2`, cutoutURL, itemID)
}
```

### Fix 3: Improve Cleanup Logic

**File:** `parallel_handler.go`

```go
// Add robust cleanup function
func (h *ParallelHandler) cleanupProcessing(itemID uuid.UUID, tempURL string, cutoutURL *string) {
    // Always try to delete temp image
    h.deleteTempImageWithRetry(tempURL)
    
    // If processing failed and we have a cutout, clean it up too
    if cutoutURL != nil {
        h.deleteCutoutImage(*cutoutURL)
    }
    
    // Reset processing status on failure
    h.db.Exec(context.Background(), `
        UPDATE wardrobe_items 
        SET processing_status = 'failed'
        WHERE id = $1 AND processing_status != 'completed'`, itemID)
}

// Add retry logic for cleanup
func (h *ParallelHandler) deleteTempImageWithRetry(imageURL string) {
    const maxRetries = 3
    for i := 0; i < maxRetries; i++ {
        if h.deleteTempImage(imageURL) {
            return
        }
        time.Sleep(time.Duration(i+1) * time.Second)
    }
    log.Printf("WARN: Failed to cleanup temp image after %d attempts: %s", maxRetries, imageURL)
}
```

### Fix 4: Add Processing Lock

**File:** `parallel_handler.go`

```go
// Add before processing starts
func (h *ParallelHandler) acquireProcessingLock(itemID uuid.UUID) bool {
    result, err := h.db.Exec(context.Background(), `
        UPDATE wardrobe_items 
        SET processing_status = 'processing'
        WHERE id = $1 AND processing_status IN ('ready', 'failed', 'fallback')`, itemID)
    
    rowsAffected := result.RowsAffected()
    return err == nil && rowsAffected == 1
}

// Check lock in ProcessParallel
func (h *ParallelHandler) ProcessParallel(c *fiber.Ctx) error {
    // ... existing validation ...
    
    // Check if already processing
    if !h.acquireProcessingLock(id) {
        return response.Conflict(c, "Item is already being processed")
    }
    
    // ... rest of function ...
}
```

## Testing Recommendations

1. **Unit Tests:** Add tests for each status transition
2. **Integration Tests:** Test full processing pipeline
3. **Concurrency Tests:** Verify no race conditions
4. **Cleanup Tests:** Ensure temp images deleted on failures

## Migration Plan

1. **Phase 1:** Add new status fields to schema
2. **Phase 2:** Deploy improved parallel handler
3. **Phase 3:** Remove rembg endpoint after monitoring
4. **Phase 4:** Clean up orphaned temp images
5. **Phase 5:** Update frontend to handle new status flow

## Risk Assessment

- **Low Risk:** Status standardization (backward compatible)
- **Medium Risk:** Endpoint removal (monitor for usage)
- **High Risk:** Image lifecycle changes (data loss potential)

## Conclusion

The dual-endpoint architecture is the root cause of most issues. Consolidation to a single, well-defined processing flow with proper error handling and cleanup will resolve all identified problems. The recommended changes improve reliability, reduce complexity, and provide better user experience.</content>
<parameter name="filePath">backend-code-review-report.md