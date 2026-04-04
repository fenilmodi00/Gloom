# Parallel Processing + Smart Skeleton - Decisions

## Decision 1: Handler Pattern
Use same struct-based handler pattern as existing rembg_handler.go with:
- Dependency injection via constructor
- Same DB, rembgClient, geminiClient dependencies
- Semaphore for concurrency limiting

## Decision 2: New Endpoint
- Endpoint: `POST /api/v1/wardrobe/:id/process-parallel`
- Keep existing `/process-rembg` as fallback
- New handler runs Gemini FIRST on original image

## Decision 3: Frontend Skeleton
- When item has category AND status is 'analyzing', show category-specific skeleton
- Use `WardrobeSkeleton.SkeletonCard` with variant prop instead of generic SkeletonCard
- Map item.category to SkeletonVariant ('tops', 'bottoms', etc.)

## Decision 4: Type Workarounds (2025-04-04)
- ProcessingStatus type definition missing 'analyzing' → used `as any` assertion for comparison
- Category includes 'accessories' but SkeletonVariant expects 'default' → runtime mapping `category === 'accessories' ? 'default' : category`
- These are temporary until type definitions and schema are updated to include 'analyzing' and unify category/variant types
