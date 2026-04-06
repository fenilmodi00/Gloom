package wardrobe

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"time"

	"backend/internal/db"
	"backend/internal/middleware"
	"backend/internal/response"
	"backend/internal/services/gemini"
	"backend/internal/services/rembg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"os"
	"strconv"
	"strings"
)

// ParallelHandler handles parallel processing: Gemini first, then Rembg.
type ParallelHandler struct {
	db           *db.DB
	rembgClient  *rembg.Client
	geminiClient *gemini.Client
	supabaseURL  string
	serviceKey   string
	semaphore    chan struct{}
}

// NewParallelHandler creates a new parallel processing handler.
func NewParallelHandler(database *db.DB, rembgClient *rembg.Client, geminiClient *gemini.Client, supabaseURL, serviceKey string) *ParallelHandler {
	maxConcurrent := 2
	if envVal := os.Getenv("REMBG_MAX_CONCURRENT"); envVal != "" {
		if val, err := strconv.Atoi(envVal); err == nil && val > 0 {
			maxConcurrent = val
		}
	}

	return &ParallelHandler{
		db:           database,
		rembgClient:  rembgClient,
		geminiClient: geminiClient,
		supabaseURL:  supabaseURL,
		serviceKey:   serviceKey,
		semaphore:    make(chan struct{}, maxConcurrent),
	}
}

// RegisterRoutes registers the parallel processing routes.
func (h *ParallelHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/wardrobe/:id/process-parallel", h.ProcessParallel)
}

// ProcessParallel starts async parallel processing: Gemini first, then Rembg.
// Returns 202 Accepted immediately, processing happens in background.
func (h *ParallelHandler) ProcessParallel(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid uuid format")
	}

	// Verify item exists and belongs to user
	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), `
	SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, fabric_guess, processing_status, created_at
	FROM wardrobe_items
	WHERE id = $1 AND user_id = $2
	`, id, userID).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FunctionalTags, &item.SilhouetteTags, &item.VibeTags, &item.FabricGuess, &item.ProcessingStatus, &item.CreatedAt)
	if err != nil {
		return response.NotFound(c, "wardrobe item not found")
	}

	// Update status to processing
	_, err = h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET processing_status = 'processing'
	WHERE id = $1
	`, id)
	if err != nil {
		log.Printf("ERROR: parallel_process userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to update processing status")
	}

	// Start async processing in goroutine
	go h.processParallelInBackground(id, userID, item.ImageURL)

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Parallel processing started",
		"item_id": id.String(),
	})
}

// processParallelInBackground handles the parallel processing asynchronously.
// Flow: Gemini on ORIGINAL image first → Update DB with category → Rembg → Upload cutout → completed
func (h *ParallelHandler) processParallelInBackground(itemID uuid.UUID, userID uuid.UUID, imageURL string) {
	// Acquire semaphore
	h.semaphore <- struct{}{}
	defer func() {
		<-h.semaphore
		h.deleteTempImage(imageURL)
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Step 1: Run Gemini on ORIGINAL image first (1-2s)
	if h.geminiClient != nil {
		h.categorizeWithGeminiOnOriginal(ctx, itemID, userID, imageURL)
	}

	// Step 2: Run Rembg on original image (20-30s)
	cutoutBytes, err := h.rembgClient.RemoveBackgroundFromURL(ctx, imageURL)
	if err != nil {
		log.Printf("ERROR: parallel_rembg userID=%s item=%s err=%v", userID, itemID, err)
		h.updateFallback(itemID)
		return
	}

	// Step 3: Upload cutout to permanent storage
	cutoutURL, err := h.uploadCutout(userID, itemID, cutoutBytes)
	if err != nil {
		log.Printf("ERROR: parallel_upload userID=%s item=%s err=%v", userID, itemID, err)
		h.updateFallback(itemID)
		return
	}
	log.Printf("INFO: parallel_upload_success userID=%s item=%s url=%s", userID, itemID, cutoutURL)

	// Step 4: Update DB with cutout URL and mark as completed
	log.Printf("INFO: parallel_db_update userID=%s item=%s url=%s", userID, itemID, cutoutURL)
	_, err = h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET cutout_url = $1, processing_status = 'completed', image_url = ''
	WHERE id = $2
	`, cutoutURL, itemID)
	if err != nil {
		log.Printf("ERROR: parallel_db_update userID=%s item=%s err=%v", userID, itemID, err)
		return
	}

	log.Printf("INFO: parallel_complete userID=%s item=%s url=%s", userID, itemID, cutoutURL)
}

