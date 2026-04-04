# Parallel Processing + Smart Skeleton Loading Plan

## Objective
Improve perceived performance by:
1. Running Gemini categorization FIRST (1-2s) to get category tags
2. Showing category-specific skeleton UI while Rembg processes
3. Running Rembg for background removal (20-30s)
4. Merging results when both complete

## Current Flow (Sequential)
```
Upload Image → Rembg (20-30s) → Upload Cutout → Gemini (1-2s) → Complete
Total: ~25-35 seconds
User sees generic skeleton the entire time
```

## Target Flow (Optimized)
```
Upload Image → [Gemini (1-2s) → Update DB with category] → [Rembg (20-30s)] → Complete
Total: ~25-30 seconds (same)
BUT User sees:
- 0-2s: Generic skeleton
- 2-22s: Category-specific skeleton (shirt/pants/shoes)
- 22-30s: Cutout image with tags
```

## Implementation Details

### Backend Changes
1. **Create new handler**: `backend/internal/handlers/wardrobe/parallel_handler.go`
   - Endpoint: `POST /api/v1/wardrobe/:id/process-parallel`
   - Flow: 
     1. Verify item exists
     2. Run Gemini FIRST on original image (1-2s)
     3. Update DB: category, tags, status='analyzing'
     4. Run Rembg on original image (20-30s)
     5. Upload cutout to storage
     6. Update DB: cutout_url, status='completed'
   - Error handling: If Gemini fails, continue with Rembg (user can manually tag)

2. **Update server routing**: `backend/cmd/server/main.go`
   - Register the new route

3. **Keep existing handler**: `rembg_handler.go` as fallback

### Frontend Changes
1. **Update add-item.tsx**: 
   - Call `/process-parallel` instead of `/process-rembg`

2. **Enhanced skeleton UI** (`app/(tabs)/wardrobe/index.tsx`):
   - Check item.category in CategoryCard component
   - If status='analyzing' AND category exists → show category-specific skeleton
   - If status='processing' AND no category → show generic skeleton
   - If status='completed' → show cutout image

3. **Processing store** (`lib/store/wardrobe-processing.store.ts`):
   - Already handles status updates via realtime/polling
   - No changes needed - it reacts to DB status changes

### Skeleton Component
**Already implemented!** `components/shared/WardrobeSkeleton.tsx` has:
- `SkeletonCard` component with `variant` prop
- Variants: 'tops' (shirt), 'bottoms' (pants), 'shoes', 'bags', 'fullbody', 'outerwear', 'default'
- Animated shimmer effect

## Database Schema
No changes needed - existing columns support this:
- `category`: VARCHAR (already exists)
- `sub_category`: VARCHAR (already exists)
- `style_tags`: TEXT[] (already exists)
- `occasion_tags`: TEXT[] (already exists)
- `colors`: TEXT[] (already exists)
- `cutout_url`: VARCHAR (already exists)
- `processing_status`: VARCHAR (already exists: 'processing', 'completed', 'failed', 'fallback')

## API Contract

### Request
```
POST /api/v1/wardrobe/:id/process-parallel
Authorization: Bearer <jwt>
```

### Response (202 Accepted)
```json
{
  "message": "Parallel processing started",
  "item_id": "uuid"
}
```

### Status Flow
1. Initial: `processing_status = 'processing'` (set by addItem)
2. After Gemini: `processing_status = 'analyzing'`, category/tags populated
3. After Rembg: `processing_status = 'completed'`, cutout_url populated

## Error Handling
- **Gemini failure**: Continue with Rembg, log error, user can manually tag later
- **Rembg failure**: Set status='fallback', show original image
- **Both fail**: Set status='failed'

## Testing Strategy
1. **Unit tests**: 
   - Parallel handler: Gemini success + Rembg success
   - Parallel handler: Gemini failure + Rembg success
   - Parallel handler: Gemini success + Rembg failure
   - Parallel handler: Both failure

2. **Integration tests**:
   - End-to-end flow with mock services
   - Verify skeleton UI updates correctly
   - Verify final item has correct data

## Estimated Effort
- Backend: 2-3 hours
- Frontend: 1-2 hours
- Testing: 1-2 hours
- Total: 4-7 hours

## Dependencies
- Existing `WardrobeSkeleton` component (already has category variants)
- Existing realtime subscription/polling in processing store
- Existing DB schema

## Risks
- Low: Uses existing patterns and infrastructure
- Medium: Need to ensure race conditions don't occur (DB updates are idempotent)
- Low: Fallback to existing behavior if new endpoint fails

## Success Criteria
1. [ ] New endpoint returns 202 Accepted
2. [ ] Gemini runs first, updates category in DB
3. [ ] Frontend shows category-specific skeleton when available
4. [ ] Rembg runs after Gemini, provides cutout
5. [ ] Final item has both category tags and cutout image
6. [ ] Error cases handled gracefully
7. [ ] Performance: Total time ~25-30s, but perceived wait reduced