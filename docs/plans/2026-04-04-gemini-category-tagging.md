# Gemini Image Category Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically categorize clothing images and assign tags (category, occasion) using Gemini 2.5 Flashlight when users upload items via the Add Item tab.

**Architecture:** After RMBG background removal completes, invoke Gemini Vision API to analyze the cutout image. Extract category (tops/bottoms/shoes/etc.) and occasion tags (casual/semi-formal/formal). Update the wardrobe item with AI-generated metadata.

**Tech Stack:** Go (backend), Gemini 2.5 Flashlight Vision API, React Native/Expo (frontend), Supabase (database)

---

## File Structure

### New Files
- `backend/internal/services/gemini/client.go` - Gemini API client with retry logic
- `backend/internal/services/gemini/client_test.go` - Unit tests for Gemini client

### Modified Files
- `backend/internal/config/config.go` - Add GEMINI_API_KEY config
- `backend/internal/server/server.go` - Initialize and wire Gemini client
- `backend/internal/handlers/wardrobe/rembg_handler.go` - Invoke Gemini after RMBG completes
- `app/(tabs)/wardrobe/add-item.tsx` - Remove hardcoded 'tops', add category selector
- `types/wardrobe.ts` - Add occasion tag constants (optional)

---

## Task 1: Add Gemini API Key to Config

**Files:**
- Modify: `backend/internal/config/config.go:10-19`
- Test: N/A (config only)

**Step 1: Add GeminiApiKey field to Config struct**

Find this code (lines 10-19):
```go
type Config struct {
	DatabaseURL string
	SupabaseURL string
	SupabaseJWTSecret string
	SupabaseServiceRoleKey string
	Port string
	GoEnv string
	FrontendURL string
	RembgServiceURL string
}
```

Replace with:
```go
type Config struct {
	DatabaseURL string
	SupabaseURL string
	SupabaseJWTSecret string
	SupabaseServiceRoleKey string
	Port string
	GoEnv string
	FrontendURL string
	RembgServiceURL string
	GeminiApiKey string
}
```

**Step 2: Add env var loading**

Find this code (lines 34-35):
```go
	RembgServiceURL: os.Getenv("EXPO_PUBLIC_REMBG_SERVICE_URL"),
}
```

Replace with:
```go
	RembgServiceURL:     os.Getenv("EXPO_PUBLIC_REMBG_SERVICE_URL"),
	GeminiApiKey:        os.Getenv("GEMINI_API_KEY"),
}
```

**Step 3: Add validation (optional)**

After the existing validation block, you may add validation for GeminiApiKey if required for your deployment.

**Step 4: Commit**

```bash
cd D:\gloom\StyleAI\backend
git add internal/config/config.go
git commit -m "feat: add GeminiApiKey config field"
```

---

## Task 2: Create Gemini Service Client

**Files:**
- Create: `backend/internal/services/gemini/client.go`
- Create: `backend/internal/services/gemini/client_test.go`

**Step 1: Write the failing test**

Create `backend/internal/services/gemini/client_test.go`:

```go
package gemini

import (
	"context"
	"testing"
)

func TestCategorizeImage_ReturnsCategoryAndTags(t *testing.T) {
	// This test will fail until we implement the client
	client := NewClient("https://fake-api", "test-key")
	
	ctx := context.Background()
	result, err := client.CategorizeImage(ctx, "https://example.com/image.png")
	
	if err != nil {
		t.Logf("Expected error with fake API: %v", err)
		return
	}
	
	if result.Category == "" {
		t.Error("Expected category in response")
	}
}
```

**Step 2: Run test to verify it fails**

Run: `cd D:\gloom\StyleAI\backend && go test ./internal/services/gemini/... -v`

Expected: FAIL - client not defined

**Step 3: Write the Gemini client implementation**

Create `backend/internal/services/gemini/client.go`:

