# Background Removal System Improvements - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical reliability issues, replace polling with realtime, and deliver a polished UX for the background removal feature.

**Architecture:**
1. Frontend (React Native + Expo) uses Supabase for storage and DB.
2. Backend (Go Fiber) calls GCP Cloud Run for background removal.
3. Current: polling-based status updates. Target: Realtime subscriptions + skeleton UX.

**Tech Stack:**
- React Native, Expo, TypeScript, Zustand
- Supabase (storage, DB, auth, realtime)
- Go Fiber (backend)
- GCP Cloud Run (rembg service)

---

## Phase 1: Critical Stabilization (Auth & Memory Leaks)

### Task 1.1: Validate Auth Token in `triggerBackgroundRemoval`

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:25-52`

**Step 1:** Write failing test (mock fetch, ensure Error thrown when token missing)
```ts
import { triggerBackgroundRemoval } from './add-item';
import { jest } from '@jest/globals';

test('triggerBackgroundRemoval throws if authToken missing', async () => {
  await expect(triggerBackgroundRemoval('item-id', 'path', '')).rejects.toThrow('No auth token');
});
```

**Step 2:** Implement guard clause
```ts
if (!authToken) {
  console.error('No auth token available');
  return { success: false, error: 'Authentication required' };
}
```

**Step 3:** Ensure dev fallback only used for Edge Functions (remove from this function). Already exists in `handleSave`.

**Acceptance:** Early return with error if no token; never send request without Authorization header.

**Dependencies:** None.

### Task 1.2: Fix Upload-Trigger Race Condition (Atomic Operation)

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:147-224`
- Potentially `lib/store/wardrobe.store.ts` (ensure `addItem` returns item with id)

**Step 1:** Extract upload+trigger into a single function with rollback.
```ts
async function uploadAndProcess(item: Omit<WardrobeItemInput, 'processing_status'>): Promise<WardrobeItem> {
  const newItem = await addItem({ ...item, processing_status: 'processing' });
  const { user } = useAuthStore.getState();
  const filePath = `${user?.id}/temp/${uuidv4()}.jpg`;
  // Update item with correct file_path if needed
  const triggerResult = await triggerBackgroundRemoval(newItem.id, filePath, authToken);
  if (!triggerResult.success) {
    await supabase.from('wardrobe_items').update({ processing_status: 'failed' }).eq('id', newItem.id);
    throw new Error('Trigger failed');
  }
  return newItem;
}
```

**Step 2:** Write tests for failure: mock `triggerBackgroundRemoval` to fail; assert item's status becomes `failed`.

**Acceptance:** If backend trigger fails, item status is `failed` immediately and user sees error toast.

**Dependencies:** Task 1.1.

