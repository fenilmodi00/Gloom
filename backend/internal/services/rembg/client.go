package rembg

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
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
		httpClient: &http.Client{Timeout: 3 * time.Minute},
		maxRetries: 3,
	}
}

// RemoveBackground sends an image to the rembg service and returns the cutout image bytes.
// It retries up to maxRetries times with exponential backoff + jitter.
func (c *Client) RemoveBackground(ctx context.Context, imageBytes []byte, filename string) ([]byte, error) {
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

		result, err := c.doRequest(ctx, imageBytes, filename)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("rembg service failed after %d attempts: %w", c.maxRetries, lastErr)
}

func (c *Client) doRequest(ctx context.Context, imageBytes []byte, filename string) ([]byte, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(imageBytes); err != nil {
		return nil, fmt.Errorf("write image data: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("close writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("rembg service returned %d: %s", resp.StatusCode, string(respBody))
	}

	result, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}
	return result, nil
}