```go
package gemini

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

// Client is an HTTP client for the Gemini Vision API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	maxRetries int
}

// CategorizeRequest is the request body for Gemini API.
type CategorizeRequest struct {
	Contents []Content `json:"contents"`
	GenerationConfig GenerationConfig `json:"generationConfig"`
}

// Content represents a part of the request (text or image).
type Content struct {
	Parts []Part `json:"parts"`
}

// Part can be text or inline data (image).
type Part struct {
	Text       string `json:"text,omitempty"`
	InlineData *InlineData `json:"inlineData,omitempty"`
}

// InlineData contains base64 encoded image data.
type InlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

// GenerationConfig controls the model response format.
type GenerationConfig struct {
	ResponseMimeType string `json:"response_mime_type"`
	ResponseSchema   *ResponseSchema `json:"response_schema,omitempty"`
}

// ResponseSchema defines the expected JSON response structure.
type ResponseSchema struct {
	Type       string `json:"type"`
	Properties map[string]SchemaProperty `json:"properties"`
	Required   []string `json:"required"`
}

// SchemaProperty describes a field in the response.
type SchemaProperty struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
	Items       *SchemaItems `json:"items,omitempty"`
}

// SchemaItems describes array item type.
type SchemaItems struct {
	Type string `json:"type"`
}

// CategorizeResponse is the response from Gemini categorization.
type CategorizeResponse struct {
	Category     string   `json:"category"`
	SubCategory  string   `json:"sub_category,omitempty"`
	OccasionTags []string `json:"occasion_tags"`
	StyleTags    []string `json:"style_tags"`
	Colors       []string `json:"colors,omitempty"`
}

// NewClient creates a new Gemini service client.
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 2 * time.Minute},
		maxRetries: 3,
	}
}

// CategorizeImage analyzes an image URL and returns categorization info.
func (c *Client) CategorizeImage(ctx context.Context, imageURL string) (*CategorizeResponse, error) {
	// For image URLs, we need to fetch the image first to get base64 data
	// This is because Gemini Vision API requires inline image data, not URLs
	imageBytes, err := c.fetchImage(ctx, imageURL)
	if err != nil {
		return nil, fmt.Errorf("fetch image: %w", err)
	}

	// Encode image to base64
	imageB64 := base64.StdEncoding.EncodeToString(imageBytes)

	// Determine mime type (default to png, could be extended to detect)
	mimeType := "image/png"
	if len(imageBytes) > 4 {
		if imageBytes[0] == 0xFF && imageBytes[1] == 0xD8 {
			mimeType = "image/jpeg"
		}
	}

	reqBody := CategorizeRequest{
		Contents: []Content{
			{
				Parts: []Part{
					{
						Text: `Analyze this clothing item image and provide categorization in JSON format.
						Return JSON with:
						- category: One of ["tops", "bottoms", "fullbody", "outerwear", "shoes", "bags", "accessories"]
						- sub_category: Specific type (e.g., "tshirt", "jeans", "sneakers", "watch")
						- occasion_tags: Array of applicable occasions from ["casual", "semi-formal", "formal", "athletic", "evening", "business", "party"]
						- style_tags: Array of style descriptors from ["minimalist", "bohemian", "streetwear", "classic", "vintage", "modern", "ethnic", "western"]
						- colors: Array of dominant colors detected in the image`,
					},
					{
						InlineData: &InlineData{
							MimeType: mimeType,
							Data:     imageB64,
						},
					},
				},
			},
		},
		GenerationConfig: GenerationConfig{
			ResponseMimeType: "application/json",
			ResponseSchema: &ResponseSchema{
				Type: "object",
				Properties: map[string]SchemaProperty{
					"category": {
						Type:        "string",
						Description: "The main category of the clothing item",
						Enum:        []string{"tops", "bottoms", "fullbody", "outerwear", "shoes", "bags", "accessories"},
					},
					"sub_category": {
						Type:        "string",
						Description: "Specific sub-category of the item",
					},
					"occasion_tags": {
						Type:        "array",
						Description: "Occasion tags for when to wear this item",
						Items: &SchemaItems{
							Type: "string",
						},
					},
					"style_tags": {
						Type:        "array",
						Description: "Style descriptors for this item",
						Items: &SchemaItems{
							Type: "string",
						},
					},
					"colors": {
						Type:        "array",
						Description: "Dominant colors detected in the image",
						Items: &SchemaItems{
							Type: "string",
						},
					},
				},
				Required: []string{"category", "occasion_tags"},
			},
		},
	}

	var lastErr error
	for attempt := 0; attempt < c.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff with jitter
			baseDelay := time.Duration(1<<uint(attempt-1)) * time.Second
			jitter := time.Duration(rand.Int63n(int64(baseDelay)))
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(baseDelay + jitter):
			}
		}

		result, err := c.doRequest(ctx, reqBody)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("gemini service failed after %d attempts: %w", c.maxRetries, lastErr)
}

// fetchImage downloads an image from a URL and returns the bytes.
func (c *Client) fetchImage(ctx context.Context, imageURL string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("image fetch returned %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// doRequest makes the actual API call to Gemini.
func (c *Client) doRequest(ctx context.Context, reqBody CategorizeRequest) (*CategorizeResponse, error) {
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	// Gemini API endpoint format
	url := fmt.Sprintf("%s/v1beta/models/gemini-2.5-flash:generateContent?key=%s", c.baseURL, c.apiKey)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("gemini service returned %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse Gemini's response format
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from Gemini")
	}

	// Parse the JSON text from the response
	responseText := geminiResp.Candidates[0].Content.Parts[0].Text

	// The response might be wrapped in markdown code blocks
	responseText = trimMarkdownCodeBlock(responseText)

	var categorizeResp CategorizeResponse
	if err := json.Unmarshal([]byte(responseText), &categorizeResp); err != nil {
		return nil, fmt.Errorf("parse categorization: %w", err)
	}

	return &categorizeResp, nil
}

// trimMarkdownCodeBlock removes ```json and ``` wrappers if present.
func trimMarkdownCodeBlock(text string) string {
	// Remove leading/trailing whitespace
	text = bytes.TrimSpace([]byte(text)).(string)

	// Check for markdown code block
	if len(text) >= 7 && text[:7] == "```json" {
		text = text[7:]
	}
	if len(text) >= 3 && text[:3] == "```" {
		text = text[3:]
	}
	if len(text) >= 3 && text[len(text)-3:] == "```" {
		text = text[:len(text)-3]
	}

	return bytes.TrimSpace([]byte(text)).(string)
}
```

**Step 4: Run test to verify it passes**

Run: `cd D:\gloom\StyleAI\backend && go build ./internal/services/gemini/...`

Expected: PASS (code compiles, test may error on network but code is valid)

**Step 5: Commit**

```bash
cd D:\gloom\StyleAI\backend
git add internal/services/gemini/
git commit -m "feat: add Gemini service client for image categorization"
```

---

## Task 3: Wire Gemini Client into Server

**Files:**
- Modify: `backend/internal/server/server.go:14-15`, `backend/internal/server/server.go:70-73`
- Test: N/A (integration only)

**Step 1: Add Gemini import**

Find this code (lines 14-15):
```go
"backend/internal/services/rembg"

