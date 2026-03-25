package outfit

import (
	"context"
	"fmt"

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
	router.Get("/outfits", h.ListOutfits)
	router.Post("/outfits", h.CreateOutfit)
	router.Get("/outfits/:id", h.GetOutfit)
	router.Delete("/outfits/:id", h.DeleteOutfit)
}

func (h *Handler) ListOutfits(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	occasion := c.Query("occasion")
	vibe := c.Query("vibe")

	query := `SELECT id, user_id, item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url, created_at FROM outfits WHERE user_id = $1`
	args := []interface{}{userID}
	argID := 2

	if occasion != "" {
		query += fmt.Sprintf(` AND occasion = $%d`, argID)
		args = append(args, occasion)
		argID++
	}
	if vibe != "" {
		query += fmt.Sprintf(` AND vibe = $%d`, argID)
		args = append(args, vibe)
		argID++
	}

	query += ` ORDER BY created_at DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		return response.InternalError(c, "database error")
	}
	defer rows.Close()

	outfits := make([]db.Outfit, 0)
	for rows.Next() {
		var outfit db.Outfit
		if err := rows.Scan(
			&outfit.ID, &outfit.UserID, &outfit.ItemIDs, &outfit.Occasion, &outfit.Vibe,
			&outfit.ColorReasoning, &outfit.AIScore, &outfit.CoverImageURL, &outfit.CreatedAt,
		); err != nil {
			return response.InternalError(c, "database scan error")
		}
		outfits = append(outfits, outfit)
	}

	return response.Success(c, outfits)
}

func (h *Handler) CreateOutfit(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req db.CreateOutfitRequest
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

	if req.ItemIDs == nil {
		req.ItemIDs = []string{}
	}

	var outfit db.Outfit
	err := h.db.QueryRow(context.Background(), `
		INSERT INTO outfits (user_id, item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url, created_at`,
		userID, req.ItemIDs, req.Occasion, req.Vibe, req.ColorReasoning, req.AIScore, req.CoverImageURL,
	).Scan(
		&outfit.ID, &outfit.UserID, &outfit.ItemIDs, &outfit.Occasion, &outfit.Vibe,
		&outfit.ColorReasoning, &outfit.AIScore, &outfit.CoverImageURL, &outfit.CreatedAt,
	)

	if err != nil {
		return response.InternalError(c, "database insert error")
	}

	return response.Created(c, outfit)
}

func (h *Handler) GetOutfit(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	outfitID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid outfit ID format")
	}

	var outfit db.Outfit
	err = h.db.QueryRow(context.Background(), `
		SELECT id, user_id, item_ids, occasion, vibe, color_reasoning, ai_score, cover_image_url, created_at
		FROM outfits
		WHERE id = $1 AND user_id = $2`, outfitID, userID).
		Scan(
			&outfit.ID, &outfit.UserID, &outfit.ItemIDs, &outfit.Occasion, &outfit.Vibe,
			&outfit.ColorReasoning, &outfit.AIScore, &outfit.CoverImageURL, &outfit.CreatedAt,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "outfit not found")
		}
		return response.InternalError(c, "database error")
	}

	return response.Success(c, outfit)
}

func (h *Handler) DeleteOutfit(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	outfitID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return response.BadRequest(c, "invalid outfit ID format")
	}

	cmdTag, err := h.db.Exec(context.Background(), `DELETE FROM outfits WHERE id = $1 AND user_id = $2`, outfitID, userID)
	if err != nil {
		return response.InternalError(c, "database delete error")
	}

	if cmdTag.RowsAffected() == 0 {
		return response.NotFound(c, "outfit not found")
	}

	return response.NoContent(c)
}
