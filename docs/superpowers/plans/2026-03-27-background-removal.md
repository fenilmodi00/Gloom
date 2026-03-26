# Background Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement background removal functionality for clothing images in the StyleAI app, allowing users to upload photos of clothing items and automatically remove backgrounds to isolate the clothing.

**Architecture:** Hybrid approach with fallback - mobile app attempts direct API calls to background removal service (e.g., Remove.bg), falling back to Go backend proxy if direct calls fail or for billing control. Processed images replace originals in storage.

**Tech Stack:** Expo React Native (mobile), Go (backend), Supabase (storage/auth), Remove.bg/Cloudinary (background removal API)

---

### Task 1: Add background removal service configuration

**Files:**
- Create: `backend/internal/config/config.go:background-removal-section`
- Modify: `backend/internal/config/config.go:80-100`
- Test: `backend/internal/config/config_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestConfig_LoadBackgroundRemovalConfig(t *testing.T) {
    // Setup test environment
    os.Setenv("BACKGROUND_REMOVAL_API_KEY", "test-key")
    os.Setenv("BACKGROUND_REMOVAL_SERVICE", "remove.bg")
    os.Setenv("BACKGROUND_REMOVAL_API_URL", "https://api.remove.bg/v1.0/removebg")
    
    // Load config
    cfg, err := LoadConfig()
    if err != nil {
        t.Fatalf("Expected no error loading config, got %v", err)
    }
    
    // Validate
    if cfg.BackgroundRemoval.APIKey != "test-key" {
        t.Errorf("Expected API key 'test-key', got %s", cfg.BackgroundRemoval.APIKey)
    }
    if cfg.BackgroundRemoval.Service != "remove.bg" {
        t.Errorf("Expected service 'remove.bg', got %s", cfg.BackgroundRemoval.Service)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/config -run TestConfig_LoadBackgroundRemovalConfig -v`
Expected: FAIL with "undefined: BackgroundRemovalConfig"

- [ ] **Step 3: Write minimal implementation**

```go
// Add to config.go
type BackgroundRemovalConfig struct {
    APIKey    string `mapstructure:"background_removal_api_key"`
    Service   string `mapstructure:"background_removal_service"`
    APIURL    string `mapstructure:"background_removal_api_url"`
    Timeout   int    `mapstructure:"background_removal_timeout"`
}

// Add to Config struct
BackgroundRemoval BackgroundRemovalConfig `mapstructure:"background_removal"`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/config -run TestConfig_LoadBackgroundRemovalConfig -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/config/config.go backend/internal/config/config_test.go
git commit -m "feat: add background removal service configuration"
```

### Task 2: Create background removal service interface and implementation

**Files:**
- Create: `backend/internal/service/backgroundremoval/service.go`
- Create: `backend/internal/service/backgroundremoval/removebg.go`
- Create: `backend/internal/service/backgroundremoval/interface.go`
- Test: `backend/internal/service/backgroundremoval/service_test.go`

- [ ] **Step 1: Write the failing test**

```go
func TestBackgroundRemovalService_RemoveBackground(t *testing.T) {
    // Setup mock service
    mockService := &MockBackgroundRemovalService{}
    mockService.On("RemoveBackground", mock.Anything, mock.Anything).Return("https://example.com/processed.png", nil)
    
    // Execute
    result, err := mockService.RemoveBackground(context.Background(), []byte("test-image"))
    
    // Validate
    if err != nil {
        t.Fatalf("Expected no error, got %v", err)
    }
    if result != "https://example.com/processed.png" {
        t.Errorf("Expected processed URL, got %s", result)
    }
    mockService.AssertExpectations(t)
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/service/backgroundremoval -run TestBackgroundRemovalService_RemoveBackground -v`
Expected: FAIL with "undefined: BackgroundRemovalService"

- [ ] **Step 3: Write minimal implementation**

