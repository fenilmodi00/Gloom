# Model Corrosion Images Feature Design

## Overview
This document describes the implementation of user-specific model corrosion images that are generated after users try on outfits and saved to their personal storage in Supabase.

## Problem Statement
Users want to save personalized model corrosion images (virtual try-on results) after selecting outfits from the trending grid. These images should be stored in the backend/database and linked to the user's account for future reference.

## Proposed Solution
Implement a system where:
1. When a user selects an outfit from the trending grid and clicks "try on", a model corrosion image is generated
2. This image is uploaded to Supabase storage in a user-specific folder
3. The image URL is stored in the user's profile or a dedicated model_images table
4. Users can view their saved model corrosion images from their profile or wardrobe

## Technical Implementation

### 1. Database Schema Changes

#### Option A: Extend User Profile (Simple)
Add columns to the `profiles` table:
```sql
ALTER TABLE profiles 
ADD COLUMN model_corrosion_image_url TEXT,
ADD COLUMN model_corrosion_image_updated_at TIMESTAMPTZ;
```

#### Option B: Dedicated Table (Recommended for scalability)
Create a new `user_model_images` table:
```sql
CREATE TABLE user_model_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_user_model_images_user_id ON user_model_images(user_id);
CREATE INDEX idx_user_model_images_outfit_id ON user_model_images(outfit_id);
```

### 2. Storage Structure

Create new Supabase storage bucket:
- `model-corrosion-images` - For storing user-specific try-on results

Folder structure:
```
model-corrosion-images/
  └── {user_id}/
      ├── {timestamp}_{outfit_id}.jpg
      └── thumbnails/
          └── {timestamp}_{outfit_id}_thumb.jpg
```

### 3. Backend API Endpoints

#### POST /api/v1/model-images/upload
Upload a model corrosion image
```typescript
// Request body
{
  userId: string,
  imageUri: string, // base64 or file URI
  outfitId?: string // optional, links to tried-on outfit
}

// Response
{
  success: boolean,
  data: {
    id: string,
    imageUrl: string,
    thumbnailUrl: string
  }
}
```

#### GET /api/v1/model-images/user/:userId
Get all model corrosion images for a user
```typescript
// Response
{
  success: boolean,
  data: [
    {
      id: string,
      imageUrl: string,
      thumbnailUrl: string,
      outfitId: string | null,
      createdAt: string
    }
  ]
}
```

#### DELETE /api/v1/model-images/:imageId
Delete a specific model corrosion image
```typescript
// Response
{
  success: boolean
}
```

### 4. Frontend Implementation

#### State Management
Create `lib/store/model-image.store.ts` following the pattern of existing stores:
```typescript
interface ModelImageState {
  images: ModelImage[];
  isLoading: boolean;
  error: string | null;
  uploadImage: (uri: string, outfitId?: string) => Promise<ModelImage>;
  fetchUserImages: () => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
}
```

#### UI Components
1. **ModelImageCard** - Component to display saved model images
2. **ModelImageGrid** - Grid view of user's model images
3. **TryOnFlow modification** - Update the try-on flow to save images

#### Integration Points
1. **InspoBottomSheet.tsx** - Modify `handleTryOnPress` to trigger image generation and upload
2. **OutfitCard.tsx** - Add option to view/save model image after try-on
3. **Profile Screen** - Add section to view saved model corrosion images

### 5. Image Generation Process

When user clicks "try on" on an outfit:
1. Frontend captures the current model view (using react-native-view-shot or similar)
2. Image is converted to base64 or file URI
3. Image is uploaded via the upload API endpoint
4. Backend stores image in Supabase storage
5. Backend returns image URL
6. Frontend saves URL to database via API
7. UI updates to show success and optionally display the image

### 6. Security Considerations

1. **RLS Policies** for `user_model_images` table:
   ```sql
   -- Users can only insert their own images
   CREATE POLICY "Users can insert their own model images"
   ON user_model_images FOR INSERT
   WITH CHECK (auth.uid() = user_id);

   -- Users can only read their own images
   CREATE POLICY "Users can read their own model images"
   ON user_model_images FOR SELECT
   USING (auth.uid() = user_id);

   -- Users can only delete their own images
   CREATE POLICY "Users can delete their own model images"
   ON user_model_images FOR DELETE
   USING (auth.uid() = user_id);
   ```

2. **Storage Bucket Policies**:
   - Users can only read/write to their own folder
   - Public access disabled for privacy (use signed URLs if sharing needed)

### 7. Implementation Steps

#### Phase 1: Backend Setup
1. [ ] Create `model-corrosion-images` storage bucket in Supabase
2. [ ] Create `user_model_images` table
3. [ ] Implement RLS policies for table and storage
4. [ ] Create API endpoints for upload, fetch, delete
5. [ ] Update backend presigned URL handler to support new bucket

#### Phase 2: Frontend - State Management
1. [ ] Create `lib/store/model-image.store.ts`
2. [ ] Add model image types to `types/user.ts` or create `types/model-image.ts`
3. [ ] Implement store methods following existing patterns

#### Phase 3: Frontend - UI Components
1. [ ] Create `components/shared/ModelImageCard.tsx`
2. [ ] Create `components/shared/ModelImageGrid.tsx`
3. [ ] Create `components/shared/ModelImageUploader.tsx` (if needed)

#### Phase 4: Integration
1. [ ] Modify `app/(tabs)/inspo/index.tsx` to handle image upload after try-on
2. [ ] Update `app/(tabs)/wardrobe/add-item.tsx` if needed for outfit linking
3. [ ] Add model images section to profile screen

#### Phase 5: Testing & Refinement
1. [ ] Test image upload flow
2. [ ] Test image retrieval and display
3. [ ] Test deletion functionality
4. [ ] Verify RLS policies work correctly
5. [ ] Performance testing with multiple images

### 8. Error Handling & Edge Cases

1. **Upload failures** - Show retry mechanism
2. **Storage quota exceeded** - Notify user to clean up old images
3. **Network issues** - Queue uploads for when back online
4. **Invalid image data** - Validate before upload
5. **Orphaned images** - Implement cleanup job for images without database records

### 9. Future Enhancements

1. **Image sharing** - Allow users to share model images (with privacy controls)
2. **Image editing** - Basic editing tools (crop, filter) before saving
3. **Before/after comparison** - Show original model vs. try-on result
4. **Animation** - Transition effect when generating/saving images
5. **Categories** - Tag model images by outfit type or occasion

## Open Questions & Decisions Needed

1. **Storage approach** - Use dedicated table vs. extending profile?
2. **Image generation method** - What library/method to capture model view?
3. **Retention policy** - How long to keep model images? Auto-delete old ones?
4. **Thumbnail generation** - Create thumbnails server-side or client-side?
5. **Image format** - Store as JPEG, PNG, or WebP? Compression settings?

## Success Metrics

1. **Technical** - Images upload successfully <95% of attempts
2. **Performance** - Upload completes in <3 seconds on average
3. **User Engagement** - X% of users save at least one model image
4. **Retention** - Users return to view their saved model images
5. **Error Rate** - <2% error rate in upload/retrieval flow

## Related Files & References

- Existing storage pattern: `lib/store/wardrobe.store.ts` (uploadImage method)
- Supabase setup: `lib/supabase.ts`
- User types: `types/user.ts`
- Outfit storage: `lib/store/outfit.store.ts`
- Profile screen: `app/(tabs)/profile/index.tsx`