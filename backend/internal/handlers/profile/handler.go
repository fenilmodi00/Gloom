package profile

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
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
	router.Get("/profile", h.GetProfile)
	router.Patch("/profile", h.UpdateProfile)
}

func (h *Handler) GetProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var profile db.Profile
	err := h.db.QueryRow(context.Background(), `
		SELECT id, name, avatar_url, body_photo_url, skin_tone, style_tags, created_at
		FROM profiles
		WHERE id = $1`, userID).
		Scan(
			&profile.ID,
			&profile.Name,
			&profile.AvatarURL,
			&profile.BodyPhotoURL,
			&profile.SkinTone,
			&profile.StyleTags,
			&profile.CreatedAt,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "profile not found")
		}
		return response.InternalError(c, "database error")
	}

	return response.Success(c, profile)
}

func (h *Handler) UpdateProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var req db.UpdateProfileRequest
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

	if req.Name != nil {
		updates = append(updates, fmt.Sprintf("name = $%d", argID))
		args = append(args, *req.Name)
		argID++
	}
	if req.AvatarURL != nil {
		updates = append(updates, fmt.Sprintf("avatar_url = $%d", argID))
		args = append(args, *req.AvatarURL)
		argID++
	}
	if req.BodyPhotoURL != nil {
		updates = append(updates, fmt.Sprintf("body_photo_url = $%d", argID))
		args = append(args, *req.BodyPhotoURL)
		argID++
	}
	if req.SkinTone != nil {
		updates = append(updates, fmt.Sprintf("skin_tone = $%d", argID))
		args = append(args, *req.SkinTone)
		argID++
	}
	if req.StyleTags != nil {
		updates = append(updates, fmt.Sprintf("style_tags = $%d", argID))
		if len(req.StyleTags) == 0 {
			args = append(args, []string{})
		} else {
			args = append(args, req.StyleTags)
		}
		argID++
	}

	if len(updates) == 0 {
		return response.BadRequest(c, "no fields to update")
	}

	args = append(args, userID)
	query := fmt.Sprintf(`
		UPDATE profiles
		SET %s
		WHERE id = $%d
		RETURNING id, name, avatar_url, body_photo_url, skin_tone, style_tags, created_at`,
		strings.Join(updates, ", "), argID)

	var profile db.Profile
	err := h.db.QueryRow(context.Background(), query, args...).
		Scan(
			&profile.ID,
			&profile.Name,
			&profile.AvatarURL,
			&profile.BodyPhotoURL,
			&profile.SkinTone,
			&profile.StyleTags,
			&profile.CreatedAt,
		)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "profile not found")
		}
		return response.InternalError(c, "database error")
	}

	return response.Success(c, profile)
}
