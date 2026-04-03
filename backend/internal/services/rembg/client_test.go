package rembg

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestRemoveBackground_Success(t *testing.T) {
	// Create a test server that returns a successful JSON response
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST request, got %s", r.Method)
		}
		if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
			t.Errorf("Expected application/json content type, got %s", r.Header.Get("Content-Type"))
		}

		// Verify request body contains image_url
		var reqBody ExtractRequest
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		if reqBody.ImageURL == "" {
			t.Errorf("Expected image_url in request")
		}

		// Return a JSON response with base64 encoded image
		resp := ExtractResponse{
			TransparentImageB64: base64.StdEncoding.EncodeToString([]byte("test-image-data")),
			LabelsFound:         []string{"shirt", "pants"},
			InferenceTimeMs:     1000,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test successful removal
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if !bytes.Equal(result, []byte("test-image-data")) {
		t.Errorf("Expected 'test-image-data', got %s", string(result))
	}
}

func TestRemoveBackground_Retry(t *testing.T) {
	// Track number of requests
	requestCount := 0

	// Create a test server that fails the first 2 times, then succeeds
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++
		if requestCount <= 2 {
			// Return internal server error for first 2 requests
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("internal error"))
			return
		}
		// Succeed on third request
		resp := ExtractResponse{
			TransparentImageB64: base64.StdEncoding.EncodeToString([]byte("success-after-retries")),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it retries and eventually succeeds
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err != nil {
		t.Fatalf("Expected no error after retries, got %v", err)
	}
	if !bytes.Equal(result, []byte("success-after-retries")) {
		t.Errorf("Expected 'success-after-retries', got %s", string(result))
	}
	if requestCount != 3 {
		t.Errorf("Expected 3 requests, got %d", requestCount)
	}
}

