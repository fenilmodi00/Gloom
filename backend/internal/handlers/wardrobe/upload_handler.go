package wardrobe

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"

	"backend/internal/middleware"
	"backend/internal/response"

	"github.com/gofiber/fiber/v2"
)

type UploadHandler struct {
	supabaseURL    string
	serviceRoleKey string
}

func NewUploadHandler(supabaseURL, serviceRoleKey string) *UploadHandler {
	return &UploadHandler{
		supabaseURL:    supabaseURL,
		serviceRoleKey: serviceRoleKey,
	}
}

func (h *UploadHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/wardrobe/upload", h.UploadImage)
}

type UploadImageRequest struct {
	Bucket string `form:"bucket"`
	Path   string `form:"path"`
}

func (h *UploadHandler) UploadImage(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	// Parse multipart form (max 10MB)
	form, err := c.MultipartForm()
	if err != nil {
		return response.BadRequest(c, "invalid multipart form")
	}

	// Get the file
	files := form.File["file"]
	if len(files) == 0 {
		return response.BadRequest(c, "no file provided")
	}

	file, err := files[0].Open()
	if err != nil {
		log.Printf("ERROR: wardrobe_upload userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to open file")
	}
	defer file.Close()

	// Get bucket and path from form values
	bucket := form.Value["bucket"]
	if len(bucket) == 0 || bucket[0] == "" {
		return response.BadRequest(c, "bucket is required")
	}

	path := form.Value["path"]
	if len(path) == 0 || path[0] == "" {
		return response.BadRequest(c, "path is required")
	}

	// Read file content
	fileData, err := io.ReadAll(file)
	if err != nil {
		log.Printf("ERROR: wardrobe_upload userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to read file")
	}

	// Upload to Supabase Storage via their API
	uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", h.supabaseURL, bucket[0], path[0])

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", path[0])
	if err != nil {
		log.Printf("ERROR: wardrobe_upload userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to create form")
	}
	part.Write(fileData)
	writer.Close()

	httpReq, err := http.NewRequest("POST", uploadURL, body)
	if err != nil {
		log.Printf("ERROR: wardrobe_upload userID=%s err=%v", userID, err)
		return response.InternalError(c, "failed to create request")
	}

	httpReq.Header.Set("Authorization", "Bearer "+h.serviceRoleKey)
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("ERROR: wardrobe_upload userID=%s operation=supabase err=%v", userID, err)
		return response.InternalError(c, "failed to upload to storage")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		log.Printf("ERROR: wardrobe_upload userID=%s status=%d body=%s", userID, resp.StatusCode, string(respBody))
		return response.InternalError(c, "storage upload failed")
	}

	// Construct the public URL
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", h.supabaseURL, bucket[0], path[0])

	return response.Success(c, fiber.Map{
		"url":  publicURL,
		"path": path[0],
	})
}
