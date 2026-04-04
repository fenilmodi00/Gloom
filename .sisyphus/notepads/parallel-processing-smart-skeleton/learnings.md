# Learnings

## 2025-04-04: Endpoint Update for Parallel Processing

- **Changed file**: `app/(tabs)/wardrobe/add-item.tsx`
- **Function modified**: `triggerBackgroundRemoval`
- **Change**: Updated endpoint from `/process-rembg` to `/process-parallel` on line 46
- **Reason**: The backend now uses parallel processing instead of sequential rembg processing
- **Impact**: All new wardrobe item additions will use the new parallel processing endpoint
- **Verification**: No TypeScript errors; file diagnostics clean

## 2025-04-04: Category-Specific Skeleton for Analyzing Items

- **Changed file**: `app/(tabs)/wardrobe/index.tsx`
- **Component modified**: `CategoryCard`
- **Change**: 
  - Imported `SkeletonCard` from `WardrobeSkeleton` as `CategorySpecificSkeletonCard`
  - Added `isAnalyzing` status check using type assertion `(status as any) === 'analyzing'` (ProcessingStatus type missing 'analyzing')
  - For `isAnalyzing && item.category`, render category-specific skeleton with `variant={category}` (mapping 'accessories' → 'default')
  - Combined image opacity condition: hide image during both `isProcessing` and `isAnalyzing`
  - Updated "Original" badge condition to exclude analyzing items
- **Reason**: Provide better UX during Gemini+rembg parallel processing by showing clothing-shaped skeletons instead of generic rectangles when category is known
- **Category mapping**: 'accessories' maps to 'default' because SkeletonVariant doesn't have 'accessories'
- **Dimensions**: Category-specific skeleton uses CARD_WIDTH=120, CARD_HEIGHT=150 (matches existing constants)
- **Verification**: File-specific TypeScript check passes aside from pre-existing FlashList prop errors unrelated to this change
