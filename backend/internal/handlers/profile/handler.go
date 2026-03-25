package profile

import (
	"context"
	"fmt"
	"log"
	"strings"

	"backend/internal/db"
	"backend/internal/middleware"
	"backend/internal/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	db *db.DB
	v  *validator.Validate
}

func New(database *db.DB) *Handler {
	return &Handler{
		db: database,
		v:  validator.New(),
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	// TODO(Phase2): Phase 2 endpoint route mapping
	profileGroup := router.Group("/profile")
	profileGroup.Get("/", h.GetProfile)
	profileGroup.Patch("/", h.UpdateProfile)
}

func (h *Handler) GetProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	if userID.String() == "00000000-0000-0000-0000-000000000000" {
		return response.Unauthorized(c, "invalid user id")
	}

	var p db.Profile
	err := h.db.QueryRow(context.Background(), `SELECT id, name, avatar_url, body_photo_url, skin_tone, style_tags, created_at FROM profiles WHERE id = $1`, userID).Scan(
		&p.ID, &p.Name, &p.AvatarURL, &p.BodyPhotoURL, &p.SkinTone, &p.StyleTags, &p.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "profile not found")
		}
		log.Printf("ERROR: get_profile userID=%s err=%v", userID, err)
		return response.InternalError(c, "error fetching profile")
	}

	return response.Success(c, p)
}

func (h *Handler) UpdateProfile(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	if userID.String() == "00000000-0000-0000-0000-000000000000" {
		return response.Unauthorized(c, "invalid user id")
	}

	var req db.UpdateProfileRequest
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
	args := []interface{}{userID}
	argID := 2

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argID))
		args = append(args, *req.Name)
		argID++
	}
	if req.AvatarURL != nil {
		setParts = append(setParts, fmt.Sprintf("avatar_url = $%d", argID))
		args = append(args, *req.AvatarURL)
		argID++
	}
	if req.BodyPhotoURL != nil {
		setParts = append(setParts, fmt.Sprintf("body_photo_url = $%d", argID))
		args = append(args, *req.BodyPhotoURL)
		argID++
	}
	if req.SkinTone != nil {
		setParts = append(setParts, fmt.Sprintf("skin_tone = $%d", argID))
		args = append(args, *req.SkinTone)
		argID++
	}
	if req.StyleTags != nil {
		setParts = append(setParts, fmt.Sprintf("style_tags = $%d", argID))
		args = append(args, req.StyleTags)
		argID++
	}

	if len(setParts) == 0 {
		return response.Success(c, fiber.Map{"message": "nothing to update"})
	}

	query := fmt.Sprintf(`UPDATE profiles SET %s WHERE id = $1 RETURNING id, name, avatar_url, body_photo_url, skin_tone, style_tags, created_at`, strings.Join(setParts, ", "))

	var p db.Profile
	err := h.db.QueryRow(context.Background(), query, args...).Scan(
		&p.ID, &p.Name, &p.AvatarURL, &p.BodyPhotoURL, &p.SkinTone, &p.StyleTags, &p.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return response.NotFound(c, "profile not found")
		}
		log.Printf("ERROR: update_profile userID=%s err=%v", userID, err)
		return response.InternalError(c, "error updating profile")
	}

	return response.Success(c, p)
}