func TestRemoveBackground_MaxRetriesExceeded(t *testing.T) {
	// Create a test server that always fails
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte("bad gateway"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it fails after max retries
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err == nil {
		t.Fatalf("Expected error after max retries, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "rembg service failed after 3 attempts") {
		t.Errorf("Expected error about 3 attempts, got %v", err)
	}
}

func TestRemoveBackground_ContextCancellation(t *testing.T) {
	// Create a test server that delays response
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow service
		time.Sleep(2 * time.Second)
		resp := ExtractResponse{
			TransparentImageB64: base64.StdEncoding.EncodeToString([]byte("delayed-response")),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Create context that cancels quickly
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Test that it respects context cancellation
	result, err := client.RemoveBackground(ctx, []byte("test-image"), "test.png")
	if err == nil {
		t.Fatalf("Expected error due to context cancellation, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	// Should be context deadline exceeded or canceled
	if err != context.DeadlineExceeded && err != context.Canceled {
		t.Errorf("Expected context error, got %v", err)
	}
}

func TestRemoveBackgroundFromURL_InvalidJSONResponse(t *testing.T) {
	// Create a test server that returns malformed JSON
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST request, got %s", r.Method)
		}
		if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
			t.Errorf("Expected application/json content type, got %s", r.Header.Get("Content-Type"))
		}

		// Verify request body contains image_url
		var reqBody ExtractRequest
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		if reqBody.ImageURL != "https://example.com/image.jpg" {
			t.Errorf("Expected image_url 'https://example.com/image.jpg', got %s", reqBody.ImageURL)
		}

		// Return malformed JSON
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{invalid json}`))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it returns an error for malformed JSON
	result, err := client.RemoveBackgroundFromURL(context.Background(), "https://example.com/image.jpg")
	if err == nil {
		t.Fatalf("Expected error for invalid JSON, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "decode response") {
		t.Errorf("Expected decode response error, got %v", err)
	}
}

func TestRemoveBackgroundFromURL_InvalidBase64(t *testing.T) {
	// Create a test server that returns invalid base64 data
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request body
		var reqBody ExtractRequest
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		if reqBody.ImageURL != "https://example.com/image.jpg" {
			t.Errorf("Expected image_url 'https://example.com/image.jpg', got %s", reqBody.ImageURL)
		}

		// Return JSON with invalid base64 string
		resp := ExtractResponse{
			TransparentImageB64: "invalid-base64!!!",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it returns an error for invalid base64
	result, err := client.RemoveBackgroundFromURL(context.Background(), "https://example.com/image.jpg")
	if err == nil {
		t.Fatalf("Expected error for invalid base64, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "decode base64") {
		t.Errorf("Expected decode base64 error, got %v", err)
	}
}

func TestRemoveBackgroundFromURL_NoImageData(t *testing.T) {
	// Create a test server that returns JSON with no image data
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request body
		var reqBody ExtractRequest
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		if reqBody.ImageURL != "https://example.com/image.jpg" {
			t.Errorf("Expected image_url 'https://example.com/image.jpg', got %s", reqBody.ImageURL)
		}

		// Return JSON with no image fields
		resp := ExtractResponse{
			LabelsFound:     []string{"shirt"},
			InferenceTimeMs: 500,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it returns an error when no image data is present
	result, err := client.RemoveBackgroundFromURL(context.Background(), "https://example.com/image.jpg")
	if err == nil {
		t.Fatalf("Expected error for no image data, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "no image data in response") {
		t.Errorf("Expected 'no image data in response' error, got %v", err)
	}
}

func TestRemoveBackgroundFromURL_ServerError(t *testing.T) {
	// Create a test server that returns a 500 error
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("Expected POST request, got %s", r.Method)
		}

		// Verify request body contains image_url
		var reqBody ExtractRequest
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		if reqBody.ImageURL != "https://example.com/image.jpg" {
			t.Errorf("Expected image_url 'https://example.com/image.jpg', got %s", reqBody.ImageURL)
		}

		// Return server error
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal server error"))
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it returns an error after retries
	result, err := client.RemoveBackgroundFromURL(context.Background(), "https://example.com/image.jpg")
	if err == nil {
		t.Fatalf("Expected error after server failures, got nil")
	}
	if result != nil {
		t.Errorf("Expected nil result, got %v", result)
	}
	if !strings.Contains(err.Error(), "rembg service failed after 3 attempts") {
		t.Errorf("Expected error about 3 attempts, got %v", err)
	}
}

func TestRemoveBackgroundFromURL_Retry(t *testing.T) {
	requestCount := 0

	// Create a test server that fails first 2 times then succeeds
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestCount++

		// Verify request body on last attempt
		if requestCount == 3 {
			var reqBody ExtractRequest
			if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
				t.Errorf("Failed to decode request body: %v", err)
			}
			if reqBody.ImageURL != "https://example.com/image.jpg" {
				t.Errorf("Expected image_url 'https://example.com/image.jpg', got %s", reqBody.ImageURL)
			}
		}

		if requestCount <= 2 {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("server error"))
			return
		}

		resp := ExtractResponse{
			TransparentImageB64: base64.StdEncoding.EncodeToString([]byte("retry-success")),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	client := NewClient(testServer.URL)

	// Test retry behavior
	result, err := client.RemoveBackgroundFromURL(context.Background(), "https://example.com/image.jpg")
	if err != nil {
		t.Fatalf("Expected no error after retries, got %v", err)
	}
	if !bytes.Equal(result, []byte("retry-success")) {
		t.Errorf("Expected 'retry-success', got %s", string(result))
	}
	if requestCount != 3 {
		t.Errorf("Expected 3 requests, got %d", requestCount)
	}
}

func TestRemoveBackground_FallbackToWhiteBg(t *testing.T) {
	// Create a test server that returns only white_bg_image_b64 (no transparent)
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := ExtractResponse{
			TransparentImageB64: "", // No transparent image
			WhiteBgImageB64:     base64.StdEncoding.EncodeToString([]byte("white-bg-image")),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	// Create client with test server URL
	client := NewClient(testServer.URL)

	// Test that it falls back to white background
	result, err := client.RemoveBackground(context.Background(), []byte("test-image"), "test.png")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if !bytes.Equal(result, []byte("white-bg-image")) {
		t.Errorf("Expected 'white-bg-image', got %s", string(result))
	}
}
