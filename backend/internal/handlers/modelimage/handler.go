package modelimage

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"backend/internal/db"
	"backend/internal/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	db             *db.DB
	supabaseURL    string
	serviceRoleKey string
	v              *validator.Validate
}

func New(database *db.DB, supabaseURL, serviceRoleKey string) *Handler {
	return &Handler{
		db:             database,
		supabaseURL:    supabaseURL,
		serviceRoleKey: serviceRoleKey,
		v:              validator.New(),
	}
}

type CreateModelImageRequest struct {
	ImageURL     string  `json:"image_url" validate:"required,url"`
	OutfitID     *string `json:"outfit_id" validate:"omitempty,uuid"`
	ModelID      *string `json:"model_id" validate:"omitempty"`
	ThumbnailURL *string `json:"thumbnail_url" validate:"omitempty,url"`
}

type ModelImageResponse struct {
	ID           string  `json:"id"`
	UserID       string  `json:"user_id"`
	ImageURL     string  `json:"image_url"`
	ThumbnailURL *string `json:"thumbnail_url,omitempty"`
	OutfitID     *string `json:"outfit_id,omitempty"`
	ModelID      *string `json:"model_id,omitempty"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	group := router.Group("/api/v1/model-images")
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
    INSERT INTO user_model_images (user_id, image_url, outfit_id, model_id, thumbnail_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, image_url, outfit_id, model_id, thumbnail_url, created_at, updated_at
  `

	var resp ModelImageResponse
	var outfitID *string
	if req.OutfitID != nil && *req.OutfitID != "" {
		outfitID = req.OutfitID
	}

	var modelID *string
	if req.ModelID != nil && *req.ModelID != "" {
		modelID = req.ModelID
	}

	var thumbnailURL *string
	if req.ThumbnailURL != nil && *req.ThumbnailURL != "" {
		thumbnailURL = req.ThumbnailURL
	}

	err := h.db.QueryRow(c.Context(), query, userID, req.ImageURL, outfitID, modelID, thumbnailURL).Scan(
		&resp.ID,
		&resp.UserID,
		&resp.ImageURL,
		&resp.OutfitID,
		&resp.ModelID,
		&resp.ThumbnailURL,
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
		SELECT id, user_id, image_url, outfit_id, model_id, thumbnail_url, created_at, updated_at
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
			&img.ModelID,
			&img.ThumbnailURL,
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

	// First get the image to find storage path
	var imageURL string
	query := `SELECT image_url FROM user_model_images WHERE id = $1 AND user_id = $2`
	err := h.db.QueryRow(c.Context(), query, imageID, userID).Scan(&imageURL)
	if err != nil {
		log.Printf("ERROR: delete_model_image fetch err=%v", err)
		return response.InternalError(c, "failed to fetch model image")
	}

	// Delete from storage
	if imageURL != "" {
		// Extract path from URL: https://[project].supabase.co/storage/v1/object/public/model-corrosion-images/[path]
		parts := strings.Split(imageURL, "/model-corrosion-images/")
		if len(parts) == 2 {
			path := parts[1]
			// Delete from Supabase storage
			deleteURL := fmt.Sprintf("%s/storage/v1/object/%s", h.supabaseURL, path)
			httpReq, err := http.NewRequest("DELETE", deleteURL, nil)
			if err != nil {
				log.Printf("ERROR: delete_model_image create request err=%v", err)
				return response.InternalError(c, "failed to create delete request")
			}
			httpReq.Header.Set("Authorization", "Bearer "+h.serviceRoleKey)

			client := &http.Client{}
			resp, err := client.Do(httpReq)
			if err != nil {
				log.Printf("ERROR: delete_model_image storage call err=%v", err)
				return response.InternalError(c, "failed to call storage service")
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
				log.Printf("ERROR: delete_model_image storage response status=%d", resp.StatusCode)
				return response.InternalError(c, "storage service returned non-200 status")
			}
		}
	}

	// Delete from database
	deleteQuery := `
    DELETE FROM user_model_images
    WHERE id = $1 AND user_id = $2
  `

	cmd, err := h.db.Exec(c.Context(), deleteQuery, imageID, userID)
	if err != nil {
		log.Printf("ERROR: delete_model_image err=%v", err)
		return response.InternalError(c, "failed to delete model image")
	}

	if cmd.RowsAffected() == 0 {
		return response.NotFound(c, "model image not found or unauthorized")
	}

	return response.Success(c, fiber.Map{"deleted": true})
}
