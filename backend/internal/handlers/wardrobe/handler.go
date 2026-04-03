package wardrobe

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"backend/internal/db"
	"backend/internal/middleware"
	"backend/internal/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	db             *db.DB
	supabaseURL    string
	serviceRoleKey string
	v              *validator.Validate
}

func New(database *db.DB, supabaseURL, serviceRoleKey string) *Handler {
	v := validator.New()
	return &Handler{
		db:             database,
		supabaseURL:    supabaseURL,
		serviceRoleKey: serviceRoleKey,
		v:              v,
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	// TODO(Phase2): Implement Gemini AI background job for wardrobe item categorization / tagging
	// TODO(Phase2): Implement background job to create cutout image
	wardrobeGroup := router.Group("/wardrobe")
	wardrobeGroup.Get("", h.ListItems)    // Hits /api/v1/wardrobe
	wardrobeGroup.Get("/", h.ListItems)   // Hits /api/v1/wardrobe/
	wardrobeGroup.Post("", h.CreateItem)  // Hits /api/v1/wardrobe
	wardrobeGroup.Post("/", h.CreateItem) // Hits /api/v1/wardrobe/
	wardrobeGroup.Get("/:id", h.GetItem)
	wardrobeGroup.Patch("/:id", h.UpdateItem)
	wardrobeGroup.Delete("/:id", h.DeleteItem)
	wardrobeGroup.Get("/images/*", h.GetImage)
}

func (h *Handler) ListItems(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	categoryFilter := c.Query("category")

	query := `SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, fabric_guess, processing_status, created_at FROM wardrobe_items WHERE user_id = $1`
	args := []interface{}{userID}

	if categoryFilter != "" {
		query += ` AND category = $2`
		args = append(args, categoryFilter)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		log.Printf("ERROR: list_wardrobe userID=%s err=%v", userID, err)
		return response.InternalError(c, "error fetching wardrobe items")
	}
	defer rows.Close()

	items := []db.WardrobeItem{}
	for rows.Next() {
		var item db.WardrobeItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FunctionalTags, &item.SilhouetteTags, &item.VibeTags, &item.FabricGuess, &item.ProcessingStatus, &item.CreatedAt); err != nil {
			log.Printf("ERROR: list_wardrobe userID=%s err=%v", userID, err)
			return response.InternalError(c, "error mapping wardrobe items")
		}
		items = append(items, item)
	}

	return response.Success(c, items)
}

func (h *Handler) CreateItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	var req db.CreateWardrobeItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.v.Struct(req); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("%s: %s", e.Field(), e.Tag()))
		}
		return response.ValidationError(c, errs)
	}

	// Validate category is required and valid
	if req.Category == nil || *req.Category == "" {
		return response.ValidationError(c, []string{"category: required field"})
	}
	validCategories := map[string]bool{
		"tops": true, "bottoms": true, "fullbody": true,
		"outerwear": true, "shoes": true, "bags": true, "accessories": true,
	}
	if !validCategories[*req.Category] {
		return response.ValidationError(c, []string{"category: invalid value"})
	}

	if req.ProcessingStatus == "" {
		req.ProcessingStatus = "ready"
	}

	query := `INSERT INTO wardrobe_items (user_id, image_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, processing_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, fabric_guess, processing_status, created_at`
	var item db.WardrobeItem
	err := h.db.QueryRow(context.Background(), query, userID, req.ImageURL, req.Category, req.SubCategory, req.Colors, req.StyleTags, req.OccasionTags, req.FunctionalTags, req.SilhouetteTags, req.VibeTags, req.ProcessingStatus).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FunctionalTags, &item.SilhouetteTags, &item.VibeTags, &item.FabricGuess, &item.ProcessingStatus, &item.CreatedAt)
	if err != nil {
		log.Printf("ERROR: create_wardrobe userID=%s err=%v", userID, err)
		return response.InternalError(c, "error creating wardrobe item")
	}

	return response.Created(c, item)
}

func (h *Handler) GetItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid uuid format")
	}

	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), `SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, fabric_guess, processing_status, created_at FROM wardrobe_items WHERE id = $1 AND user_id = $2`, id, userID).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FunctionalTags, &item.SilhouetteTags, &item.VibeTags, &item.FabricGuess, &item.ProcessingStatus, &item.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
		log.Printf("ERROR: get_wardrobe userID=%s err=%v", userID, err)
		return response.InternalError(c, "error fetching wardrobe item")
	}

	return response.Success(c, item)
}