"github.com/gofiber/fiber/v2"
```

Replace with:
```go
"backend/internal/services/gemini"
"backend/internal/services/rembg"

"github.com/gofiber/fiber/v2"
```

**Step 2: Add Gemini client initialization and pass to handler**

Find this code (line 70-72):
```go
rembgClient := rembg.NewClient(cfg.RembgServiceURL)
rembgHandler := wardrobe.NewRembgHandler(database, rembgClient, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
rembgHandler.RegisterRoutes(api)
```

Replace with:
```go
rembgClient := rembg.NewClient(cfg.RembgServiceURL)
geminiClient := gemini.NewClient("https://generativelanguage.googleapis.com", cfg.GeminiApiKey)
rembgHandler := wardrobe.NewRembgHandler(database, rembgClient, geminiClient, cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
rembgHandler.RegisterRoutes(api)
```

**Step 3: Commit**

```bash
cd D:\gloom\StyleAI\backend
git add internal/server/server.go
git commit -m "feat: wire Gemini client into server"
```

---

## Task 4: Integrate Gemini in RembgHandler

**Files:**
- Modify: `backend/internal/handlers/wardrobe/rembg_handler.go:15-30`, `backend/internal/handlers/wardrobe/rembg_handler.go:96-136`
- Test: N/A (integration test)

**Step 1: Add Gemini import and update handler struct**

Find this code (lines 15-16):
```go
"backend/internal/services/rembg"
"github.com/gofiber/fiber/v2"
```

Replace with:
```go
"backend/internal/services/gemini"
"backend/internal/services/rembg"

"github.com/gofiber/fiber/v2"
```

Find this code (lines 24-30):
```go
// RembgHandler handles async background removal processing.
type RembgHandler struct {
	db *db.DB
	rembgClient *rembg.Client
	supabaseURL string
	serviceKey string
	semaphore chan struct{}
}
```

Replace with:
```go
// RembgHandler handles async background removal processing.
type RembgHandler struct {
	db           *db.DB
	rembgClient  *rembg.Client
	geminiClient *gemini.Client
	supabaseURL  string
	serviceKey   string
	semaphore    chan struct{}
}
```

**Step 2: Update NewRembgHandler to accept Gemini client**

Find this code (lines 32-48):
```go
// NewRembgHandler creates a new rembg processing handler.
func NewRembgHandler(database *db.DB, rembgClient *rembg.Client, supabaseURL, serviceKey string) *RembgHandler {
	maxConcurrent := 2
	if envVal := os.Getenv("REMBG_MAX_CONCURRENT"); envVal != "" {
		if val, err := strconv.Atoi(envVal); err == nil && val > 0 {
			maxConcurrent = val
		}
	}

	return &RembgHandler{
		db:           database,
		rembgClient:  rembgClient,
		supabaseURL:  supabaseURL,
		serviceKey:   serviceKey,
		semaphore:    make(chan struct{}, maxConcurrent),
	}
}
```

Replace with:
```go
// NewRembgHandler creates a new rembg processing handler.
func NewRembgHandler(database *db.DB, rembgClient *rembg.Client, geminiClient *gemini.Client, supabaseURL, serviceKey string) *RembgHandler {
	maxConcurrent := 2
	if envVal := os.Getenv("REMBG_MAX_CONCURRENT"); envVal != "" {
		if val, err := strconv.Atoi(envVal); err == nil && val > 0 {
			maxConcurrent = val
		}
	}

	return &RembgHandler{
		db:           database,
		rembgClient:  rembgClient,
		geminiClient: geminiClient,
		supabaseURL:  supabaseURL,
		serviceKey:   serviceKey,
		semaphore:    make(chan struct{}, maxConcurrent),
	}
}
```

**Step 3: Add Gemini categorization in processInBackground**

Find this code (lines 125-136):
```go
	// Update DB with cutout URL and completed status
	_, err = h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET cutout_url = $1, processing_status = 'completed'
	WHERE id = $2
	`, cutoutURL, itemID)
	if err != nil {
		log.Printf("ERROR: rembg_update userID=%s item=%s err=%v", userID, itemID, err)
	} else {
		log.Printf("INFO: rembg_complete userID=%s item=%s url=%s", userID, itemID, cutoutURL)
	}
}
```

Replace with:
```go
	// Update DB with cutout URL first
	_, err = h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET cutout_url = $1, processing_status = 'analyzing'
	WHERE id = $2
	`, cutoutURL, itemID)
	if err != nil {
		log.Printf("ERROR: rembg_update userID=%s item=%s err=%v", userID, itemID, err)
		h.updateFallback(itemID)
		return
	}

	// NEW: Invoke Gemini for categorization
	if h.geminiClient != nil {
		h.categorizeWithGemini(ctx, itemID, userID, cutoutURL)
	}

	// Final update: mark as completed
	_, err = h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET processing_status = 'completed'
	WHERE id = $1
	`, itemID)
	if err != nil {
		log.Printf("ERROR: rembg_complete userID=%s item=%s err=%v", userID, itemID, err)
	} else {
		log.Printf("INFO: rembg_complete userID=%s item=%s url=%s", userID, itemID, cutoutURL)
	}
}

// categorizeWithGemini analyzes the cutout with Gemini and updates the item.
func (h *RembgHandler) categorizeWithGemini(ctx context.Context, itemID, userID uuid.UUID, cutoutURL string) {
	log.Printf("INFO: gemini_categorize_start userID=%s item=%s", userID, itemID)

	result, err := h.geminiClient.CategorizeImage(ctx, cutoutURL)
	if err != nil {
		log.Printf("ERROR: gemini_categorize userID=%s item=%s err=%v", userID, itemID, err)
		// Don't fail the whole process - user can manually categorize
		return
	}

	// Update the wardrobe item with AI-generated categorization
	_, err = h.db.Exec(ctx, `
	UPDATE wardrobe_items
	SET 
		category = COALESCE($1, category),
		sub_category = COALESCE($2, sub_category),
		style_tags = COALESCE($3, style_tags),
		occasion_tags = COALESCE($4, occasion_tags),
		colors = COALESCE($5, colors)
	WHERE id = $6
	`, result.Category, result.SubCategory, result.StyleTags, result.OccasionTags, result.Colors, itemID)

	if err != nil {
		log.Printf("ERROR: gemini_update userID=%s item=%s err=%v", userID, itemID, err)
		return
	}

	log.Printf("INFO: gemini_categorize_complete userID=%s item=%s category=%s tags=%v", 
		userID, itemID, result.Category, result.OccasionTags)
}
```

**Step 4: Commit**

```bash
cd D:\gloom\StyleAI\backend
git add internal/handlers/wardrobe/rembg_handler.go
git commit -m "feat: integrate Gemini categorization after background removal"
```

---

## Task 5: Update Frontend - Remove Hardcoded Category

**Files:**
- Modify: `app/(tabs)/wardrobe/add-item.tsx:222-232`
- Test: N/A (manual test)

**Step 1: Remove hardcoded category and add proper form**

Find this code (lines 222-232):
```typescript
const newItem = await addItem({
  image_url: photoUri,
  category: 'tops', // Default to tops during development
  sub_category: null,
  colors: [],
  style_tags: [],
  occasion_tags: [],
  vibe_tags: [],
  fabric_guess: null,
  processing_status: 'processing',
});
```

Replace with:
```typescript
// Note: Category and tags will be populated by Gemini AI after background removal
// We'll save with 'processing' status and let the backend update with AI results
const newItem = await addItem({
  image_url: photoUri,
  category: null, // Will be set by Gemini after RMBG
  sub_category: null,
  colors: [],
  style_tags: [],
  occasion_tags: [],
  vibe_tags: [],
  fabric_guess: null,
  processing_status: 'processing',
});
```

**Step 2: Commit**

```bash
cd D:\gloom\StyleAI
git add app/\(tabs\)/wardrobe/add-item.tsx
git commit -m "feat: remove hardcoded category, let Gemini auto-categorize"
```

---

## Task 6: Verify End-to-End Flow

**Step 1: Test the flow manually**

1. Set `GEMINI_API_KEY` in your `.env` file
2. Start the Go backend: `cd backend && go run ./cmd/server`
3. Start the Expo dev server: `npm run start`
4. Open the app and navigate to Wardrobe tab
5. Tap "Add item" and upload a clothing image
6. Verify:
   - Image uploads successfully
   - RMBG processes the image (background removed)
   - Gemini categorizes the item
   - Category and tags appear in the wardrobe item

**Step 2: Check server logs**

Look for these log patterns:
- `INFO: rembg_complete userID=... item=... url=...`
- `INFO: gemini_categorize_start userID=... item=...`
- `INFO: gemini_categorize_complete userID=... item=... category=... tags=[...]`

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add Gemini API key to config | config/config.go |
| 2 | Create Gemini service client | services/gemini/client.go, client_test.go |
| 3 | Wire Gemini client into server | server/server.go |
| 4 | Integrate Gemini in handler | handlers/wardrobe/rembg_handler.go |
| 5 | Update frontend | app/(tabs)/wardrobe/add-item.tsx |
| 6 | Verify end-to-end | Manual testing |

**Total: 6 tasks** - Implement in order as they build on each other.