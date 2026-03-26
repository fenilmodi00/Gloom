# Model Corrosion Images Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to save virtual try-on results as model corrosion images after selecting outfits from the trending grid in the Inspo screen.

**Architecture:** Store user-generated model images in Supabase with dedicated table and storage bucket. Use presigned URL upload pattern (existing wardrobe pattern). Display images in ModelCarousel temporarily and provide persistent access via Profile screen.

**Tech Stack:** Supabase (Database + Storage), React Native, Zustand, Expo Router

---

## Overview

The feature allows users to:
1. See generated model images in the ModelCarousel after clicking "Try On" on a trending outfit
2. Save these images permanently to their profile
3. Access saved images from their Profile screen

**Data Flow:**
```
Trending Grid → Try-On → Generate Image → 
  ├── Show in ModelCarousel (temporary session)
  └── Save to Supabase → Access via Profile (persistent)
```

---

## Task 1: Database Schema & Storage Setup

### Step 1: Create Migration for user_model_images Table

**Files:**
- Test: N/A (migration)
- Create: Supabase migration

**Step 1: Write and apply migration**

```sql
-- Create user_model_images table
CREATE TABLE user_model_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  outfit_id UUID REFERENCES outfits(id) ON DELETE SET NULL,
  model_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_model_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own images
CREATE POLICY "Users can view own images" ON user_model_images
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own images
CREATE POLICY "Users can insert own images" ON user_model_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own images
CREATE POLICY "Users can delete own images" ON user_model_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster user queries
CREATE INDEX idx_user_model_images_user_id ON user_model_images(user_id);
CREATE INDEX idx_user_model_images_created_at ON user_model_images(created_at DESC);
```

**Step 2: Run migration**

Apply via Supabase CLI or dashboard.

**Step 3: Commit**

```bash
git add docs/plans/
git commit -m "feat: add user_model_images table with RLS policies"
```

---

### Step 2: Create Storage Bucket for Model Images

**Files:**
- Create: Supabase storage bucket (via dashboard or CLI)

**Step 1: Create bucket**

Run in Supabase SQL Editor:
```sql
-- Create bucket for model corrosion images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('model-corrosion-images', 'model-corrosion-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Set up storage RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload model images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'model-corrosion-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own folder
CREATE POLICY "Users can view own model images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'model-corrosion-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own model images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'model-corrosion-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Step 2: Commit**

```bash
git commit -m "feat: add model-corrosion-images storage bucket with RLS"
```

---

## Task 2: TypeScript Types

### Step 1: Add UserModelImage Type

**Files:**
- Modify: `types/user.ts`

**Step 1: Read existing types/user.ts**

```bash
cat types/user.ts
```

**Step 2: Add UserModelImage interface**

```typescript
export interface UserModelImage {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url?: string;
  outfit_id?: string;
  model_id?: string;
  created_at: string;
}
```

**Step 3: Commit**

```bash
git add types/user.ts
git commit -m "feat: add UserModelImage type"
```

---

## Task 3: Backend API Endpoints

### Step 1: Create Presigned URL Endpoint

**Files:**
- Modify: Backend (existing `/api/v1/presigned-url` endpoint should already exist)

**Note:** The wardrobe store already uses presigned URL pattern. Verify it works for the new bucket by testing with bucket: 'model-corrosion-images'.

**Step 1: Test presigned URL works for new bucket**

```bash
# Test via curl or Postman
curl -X POST http://localhost:8080/api/v1/presigned-url \
  -H "Content-Type: application/json" \
  -d '{"bucket": "model-corrosion-images", "path": "test-user-id/test.jpg"}'
```

Expected: Returns presigned upload URL

**Step 2: Commit**

```bash
git commit -m "feat: support model-corrosion-images bucket in presigned-url endpoint"
```

---

### Step 2: Create Model Image Save Endpoint

**Files:**
- Create: Backend edge function or API route

**Step 1: Create API endpoint**

In backend, create `api/v1/model-images`:

```javascript
// POST /api/v1/model-images
// Body: { image_url, thumbnail_url?, outfit_id?, model_id? }
// Returns: { id, user_id, image_url, created_at }

