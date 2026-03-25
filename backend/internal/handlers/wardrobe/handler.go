package wardrobe

import (
	"context"
	"fmt"
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
	db *db.DB
	v  *validator.Validate
}

func New(database *db.DB) *Handler {
	v := validator.New()
	return &Handler{
		db: database,
		v:  v,
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	// TODO(Phase2): Implement Gemini AI background job for wardrobe item categorization / tagging
	// TODO(Phase2): Implement background job to create cutout image
	wardrobeGroup := router.Group("/wardrobe")
	wardrobeGroup.Get("/", h.ListItems)
	wardrobeGroup.Post("/", h.CreateItem)
	wardrobeGroup.Get("/:id", h.GetItem)
	wardrobeGroup.Patch("/:id", h.UpdateItem)
	wardrobeGroup.Delete("/:id", h.DeleteItem)
}

func (h *Handler) ListItems(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	categoryFilter := c.Query("category")

	query := `SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at FROM wardrobe_items WHERE user_id = $1`
	args := []interface{}{userID}

	if categoryFilter != "" {
		query += ` AND category = $2`
		args = append(args, categoryFilter)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return response.InternalError(c, "error fetching wardrobe items")
	}
	defer rows.Close()

	items := []db.WardrobeItem{}
	for rows.Next() {
		var item db.WardrobeItem
		if err := rows.Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt); err != nil {
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

	validCategories := map[string]bool{"upper": true, "lower": true, "dress": true, "shoes": true, "bag": true, "accessory": true}
	if !validCategories[req.Category] {
		return response.ValidationError(c, []string{"category: invalid"})
	}

	query := `INSERT INTO wardrobe_items (user_id, image_url, category, sub_category, colors, style_tags, occasion_tags) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at`
	var item db.WardrobeItem
	err := h.db.QueryRow(context.Background(), query, userID, req.ImageURL, req.Category, req.SubCategory, req.Colors, req.StyleTags, req.OccasionTags).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt)
	if err != nil {
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
	err = h.db.QueryRow(context.Background(), `SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at FROM wardrobe_items WHERE id = $1 AND user_id = $2`, id, userID).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
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
		validCategories := map[string]bool{"upper": true, "lower": true, "dress": true, "shoes": true, "bag": true, "accessory": true}
		if !validCategories[*req.Category] {
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

	if len(setParts) == 0 {
		return response.Success(c, fiber.Map{"message": "nothing to update"})
	}

	query := fmt.Sprintf(`UPDATE wardrobe_items SET %s WHERE id = $1 AND user_id = $2 RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at`, strings.Join(setParts, ", "))

	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), query, args...).Scan(&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory, &item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
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
		return response.InternalError(c, "error deleting wardrobe item")
	}

	if tag.RowsAffected() == 0 {
		return response.NotFound(c, "wardrobe item not found")
	}

	return response.NoContent(c)
}