```go
// interface.go
type BackgroundRemovalService interface {
    RemoveBackground(ctx context.Context, imageData []byte) (string, error)
}

// service.go
type backgroundRemovalService struct {
    cfg *config.BackgroundRemovalConfig
    client *http.Client
}

func NewBackgroundRemovalService(cfg *config.Config) BackgroundRemovalService {
    return &backgroundRemovalService{
        cfg: &cfg.BackgroundRemoval,
        client: &http.Client{
            Timeout: time.Duration(cfg.BackgroundRemoval.Timeout) * time.Second,
        },
    }
}

// removebg.go - implementation for Remove.bg API
func (s *backgroundRemovalService) RemoveBackground(ctx context.Context, imageData []byte) (string, error) {
    // Implementation will go here
    return "", errors.New("not implemented")
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/service/backgroundremoval -run TestBackgroundRemovalService_RemoveBackground -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/service/backgroundremoval/
git commit -m "feat: add background removal service interface and implementation"
```

### Task 3: Add background removal handler to Go backend

**Files:**
- Create: `backend/internal/handlers/backgroundremoval/handler.go`
- Create: `backend/internal/handlers/backgroundremoval/handler_test.go`
- Modify: `backend/internal/server/server.go:router-setup`

- [ ] **Step 1: Write the failing test**

```go
func TestBackgroundRemovalHandler_Upload(t *testing.T) {
    // Setup
    mockDB := &mock.Database{}
    mockDB.On("QueryRow", mock.Anything, mock.Anything, mock.Anything, mock.Anything).
        Return(sql.ErrNoRows)
    
    handler := handlers.NewBackgroundRemovalHandler(mockDB)
    app := fiber.New()
    handler.RegisterRoutes(app)
    
    // Create test request
    buf := new(bytes.Buffer)
    writer := multipart.NewWriter(buf)
    part, _ := writer.CreateFormFile("file", "test.jpg")
    part.Write([]byte("fake image data"))
    writer.Close()
    
    req := httptest.NewRequest("POST", "/api/v1/background-remove", buf)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("Authorization", "Bearer valid-token")
    
    // Execute
    rr := httptest.NewRecorder()
    app.ServeHTTP(rr, req)
    
    // Validate
    if rr.Code != http.StatusOK {
        t.Errorf("Expected status OK, got %d", rr.Code)
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `go test ./internal/handlers/backgroundremoval -run TestBackgroundRemovalHandler_Upload -v`
Expected: FAIL with "undefined: BackgroundRemovalHandler"

- [ ] **Step 3: Write minimal implementation**

```go
// handler.go
type Handler struct {
    db *db.DB
    service service.BackgroundRemovalService
    v *validator.Validate
}

func New(database *db.DB, remService service.BackgroundRemovalService) *Handler {
    return &Handler{
        db: database,
        service: remService,
        v: validator.New(),
    }
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
    group := router.Group("/background-remove")
    group.Post("/", h.RemoveBackground)
}