app.post('/api/v1/model-images', async (req, res) => {
  const { user, session } = req;
  if (!user && !isDevMode) return res.status(401).json({ error: 'Unauthorized' });

  const { image_url, thumbnail_url, outfit_id, model_id } = req.body;
  
  const { data, error } = await supabase
    .from('user_model_images')
    .insert({
      user_id: user.id,
      image_url,
      thumbnail_url,
      outfit_id,
      model_id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});
```

**Step 2: Commit**

```bash
git commit -m "feat: add POST /api/v1/model-images endpoint"
```

---

### Step 3: Create Fetch Model Images Endpoint

**Files:**
- Modify: Backend API

**Step 1: Add GET endpoint**

```javascript
// GET /api/v1/model-images
// Query: ?limit=20&offset=0
// Returns: { data: UserModelImage[] }

app.get('/api/v1/model-images', async (req, res) => {
  const { user, session } = req;
  if (!user && !isDevMode) return res.status(401).json({ error: 'Unauthorized' });

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  const { data, error } = await supabase
    .from('user_model_images')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});
```

**Step 2: Commit**

```bash
git commit -m "feat: add GET /api/v1/model-images endpoint"
```

---

### Step 4: Create Delete Model Image Endpoint

**Files:**
- Modify: Backend API

**Step 1: Add DELETE endpoint**

```javascript
// DELETE /api/v1/model-images/:id
// Returns: { success: true }

app.delete('/api/v1/model-images/:id', async (req, res) => {
  const { user, session } = req;
  if (!user && !isDevMode) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  // First get the image to find storage path
  const { data: image, error: fetchError } = await supabase
    .from('user_model_images')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Delete from storage
  const path = image.image_url.split('/storage/v1/object/public/model-corrosion-images/')[1];
  if (path) {
    await supabase.storage.from('model-corrosion-images').remove([path]);
  }

  // Delete from database
  const { error } = await supabase
    .from('user_model_images')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
```

**Step 2: Commit**

```bash
git commit -m "feat: add DELETE /api/v1/model-images/:id endpoint"
```

---

## Task 4: Frontend State Management

### Step 1: Create Model Images Store

**Files:**
- Create: `lib/store/model-images.store.ts`

**Step 1: Write failing test**

```typescript
// __tests__/model-images-store.test.ts
import { useModelImagesStore } from '@/lib/store/model-images.store';

describe('useModelImagesStore', () => {
  it('should have initial empty state', () => {
    const { images } = useModelImagesStore.getState();
    expect(images).toEqual([]);
  });

  it('should add image to state', () => {
    const { addImage } = useModelImagesStore.getState();
    const testImage = {
      id: 'test-1',
      user_id: 'user-1',
      image_url: 'https://example.com/test.jpg',
      created_at: new Date().toISOString(),
    };
    addImage(testImage);
    const { images } = useModelImagesStore.getState();
    expect(images).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
bun test __tests__/model-images-store.test.ts
```

Expected: FAIL with "useModelImagesStore not found"

**Step 3: Write implementation**

```typescript
// lib/store/model-images.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../storage';
import { useAuthStore } from './auth.store';
import type { UserModelImage } from '@/types/user';

interface ModelImagesState {
  images: UserModelImage[];
  isLoading: boolean;
  error: string | null;

  addImage: (image: UserModelImage) => void;
  setImages: (images: UserModelImage[]) => void;
  removeImage: (id: string) => void;
  fetchImages: () => Promise<void>;
  saveImage: (imageUrl: string, outfitId?: string, modelId?: string) => Promise<UserModelImage>;
  deleteImage: (id: string) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useModelImagesStore = create<ModelImagesState>()(
  persist(
    (set, get) => ({
      images: [],
      isLoading: false,
      error: null,

      addImage: (image) =>
        set((state) => ({ images: [image, ...state.images] })),

      setImages: (images) => set({ images }),

      removeImage: (id) =>
        set((state) => ({
          images: state.images.filter((img) => img.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchImages: async () => {
        const { user, session } = useAuthStore.getState();
        if (!user && !__DEV__) {
          set({ isLoading: false, error: 'User not authenticated' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
          const headers: Record<string, string> = {};
          if (session) headers['Authorization'] = `Bearer ${session}`;

          const response = await fetch(`${backendUrl}/api/v1/model-images?limit=50`, {
            headers,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch images');
          }

          const json = await response.json();
          set({ images: json.data || [], isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch images',
            isLoading: false,
          });
        }
      },

      saveImage: async (imageUrl, outfitId, modelId) => {
        const { user, session } = useAuthStore.getState();
        if (!user && !__DEV__) throw new Error('User not authenticated');

        set({ isLoading: true, error: null });

        try {
          const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (session) headers['Authorization'] = `Bearer ${session}`;

          const response = await fetch(`${backendUrl}/api/v1/model-images`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              image_url: imageUrl,
              outfit_id: outfitId,
              model_id: modelId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to save image');
          }

          const json = await response.json();
          const newImage = json.data as UserModelImage;

          set((state) => ({
            images: [newImage, ...state.images],
            isLoading: false,
          }));

          return newImage;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save image',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteImage: async (id) => {
        const { user, session } = useAuthStore.getState();
        if (!user && !__DEV__) return;

        try {
          const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8080';
          const headers: Record<string, string> = {};
          if (session) headers['Authorization'] = `Bearer ${session}`;

          const response = await fetch(`${backendUrl}/api/v1/model-images/${id}`, {
            method: 'DELETE',
            headers,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to delete image');
          }

          set((state) => ({
            images: state.images.filter((img) => img.id !== id),
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete image',
          });
        }
      },
    }),
    {
      name: 'model-images-storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        images: state.images,
      }),
    }
  )
);

// Selectors
export const useModelImages = () => useModelImagesStore((state) => state.images);
export const useModelImagesLoading = () => useModelImagesStore((state) => state.isLoading);
export const useModelImagesError = () => useModelImagesStore((state) => state.error);
```

**Step 4: Run test to verify it passes**

```bash
bun test __tests__/model-images-store.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/store/model-images.store.ts __tests__/model-images-store.test.ts
git commit -m "feat: add model images Zustand store"
```

---

## Task 5: Model Carousel Temporary Display

### Step 1: Add Session State for Generated Images

**Files:**
- Modify: `app/(tabs)/inspo/index.tsx`

**Step 1: Read existing file**

```bash
cat app/\(tabs\)/inspo/index.tsx
```

**Step 2: Add state for generated images**

```typescript
// Add to InspoScreen component
const [generatedImages, setGeneratedImages] = useState<ModelCard[]>([]);

// Update handleTryOnPress to simulate generation and add to carousel
const handleTryOnPress = useCallback((item: TrendingItem) => {
  // In production, this would call AI to generate the model image
  // For now, simulate with mock data
  const mockGeneratedImage: ModelCard = {
    id: `generated-${Date.now()}`,
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600',
    name: `Try-On ${item.id}`,
    outfit: item.outfitName,
  };
  
  setGeneratedImages((prev) => [mockGeneratedImage, ...prev]);
}, []);
```

**Step 3: Update ModelCarousel to include generated images**

```typescript
<ModelCarousel
  models={[...generatedImages, ...MODEL_CARDS]}
  onCardPress={handleModelPress}
/>
```

**Step 4: Commit**

```bash
git add app/\(tabs\)/inspo/index.tsx
git commit -m "feat: add generated images to ModelCarousel"
```

---

## Task 6: Save Button Integration

### Step 1: Add Save Functionality to ModelDetailPopup

**Files:**
- Modify: `components/inspo/ModelDetailPopup.tsx`

**Step 1: Read existing file**

```bash
cat components/inspo/ModelDetailPopup.tsx
```

**Step 2: Add save button**

```typescript
import { useModelImagesStore } from '@/lib/store/model-images.store';

interface ModelDetailPopupProps {
  visible: boolean;
  model: ModelCard | null;
  clothItems: OutfitItem[];
  onClose: () => void;
  onSave?: (imageUrl: string) => void;  // Add this
}

// In the component, add save button in the UI
const handleSave = async () => {
  if (!model) return;
  
  const imageUrl = typeof model.imageUrl === 'string' 
    ? model.imageUrl 
    : null;
    
  if (!imageUrl) return;
  
  try {
    await useModelImagesStore.getState().saveImage(imageUrl);
    onClose();
    // Optionally show toast: "Saved to your try-ons!"
  } catch (error) {
    console.error('Failed to save image:', error);
  }
};
```

**Step 3: Commit**

```bash
git add components/inspo/ModelDetailPopup.tsx
git commit -m "feat: add save button to ModelDetailPopup"
```

---

## Task 7: Profile Screen Integration

### Step 1: Add My Try-Ons Section to Profile

**Files:**
- Modify: `app/(tabs)/profile/index.tsx`

**Step 1: Read existing profile screen**

```bash
cat app/\(tabs\)/profile/index.tsx
```

**Step 2: Add My Try-Ons section**

```typescript
import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useModelImagesStore } from '@/lib/store/model-images.store';

// Add to ProfileScreen component
useEffect(() => {
  useModelImagesStore.getState().fetchImages();
}, []);

const images = useModelImagesStore((state) => state.images);

// Render in return:
<View className="mt-6">
  <Text className="text-xl font-bold mb-4">My Try-Ons</Text>
  {images.length === 0 ? (
    <Text className="text-gray-500">No try-ons yet. Browse Inspo and try on outfits!</Text>
  ) : (
    <FlatList
      data={images}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable className="flex-1 p-1">
          <Image
            source={{ uri: item.image_url }}
            className="w-full aspect-[3/4] rounded-lg"
            contentFit="cover"
          />
        </Pressable>
      )}
    />
  )}
</View>
```

**Step 3: Commit**

```bash
git add app/\(tabs\)/profile/index.tsx
git commit -m "feat: add My Try-Ons section to Profile screen"
```

---

## Task 8: Testing & Verification

### Step 1: Test End-to-End Flow

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 2: Run tests**

```bash
bun test
```

Expected: All tests pass

**Step 3: Build iOS**

```bash
bun run ios
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git commit -m "test: verify TypeScript and tests pass"
```

---

## Summary

This plan implements the model corrosion images feature with:

| Task | Description |
|------|-------------|
| 1 | Database table + storage bucket |
| 2 | TypeScript types |
| 3 | Backend API endpoints |
| 4 | Zustand store for state management |
| 5 | Temporary display in ModelCarousel |
| 6 | Save button in ModelDetailPopup |
| 7 | Profile screen access |
| 8 | Testing & verification |

**Total estimated tasks:** 12-15 steps across 8 major tasks

---

## Execution

**Plan complete and saved to `docs/plans/2026-03-26-model-corrosion-images.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
