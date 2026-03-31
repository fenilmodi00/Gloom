package edgefunction

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"

	"backend/internal/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	supabaseURL    string
	serviceRoleKey string
}

func New(supabaseURL, serviceRoleKey string) *Handler {
	return &Handler{
		supabaseURL:    supabaseURL,
		serviceRoleKey: serviceRoleKey,
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Post("/edge-function/:name", h.ProxyEdgeFunction)
}

func (h *Handler) ProxyEdgeFunction(c *fiber.Ctx) error {
	functionName := c.Params("name")
	if functionName == "" {
		return response.BadRequest(c, "missing edge function name")
	}

	// Get the user's JWT from the auth middleware (set by AuthRequired)
	userID := c.Locals("userID")
	if userID == nil {
		return response.Unauthorized(c, "unauthorized")
	}

	// Construct the Supabase Edge Function URL
	edgeFunctionURL := fmt.Sprintf("%s/functions/v1/%s", h.supabaseURL, functionName)

	// Create the request to Supabase
	reqBody := c.Body()
	httpReq, err := http.NewRequest("POST", edgeFunctionURL, bytes.NewReader(reqBody))
	if err != nil {
		log.Printf("ERROR: edge_function_proxy operation=request_creation function=%s err=%v", functionName, err)
		return response.InternalError(c, "failed to create request")
	}

	// Forward headers from client
	contentType := c.Get("Content-Type")
	if contentType != "" {
		httpReq.Header.Set("Content-Type", contentType)
	}

	// Use service role key for authentication with Supabase
	httpReq.Header.Set("Authorization", "Bearer "+h.serviceRoleKey)

	// Forward the user's JWT in a custom header so the edge function can validate it
	userJWT := c.Get("X-User-JWT")
	if userJWT != "" {
		httpReq.Header.Set("X-User-JWT", userJWT)
	}

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("ERROR: edge_function_proxy operation=supabase_call function=%s err=%v", functionName, err)
		return response.InternalError(c, "failed to call edge function")
	}
	defer resp.Body.Close()

	// Read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("ERROR: edge_function_proxy operation=read_response function=%s err=%v", functionName, err)
		return response.InternalError(c, "failed to read edge function response")
	}

	// Return the response with the same status code
	return c.Status(resp.StatusCode).Send(respBody)
}