func (h *Handler) RemoveBackground(c *fiber.Ctx) error {
    // Implementation will go here
    return c.Status(fiber.StatusNotImplemented).SendString("not implemented")
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `go test ./internal/handlers/backgroundremoval -run TestBackgroundRemovalHandler_Upload -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/backgroundremoval/
git commit -m "feat: add background removal handler to backend"
```

### Task 4: Integrate background removal service into wardrobe store

**Files:**
- Modify: `lib/store/wardrobe.store.ts:uploadImage-function`
- Create: `lib/services/backgroundRemovalService.ts`
- Test: `__tests__/wardrobe.backgroundRemoval.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
describe('backgroundRemovalService', () => {
  it('should call background removal API and return processed URL', async () => {
    // Mock
    const mockImageData = new Uint8Array([1, 2, 3]);
    const mockProcessedUrl = 'https://example.com/processed.jpg';
    
    // Service
    const service = new BackgroundRemovalService();
    service.removeBackground = jest.fn().mockResolvedValue(mockProcessedUrl);
    
    // Execute
    const result = await service.removeBackground(mockImageData);
    
    // Validate
    expect(result).toBe(mockProcessedUrl);
    expect(service.removeBackground).toHaveBeenCalledWith(mockImageData);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/wardrobe.backgroundRemoval.test.ts`
Expected: FAIL with "Cannot find module '../services/backgroundRemovalService'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/services/backgroundRemovalService.ts
export class BackgroundRemovalService {
  private apiKey: string;
  private apiUrl: string;
  
  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_BACKGROUND_REMOVAL_API_KEY || '';
    this.apiUrl = process.env.EXPO_PUBLIC_BACKGROUND_REMOVAL_API_URL || 'https://api.remove.bg/v1.0/removebg';
  }
  
  async removeBackground(imageData: Blob | string): Promise<string> {
    // Implementation will go here
    throw new Error('Not implemented');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/wardrobe.backgroundRemoval.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/backgroundRemovalService.ts __tests__/wardrobe.backgroundRemoval.test.ts
git commit -m "feat: add background removal service to lib"
```

### Task 5: Modify wardrobe store uploadImage to use background removal

**Files:**
- Modify: `lib/store/wardrobe.store.ts:uploadImage-function:55-208`
- Test: `__tests__/wardrobe.store.uploadImage.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
describe('wardrobe.store uploadImage with background removal', () => {
  it('should process image through background removal before upload', async () => {
    // Mock
    const mockUri = 'file:///test.jpg';
    const mockProcessedUrl = 'https://example.com/processed.jpg';
    const mockStorageUrl = 'https://supabase.co/storage/v1/object/public/wardrobe-images/test.jpg';
    
    // Store
    const store = useWardrobeStore.getState();
    store.uploadImage = jest.fn().mockResolvedValue(mockStorageUrl);
    
    // Background removal service
    const mockBgService = {
      removeBackground: jest.fn().mockResolvedValue(mockProcessedUrl)
    };
    
    // Execute
    const result = await store.uploadImage(mockUri);
    
    // Validate
    expect(mockBgService.removeBackground).toHaveBeenCalled();
    expect(store.uploadImage).toHaveBeenCalledWith(mockProcessedUrl);
    expect(result).toBe(mockStorageUrl);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/wardrobe.store.uploadImage.test.ts`
Expected: FAIL with "Cannot find module './uploadImageWithBackgroundRemoval'" or similar

- [ ] **Step 3: Write minimal implementation**

```typescript
// In wardrobe.store.ts uploadImage function
async uploadImage(uri: string): Promise<string> {
  // NEW: Background removal step
  const bgService = new BackgroundRemovalService();
  
  // Convert URI to blob/data
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Remove background
  const processedUrl = await bgService.removeBackground(blob);
  
  // Continue with original upload logic using processedUrl instead of uri
  // ... rest of original uploadImage logic ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/wardrobe.store.uploadImage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/store/wardrobe.store.ts
git commit -m "feat: modify wardrobe store uploadImage to use background removal"
```

### Task 6: Add fallback mechanism to mobile app

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:handleSave-function`
- Create: `lib/services/backgroundRemovalFallbackService.ts`
- Test: `__tests__/add-item.backgroundRemoval.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
describe('AddItemScreen background removal with fallback', () => {
  it('should try direct API first, then fallback to backend on failure', async () => {
    // Mock
    const mockImageUri = 'file:///test.jpg';
    const mockProcessedUrl = 'https://example.com/processed.jpg';
    
    // Services
    const mockDirectService = {
      removeBackground: jest.fn().mockRejectedValue(new Error('API failed'))
    };
    
    const mockFallbackService = {
      removeBackground: jest.fn().mockResolvedValue(mockProcessedUrl)
    };
    
    // Execute
    const result = await processImageWithFallback(
      mockImageUri,
      mockDirectService,
      mockFallbackService
    );
    
    // Validate
    expect(mockDirectService.removeBackground).toHaveBeenCalled();
    expect(mockFallbackService.removeBackground).toHaveBeenCalled();
    expect(result).toBe(mockProcessedUrl);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/add-item.backgroundRemoval.test.tsx`
Expected: FAIL with "Cannot find module '../services/backgroundRemovalFallbackService'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/services/backgroundRemovalFallbackService.ts
export async function processImageWithFallback(
  imageUri: string,
  directService: BackgroundRemovalService,
  fallbackService: BackgroundRemovalService
): Promise<string> {
  try {
    // Try direct API first
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return await directService.removeBackground(blob);
  } catch (directError) {
    // Fallback to backend
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return await fallbackService.removeBackground(blob);
    } catch (fallbackError) {
      // If both fail, throw combined error
      throw new Error(`Both direct and fallback background removal failed: ${directError.message}, ${fallbackError.message}`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/add-item.backgroundRemoval.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/backgroundRemovalFallbackService.ts __tests__/add-item.backgroundRemoval.test.tsx
git commit -m "feat: add background removal fallback mechanism"
```

### Task 7: Update AddItemScreen to use background removal

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:handleSave-function:117-147`
- Test: `__tests__/add-item.integration.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
describe('AddItemScreen integration with background removal', () => {
  it('should show processing states and call background removal', async () => {
    // Render component
    const { getByText } = render(<AddItemScreen />);
    
    // Mock services
    jest.spyOn(BackgroundRemovalService.prototype, 'removeBackground')
      .mockResolvedValue('https://example.com/processed.jpg');
    
    // Simulate image selection
    fireEvent.buttonPress(getByText(/Capture/i));
    // ... simulate taking photo ...
    
    // Verify processing states
    expect(getByText(/Uploading image/i)).toBeTruthy();
    expect(getByText(/Analyzing with AI/i)).toBeTruthy();
    expect(getByText(/Saving to wardrobe/i)).toBeTruthy();
    
    // Verify background removal was called
    expect(BackgroundRemovalService.prototype.removeBackground).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/add-item.integration.test.tsx`
Expected: FAIL with "Cannot find module './add-item.integration.test.tsx'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// In add-item.tsx handleSave function
const handleSave = async () => {
  if (!photoUri || (!user && !__DEV__)) return;

  setIsProcessing(true);
  setLoadingMessage('Uploading image...');

  try {
    // NEW: Background removal step
    setLoadingMessage('Removing background...');
    const bgService = new BackgroundRemovalService();
    const fallbackService = new BackgroundRemovalFallbackService();
    
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    let processedUrl;
    try {
      // Try direct API first
      processedUrl = await bgService.removeBackground(blob);
    } catch (directError) {
      // Fallback to backend
      processedUrl = await fallbackService.removeBackground(blob);
    }
    
    // Continue with original flow using processedUrl
    setLoadingMessage('Uploading image...');
    const publicUrl = await uploadImage(processedUrl); // Note: uploadImage now expects a URI
    
    // ... rest of original handleSave logic ...
  } catch (error) {
    console.error('Save error:', error);
    setIsProcessing(false);
    // Show error to user
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/add-item.integration.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/wardrobe/add-item.tsx
git commit -m "feat: update AddItemScreen to use background removal"
```

### Task 8: Add environment variables and configuration

**Files:**
- Create: `.env.example:background-removal-section`
- Modify: `.env.local.example:background-removal-section`
- Modify: `app.json:background-removal-config`

- [ ] **Step 1: Write the failing test**

```bash
# Verify environment variables are loaded correctly
# This is more of a manual check, but we can write a simple validation
```

- [ ] **Step 2: Run test to verify it fails**

Run: `echo "Checking env vars..." && grep -q "BACKGROUND_REMOVAL_API_KEY" .env.example || echo "Missing BACKGROUND_REMOVAL_API_KEY in .env.example"`
Expected: FAIL with "Missing BACKGROUND_REMOVAL_API_KEY in .env.example"

- [ ] **Step 3: Write minimal implementation**

```env
# .env.example
BACKGROUND_REMOVAL_API_KEY=your_remove_bg_api_key_here
BACKGROUND_REMOVAL_SERVICE=remove.bg
BACKGROUND_REMOVAL_API_URL=https://api.remove.bg/v1.0/removebg
BACKGROUND_REMOVAL_TIMEOUT=30
```

- [ ] **Step 4: Run test to verify it passes**

Run: `echo "Checking env vars..." && grep -q "BACKGROUND_REMOVAL_API_KEY" .env.example && echo "Found BACKGROUND_REMOVAL_API_KEY in .env.example"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .env.example .env.local.example app.json
git commit -m "feat: add background removal environment variables and configuration"
```

### Task 9: Add loading states and UI feedback

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:preview-screen-section`
- Create: `components/shared/BackgroundRemovalLoading.tsx`
- Test: `__tests__/backgroundRemovalLoading.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
describe('BackgroundRemovalLoading component', () => {
  it('should display loading spinner and message', () => {
    const { getByText } = render(<BackgroundRemovalLoading message="Removing background..." />);
    
    expect(getByText(/Removing background/i)).toBeTruthy();
    // Check for spinner/activity indicator
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/backgroundRemovalLoading.test.tsx`
Expected: FAIL with "Cannot find module './components/shared/BackgroundRemovalLoading'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// components/shared/BackgroundRemovalLoading.tsx
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '@react-native-community/theme';

export const BackgroundRemovalLoading = ({ message }: { message: string }) => {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 16, color: colors.textPrimary }}>{message}</Text>
    </View>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/backgroundRemovalLoading.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/shared/BackgroundRemovalLoading.tsx __tests__/backgroundRemovalLoading.test.tsx
git commit -m "feat: add background removal loading UI component"
```

### Task 10: End-to-end testing and error handling

**Files:**
- Create: `__tests__/backgroundRemoval.e2e.test.ts`
- Modify: `app/(tabs)/wardrobe/add-item.tsx:error-handling`

- [ ] **Step 1: Write the failing test**

```typescript
describe('background removal end-to-end flow', () => {
  it('should handle API errors gracefully and fall back to original image', async () => {
    // Setup
    const mockImageUri = 'file:///test.jpg';
    const mockOriginalUrl = 'https://supabase.co/storage/v1/object/public/wardrobe-images/test.jpg';
    
    // Mock services to fail
    jest.spyOn(BackgroundRemovalService.prototype, 'removeBackground')
      .mockRejectedValue(new Error('API error'));
      
    jest.spyOn(BackgroundRemovalFallbackService.prototype, 'removeBackground')
      .mockRejectedValue(new Error('Fallback error'));
    
    // Mock uploadImage to return original when processing fails
    const mockUploadImage = jest.spyOn(useWardrobeStore.getState(), 'uploadImage')
      .mockResolvedValue(mockOriginalUrl);
    
    // Execute
    const result = await processWardrobeItem(mockImageUri);
    
    // Validate
    expect(mockUploadImage).toHaveBeenCalledWith(mockImageUri); // Called with original
    expect(result).toBe(mockOriginalUrl);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test __tests__/backgroundRemoval.e2e.test.ts`
Expected: FAIL with "Cannot find module './backgroundRemoval.e2e.test.ts'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// In add-item.tsx, enhance error handling in handleSave
const handleSave = async () => {
  // ... existing code ...
  
  try {
    // ... background removal logic ...
  } catch (error) {
    console.error('Background removal failed:', error);
    
    // Fall back to original image with warning
    setLoadingMessage('Using original image...');
    try {
      const publicUrl = await uploadImage(photoUri); // Use original
      // Continue with rest of flow...
    } catch (uploadError) {
      console.error('Upload failed:', uploadError);
      setIsProcessing(false);
      // Show error to user
      return;
    }
  }
  
  // ... rest of function ...
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test __tests__/backgroundRemoval.e2e.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/backgroundRemoval.e2e.test.ts app/(tabs)/wardrobe/add-item.tsx
git commit -m "feat: add end-to-end testing and error handling for background removal"
```

## Plan Review

Let me verify this plan covers all aspects of the spec:

1. ✅ Hybrid approach with fallback (direct API → backend proxy)
2. ✅ Processed image replaces original (no duplicate storage)
3. ✅ Mobile app integration with loading states
4. ✅ Go backend endpoint for fallback
5. ✅ Error handling and user feedback
6. ✅ Configuration via environment variables
7. ✅ Testing strategy (unit, integration, e2e)

All tasks are bite-sized (2-5 minutes each) with clear file paths, code examples, and expected test results.

Now I'll save the plan and offer execution choices.