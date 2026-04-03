package rembg

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"
)

// Client is an HTTP client for the rembg background removal service.
type Client struct {
	baseURL    string
	httpClient *http.Client
	maxRetries int
}

// NewClient creates a new rembg service client.
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 5 * time.Minute},
		maxRetries: 3,
	}
}

// ExtractRequest is the request body for the /extract-outfit/url endpoint.
type ExtractRequest struct {
	ImageURL     string `json:"image_url"`
	OutputFormat string `json:"output_format"`
}

// ExtractResponse is the response body from the /extract-outfit/url endpoint.
type ExtractResponse struct {
	TransparentImageB64 string   `json:"transparent_image_b64"`
	WhiteBgImageB64     string   `json:"white_bg_image_b64"`
	LabelsFound         []string `json:"labels_found"`
	InferenceTimeMs     int      `json:"inference_time_ms"`
	ImageWidth          int      `json:"image_width"`
	ImageHeight         int      `json:"image_height"`
}

// RemoveBackground sends an image URL to the rembg service and returns the cutout image bytes.
// It retries up to maxRetries times with exponential backoff + jitter.
func (c *Client) RemoveBackground(ctx context.Context, imageBytes []byte, filename string) ([]byte, error) {
	// Upload the image first to get a URL, then call the extract endpoint
	// For now, we'll assume the imageBytes is a placeholder and the actual URL
	// is passed directly. In the existing API, imageBytes was the image data.
	// Since the new API requires a URL, we'll construct a request with a data URL
	// or return an error if we can't construct one.

	// Actually, looking at the existing API contract - it expects image bytes
	// The new GCP endpoint expects a URL. We need to handle this conversion.
	// For now, we'll use a data URL approach for the image bytes
	dataURL := fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(imageBytes))

	var lastErr error
	for attempt := 0; attempt < c.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff with jitter: 1s±500ms, 2s±1s, 4s±2s
			baseDelay := time.Duration(1<<uint(attempt-1)) * time.Second
			jitter := time.Duration(rand.Int63n(int64(baseDelay)))
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(baseDelay + jitter):
			}
		}

		result, err := c.doRequest(ctx, dataURL)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("rembg service failed after %d attempts: %w", c.maxRetries, lastErr)
}

// RemoveBackgroundFromURL sends an image URL to the rembg service and returns the cutout image bytes.
// This is the preferred method when you already have a publicly accessible image URL.
func (c *Client) RemoveBackgroundFromURL(ctx context.Context, imageURL string) ([]byte, error) {
	var lastErr error
	for attempt := 0; attempt < c.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff with jitter: 1s±500ms, 2s±1s, 4s±2s
			baseDelay := time.Duration(1<<uint(attempt-1)) * time.Second
			jitter := time.Duration(rand.Int63n(int64(baseDelay)))
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(baseDelay + jitter):
			}
		}

		result, err := c.doRequest(ctx, imageURL)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("rembg service failed after %d attempts: %w", c.maxRetries, lastErr)
}

func (c *Client) doRequest(ctx context.Context, imageURL string) ([]byte, error) {
	// Create JSON request body
	reqBody := ExtractRequest{
		ImageURL:     imageURL,
		OutputFormat: "transparent",
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/extract-outfit/url", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("rembg service returned %d: %s", resp.StatusCode, string(respBody))
	}

	// Parse JSON response
	var extractResp ExtractResponse
	if err := json.NewDecoder(resp.Body).Decode(&extractResp); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	// Prefer transparent image, fallback to white background
	var imageData string
	if extractResp.TransparentImageB64 != "" {
		imageData = extractResp.TransparentImageB64
	} else if extractResp.WhiteBgImageB64 != "" {
		imageData = extractResp.WhiteBgImageB64
	} else {
		return nil, fmt.Errorf("no image data in response")
	}

	// Decode base64
	imageBytes, err := base64.StdEncoding.DecodeString(imageData)
	if err != nil {
		return nil, fmt.Errorf("decode base64: %w", err)
	}

	return imageBytes, nil
}
