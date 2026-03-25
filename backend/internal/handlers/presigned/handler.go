package presigned

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"backend/internal/db"
	"backend/internal/response"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
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

type GeneratePresignedURLRequest struct {
	Bucket string `json:"bucket" validate:"required"`
	Path   string `json:"path" validate:"required"`
}

type SupabaseStorageResponse struct {
	SignedURL string `json:"signedURL"`
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Post("/presigned-url", h.GenerateUploadURL)
}

func (h *Handler) GenerateUploadURL(c *fiber.Ctx) error {
	var req GeneratePresignedURLRequest
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

	if req.Bucket != "wardrobe-images" {
		return response.ValidationError(c, []string{"bucket: invalid bucket"})
	}

	validExts := []string{".jpg", ".jpeg", ".png", ".webp"}
	valid := false
	for _, ext := range validExts {
		if strings.HasSuffix(strings.ToLower(req.Path), ext) {
			valid = true
			break
		}
	}
	if !valid {
		return response.ValidationError(c, []string{"path: invalid file extension"})
	}

	url := fmt.Sprintf("%s/storage/v1/object/upload/sign/%s/%s", h.supabaseURL, req.Bucket, req.Path)
	reqBody, _ := json.Marshal(map[string]interface{}{"expiresIn": 3600})

	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return response.InternalError(c, "failed to create request")
	}
	httpReq.Header.Set("Authorization", "Bearer "+h.serviceRoleKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return response.InternalError(c, "failed to call storage service")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return response.InternalError(c, "storage service returned non-200 status")
	}

	var storageResp SupabaseStorageResponse
	if err := json.NewDecoder(resp.Body).Decode(&storageResp); err != nil {
		return response.InternalError(c, "failed to decode storage response")
	}

	return response.Success(c, fiber.Map{
		"url":  h.supabaseURL + storageResp.SignedURL,
		"path": req.Path,
	})
}
