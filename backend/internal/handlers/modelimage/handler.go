package modelimage

import (
	"log"

	"backend/internal/db"
	"backend/internal/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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

type CreateModelImageRequest struct {
	ImageURL string  `json:"image_url" validate:"required,url"`
	OutfitID *string `json:"outfit_id" validate:"omitempty,uuid"`
}

type ModelImageResponse struct {
	ID        string  `json:"id"`
	UserID    string  `json:"user_id"`
	ImageURL  string  `json:"image_url"`
	OutfitID  *string `json:"outfit_id"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	group := router.Group("/model-images")
	group.Post("/upload", h.CreateModelImage)
	group.Get("/user/:userId", h.ListUserImages)
	group.Delete("/:id", h.DeleteModelImage)
}

func (h *Handler) CreateModelImage(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var req CreateModelImageRequest
	if err := c.BodyParser(&req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	if err := h.v.Struct(req); err != nil {
		return response.ValidationError(c, []string{err.Error()})
	}

	query := `
		INSERT INTO user_model_images (user_id, image_url, outfit_id)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, image_url, outfit_id, created_at, updated_at
	`

	var resp ModelImageResponse
	var outfitID *string
	if req.OutfitID != nil && *req.OutfitID != "" {
		outfitID = req.OutfitID
	}

	err := h.db.QueryRow(c.Context(), query, userID, req.ImageURL, outfitID).Scan(
		&resp.ID,
		&resp.UserID,
		&resp.ImageURL,
		&resp.OutfitID,
		&resp.CreatedAt,
		&resp.UpdatedAt,
	)

	if err != nil {
		log.Printf("ERROR: create_model_image err=%v", err)
		return response.InternalError(c, "failed to create model image")
	}

	return response.Created(c, resp)
}

func (h *Handler) ListUserImages(c *fiber.Ctx) error {
	requestUserID := c.Params("userId")
	userID := c.Locals("user_id").(string)

	if requestUserID != userID {
		return response.Forbidden(c, "cannot view other users' images")
	}

	query := `
		SELECT id, user_id, image_url, outfit_id, created_at, updated_at
		FROM user_model_images
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := h.db.Query(c.Context(), query, userID)
	if err != nil {
		log.Printf("ERROR: list_model_images err=%v", err)
		return response.InternalError(c, "failed to fetch model images")
	}
	defer rows.Close()

	var images []ModelImageResponse
	for rows.Next() {
		var img ModelImageResponse
		if err := rows.Scan(
			&img.ID,
			&img.UserID,
			&img.ImageURL,
			&img.OutfitID,
			&img.CreatedAt,
			&img.UpdatedAt,
		); err != nil {
			log.Printf("ERROR: scan_model_image err=%v", err)
			continue
		}
		images = append(images, img)
	}

	if images == nil {
		images = []ModelImageResponse{}
	}

	return response.Success(c, images)
}

func (h *Handler) DeleteModelImage(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	imageID := c.Params("id")

	if _, err := uuid.Parse(imageID); err != nil {
		return response.BadRequest(c, "invalid image ID format")
	}

	query := `
		DELETE FROM user_model_images
		WHERE id = $1 AND user_id = $2
	`

	cmd, err := h.db.Exec(c.Context(), query, imageID, userID)
	if err != nil {
		log.Printf("ERROR: delete_model_image err=%v", err)
		return response.InternalError(c, "failed to delete model image")
	}

	if cmd.RowsAffected() == 0 {
		return response.NotFound(c, "model image not found or unauthorized")
	}

	return response.Success(c, fiber.Map{"deleted": true})
}