// categorizeWithGeminiOnOriginal analyzes the ORIGINAL image (not cutout) with Gemini and updates the item.
// Sets status to 'analyzing' after Gemini succeeds.
func (h *ParallelHandler) categorizeWithGeminiOnOriginal(ctx context.Context, itemID, userID uuid.UUID, imageURL string) {
	log.Printf("INFO: parallel_gemini_start userID=%s item=%s", userID, itemID)

	resp, err := h.geminiClient.CategorizeImage(ctx, imageURL)
	if err != nil {
		log.Printf("ERROR: parallel_gemini userID=%s item=%s err=%v", userID, itemID, err)
		// Continue with Rembrandt even if Gemini fails
		return
	}

	// Update the wardrobe item with AI-generated categorization AND set status='analyzing'
	// This indicates Gemini completed but rembg is still running
	_, err = h.db.Exec(ctx, `
	UPDATE wardrobe_items
	SET category = $1, sub_category = $2, colors = $3, style_tags = $4, 
	    occasion_tags = $5, vibe_tags = $6, functional_tags = $7, 
	    silhouette_tags = $8, fabric_guess = $9, 
	    processing_status = 'analyzing'
	WHERE id = $10
	`, resp.Category, resp.SubCategory, resp.Colors, resp.StyleTags,
		resp.OccasionTags, resp.VibeTags, resp.FunctionalTags,
		resp.SilhouetteTags, resp.FabricGuess, itemID)
	if err != nil {
		log.Printf("ERROR: parallel_gemini_update userID=%s item=%s err=%v", userID, itemID, err)
		return
	}
	log.Printf("INFO: parallel_gemini_complete userID=%s item=%s category=%s", userID, itemID, resp.Category)
}

// uploadCutout uploads the cutout image to Supabase storage.
func (h *ParallelHandler) uploadCutout(userID uuid.UUID, itemID uuid.UUID, imageBytes []byte) (string, error) {
	path := fmt.Sprintf("%s/cutouts/%s.png", userID, itemID)
	uploadURL := fmt.Sprintf("%s/storage/v1/object/wardrobe-images/%s", h.supabaseURL, path)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", fmt.Sprintf("%s.png", itemID))
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}
	part.Write(imageBytes)
	writer.Close()

	req, err := http.NewRequest("POST", uploadURL, body)
	if err != nil {
		return "", fmt.Errorf("create upload request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+h.serviceKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 2 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("upload failed with status %d", resp.StatusCode)
	}

	return fmt.Sprintf("%s/storage/v1/object/public/wardrobe-images/%s", h.supabaseURL, path), nil
}

// updateFallback marks an item as fallback when processing fails.
func (h *ParallelHandler) updateFallback(itemID uuid.UUID) {
	_, err := h.db.Exec(context.Background(), `
	UPDATE wardrobe_items
	SET processing_status = 'fallback'
	WHERE id = $1
	`, itemID)
	if err != nil {
		log.Printf("ERROR: parallel_fallback item=%s err=%v", itemID, err)
	}
}

// deleteTempImage removes the original temporary image from storage.
func (h *ParallelHandler) deleteTempImage(imageURL string) {
	// Only delete if it's in the temp folder
	if !strings.Contains(imageURL, "/temp/") {
		return
	}

	// Extract path from public URL
	// Format: https://.../storage/v1/object/public/wardrobe-images/USER_ID/temp/FILE_NAME
	parts := strings.Split(imageURL, "/wardrobe-images/")
	if len(parts) < 2 {
		return
	}
	path := parts[1]

	deleteURL := fmt.Sprintf("%s/storage/v1/object/wardrobe-images/%s", h.supabaseURL, path)
	req, err := http.NewRequest("DELETE", deleteURL, nil)
	if err != nil {
		log.Printf("ERROR: parallel_cleanup_req path=%s err=%v", path, err)
		return
	}
	req.Header.Set("Authorization", "Bearer "+h.serviceKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("ERROR: parallel_cleanup_do path=%s err=%v", path, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound {
		log.Printf("INFO: parallel_cleanup_success path=%s status=%d", path, resp.StatusCode)
	} else {
		log.Printf("WARN: parallel_cleanup_failed path=%s status=%d", path, resp.StatusCode)
	}
}
