package presigned

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"

	"github.com/styleai/backend/internal/db"
	"github.com/styleai/backend/internal/response"
)

type Handler struct {
	db             *db.DB
	validate       *validator.Validate
	supabaseURL    string
	serviceRoleKey string
}

func New(db *db.DB, supabaseURL, serviceRoleKey string) *Handler {
	return &Handler{
		db:             db,
		validate:       validator.New(),
		supabaseURL:    supabaseURL,
		serviceRoleKey: serviceRoleKey,
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Post("/presigned-url", h.GenerateUploadURL)
}

type PresignedURLRequest struct {
	Bucket string `json:"bucket" validate:"required,eq=wardrobe-images"`
	Path   string `json:"path" validate:"required"`
}

type SupabasePresignedResponse struct {
	SignedURL string `json:"signedUrl"`
}

func (h *Handler) GenerateUploadURL(c *fiber.Ctx) error {
	var req PresignedURLRequest
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

	ext := strings.ToLower(filepath.Ext(req.Path))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		return response.ValidationError(c, []string{"invalid file extension: must be .jpg, .jpeg, .png, or .webp"})
	}

	url := fmt.Sprintf("%s/storage/v1/object/upload/sign/%s/%s", h.supabaseURL, req.Bucket, req.Path)

	body := []byte(`{"expiresIn": 3600}`)

	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return response.InternalError(c, "failed to create request")
	}

	httpReq.Header.Set("Authorization", "Bearer "+h.serviceRoleKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		return response.InternalError(c, "failed to contact storage service")
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(httpResp.Body)
		return response.InternalError(c, fmt.Sprintf("storage service returned %d: %s", httpResp.StatusCode, string(respBody)))
	}

	var parsedResp SupabasePresignedResponse
	if err := json.NewDecoder(httpResp.Body).Decode(&parsedResp); err != nil {
		return response.InternalError(c, "failed to parse storage response")
	}

	return response.Success(c, fiber.Map{
		"url":  h.supabaseURL + parsedResp.SignedURL,
		"path": req.Path,
	})
}