func (h *Handler) UpdateItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid uuid format")
	}

	var req db.UpdateWardrobeItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.v.Struct(req); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("%s: %s", e.Field(), e.Tag()))
		}
		return response.ValidationError(c, errs)
	}

	setParts := []string{}
	args := []interface{}{id, userID}
	argID := 3

	if req.ImageURL != nil {
		setParts = append(setParts, fmt.Sprintf("image_url = $%d", argID))
		args = append(args, *req.ImageURL)
		argID++
	}
	if req.CutoutURL != nil {
		setParts = append(setParts, fmt.Sprintf("cutout_url = $%d", argID))
		args = append(args, *req.CutoutURL)
		argID++
	}
	if req.Category != nil {
		validCategories := map[string]bool{"tops": true, "bottoms": true, "fullbody": true, "outerwear": true, "shoes": true, "bags": true, "accessories": true}
		if *req.Category != "" && !validCategories[*req.Category] {
			return response.ValidationError(c, []string{"category: invalid"})
		}
		setParts = append(setParts, fmt.Sprintf("category = $%d", argID))
		args = append(args, *req.Category)
		argID++
	}
	if req.SubCategory != nil {
		setParts = append(setParts, fmt.Sprintf("sub_category = $%d", argID))
		args = append(args, *req.SubCategory)
		argID++
	}
	if req.Colors != nil {
		setParts = append(setParts, fmt.Sprintf("colors = $%d", argID))
		args = append(args, req.Colors)
		argID++
	}
	if req.StyleTags != nil {
		setParts = append(setParts, fmt.Sprintf("style_tags = $%d", argID))
		args = append(args, req.StyleTags)
		argID++
	}
	if req.OccasionTags != nil {
		setParts = append(setParts, fmt.Sprintf("occasion_tags = $%d", argID))
		args = append(args, req.OccasionTags)
		argID++
	}
	if req.FabricGuess != nil {
		setParts = append(setParts, fmt.Sprintf("fabric_guess = $%d", argID))
		args = append(args, *req.FabricGuess)
		argID++
	}
	if req.FunctionalTags != nil {
		setParts = append(setParts, fmt.Sprintf("functional_tags = $%d", argID))
		args = append(args, req.FunctionalTags)
		argID++
	}
	if req.SilhouetteTags != nil {
		setParts = append(setParts, fmt.Sprintf("silhouette_tags = $%d", argID))
		args = append(args, req.SilhouetteTags)
		argID++
	}
	if req.VibeTags != nil {
		setParts = append(setParts, fmt.Sprintf("vibe_tags = $%d", argID))
		args = append(args, req.VibeTags)
		argID++
	}
	if req.ProcessingStatus != nil {
		setParts = append(setParts, fmt.Sprintf("processing_status = $%d", argID))
		args = append(args, *req.ProcessingStatus)
		argID++
	}

	if len(setParts) == 0 {
		return response.Success(c, fiber.Map{"message": "nothing to update"})
	}

	query := fmt.Sprintf(`UPDATE wardrobe_items SET %s WHERE id = $1 AND user_id = $2 RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, functional_tags, silhouette_tags, vibe_tags, fabric_guess, processing_status, created_at`, strings.Join(setParts, ", "))

	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), query, args...).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FunctionalTags, &item.SilhouetteTags, &item.VibeTags, &item.FabricGuess, &item.ProcessingStatus, &item.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
		log.Printf("ERROR: update_wardrobe userID=%s err=%v", userID, err)
		return response.InternalError(c, "error updating wardrobe item")
	}

	return response.Success(c, item)
}

func (h *Handler) DeleteItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return response.BadRequest(c, "invalid uuid format")
	}

	tag, err := h.db.Exec(context.Background(), `DELETE FROM wardrobe_items WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		log.Printf("ERROR: delete_wardrobe userID=%s err=%v", userID, err)
		return response.InternalError(c, "error deleting wardrobe item")
	}

	if tag.RowsAffected() == 0 {
		return response.NotFound(c, "wardrobe item not found")
	}

	return response.NoContent(c)
}

// GetImage proxies image requests from Supabase Storage through the backend
func (h *Handler) GetImage(c *fiber.Ctx) error {
	path := c.Params("*")
	if path == "" {
		return response.BadRequest(c, "image path is required")
	}

	// Validate path to prevent directory traversal
	if strings.Contains(path, "..") || strings.HasPrefix(path, "/") {
		return response.BadRequest(c, "invalid path")
	}

	// Construct Supabase Storage URL
	storageURL := fmt.Sprintf("%s/storage/v1/object/public/wardrobe-images/%s", h.supabaseURL, path)

	// Forward the request to Supabase Storage
	httpReq, err := http.NewRequest("GET", storageURL, nil)
	if err != nil {
		log.Printf("ERROR: get_image path=%s err=%v", path, err)
		return response.InternalError(c, "failed to create request")
	}

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("ERROR: get_image path=%s err=%v", path, err)
		return response.InternalError(c, "failed to fetch image")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return response.NotFound(c, "image not found")
		}
		log.Printf("ERROR: get_image path=%s status=%d", path, resp.StatusCode)
		return response.InternalError(c, "failed to fetch image")
	}

	// Read image data
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("ERROR: get_image path=%s err=%v", path, err)
		return response.InternalError(c, "failed to read image")
	}

	// Set content type based on extension
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		// Fallback based on extension
		switch {
		case strings.HasSuffix(strings.ToLower(path), ".png"):
			contentType = "image/png"
		case strings.HasSuffix(strings.ToLower(path), ".webp"):
			contentType = "image/webp"
		default:
			contentType = "image/jpeg"
		}
	}

	c.Set("Content-Type", contentType)
	c.Set("Cache-Control", "public, max-age=31536000") // Cache for 1 year
	return c.Send(data)
}
