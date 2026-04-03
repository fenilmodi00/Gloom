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
	"backend/internal/services/rembg"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// RembgHandler handles async background removal processing.
type RembgHandler struct {
	db          *db.DB
	rembgClient *rembg.Client
	supabaseURL string
	serviceKey  string
	semaphore   chan struct{}
}

// NewRembgHandler creates a new rembg processing handler.
func NewRembgHandler(database *db.DB, rembgClient *rembg.Client, supabaseURL, serviceKey string) *RembgHandler {
	return &RembgHandler{
		db:          database,
		rembgClient: rembgClient,
		supabaseURL: supabaseURL,
		serviceKey:  serviceKey,
		semaphore:   make(chan struct{}, 2), // Max 2 concurrent rembg calls
	}
}

// RegisterRoutes registers the rembg processing routes.
func (h *RembgHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/wardrobe/:id/process-rembg", h.ProcessRembg)
}

// ProcessRembg starts async background removal processing.
// Returns 202 Accepted immediately, processing happens in background.
func (h *RembgHandler) ProcessRembg(c *fiber.Ctx) error {
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
		log.Printf("ERROR: rembg_process userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to update processing status")
	}

	// Start async processing in goroutine
	go h.processInBackground(id, userID, item.ImageURL)

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"message": "Background removal started",
		"item_id": id.String(),
	})
}

// processInBackground handles the actual rembg processing asynchronously.
func (h *RembgHandler) processInBackground(itemID uuid.UUID, userID uuid.UUID, imageURL string) {
	// Acquire semaphore (max 2 concurrent)
	h.semaphore <- struct{}{}
	defer func() { <-h.semaphore }()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// Call rembg service with the image URL directly
	cutoutBytes, err := h.rembgClient.RemoveBackgroundFromURL(ctx, imageURL)
	if err != nil {
		log.Printf("ERROR: rembg_process userID=%s item=%s err=%v", userID, itemID, err)
		h.updateFallback(itemID)
		return
	}

	// Upload cutout to permanent storage
	cutoutURL, err := h.uploadCutout(userID, itemID, cutoutBytes)
	if err != nil {
		log.Printf("ERROR: rembg_upload userID=%s item=%s err=%v", userID, itemID, err)
		h.updateFallback(itemID)
		return
	}

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

// uploadCutout uploads the cutout image to Supabase storage.
func (h *RembgHandler) uploadCutout(userID uuid.UUID, itemID uuid.UUID, imageBytes []byte) (string, error) {
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
func (h *RembgHandler) updateFallback(itemID uuid.UUID) {
	_, err := h.db.Exec(context.Background(), `
		UPDATE wardrobe_items
		SET processing_status = 'fallback'
		WHERE id = $1
	`, itemID)
	if err != nil {
		log.Printf("ERROR: rembg_fallback item=%s err=%v", itemID, err)
	}
}
