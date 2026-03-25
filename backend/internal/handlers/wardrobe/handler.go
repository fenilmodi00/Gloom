package wardrobe

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/styleai/backend/internal/db"
	"github.com/styleai/backend/internal/middleware"
	"github.com/styleai/backend/internal/response"
)

type Handler struct {
	db       *db.DB
	validate *validator.Validate
}

func New(db *db.DB) *Handler {
	return &Handler{
		db:       db,
		validate: validator.New(),
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Get("/wardrobe", h.ListItems)
	router.Post("/wardrobe", h.CreateItem)
	router.Get("/wardrobe/:id", h.GetItem)
	router.Patch("/wardrobe/:id", h.UpdateItem)
	router.Delete("/wardrobe/:id", h.DeleteItem)
}

func (h *Handler) ListItems(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	category := c.Query("category")

	query := `SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at FROM wardrobe_items WHERE user_id = $1`
	args := []interface{}{userID}

	if category != "" {
		query += ` AND category = $2`
		args = append(args, category)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return response.InternalError(c, "database error")
	}
	defer rows.Close()

	items := make([]db.WardrobeItem, 0)
	for rows.Next() {
		var item db.WardrobeItem
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory,
			&item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt,
		); err != nil {
			return response.InternalError(c, "database scan error")
		}
		items = append(items, item)
	}

	return response.Success(c, items)
}

func (h *Handler) CreateItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req db.CreateWardrobeItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid JSON payload")
	}

	if err := h.validate.Struct(req); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("invalid field %s: %s", e.Field(), e.Tag()))
		}
		return response.ValidationError(c, errs)
	}

	if req.Colors == nil {
		req.Colors = []string{}
	}
	if req.StyleTags == nil {
		req.StyleTags = []string{}
	}
	if req.OccasionTags == nil {
		req.OccasionTags = []string{}
	}

	var item db.WardrobeItem
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO wardrobe_items (user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at`,
		userID, req.ImageURL, req.CutoutURL, req.Category, req.SubCategory, req.Colors, req.StyleTags, req.OccasionTags, req.FabricGuess,
	).Scan(
		&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory,
		&item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt,
	)

	if err != nil {
		return response.InternalError(c, "database insert error")
	}

	return response.Created(c, item)
}

func (h *Handler) GetItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	itemID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid item ID format")
	}

	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), `
		SELECT id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at
		FROM wardrobe_items
		WHERE id = $1 AND user_id = $2`, itemID, userID).
		Scan(
			&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory,
			&item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
		return response.InternalError(c, "database error")
	}

	return response.Success(c, item)
}

func (h *Handler) UpdateItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	itemID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid item ID format")
	}

	var req db.UpdateWardrobeItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid JSON payload")
	}

	if err := h.validate.Struct(req); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("invalid field %s: %s", e.Field(), e.Tag()))
		}
		return response.ValidationError(c, errs)
	}

	updates := []string{}
	args := []interface{}{}
	argID := 1

	if req.ImageURL != nil {
		updates = append(updates, fmt.Sprintf("image_url = $%d", argID))
		args = append(args, *req.ImageURL)
		argID++
	}
	if req.CutoutURL != nil {
		updates = append(updates, fmt.Sprintf("cutout_url = $%d", argID))
		args = append(args, *req.CutoutURL)
		argID++
	}
	if req.Category != nil {
		updates = append(updates, fmt.Sprintf("category = $%d", argID))
		args = append(args, *req.Category)
		argID++
	}
	if req.SubCategory != nil {
		updates = append(updates, fmt.Sprintf("sub_category = $%d", argID))
		args = append(args, *req.SubCategory)
		argID++
	}
	if req.Colors != nil {
		updates = append(updates, fmt.Sprintf("colors = $%d", argID))
		args = append(args, req.Colors)
		argID++
	}
	if req.StyleTags != nil {
		updates = append(updates, fmt.Sprintf("style_tags = $%d", argID))
		args = append(args, req.StyleTags)
		argID++
	}
	if req.OccasionTags != nil {
		updates = append(updates, fmt.Sprintf("occasion_tags = $%d", argID))
		args = append(args, req.OccasionTags)
		argID++
	}
	if req.FabricGuess != nil {
		updates = append(updates, fmt.Sprintf("fabric_guess = $%d", argID))
		args = append(args, *req.FabricGuess)
		argID++
	}

	if len(updates) == 0 {
		return response.BadRequest(c, "no fields to update")
	}

	args = append(args, itemID, userID)
	query := fmt.Sprintf(`
		UPDATE wardrobe_items
		SET %s
		WHERE id = $%d AND user_id = $%d
		RETURNING id, user_id, image_url, cutout_url, category, sub_category, colors, style_tags, occasion_tags, fabric_guess, created_at`,
		strings.Join(updates, ", "), argID, argID+1)

	var item db.WardrobeItem
	err = h.db.QueryRow(context.Background(), query, args...).
		Scan(
			&item.ID, &item.UserID, &item.ImageURL, &item.CutoutURL, &item.Category, &item.SubCategory,
			&item.Colors, &item.StyleTags, &item.OccasionTags, &item.FabricGuess, &item.CreatedAt,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "wardrobe item not found")
		}
		return response.InternalError(c, "database error")
	}

	return response.Success(c, item)
}

func (h *Handler) DeleteItem(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	itemID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid item ID format")
	}

	cmdTag, err := h.db.Exec(context.Background(), `DELETE FROM wardrobe_items WHERE id = $1 AND user_id = $2`, itemID, userID)
	if err != nil {
		return response.InternalError(c, "database delete error")
	}

	if cmdTag.RowsAffected() == 0 {
		return response.NotFound(c, "wardrobe item not found")
	}

	return response.NoContent(c)
}