### Task 1.3: Memory Leak - Unsubscribe on Unmount

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx` (useEffect cleanup)

**Step 1:** Locate where `startProcessing` is called (line ~204). Store the `stopPolling` function in a ref.

```ts
const stopPollingRef = useRef<(() => void) | null>(null);
useEffect(() => {
  if (photoUri) {
    const { stopProcessing } = useWardrobeProcessingStore.getState();
    stopPollingRef.current = stopProcessing;
    startProcessing(newItem.id);
  }
  return () => {
    stopPollingRef.current?.();
  };
}, [photoUri, newItem?.id]);
```

**Step 2:** Test by unmounting component; verify no setInterval logs.

**Acceptance:** Interval cleared on unmount; no memory leak warnings.

**Dependencies:** None.

---

## Phase 2: Replace Polling with Realtime (High Impact)

### Task 2.1: Convert Polling Store to Realtime Subscription

**Files:**
- Modify: `lib/store/wardrobe-processing.store.ts` (entire file)

**Step 1:** Write tests for the store:
- `startProcessing` should call `supabase.channel(...).subscribe()`.
- `on('postgres_changes')` should update state to `completed` when DB row changes.
- `stopProcessing` should unsubscribe.

**Step 2:** Replace `startPolling` loop with Realtime subscription.
```ts
channel = supabase
  .channel(`wardrobe-processing-${itemId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'wardrobe_items', filter: `id=eq.${itemId}` },
    (payload) => {
      const status = payload.new.processing_status;
      if (status === 'completed') {
        set({ status: 'completed', cutoutUrl: payload.new.cutout_url });
        showToast({ type: 'success', message: 'Background removed!' });
      } else if (status === 'failed' || status === 'fallback') {
        set({ status });
        showToast({ type: 'error', message: 'Processing failed.' });
      }
    }
  )
  .subscribe();
```

**Step 3:** Remove `setInterval` and poll attempt counters.

**Step 4:** Add fallback: if Realtime fails (network), revert to polling after 30s.

**Acceptance:** No polling; updates instantly upon DB change. Unsubscribe on stop.

**Dependencies:** Task 1.3 (store cleanup).

### Task 2.2: Backend - Configurable Concurrency Limit

**Files:**
- Modify: `backend/internal/handlers/wardrobe/rembg_handler.go:30-45`

**Step 1:** Add config field `RembgMaxConcurrent` (default 2).
```go
type Config struct {
  RembgServiceURL string
  RembgMaxConcurrent int
}
```

**Step 2:** Replace `semaphore := make(chan struct{}, 2)` with `make(chan struct{}, cfg.RembgMaxConcurrent)`.

**Step 3:** Write unit test: simulate 10 concurrent requests; verify max concurrent calls to Cloud Run do not exceed limit (use mock client counting semaphore acquire).

**Acceptance:** Limit can be changed via env var without code change.

**Dependencies:** None.

---

## Phase 3: Data Quality & Code Hygiene (Medium)

### Task 3.1: UUID for Temporary File Names

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:186-188`
- Modify (backend): any similar temp path generation.

**Step 1:** Install `uuid` if not present: `npm install uuid` + `import { v4 as uuidv4 } from 'uuid'`.
**Step 2:** Replace `${Date.now()}.${fileExt}` with `${uuidv4()}.${fileExt}`.
**Step 3:** Ensure backend Cloud Run call uses same path (should match uploaded file).

**Acceptance:** Collision probability negligible.

**Dependencies:** None.

### Task 3.2: Remove Hardcoded Category

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:173`

**Step 1:** Change `category: 'tops'` to `category: null`.
**Step 2:** Verify `addItem` accepts null (likely yes, as DB column nullable).
**Step 3:** Ensure wardrobe UI handles null category gracefully (maybe show "Uncategorized").

**Acceptance:** No hardcoded default; AI tagging will set later.

**Dependencies:** None.

### Task 3.3: Remove Debug Logs

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:194-196` (console.log)
- Modify: any backend debug logs.

**Step 1:** Move logs to a `debug` flag or remove entirely.
**Step 2:** Keep errors; remove verbose info logs.

**Acceptance:** No `console.log` in production build (verify with bundle analyzer).

**Dependencies:** None.

---

## Phase 4: Backend Observability & Reliability (Low)

### Task 4.1: Cleanup Temporary Storage

**Files:**
- Modify: `backend/internal/handlers/wardrobe/rembg_handler.go` (after uploadCutout or on fallback)

**Step 1:** After successful cutout upload to Supabase, delete the original temporary file (`temp/{userId}/{fileName}`).
**Step 2:** On failure (fallback), also delete temp file after marking item.
**Step 3:** Use `context` to propagate cancellation and ensure cleanup even on panic (defer).

**Acceptance:** No temp files remain after processing completes (check storage manually).

**Dependencies:** Task 2.2 (backend config).

### Task 4.2: Add Structured Logging

**Files:**
- Modify: `backend/internal/services/rembg/client.go` and handler.

**Step 1:** Use `logrus` or `slog` with fields: `item_id`, `status`, `retry_count`, `duration_ms`.
**Step 2:** Emit events: `rembg_started`, `rembg_completed`, `rembg_failed`.

**Acceptance:** Logs visible in Cloud Run logs with structured JSON.

**Dependencies:** None.

### Task 4.3: Centralize Retry Logic (Client)

**Files:**
- Create: `backend/internal/services/rembg/retry.go`
- Modify: `client.go` to use generic retry helper.

```go
func WithRetry[T any](fn func() (T, error), maxAttempts int) (T, error) { ... }
```

**Step 1:** Extract existing retry loop into helper.
**Step 2:** Update `RemoveBackgroundFromURL` to call helper.

**Acceptance:** Single source of truth for retry/backoff; used by other services if needed.

**Dependencies:** None.

---

## Phase 5: UX Polish (Skeleton & Animations)

### Task 5.1: Skeleton Overlay in Preview Screen

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:302-327` (preview screen)
- Use: `components/shared/WardrobeSkeleton.tsx` as placeholder.

**Step 1:** Wrap preview image container with `position: 'relative'` and fixed `aspectRatio: 3/4`.
**Step 2:** Conditionally render `WardrobeSkeleton` absolutely positioned over the image container while `isProcessing` is true.
**Step 3:** Hide actual `<Image>` opacity to 0 when processing.

**Acceptance:** Skeleton covers exact area; no layout shift on completion.

**Dependencies:** Task 1.3 (memory leak fixed).

### Task 5.2: Fade Transition Animation

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:313-315`

**Step 1:** Use `Animated.View` for both skeleton and image.
```tsx
const opacity = useSharedValue(0);
useEffect(() => {
  if (!isProcessing) {
    opacity.value = withSpring(1);
  }
}, [isProcessing]);

<Animated.View style={[styles.previewImage, { opacity: useDerivedValue(() => isProcessing ? 0 : 1) }]}>
  <Image ... />
</Animated.View>
```

**Step 2:** Fade out skeleton when processing completes.

**Acceptance:** Smooth crossfade between states.

**Dependencies:** Task 5.1.

### Task 5.3: Progress Indicator

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:151` (loadingMessage)

**Step 1:** Show count of polling attempts or elapsed time (if using Realtime, show "Waiting for server..." or "Processing..." but with a small progress bar).
**Step 2:** If using Realtime, could show "Status: uploaded → processing → finishing".

**Acceptance:** User sees progress, not indefinite spinner.

**Dependencies:** Task 2.1 (realtime integration).

---

## Rollback Strategies

| Task | Rollback |
|------|----------|
| 1.1 Auth guard | Revert to previous code; ensure ENV fallback still present |
| 1.2 Atomic upload | Keep transaction supports `ROLLBACK`; on failure, delete created row and file |
| 2.1 Realtime | Store polling logic in a separate branch; can revert if Realtime unstable |
| 2.2 Configurable concurrency | Keep default 2; invalid env var falls back to 2 |
| 5.x UX polish | Toggle feature flag `USE_SKELETON_UX`; default true; can switch off instantly |

---

## Parallelization Guide

- **Phase 1 tasks (1.1, 1.3)** are independent and can run in parallel.
- **Task 1.2** depends on 1.1.
- **Phase 2 tasks** depend on Phase 1 completion.
- **Phase 3 tasks** are mostly independent; can run in parallel with Phase 2.
- **Phase 4** backend tasks are independent of frontend and can be done in parallel.
- **Phase 5** depends on Phase 2 (realtime) but can be started early for skeleton placement.

**Suggested execution order for fastest delivery:**
1. 1.1, 1.3, 3.1, 3.2, 3.3 (quick wins) → commit
2. 2.2 (backend config) → commit
3. 2.1 (realtime store) → commit
4. 4.1, 4.2, 4.3 (backend hygiene) → commit
5. 1.2 (atomic upload) → commit
6. 5.1, 5.2, 5.3 (UX polish) → commit

Total estimated effort: 2-3 days (one engineer) with parallelization.

---

## Testing Strategy

- **Unit tests:** TriggerBackgroundRemoval error paths, store subscription logic, atomic rollback.
- **Integration tests:** End-to-end upload → backend → realtime update (use Supabase test container).
- **Manual QA:** Verify skeleton overlay, fade transition, error toasts.

---

## Post-Implementation Checklist

- [ ] All tests pass (`npm test`, `go test ./...`).
- [ ] No console warnings about memory leaks.
- [ ] Realtime events received in dev (check Supabase dashboard).
- [ ] Backend deployed to Cloud Run with new env `REMBG_MAX_CONCURRENT`.
- [ ] Monitor logs for 24h: `rembg_failed` count should be low.
