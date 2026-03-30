# Background Removal Feature Design

## Overview
This document describes the implementation of a background removal feature for the Gloom app. When users upload images of their clothing items, the app will automatically remove the background to isolate the clothing item, improving the quality of wardrobe images and AI tagging accuracy.

## Architecture Approach
We'll implement a hybrid approach with fallback:
1. **Primary path**: Mobile app calls background removal API directly (e.g., Remove.bg, Cloudinary)
2. **Fallback path**: If direct API fails or for billing control, mobile sends to Go backend which proxies to the service
3. **Storage**: Processed image replaces original (no duplicate storage)
4. **Data model**: Wardrobe item stores processed image URL

## Detailed Design

### 1. Mobile App Flow (Expo React Native)
#### Image Selection & Processing
1. User selects/takes photo in AddItemScreen
2. Before uploading to storage, app attempts direct API call to background removal service
3. If successful, receives processed image URL
4. If direct API fails, falls back to backend proxy endpoint
5. Processes image URL is used for storage upload and wardrobe item creation

#### API Integration
- **Direct API Call**: Mobile app calls third-party background removal service (e.g., Remove.bg API) with image data
- **Fallback Endpoint**: Mobile app calls `/api/v1/background-remove` on Go backend
- **Authentication**: Uses same auth mechanism as other API calls (Bearer token from Supabase session)

#### Error Handling
- Network failures: Show retry option
- API errors: Fall back to backend proxy
- Processing timeouts: Show loading state with cancel option
- Invalid responses: Fall back to original image with warning

### 2. Backend Changes (Go Service)
#### New Endpoint
```
POST /api/v1/background-remove
```
- Accepts multipart/form-data with image file
- Authenticates user via Supabase JWT
- Calls background removal service API
- Returns processed image URL
- Implements rate limiting and billing controls

#### Implementation Details
- Reuses existing auth middleware
- Uses environment variables for background removal API credentials
- Implements circuit breaker pattern for external service reliability
- Returns proper HTTP status codes (200 for success, 400/500 for errors)

### 3. Data Model Changes
#### Wardrobe Item Model
No database schema changes needed - we're replacing the existing `image_url` field with the processed image URL rather than storing both versions.

#### Upload Flow Modification
In `wardrobe.store.ts`:
1. Modify `uploadImage` function OR create new `uploadProcessedImage` function
2. Add background removal step before actual storage upload
3. Use processed image URL for the storage upload call

### 4. Third-Party Service Selection
#### Recommended Services
1. **Remove.bg**: High accuracy for clothing, good documentation, reliable
2. **Cloudinary**: Background removal as part of broader image transformation suite
3. **Clipdrop**: Good for fashion/apparel specifically

#### Evaluation Criteria
- Accuracy on clothing items (preserving details like buttons, zippers, textures)
- Processing speed (< 3 seconds ideal)
- Cost per image
- API reliability and uptime
- Documentation quality

### 5. Security Considerations
- API keys for background removal service stored in backend environment variables (not in mobile app)
- Mobile-to-backend communication uses existing Supabase auth
- Direct mobile-to-service calls use temporary/expirable tokens if required by service
- Image data transmitted over HTTPS only
- No storage of original images if replaced (privacy benefit)

### 6. Performance & Optimization
- Show loading indicator during background removal
- Allow cancel during long-running operations
- Cache successful removals temporarily to avoid reprocessing same image
- Consider image size optimization before sending to service (resize if too large)
- Implement retry logic with exponential backoff for transient failures

### 7. Testing Strategy
#### Unit Tests
- Mobile app: Test API call wrappers, success/error handling
- Backend: Test endpoint authentication, service integration, error cases

#### Integration Tests
- End-to-end flow: image selection → background removal → storage → wardrobe item creation
- Fallback scenarios: direct API failure triggering backend proxy

#### Manual Testing
- Test with various clothing types (tops, bottoms, shoes, accessories)
- Test with different backgrounds (complex patterns, simple colors, shadows)
- Test edge cases (partial occlusions, unusual angles)

### 8. Error Handling & Recovery
#### User-Facing Errors
- "Background removal failed. Try again?" with retry button
- "Processing taking longer than expected..." with cancel option
- Fall back to original image if all removal attempts fail, with visual indicator

#### Logging & Monitoring
- Log background removal API calls (success/failure, timing)
- Monitor error rates and latency
- Alert on service degradation or API credential issues

### 9. Future Enhancements
- Option to keep original image alongside processed version
- User editing capability to refine background removal results
- Batch processing for multiple images
- Pre-warming of background removal service for faster response
- A/B testing of different background removal services

## Open Questions
1. Which specific background removal service should we integrate with first?
2. What should be the timeout threshold for direct API calls before falling back to backend?
3. Should we implement any client-side preprocessing (resizing, compression) before sending to background removal service?
4. How should we handle images where background removal fails completely (e.g., very similar foreground/background colors)?

## Conclusion
This design provides a robust, user-friendly background removal implementation that prioritizes image quality for clothing items while maintaining good performance and reliability through fallback mechanisms. The hybrid approach gives us flexibility to optimize for cost, speed, and reliability as we learn from real-world usage.